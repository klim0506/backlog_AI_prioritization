# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('economic_efficiency', models.FloatField(default=0.0, verbose_name='Экономическая эффективность (E)')),
                ('technical_complexity', models.FloatField(default=0.0, verbose_name='Сложность технической реализации (T)')),
                ('expert_rating', models.FloatField(default=0.0, verbose_name='Экспертная оценка (X)')),
                ('vector_sum', models.FloatField(blank=True, null=True, verbose_name='Векторная сумма')),
                ('economic_efficiency_llm_generated', models.BooleanField(default=False)),
                ('technical_complexity_llm_generated', models.BooleanField(default=False)),
                ('expert_rating_llm_generated', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('initiator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='initiated_projects', to=settings.AUTH_USER_MODEL, verbose_name='Инициатор')),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='owned_projects', to=settings.AUTH_USER_MODEL, verbose_name='Владелец проекта')),
                ('project', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='evaluation', to='projects.project', verbose_name='Проект')),
                ('responsible', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='responsible_projects', to=settings.AUTH_USER_MODEL, verbose_name='Ответственный')),
                ('status', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='projects.projectstatus', verbose_name='Статус проекта')),
            ],
            options={
                'verbose_name': 'Оценка проекта',
                'verbose_name_plural': 'Оценки проектов',
                'ordering': ['project__priority_number', 'project__project_number'],
            },
        ),
    ]

