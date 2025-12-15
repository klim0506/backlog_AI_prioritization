<<<<<<< HEAD
# backlog_AI_prioritization
Система приоритизации бэклога проектов с учётом различных экономических и проектных параметров
=======
# Система приоритизации бэклога проектов

Веб-приложение для оценки, приоритизации и визуального анализа проектов на основе трёх ключевых параметров:
1. Экономическая эффективность
2. Сложность технической реализации
3. Экспертная оценка

## Технологический стек

- **Frontend**: React 18, React Router
- **Backend**: Django 4.2, Django REST Framework
- **База данных**: SQLite
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
   - owner, responsible, initiator (Пользователи)
   - economic_efficiency (E)
   - technical_complexity (T)
   - expert_rating (X)
   - vector_sum (Векторная сумма)

## Страницы приложения

1. **Авторизация** (`/login`) - Вход в систему
2. **Все проекты** (`/projects`) - Список всех проектов
3. **Таблица оценки** (`/evaluations`) - Редактируемая таблица оценок
4. **Визуализация** (`/visualization`) - 3D и 2D визуализация результатов

## API Endpoints

- `GET/POST /api/projects/project/` - Список/создание проектов
- `GET/PUT/DELETE /api/projects/project/{id}/` - Детали проекта
- `GET/POST /api/evaluations/evaluation/` - Список/создание оценок
- `GET/PUT/DELETE /api/evaluations/evaluation/{id}/` - Детали оценки
- `POST /api/users/login/` - Авторизация
- `POST /api/users/logout/` - Выход
- `GET /api/users/current/` - Текущий пользователь

## Следующие шаги

- Реализация функционала добавления/редактирования проектов
- Интеграция с LLM для генерации оценок
- Реализация 3D визуализации (Three.js или аналогичная библиотека)
- Импорт проектов из CSV/Excel
- Расширенная фильтрация и поиск

>>>>>>> 8b1c8d3 (Initial commit: структура проекта с Django backend и React frontend)
