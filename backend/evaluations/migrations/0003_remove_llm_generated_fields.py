from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('evaluations', '0002_update_evaluation_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projectevaluation',
            name='economic_efficiency_llm_generated',
        ),
        migrations.RemoveField(
            model_name='projectevaluation',
            name='technical_complexity_llm_generated',
        ),
        migrations.RemoveField(
            model_name='projectevaluation',
            name='expert_rating_llm_generated',
        ),
    ]

