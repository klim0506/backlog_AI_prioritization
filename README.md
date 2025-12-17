# Система приоритизации бэклога проектов

Веб-приложение для оценки, приоритизации и визуального анализа проектов на основе трёх ключевых параметров:
1. Экономическая эффективность
2. Сложность технической реализации
3. Экспертная оценка

## Технологический стек

- **Frontend**: React 18, React Router
- **Backend**: Django 4.2, Django REST Framework
- **База данных**: SQLite
- **LLM**: DeepSeek API для генерации оценок
- **Стили**: CSS (минималистичный дизайн в бело-голубо-синих цветах)

## Структура проекта

```
├── backend/              # Django приложение
│   ├── project_prioritization/  # Основные настройки
│   ├── projects/         # Приложение для управления проектами
│   ├── evaluations/     # Приложение для оценок проектов
│   └── users/           # Приложение для авторизации
├── frontend/            # React приложение
│   ├── src/
│   │   ├── components/  # Компоненты (Layout, Sidebar)
│   │   ├── pages/       # Страницы приложения
│   │   └── context/     # React Context (Auth)
└── README.md
```

## Установка и запуск

### Backend (Django)

1. Перейдите в директорию backend:
```bash
cd backend
```

2. Создайте виртуальное окружение (рекомендуется):
```bash
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
```

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

Backend будет доступен по адресу: http://localhost:8000

### Frontend (React)

1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите приложение:
```bash
npm start
```

Frontend будет доступен по адресу: http://localhost:3000

## Структура базы данных

### Модели:

1. **Project** - Проекты
   - project_number (№ проекта)
   - priority_number (№ приоритета)
   - name (Название)
   - description (Описание)
   - comment (Комментарий)
   - vector_sum (Векторная сумма)

2. **ProjectStatus** - Статусы проектов
   - name (Название статуса)
   - description (Описание)

3. **ProjectEvaluation** - Оценки проектов
   - project (Связь с проектом)
   - status (Статус)
   - product (PM)
   - developer (Разработчик)
   - economic_efficiency (E)
   - technical_complexity (T)
   - expert_rating (X)
   - vector_sum (Векторная сумма)

## Страницы приложения

1. **Авторизация** (`/login`) - Вход в систему
2. **Все проекты** (`/projects`) - Список всех проектов с возможностью добавления и редактирования
3. **Таблица оценки** (`/evaluations`) - Редактируемая таблица оценок с сортировкой
4. **Визуализация** (`/visualization`) - Визуализация результатов

## API Endpoints

- `GET/POST /api/projects/project/` - Список/создание проектов
- `GET/PUT/DELETE /api/projects/project/{id}/` - Детали проекта
- `POST /api/projects/project/import_projects/` - Импорт проектов через LLM
- `GET/POST /api/evaluations/evaluation/` - Список/создание оценок
- `GET/PUT/DELETE /api/evaluations/evaluation/{id}/` - Детали оценки
- `POST /api/evaluations/evaluation/{id}/generate_with_llm/` - Генерация оценки через LLM
- `GET /api/projects/status/` - Список статусов проектов
- `GET /api/users/list/` - Список пользователей
- `POST /api/users/login/` - Авторизация
- `POST /api/users/logout/` - Выход
- `GET /api/users/current/` - Текущий пользователь

## Особенности

- Автоматическое создание оценки при создании проекта
- Автоматическое обновление приоритетов на основе векторной суммы
- Генерация оценок через DeepSeek LLM
- Импорт проектов из CSV/Excel с автоматической обработкой через LLM
- Сортировка по всем столбцам в таблице оценок
