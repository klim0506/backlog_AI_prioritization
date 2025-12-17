from django.db import models
from django.contrib.auth.models import User
from projects.models import Project, ProjectStatus


class ProjectEvaluation(models.Model):
    """Модель оценки проекта по трем осям"""
    project = models.OneToOneField(
        Project, 
        on_delete=models.CASCADE, 
        related_name='evaluation',
        verbose_name="Проект"
    )
    status = models.ForeignKey(
        ProjectStatus,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Статус проекта"
    )
    product = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_projects',
        verbose_name="Product"
    )
    developer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='developer_projects',
        verbose_name="Разработчик"
    )
    
    # Три оси оценки
    economic_efficiency = models.FloatField(
        default=0.0,
        verbose_name="Экономическая эффективность (E)"
    )
    technical_complexity = models.FloatField(
        default=0.0,
        verbose_name="Сложность технической реализации (T)"
    )
    expert_rating = models.FloatField(
        default=0.0,
        verbose_name="Экспертная оценка (X)"
    )
    
    sum = models.FloatField(null=True, blank=True, verbose_name="Сумма")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Оценка проекта"
        verbose_name_plural = "Оценки проектов"
        ordering = ['project__priority_number', 'project__project_number']
    
    def __str__(self):
        return f"Оценка {self.project.project_number}"
    
    def calculate_sum(self):
        """Вычисляет сумму E + T + X"""
        self.sum = self.economic_efficiency + self.technical_complexity + self.expert_rating
        return self.sum
    
    def save(self, *args, **kwargs):
        self.calculate_sum()
        super().save(*args, **kwargs)

