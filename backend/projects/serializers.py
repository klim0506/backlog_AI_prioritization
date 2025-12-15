from rest_framework import serializers
from .models import Project, ProjectStatus


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ['id', 'name', 'description']


class ProjectSerializer(serializers.ModelSerializer):
    project_number = serializers.CharField(read_only=True)  # Только для чтения, генерируется автоматически
    priority_number = serializers.IntegerField(read_only=True)  # Не редактируется пользователем, по умолчанию 0
    vector_sum = serializers.FloatField(read_only=True)  # Не редактируется пользователем, по умолчанию 0
    
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'vector_sum', 
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'description': {'required': True, 'allow_blank': False},
            'name': {'required': True},
            'comment': {'allow_blank': True, 'required': False},
        }
    
    def validate_description(self, value):
        """Проверяем, что описание не пустое"""
        if not value or not value.strip():
            raise serializers.ValidationError("Описание обязательно для заполнения")
        return value.strip()


class ProjectListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка проектов"""
    evaluation_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'project_number', 'priority_number', 'name', 
            'description', 'comment', 'vector_sum', 'evaluation_id'
        ]
    
    def get_evaluation_id(self, obj):
        """Возвращает ID оценки проекта, если она существует"""
        if hasattr(obj, 'evaluation'):
            return obj.evaluation.id
        return None

