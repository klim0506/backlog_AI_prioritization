from django.contrib import admin
from .models import ProjectEvaluation


@admin.register(ProjectEvaluation)
class ProjectEvaluationAdmin(admin.ModelAdmin):
    list_display = [
        'project', 'status', 'economic_efficiency', 
        'technical_complexity', 'expert_rating', 'sum'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['project__project_number', 'project__name']

