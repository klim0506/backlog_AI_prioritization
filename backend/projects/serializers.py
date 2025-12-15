from rest_framework import serializers
from .models import Project, ProjectStatus


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ['id', 'name', 'description']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'vector_sum', 
            'created_at', 'updated_at'
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка проектов"""
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'vector_sum'
        ]

