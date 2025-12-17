from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.db.models import IntegerField, Value
from django.db.models.functions import Cast, Replace
from django.db import connection
from .models import Project, ProjectStatus
from .serializers import ProjectSerializer, ProjectListSerializer, ProjectStatusSerializer
from .llm_service import DeepSeekService
from evaluations.models import ProjectEvaluation
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class ProjectPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related(
        'evaluation__product', 
        'evaluation__developer',
        'evaluation__status'
    ).prefetch_related('evaluation__status').all()
    serializer_class = ProjectSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = ProjectPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        sort_by = self.request.query_params.get('sort_by', 'priority')
        sort_order = self.request.query_params.get('sort_order', 'asc')
        
        if sort_by == 'number':
            if connection.vendor == 'sqlite':
                queryset = queryset.extra(
                    select={
                        'project_number_int': """
                            CAST(
                                REPLACE(
                                    REPLACE(projects_project.project_number, '#', ''),
                                    '№', ''
                                ) AS INTEGER
                            )
                        """
                    }
                )
            else:
                queryset = queryset.extra(
                    select={
                        'project_number_int': """
                            CAST(
                                REPLACE(
                                    REPLACE(project_number, '#', ''),
                                    '№', ''
                                ) AS INTEGER
                            )
                        """
                    }
                )
            
            if sort_order == 'desc':
                queryset = queryset.order_by('-project_number_int')
            else:
                queryset = queryset.order_by('project_number_int')
        elif sort_by == 'priority':
            if connection.vendor == 'sqlite':
                if sort_order == 'desc':
                    queryset = queryset.extra(
                        select={
                            'priority_sort': """
                                CASE 
                                    WHEN priority_number = 0 THEN -999999
                                    ELSE priority_number
                                END
                            """
                        }
                    )
                    queryset = queryset.order_by('-priority_sort', 'project_number')
                else:
                    queryset = queryset.extra(
                        select={
                            'priority_sort': """
                                CASE 
                                    WHEN priority_number = 0 THEN 999999
                                    ELSE priority_number
                                END
                            """
                        }
                    )
                    queryset = queryset.order_by('priority_sort', 'project_number')
            else:
                if sort_order == 'desc':
                    queryset = queryset.extra(
                        select={
                            'priority_sort': """
                                CASE 
                                    WHEN priority_number = 0 THEN -999999
                                    ELSE priority_number
                                END
                            """
                        }
                    )
                    queryset = queryset.order_by('-priority_sort', 'project_number')
                else:
                    queryset = queryset.extra(
                        select={
                            'priority_sort': """
                                CASE 
                                    WHEN priority_number = 0 THEN 999999
                                    ELSE priority_number
                                END
                            """
                        }
                    )
                    queryset = queryset.order_by('priority_sort', 'project_number')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            project_id = response.data.get('id')
            project_name = response.data.get('name', '')
            logger.info(f"CREATE Project #{project_id} {project_name}")
        return response
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        project_name = instance.name
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            logger.info(f"UPDATE Project #{instance.id} {project_name}")
        return response
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project_id = instance.id
        project_name = instance.name
        had_priority = instance.priority_number > 0
        
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            logger.info(f"DELETE Project #{project_id} {project_name}")
            
            if had_priority:
                from evaluations.models import ProjectEvaluation
                from django.db import transaction
                
                with transaction.atomic():
                    evaluations = ProjectEvaluation.objects.filter(
                        sum__gt=0
                    ).select_related('project').order_by('-sum', 'project__project_number')
                    
                    priority = 1
                    for evaluation in evaluations:
                        if evaluation.project.priority_number != priority:
                            Project.objects.filter(id=evaluation.project.id).update(priority_number=priority)
                        priority += 1
                    
                    zero_evaluations = ProjectEvaluation.objects.filter(
                        sum=0
                    ).select_related('project')
                    
                    for evaluation in zero_evaluations:
                        if evaluation.project.priority_number != 0:
                            Project.objects.filter(id=evaluation.project.id).update(priority_number=0)
        
        return response
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_projects(self, request):
        """Импорт проектов через DeepSeek LLM из таблицы (CSV/Excel)"""
        try:
            uploaded_file = request.FILES.get('file')
            
            if not uploaded_file:
                return Response(
                    {'error': 'Необходимо загрузить файл'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_name = uploaded_file.name.lower()
            is_excel = file_name.endswith('.xlsx') or file_name.endswith('.xls')
            is_csv = file_name.endswith('.csv')
            
            if not (is_excel or is_csv):
                return Response(
                    {'error': 'Поддерживаются только файлы CSV и Excel (.xlsx, .xls)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                if is_excel:
                    df = pd.read_excel(uploaded_file, engine='openpyxl')
                else:
                    try:
                        df = pd.read_csv(uploaded_file, encoding='utf-8')
                    except UnicodeDecodeError:
                        df = pd.read_csv(uploaded_file, encoding='windows-1251')
                
                df = df.dropna(how='all')
                table_data = df.to_dict('records')
                
                for row in table_data:
                    for key, value in row.items():
                        if pd.isna(value):
                            row[key] = ''
                        else:
                            row[key] = str(value).strip()
            except Exception as e:
                return Response(
                    {'error': f'Ошибка при чтении файла: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not table_data:
                return Response(
                    {'error': 'Файл не содержит данных'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'table_data': table_data,
                'total_rows': len(table_data)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Ошибка при импорте: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], parser_classes=[JSONParser])
    def import_batch_rows(self, request):
        """Импорт батча строк из таблицы (до 5 строк за раз)"""
        try:
            rows_data = request.data.get('rows_data', [])
            headers = request.data.get('headers', [])
            
            if not rows_data or not isinstance(rows_data, list):
                return Response(
                    {'error': 'Необходимо предоставить массив данных строк'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(rows_data) > 5:
                return Response(
                    {'error': 'Максимальный размер батча - 5 строк'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            llm_service = DeepSeekService()
            created_projects = []
            errors = []
            
            try:
                projects_data = llm_service.process_batch_rows(rows_data, headers)
            except Exception as e:
                return Response(
                    {'error': f'Ошибка при обработке батча через LLM: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            for idx, project_data in enumerate(projects_data):
                try:
                    if not project_data.get('name'):
                        errors.append(f"Строка {idx + 1}: отсутствует название проекта")
                        continue
                    
                    if not project_data.get('description'):
                        errors.append(f"Строка {idx + 1}: отсутствует описание проекта")
                        continue
                    
                    project = Project.objects.create(
                        name=project_data['name'],
                        description=project_data['description'],
                        comment=project_data.get('comment', '')
                    )
                    logger.info(f"IMPORT Project #{project.id} {project.name}")
                    
                    if not ProjectEvaluation.objects.filter(project=project).exists():
                        ProjectEvaluation.objects.create(
                            project=project,
                            economic_efficiency=0.0,
                            technical_complexity=0.0,
                            expert_rating=0.0
                        )
                    
                    created_projects.append(ProjectSerializer(project).data)
                except Exception as e:
                    errors.append(f"Строка {idx + 1}: ошибка при создании проекта - {str(e)}")
            
            return Response({
                'projects': created_projects,
                'errors': errors,
                'success_count': len(created_projects),
                'total_count': len(rows_data)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Ошибка при обработке батча: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer

