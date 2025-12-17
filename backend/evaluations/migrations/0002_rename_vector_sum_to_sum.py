# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('evaluations', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='projectevaluation',
            old_name='vector_sum',
            new_name='sum',
        ),
    ]

