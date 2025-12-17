from django.apps import AppConfig


class EvaluationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'evaluations'
    verbose_name = "Оценки проектов"
    
    def ready(self):
        import evaluations.signals

