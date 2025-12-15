"""
Сервис для работы с DeepSeek API
"""
import os
import json
import requests
from typing import List, Dict, Any


class DeepSeekService:
    """Сервис для работы с DeepSeek API"""
    
    def __init__(self):
        self.api_key = os.getenv('DEEPSEEK_API_KEY', '')
        self.api_url = os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions')
        self.model = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    
    def process_table_data(self, table_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Обрабатывает данные таблицы через DeepSeek API
        
        Args:
            table_data: Список словарей с данными из таблицы (каждая строка - отдельный словарь)
        
        Returns:
            Список структурированных данных проектов
        """
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY не установлен в переменных окружения")
        
        # Формируем промпт для LLM
        prompt = self._create_prompt(table_data)
        
        # Отправляем запрос в DeepSeek API
        response = self._call_api(prompt)
        
        # Парсим ответ и возвращаем структурированные данные
        return self._parse_response(response)
    
    def _create_prompt(self, table_data: List[Dict[str, Any]]) -> str:
        """Создает промпт для LLM на основе данных таблицы"""
        
        # Преобразуем таблицу в текстовый формат
        if not table_data:
            return ""
        
        # Получаем заголовки (ключи первого словаря)
        headers = list(table_data[0].keys()) if table_data else []
        
        # Формируем текстовое представление таблицы
        table_text = "Заголовки колонок: " + ", ".join(headers) + "\n\n"
        table_text += "Данные таблицы (каждая строка - отдельный проект):\n"
        
        for idx, row in enumerate(table_data, 1):
            table_text += f"\nСтрока {idx}:\n"
            for key, value in row.items():
                if value:  # Пропускаем пустые значения
                    table_text += f"  {key}: {value}\n"
        
        prompt = f"""Ты - ассистент для системы приоритизации проектов. 

Тебе предоставлена таблица с проектами. Каждая строка таблицы - это отдельный проект.

Заголовки колонок могут быть на русском или английском языке, и могут называться по-разному.

Твоя задача:
1. Проанализировать структуру таблицы
2. Сопоставить колонки с полями проекта:
   - Название проекта (name) - обязательное поле
   - Описание проекта (description) - обязательное поле, если нет - сгенерируй краткое описание на основе названия
   - Комментарий (comment) - необязательное поле
3. Вернуть JSON массив, где каждый элемент - это проект в формате:
   {{
     "name": "Название проекта",
     "description": "Подробное описание проекта",
     "comment": "Дополнительные комментарии (если есть)"
   }}

ВАЖНО:
- Название и описание обязательны для каждого проекта
- Если описание отсутствует, сгенерируй его на основе названия и других данных
- Комментарий может быть пустым
- Верни ТОЛЬКО валидный JSON массив, без дополнительного текста

Данные таблицы:
{table_text}

Верни JSON массив с проектами:"""
        
        return prompt
    
    def _call_api(self, prompt: str) -> str:
        """Вызывает DeepSeek API и возвращает ответ"""
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        
        payload = {
            'model': self.model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'Ты - помощник для обработки табличных данных. Всегда возвращай только валидный JSON без дополнительного текста.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.3,
            'max_tokens': 4000
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ошибка при вызове DeepSeek API: {str(e)}")
        except (KeyError, IndexError) as e:
            raise Exception(f"Неожиданный формат ответа от DeepSeek API: {str(e)}")
    
    def _parse_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Парсит ответ от LLM и возвращает структурированные данные"""
        
        # Очищаем ответ от возможных markdown блоков
        response_text = response_text.strip()
        
        # Убираем markdown code blocks если есть
        if response_text.startswith('```'):
            # Находим начало JSON
            start = response_text.find('[')
            end = response_text.rfind(']') + 1
            if start != -1 and end > start:
                response_text = response_text[start:end]
        elif response_text.startswith('{'):
            # Если вернулся один объект, оборачиваем в массив
            response_text = f'[{response_text}]'
        
        try:
            # Парсим JSON
            data = json.loads(response_text)
            
            # Убеждаемся, что это список
            if isinstance(data, dict):
                data = [data]
            
            # Валидируем и нормализуем данные
            normalized_data = []
            for item in data:
                if not isinstance(item, dict):
                    continue
                
                normalized_item = {
                    'name': item.get('name', '').strip(),
                    'description': item.get('description', '').strip(),
                    'comment': item.get('comment', '').strip() if item.get('comment') else ''
                }
                
                # Проверяем обязательные поля
                if normalized_item['name']:
                    normalized_data.append(normalized_item)
            
            return normalized_data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Ошибка парсинга JSON ответа от LLM: {str(e)}\nОтвет: {response_text[:200]}")
        except Exception as e:
            raise Exception(f"Ошибка обработки ответа от LLM: {str(e)}")
