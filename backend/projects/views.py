from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, ProjectStatus
from .serializers import ProjectSerializer, ProjectListSerializer, ProjectStatusSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
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


class ProjectStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer

