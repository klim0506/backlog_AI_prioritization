from rest_framework import serializers
from .models import ProjectEvaluation
from projects.serializers import ProjectSerializer, ProjectStatusSerializer
from projects.models import Project, ProjectStatus
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class ProjectEvaluationSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    status = ProjectStatusSerializer(read_only=True)
    product = UserSerializer(read_only=True)
    developer = UserSerializer(read_only=True)
    
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source='project',
        write_only=True,
        required=True
    )
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStatus.objects.all(),
        source='status',
        write_only=True,
        required=False,
        allow_null=True
    )
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='product',
        write_only=True,
        required=False,
        allow_null=True
    )
    developer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='developer',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = ProjectEvaluation
        fields = [
            'id', 'project', 'project_id', 'status', 'status_id',
            'product', 'product_id', 'developer', 'developer_id',
            'economic_efficiency', 'technical_complexity', 'expert_rating',
            'sum', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sum', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.calculate_sum()
        instance.save()
        return instance
    
    def create(self, validated_data):
        project = validated_data.get('project')
        if not project:
            raise serializers.ValidationError({'project_id': 'Проект обязателен для создания оценки'})
        
        if ProjectEvaluation.objects.filter(project=project).exists():
            raise serializers.ValidationError({'project_id': 'Для этого проекта уже существует оценка'})
        
        instance = super().create(validated_data)
        instance.calculate_sum()
        instance.save()
        return instance

