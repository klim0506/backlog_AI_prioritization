from django.db import migrations


def create_default_statuses(apps, schema_editor):
    """Создает статусы проектов по умолчанию"""
    ProjectStatus = apps.get_model('projects', 'ProjectStatus')
    
    statuses = [
        {'name': 'бэклог', 'description': 'Проект в бэклоге'},
        {'name': 'разработка', 'description': 'Проект в разработке'},
        {'name': 'тестирование', 'description': 'Проект на тестировании'},
        {'name': 'использование', 'description': 'Проект в использовании'},
        {'name': 'закрыт', 'description': 'Проект закрыт'},
    ]
    
    for status_data in statuses:
        ProjectStatus.objects.get_or_create(
            name=status_data['name'],
            defaults={'description': status_data['description']}
        )


def reverse_create_default_statuses(apps, schema_editor):
    """Удаляет статусы проектов по умолчанию"""
    ProjectStatus = apps.get_model('projects', 'ProjectStatus')
    ProjectStatus.objects.filter(
        name__in=['бэклог', 'разработка', 'тестирование', 'использование', 'закрыт']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_statuses, reverse_create_default_statuses),
    ]

