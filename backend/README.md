# Backend - Django API

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
```

2. Активируйте виртуальное окружение:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Выполните миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Создайте суперпользователя (опционально):
```bash
python manage.py createsuperuser
```

6. Запустите сервер:
```bash
python manage.py runserver
```

Сервер будет доступен по адресу: http://localhost:8000

## API Endpoints

- `/api/projects/project/` - Проекты
- `/api/projects/status/` - Статусы проектов
- `/api/evaluations/evaluation/` - Оценки проектов
- `/api/users/login/` - Авторизация
- `/api/users/logout/` - Выход
- `/api/users/current/` - Текущий пользователь

## Админ-панель

Доступна по адресу: http://localhost:8000/admin

