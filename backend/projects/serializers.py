from rest_framework import serializers
from .models import Project, ProjectStatus
from evaluations.models import ProjectEvaluation


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ['id', 'name', 'description']


class ProjectSerializer(serializers.ModelSerializer):
    project_number = serializers.CharField(read_only=True)
    priority_number = serializers.IntegerField(read_only=True)
    sum = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'sum', 
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'description': {'required': True, 'allow_blank': False},
            'name': {'required': True},
            'comment': {'allow_blank': True, 'required': False},
        }
    
    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Описание обязательно для заполнения")
        return value.strip()
    
    def create(self, validated_data):
        project = super().create(validated_data)
        if not ProjectEvaluation.objects.filter(project=project).exists():
            ProjectEvaluation.objects.create(
                project=project,
                economic_efficiency=0.0,
                technical_complexity=0.0,
                expert_rating=0.0
            )
        return project


class ProjectListSerializer(serializers.ModelSerializer):
    evaluation_id = serializers.SerializerMethodField()
    pm = serializers.SerializerMethodField()
    developer = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    economic_efficiency = serializers.SerializerMethodField()
    technical_complexity = serializers.SerializerMethodField()
    expert_rating = serializers.SerializerMethodField()
    evaluation_sum = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'sum', 'evaluation_id',
            'pm', 'developer', 'status', 'economic_efficiency',
            'technical_complexity', 'expert_rating', 'evaluation_sum'
        ]
    
    def get_evaluation_id(self, obj):
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.id
        return None
    
    def get_pm(self, obj):
        if hasattr(obj, 'evaluation') and obj.evaluation.product:
            return {
                'id': obj.evaluation.product.id,
                'username': obj.evaluation.product.username,
                'first_name': obj.evaluation.product.first_name,
                'last_name': obj.evaluation.product.last_name
            }
        return None
    
    def get_developer(self, obj):
        if hasattr(obj, 'evaluation') and obj.evaluation.developer:
            return {
                'id': obj.evaluation.developer.id,
                'username': obj.evaluation.developer.username,
                'first_name': obj.evaluation.developer.first_name,
                'last_name': obj.evaluation.developer.last_name
            }
        return None
    
    def get_status(self, obj):
        if hasattr(obj, 'evaluation') and obj.evaluation.status:
            return {
                'id': obj.evaluation.status.id,
                'name': obj.evaluation.status.name,
                'description': obj.evaluation.status.description
            }
        return None
    
    def get_economic_efficiency(self, obj):
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.economic_efficiency
        return 0.0
    
    def get_technical_complexity(self, obj):
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.technical_complexity
        return 0.0
    
    def get_expert_rating(self, obj):
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.expert_rating
        return 0.0
    
    def get_evaluation_sum(self, obj):
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.sum or 0.0
        return obj.sum or 0.0

