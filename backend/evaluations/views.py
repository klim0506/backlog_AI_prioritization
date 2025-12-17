from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from rest_framework.pagination import PageNumberPagination
from .models import ProjectEvaluation
from .serializers import ProjectEvaluationSerializer
from projects.llm_service import DeepSeekService
import logging

logger = logging.getLogger(__name__)


class NoPagination(PageNumberPagination):
    page_size = None


class ProjectEvaluationViewSet(viewsets.ModelViewSet):
    queryset = ProjectEvaluation.objects.select_related(
        'project', 'status', 'product', 'developer'
    ).all()
    serializer_class = ProjectEvaluationSerializer
    parser_classes = [JSONParser]
    pagination_class = NoPagination
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        project_name = instance.project.name if instance.project else ''
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            logger.info(f"UPDATE Evaluation Project #{instance.project.id if instance.project else '?'} {project_name}")
        return response
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            evaluation_id = response.data.get('id')
            project_id = response.data.get('project')
            logger.info(f"CREATE Evaluation #{evaluation_id} Project #{project_id}")
        return response
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        evaluation_id = instance.id
        project_id = instance.project.id if instance.project else '?'
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            logger.info(f"DELETE Evaluation #{evaluation_id} Project #{project_id}")
        return response
    
    @action(detail=True, methods=['post'])
    def generate_with_llm(self, request, pk=None):
        """Генерация всех трех оценок (E, T, X) с помощью LLM одним запросом"""
        evaluation = self.get_object()
        
        try:
            llm_service = DeepSeekService()
            generated_values = llm_service.generate_all_evaluations(
                project_name=evaluation.project.name,
                project_description=evaluation.project.description
            )
            
            evaluation.economic_efficiency = generated_values['economic_efficiency']
            evaluation.technical_complexity = generated_values['technical_complexity']
            evaluation.expert_rating = generated_values['expert_rating']
            evaluation.calculate_sum()
            evaluation.save()
            
            project_name = evaluation.project.name if evaluation.project else ''
            logger.info(f"LLM_GENERATE Evaluation Project #{evaluation.project.id if evaluation.project else '?'} {project_name} E:{generated_values['economic_efficiency']} T:{generated_values['technical_complexity']} X:{generated_values['expert_rating']}")
            
            serializer = self.get_serializer(evaluation)
            return Response({
                'message': 'Все оценки успешно сгенерированы',
                'values': generated_values,
                'evaluation': serializer.data
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка при генерации оценок: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

