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

4. Создайте файл `.env` в директории `backend/`:
```env
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

5. Выполните миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Создайте суперпользователя (опционально):
```bash
python manage.py createsuperuser
```

7. Запустите сервер:
```bash
python manage.py runserver
```

Сервер будет доступен по адресу: http://localhost:8000

## API Endpoints

- `GET/POST /api/projects/project/` - Список/создание проектов
- `GET/PUT/DELETE /api/projects/project/{id}/` - Детали проекта
- `POST /api/projects/project/import_projects/` - Импорт проектов через LLM
- `GET /api/projects/status/` - Статусы проектов
- `GET/POST /api/evaluations/evaluation/` - Список/создание оценок
- `GET/PUT/DELETE /api/evaluations/evaluation/{id}/` - Детали оценки
- `POST /api/evaluations/evaluation/{id}/generate_with_llm/` - Генерация оценки через LLM
- `GET /api/users/list/` - Список пользователей
- `POST /api/users/login/` - Авторизация
- `POST /api/users/logout/` - Выход
- `GET /api/users/current/` - Текущий пользователь

## Админ-панель

Доступна по адресу: http://localhost:8000/admin

## Особенности

- Автоматическое создание оценки при создании проекта
- Автоматическое обновление приоритетов на основе векторной суммы
- Генерация оценок через DeepSeek LLM
- Импорт проектов из CSV/Excel с автоматической обработкой через LLM
