from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ProjectEvaluation
from .serializers import ProjectEvaluationSerializer


class ProjectEvaluationViewSet(viewsets.ModelViewSet):
    queryset = ProjectEvaluation.objects.select_related(
        'project', 'status', 'owner', 'responsible', 'initiator'
    ).all()
    serializer_class = ProjectEvaluationSerializer
    
    @action(detail=True, methods=['post'])
    def generate_with_llm(self, request, pk=None):
        """Генерация оценки с помощью LLM (заглушка для будущей реализации)"""
        evaluation = self.get_object()
        parameter = request.data.get('parameter')  # 'economic_efficiency', 'technical_complexity', 'expert_rating'
        
        # TODO: Интеграция с LLM
        # Пока возвращаем заглушку
        return Response({
            'message': 'LLM генерация будет реализована в следующих итерациях',
            'parameter': parameter,
            'evaluation_id': evaluation.id
        })

