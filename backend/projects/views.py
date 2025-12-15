from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Project, ProjectStatus
from .serializers import ProjectSerializer, ProjectListSerializer, ProjectStatusSerializer
from .llm_service import DeepSeekService
import json
import pandas as pd
import io
import os


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    @action(detail=False, methods=['get'])
    def list_view(self, request):
        """Список проектов для страницы 'Все проекты'"""
        projects = self.get_queryset()
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_projects(self, request):
        """
        Импорт проектов через DeepSeek LLM из таблицы (CSV/Excel)
        Каждая строка таблицы - новый проект
        """
        try:
            # Получаем файл из запроса
            uploaded_file = request.FILES.get('file')
            
            if not uploaded_file:
                return Response(
                    {'error': 'Необходимо загрузить файл'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Определяем тип файла
            file_name = uploaded_file.name.lower()
            is_excel = file_name.endswith('.xlsx') or file_name.endswith('.xls')
            is_csv = file_name.endswith('.csv')
            
            if not (is_excel or is_csv):
                return Response(
                    {'error': 'Поддерживаются только файлы CSV и Excel (.xlsx, .xls)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Читаем файл в DataFrame
            try:
                if is_excel:
                    df = pd.read_excel(uploaded_file, engine='openpyxl')
                else:
                    # Для CSV пробуем разные кодировки
                    try:
                        df = pd.read_csv(uploaded_file, encoding='utf-8')
                    except UnicodeDecodeError:
                        df = pd.read_csv(uploaded_file, encoding='windows-1251')
                
                # Удаляем полностью пустые строки
                df = df.dropna(how='all')
                
                # Преобразуем DataFrame в список словарей (каждая строка - отдельный проект)
                table_data = df.to_dict('records')
                
                # Заменяем NaN на пустые строки
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
            
            # Обрабатываем данные через DeepSeek LLM
            try:
                llm_service = DeepSeekService()
                processed_projects = llm_service.process_table_data(table_data)
            except Exception as e:
                return Response(
                    {'error': f'Ошибка при обработке через LLM: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if not processed_projects:
                return Response(
                    {'error': 'LLM не смог обработать данные таблицы'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Создаем проекты в базе данных
            created_projects = []
            errors = []
            
            for idx, project_data in enumerate(processed_projects, 1):
                try:
                    # Проверяем обязательные поля
                    if not project_data.get('name'):
                        errors.append(f"Строка {idx}: отсутствует название проекта")
                        continue
                    
                    if not project_data.get('description'):
                        errors.append(f"Строка {idx}: отсутствует описание проекта")
                        continue
                    
                    # Создаем проект (номер генерируется автоматически)
                    project = Project.objects.create(
                        name=project_data['name'],
                        description=project_data['description'],
                        comment=project_data.get('comment', '')
                    )
                    created_projects.append(ProjectSerializer(project).data)
                    
                except Exception as e:
                    errors.append(f"Строка {idx}: ошибка при создании проекта - {str(e)}")
            
            return Response({
                'message': f'Импортировано проектов: {len(created_projects)} из {len(processed_projects)}',
                'created': created_projects,
                'errors': errors,
                'total_rows': len(table_data),
                'processed_by_llm': len(processed_projects)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка при импорте: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer

