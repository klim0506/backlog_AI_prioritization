from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Модель проекта"""
    project_number = models.CharField(max_length=50, unique=True, blank=True, null=False, verbose_name="№ проекта")
    priority_number = models.IntegerField(default=0, verbose_name="№ приоритета реализации")
    name = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(verbose_name="Описание", blank=False)
    comment = models.TextField(blank=True, verbose_name="Комментарий")
    sum = models.FloatField(default=0.0, verbose_name="Сумма")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ['priority_number', 'project_number']
    
    def __str__(self):
        return f"{self.project_number} - {self.name}"
    
    @staticmethod
    def generate_project_number():
        """Генерирует уникальный номер проекта"""
        last_project = Project.objects.order_by('-id').first()
        if last_project and last_project.project_number:
            try:
                last_number = int(last_project.project_number.replace('#', ''))
                next_number = last_number + 1
            except ValueError:
                next_number = 1
        else:
            next_number = 1
        
        project_number = f"#{next_number:06d}"
        while Project.objects.filter(project_number=project_number).exists():
            next_number += 1
            project_number = f"#{next_number:06d}"
        
        return project_number
    
    def save(self, *args, **kwargs):
        if not self.project_number or self.project_number.strip() == '':
            self.project_number = Project.generate_project_number()
        if self.priority_number is None:
            self.priority_number = 0
        if self.sum is None:
            self.sum = 0.0
        super().save(*args, **kwargs)


class ProjectStatus(models.Model):
    """Статусы проектов"""
    name = models.CharField(max_length=50, unique=True, verbose_name="Название статуса")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    class Meta:
        verbose_name = "Статус проекта"
        verbose_name_plural = "Статусы проектов"
    
    def __str__(self):
        return self.name

