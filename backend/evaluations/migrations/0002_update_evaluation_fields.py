# Generated migration for updating ProjectEvaluation model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0002_create_default_statuses'),
        ('evaluations', '0001_initial'),
    ]

    operations = [
        # Удаляем поле owner
        migrations.RemoveField(
            model_name='projectevaluation',
            name='owner',
        ),
        # Переименовываем responsible в product
        migrations.RenameField(
            model_name='projectevaluation',
            old_name='responsible',
            new_name='product',
        ),
        # Переименовываем initiator в developer
        migrations.RenameField(
            model_name='projectevaluation',
            old_name='initiator',
            new_name='developer',
        ),
        # Обновляем related_name для product
        migrations.AlterField(
            model_name='projectevaluation',
            name='product',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='product_projects',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Product'
            ),
        ),
        # Обновляем related_name для developer
        migrations.AlterField(
            model_name='projectevaluation',
            name='developer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='developer_projects',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Разработчик'
            ),
        ),
    ]

