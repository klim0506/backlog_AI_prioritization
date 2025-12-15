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
    owner = UserSerializer(read_only=True)
    responsible = UserSerializer(read_only=True)
    initiator = UserSerializer(read_only=True)
    
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source='project',
        write_only=True,
        required=False
    )
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectStatus.objects.all(),
        source='status',
        write_only=True,
        required=False,
        allow_null=True
    )
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='owner',
        write_only=True,
        required=False,
        allow_null=True
    )
    responsible_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='responsible',
        write_only=True,
        required=False,
        allow_null=True
    )
    initiator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='initiator',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = ProjectEvaluation
        fields = [
            'id', 'project', 'project_id', 'status', 'status_id',
            'owner', 'owner_id', 'responsible', 'responsible_id',
            'initiator', 'initiator_id',
            'economic_efficiency', 'technical_complexity', 'expert_rating',
            'vector_sum',
            'economic_efficiency_llm_generated',
            'technical_complexity_llm_generated',
            'expert_rating_llm_generated',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['vector_sum', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.calculate_vector_sum()
        instance.save()
        return instance
    
    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.calculate_vector_sum()
        instance.save()
        return instance

