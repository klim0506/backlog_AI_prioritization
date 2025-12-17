from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver
from projects.models import Project
from .models import ProjectEvaluation


@receiver(post_save, sender=Project)
def create_project_evaluation(sender, instance, created, **kwargs):
    """Создает оценку при создании проекта и синхронизирует sum"""
    if created:
        def create_evaluation():
            if not ProjectEvaluation.objects.filter(project=instance).exists():
                evaluation = ProjectEvaluation.objects.create(
                    project=instance,
                    economic_efficiency=0.0,
                    technical_complexity=0.0,
                    expert_rating=0.0
                )
                Project.objects.filter(id=instance.id).update(sum=evaluation.sum or 0.0)
        transaction.on_commit(create_evaluation)


@receiver(post_save, sender=ProjectEvaluation)
def update_project_priorities(sender, instance, **kwargs):
    """Обновляет приоритеты проектов на основе суммы и синхронизирует sum"""
    from projects.models import Project
    
    with transaction.atomic():
        if instance.project:
            Project.objects.filter(id=instance.project.id).update(sum=instance.sum or 0.0)
        
        evaluations = ProjectEvaluation.objects.filter(
            sum__gt=0
        ).select_related('project').order_by('-sum', 'project__project_number')
        
        priority = 1
        for evaluation in evaluations:
            if evaluation.project.priority_number != priority:
                Project.objects.filter(id=evaluation.project.id).update(priority_number=priority)
            priority += 1
        
        zero_evaluations = ProjectEvaluation.objects.filter(
            sum=0
        ).select_related('project')
        
        for evaluation in zero_evaluations:
            if evaluation.project.priority_number != 0:
                Project.objects.filter(id=evaluation.project.id).update(priority_number=0)

