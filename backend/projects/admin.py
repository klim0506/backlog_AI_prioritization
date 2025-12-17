from django.contrib import admin
from .models import Project, ProjectStatus


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['project_number', 'name', 'priority_number', 'sum', 'created_at']
    list_filter = ['priority_number', 'created_at']
    search_fields = ['project_number', 'name', 'description']


@admin.register(ProjectStatus)
class ProjectStatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

