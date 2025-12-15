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
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_projects',
        verbose_name="Владелец проекта"
    )
    responsible = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_projects',
        verbose_name="Ответственный"
    )
    initiator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initiated_projects',
        verbose_name="Инициатор"
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
    
    vector_sum = models.FloatField(null=True, blank=True, verbose_name="Векторная сумма")
    
    # Флаги для отслеживания LLM-генерации
    economic_efficiency_llm_generated = models.BooleanField(default=False)
    technical_complexity_llm_generated = models.BooleanField(default=False)
    expert_rating_llm_generated = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Оценка проекта"
        verbose_name_plural = "Оценки проектов"
        ordering = ['project__priority_number', 'project__project_number']
    
    def __str__(self):
        return f"Оценка {self.project.project_number}"
    
    def calculate_vector_sum(self):
        """Вычисляет векторную сумму E + T + X"""
        self.vector_sum = self.economic_efficiency + self.technical_complexity + self.expert_rating
        return self.vector_sum
    
    def save(self, *args, **kwargs):
        # Всегда пересчитываем векторную сумму при сохранении
        self.calculate_vector_sum()
        super().save(*args, **kwargs)

