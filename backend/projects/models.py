from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Модель проекта"""
    project_number = models.CharField(max_length=50, unique=True, verbose_name="№ проекта")
    priority_number = models.IntegerField(null=True, blank=True, verbose_name="№ приоритета реализации")
    name = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    comment = models.TextField(blank=True, verbose_name="Комментарий")
    vector_sum = models.FloatField(null=True, blank=True, verbose_name="Векторная сумма")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ['priority_number', 'project_number']
    
    def __str__(self):
        return f"{self.project_number} - {self.name}"


class ProjectStatus(models.Model):
    """Статусы проектов"""
    name = models.CharField(max_length=50, unique=True, verbose_name="Название статуса")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    class Meta:
        verbose_name = "Статус проекта"
        verbose_name_plural = "Статусы проектов"
    
    def __str__(self):
        return self.name

