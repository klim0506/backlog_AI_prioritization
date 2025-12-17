"""Сервис для работы с DeepSeek API"""
import os
import json
import re
import requests
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / '.env'

if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=True)
else:
    load_dotenv(override=True)


class DeepSeekService:
    """Сервис для работы с DeepSeek API"""
    
    def __init__(self):
        self.api_key = os.getenv('DEEPSEEK_API_KEY', '').strip()
        self.api_url = os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions').strip()
        self.model = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat').strip()
    
    def process_single_row(self, row_data: Dict[str, Any], headers: List[str] = None) -> Dict[str, Any]:
        """Обрабатывает одну строку таблицы через DeepSeek API"""
        if not self.api_key:
            error_msg = (
                f"DEEPSEEK_API_KEY не установлен в переменных окружения.\n"
                f"Проверьте файл .env в директории backend/ и убедитесь, что он содержит:\n"
                f"DEEPSEEK_API_KEY=ваш-ключ-здесь\n\n"
                f"Путь к файлу: {ENV_FILE}\n"
                f"Файл существует: {ENV_FILE.exists()}"
            )
            raise ValueError(error_msg)
        
        prompt = self._create_single_row_prompt(row_data, headers)
        response = self._call_api(prompt)
        return self._parse_single_response(response)
    
    def _parse_single_response(self, response_text: str) -> Dict[str, Any]:
        """Парсит ответ от LLM для одной строки"""
        response_text = response_text.strip()
        
        if '```' in response_text:
            lines = response_text.split('\n')
            json_start = None
            json_end = None
            
            for i, line in enumerate(lines):
                if line.strip().startswith('```'):
                    continue
                if json_start is None and line.strip():
                    json_start = i
                    break
            
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('```'):
                    json_end = i
                    break
            
            if json_start is not None:
                if json_end is not None:
                    response_text = '\n'.join(lines[json_start:json_end])
                else:
                    response_text = '\n'.join(lines[json_start:])
        
        response_text = response_text.strip()
        
        try:
            data = json.loads(response_text)
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            
            if not isinstance(data, dict):
                raise ValueError("Ответ должен быть JSON объектом")
            
            normalized_item = {
                'name': data.get('name', '').strip(),
                'description': data.get('description', '').strip(),
                'comment': data.get('comment', '').strip() if data.get('comment') else ''
            }
            
            if not normalized_item['name']:
                raise ValueError("Название проекта обязательно")
            if not normalized_item['description']:
                raise ValueError("Описание проекта обязательно")
            
            return normalized_item
            
        except json.JSONDecodeError as e:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                try:
                    json_str = json_match.group(0)
                    brace_count = 0
                    last_brace = -1
                    for i, char in enumerate(json_str):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                last_brace = i
                                break
                    
                    if last_brace > 0:
                        json_str = json_str[:last_brace + 1]
                    
                    data = json.loads(json_str)
                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]
                    
                    if not isinstance(data, dict):
                        raise ValueError("Ответ должен быть JSON объектом")
                    
                    normalized_item = {
                        'name': data.get('name', '').strip(),
                        'description': data.get('description', '').strip(),
                        'comment': data.get('comment', '').strip() if data.get('comment') else ''
                    }
                    
                    if not normalized_item['name']:
                        raise ValueError("Название проекта обязательно")
                    if not normalized_item['description']:
                        raise ValueError("Описание проекта обязательно")
                    
                    return normalized_item
                except Exception as parse_error:
                    raise Exception(f"Ошибка парсинга JSON ответа от LLM: {str(e)}\nПопытка восстановления также не удалась: {str(parse_error)}\nОтвет (первые 500 символов): {response_text[:500]}")
            
            raise Exception(f"Ошибка парсинга JSON ответа от LLM: {str(e)}\nОтвет (первые 500 символов): {response_text[:500]}")
        except Exception as e:
            raise Exception(f"Ошибка обработки ответа от LLM: {str(e)}\nОтвет (первые 500 символов): {response_text[:500]}")
    
    def process_batch_rows(self, rows_data: List[Dict[str, Any]], headers: List[str] = None) -> List[Dict[str, Any]]:
        """Обрабатывает батч строк (до 5) через DeepSeek API"""
        if not self.api_key:
            error_msg = (
                f"DEEPSEEK_API_KEY не установлен в переменных окружения.\n"
                f"Проверьте файл .env в директории backend/ и убедитесь, что он содержит:\n"
                f"DEEPSEEK_API_KEY=ваш-ключ-здесь\n\n"
                f"Путь к файлу: {ENV_FILE}\n"
                f"Файл существует: {ENV_FILE.exists()}"
            )
            raise ValueError(error_msg)
        
        if len(rows_data) > 5:
            raise ValueError("Максимальный размер батча - 5 строк")
        
        prompt = self._create_batch_prompt(rows_data, headers)
        response = self._call_api(prompt)
        return self._parse_batch_response(response, len(rows_data))
    
    def _create_batch_prompt(self, rows_data: List[Dict[str, Any]], headers: List[str] = None) -> str:
        """Создает промпт для LLM на основе батча строк"""
        if headers is None and len(rows_data) > 0:
            headers = list(rows_data[0].keys())
        
        rows_text = "Заголовки колонок: " + ", ".join(headers) + "\n\n"
        rows_text += "Данные строк таблицы:\n\n"
        
        for idx, row_data in enumerate(rows_data, 1):
            rows_text += f"Строка {idx}:\n"
            for key, value in row_data.items():
                if value:
                    rows_text += f"  {key}: {value}\n"
            rows_text += "\n"
        
        prompt = f"""Ты - ассистент для системы приоритизации проектов. 

Тебе предоставлено несколько строк таблицы с данными проектов (до 5 строк).

Заголовки колонок могут быть на русском или английском языке, и могут называться по-разному.

Твоя задача:
1. Проанализировать каждую строку таблицы
2. Для каждой строки сопоставить колонки с полями проекта:
   - Название проекта (name) - обязательное поле
   - Описание проекта (description) - обязательное поле, если нет - сгенерируй краткое описание на основе названия
   - Комментарий (comment) - необязательное поле
3. Вернуть JSON массив объектов в формате:
   [
     {{
       "name": "Название проекта 1",
       "description": "Подробное описание проекта 1",
       "comment": "Дополнительные комментарии (если есть)"
     }},
     {{
       "name": "Название проекта 2",
       "description": "Подробное описание проекта 2",
       "comment": "Дополнительные комментарии (если есть)"
     }}
   ]

КРИТИЧЕСКИ ВАЖНО:
- Название и описание обязательны для каждого проекта
- Если описание отсутствует, сгенерируй его на основе названия и других данных
- Комментарий может быть пустым
- Верни ТОЛЬКО валидный JSON массив, БЕЗ markdown блоков, БЕЗ дополнительного текста
- НЕ используй ```json или ``` - верни только чистый JSON массив
- Начни ответ сразу с символа [
- Количество объектов в массиве должно соответствовать количеству строк

Данные строк:
{rows_text}

Верни JSON массив с проектами (только JSON, без markdown):"""
        
        return prompt
    
    def _parse_batch_response(self, response_text: str, expected_count: int) -> List[Dict[str, Any]]:
        """Парсит ответ от LLM для батча строк"""
        response_text = response_text.strip()
        
        if '```' in response_text:
            lines = response_text.split('\n')
            json_start = None
            json_end = None
            
            for i, line in enumerate(lines):
                if line.strip().startswith('```'):
                    continue
                if json_start is None and line.strip():
                    json_start = i
                    break
            
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('```'):
                    json_end = i
                    break
            
            if json_start is not None:
                if json_end is not None:
                    response_text = '\n'.join(lines[json_start:json_end])
                else:
                    response_text = '\n'.join(lines[json_start:])
        
        response_text = response_text.strip()
        
        try:
            data = json.loads(response_text)
            
            if not isinstance(data, list):
                if isinstance(data, dict):
                    data = [data]
                else:
                    raise ValueError("Ответ должен быть JSON массивом")
            
            results = []
            for idx, item in enumerate(data):
                if not isinstance(item, dict):
                    raise ValueError(f"Элемент {idx + 1} должен быть объектом")
                
                normalized_item = {
                    'name': item.get('name', '').strip(),
                    'description': item.get('description', '').strip(),
                    'comment': item.get('comment', '').strip() if item.get('comment') else ''
                }
                
                if not normalized_item['name']:
                    raise ValueError(f"Элемент {idx + 1}: название проекта обязательно")
                if not normalized_item['description']:
                    raise ValueError(f"Элемент {idx + 1}: описание проекта обязательно")
                
                results.append(normalized_item)
            
            if len(results) != expected_count:
                raise ValueError(f"Ожидалось {expected_count} проектов, получено {len(results)}")
            
            return results
            
        except json.JSONDecodeError as e:
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                try:
                    json_str = json_match.group(0)
                    data = json.loads(json_str)
                    
                    if not isinstance(data, list):
                        if isinstance(data, dict):
                            data = [data]
                        else:
                            raise ValueError("Ответ должен быть JSON массивом")
                    
                    results = []
                    for idx, item in enumerate(data):
                        if not isinstance(item, dict):
                            continue
                        
                        normalized_item = {
                            'name': item.get('name', '').strip(),
                            'description': item.get('description', '').strip(),
                            'comment': item.get('comment', '').strip() if item.get('comment') else ''
                        }
                        
                        if normalized_item['name'] and normalized_item['description']:
                            results.append(normalized_item)
                    
                    if len(results) > 0:
                        return results
                except Exception as parse_error:
                    pass
            
            raise Exception(f"Ошибка парсинга JSON ответа от LLM: {str(e)}\nОтвет (первые 500 символов): {response_text[:500]}")
        except Exception as e:
            raise Exception(f"Ошибка обработки ответа от LLM: {str(e)}\nОтвет (первые 500 символов): {response_text[:500]}")
    
    def _create_single_row_prompt(self, row_data: Dict[str, Any], headers: List[str] = None) -> str:
        """Создает промпт для LLM на основе одной строки таблицы"""
        if headers is None:
            headers = list(row_data.keys())
        
        row_text = "Заголовки колонок: " + ", ".join(headers) + "\n\n"
        row_text += "Данные строки:\n"
        
        for key, value in row_data.items():
            if value:
                row_text += f"  {key}: {value}\n"
        
        prompt = f"""Ты - ассистент для системы приоритизации проектов. 

Тебе предоставлена одна строка таблицы с данными проекта.

Заголовки колонок могут быть на русском или английском языке, и могут называться по-разному.

Твоя задача:
1. Проанализировать данные строки
2. Сопоставить колонки с полями проекта:
   - Название проекта (name) - обязательное поле
   - Описание проекта (description) - обязательное поле, если нет - сгенерируй краткое описание на основе названия
   - Комментарий (comment) - необязательное поле
3. Вернуть JSON объект в формате:
   {{
     "name": "Название проекта",
     "description": "Подробное описание проекта",
     "comment": "Дополнительные комментарии (если есть)"
   }}

КРИТИЧЕСКИ ВАЖНО:
- Название и описание обязательны
- Если описание отсутствует, сгенерируй его на основе названия и других данных
- Комментарий может быть пустым
- Верни ТОЛЬКО валидный JSON объект, БЕЗ markdown блоков, БЕЗ дополнительного текста
- НЕ используй ```json или ``` - верни только чистый JSON объект
- Начни ответ сразу с символа {{

Данные строки:
{row_text}

Верни JSON объект с проектом (только JSON, без markdown):"""
        
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
    
    def generate_evaluation(self, project_name: str, project_description: str, parameter: str) -> float:
        """Генерирует оценку проекта по указанному параметру через DeepSeek API"""
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY не установлен в переменных окружения")
        
        parameter_descriptions = {
            'economic_efficiency': {
                'name': 'Экономическая эффективность (E)',
                'description': 'Оценивает экономическую выгоду проекта: потенциальную прибыль, ROI, экономию средств, влияние на бизнес-показатели. Шкала от 0 до 10, где 10 - максимальная экономическая эффективность.'
            },
            'technical_complexity': {
                'name': 'Сложность технической реализации (T)',
                'description': 'Оценивает техническую сложность проекта: требуемые ресурсы, технологии, время разработки, риски. Шкала от 0 до 10, где 0 - минимальная сложность (простой проект), 10 - максимальная сложность (очень сложный проект).'
            },
            'expert_rating': {
                'name': 'Экспертная оценка (X)',
                'description': 'Общая экспертная оценка проекта: стратегическая важность, приоритет, влияние на организацию, соответствие целям. Шкала от 0 до 10, где 10 - максимальная экспертная оценка.'
            }
        }
        
        if parameter not in parameter_descriptions:
            raise ValueError(f"Неизвестный параметр: {parameter}")
        
        param_info = parameter_descriptions[parameter]
        
        prompt = f"""Ты - эксперт по оценке проектов в системе приоритизации.

Тебе нужно оценить проект по параметру "{param_info['name']}".

Описание параметра: {param_info['description']}

Информация о проекте:
- Название: {project_name}
- Описание: {project_description}

Твоя задача:
1. Проанализировать проект на основе предоставленной информации
2. Оценить проект по параметру "{param_info['name']}" по шкале от 0.0 до 10.0
3. Вернуть ТОЛЬКО число от 0.0 до 10.0 (можно с одним знаком после запятой)

ВАЖНО:
- Верни ТОЛЬКО число, без дополнительного текста
- Число должно быть от 0.0 до 10.0
- Используй один знак после запятой (например: 7.5, 3.2, 9.0)

Верни оценку:"""
        
        try:
            response = self._call_api(prompt)
            response = response.strip()
            
            if response.startswith('```'):
                start = response.find('\n')
                end = response.rfind('```')
                if start != -1 and end > start:
                    response = response[start+1:end].strip()
            
            numbers = re.findall(r'\d+\.?\d*', response)
            if numbers:
                value = float(numbers[0])
                value = max(0.0, min(10.0, value))
                return round(value, 1)
            else:
                try:
                    data = json.loads(response)
                    if isinstance(data, (int, float)):
                        value = float(data)
                        value = max(0.0, min(10.0, value))
                        return round(value, 1)
                except:
                    pass
                
                raise Exception(f"Не удалось извлечь число из ответа LLM: {response[:200]}")
        except Exception as e:
            if "DEEPSEEK_API_KEY" in str(e):
                raise
            raise Exception(f"Ошибка при генерации оценки через LLM: {str(e)}")
    
    def generate_all_evaluations(self, project_name: str, project_description: str) -> Dict[str, float]:
        """Генерирует все три оценки проекта (E, T, X) одним запросом через DeepSeek API"""
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY не установлен в переменных окружения")
        
        prompt = f"""Ты - креативный эксперт по оценке проектов в системе приоритизации.

Тебе нужно оценить проект по трем параметрам одновременно:
1. Экономическая эффективность (E) - экономическая выгода проекта: потенциальная прибыль, ROI, экономия средств, влияние на бизнес-показатели. Шкала от 0.0 до 10.0, где 10 - максимальная экономическая эффективность.
2. Сложность технической реализации (T) - техническая сложность проекта: требуемые ресурсы, технологии, время разработки, риски. Шкала от 0.0 до 10.0, где 0 - минимальная сложность (простой проект), 10 - максимальная сложность (очень сложный проект).
3. Экспертная оценка (X) - общая экспертная оценка проекта: стратегическая важность, приоритет, влияние на организацию, соответствие целям. Шкала от 0.0 до 10.0, где 10 - максимальная экспертная оценка.

Информация о проекте:
- Название: {project_name}
- Описание: {project_description}

Твоя задача:
1. Проанализировать проект креативно и нестандартно
2. Искать неочевидные причины и факторы влияния
3. Придавать субъективность численным ответам - не бойся быть оригинальным в оценке
4. Оценить проект по всем трем параметрам одновременно, учитывая их взаимосвязь
5. Вернуть JSON объект с тремя полями: "economic_efficiency", "technical_complexity", "expert_rating"

ВАЖНО:
- Верни ТОЛЬКО валидный JSON объект без дополнительного текста
- Каждое значение должно быть числом от 0.0 до 10.0
- Используй один знак после запятой (например: 7.5, 3.2, 9.0)
- Будь креативным в оценке, не ограничивайся стандартными подходами
- Учитывай субъективные факторы и нестандартные причины

Пример ответа:
{{
  "economic_efficiency": 7.5,
  "technical_complexity": 4.2,
  "expert_rating": 8.1
}}

Верни оценки:"""
        
        try:
            response = self._call_api(prompt)
            response = response.strip()
            
            if '```' in response:
                lines = response.split('\n')
                json_start = None
                json_end = None
                
                for i, line in enumerate(lines):
                    if '```json' in line.lower() or (line.strip().startswith('```') and json_start is None):
                        json_start = i + 1
                        break
                    elif line.strip().startswith('```') and json_start is None:
                        json_start = i + 1
                        break
                
                for i in range(len(lines) - 1, -1, -1):
                    if lines[i].strip().startswith('```'):
                        json_end = i
                        break
                
                if json_start is not None and json_end is not None:
                    response = '\n'.join(lines[json_start:json_end])
                elif json_start is not None:
                    response = '\n'.join(lines[json_start:])
            
            response = response.strip()
            
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
                brace_count = 0
                last_brace = -1
                for i, char in enumerate(json_str):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            last_brace = i
                            break
                
                if last_brace > 0:
                    json_str = json_str[:last_brace + 1]
                
                data = json.loads(json_str)
            else:
                data = json.loads(response)
            
            if not isinstance(data, dict):
                raise ValueError("Ответ должен быть JSON объектом")
            
            result = {
                'economic_efficiency': max(0.0, min(10.0, round(float(data.get('economic_efficiency', 0)), 1))),
                'technical_complexity': max(0.0, min(10.0, round(float(data.get('technical_complexity', 0)), 1))),
                'expert_rating': max(0.0, min(10.0, round(float(data.get('expert_rating', 0)), 1)))
            }
            
            return result
            
        except json.JSONDecodeError as e:
            raise Exception(f"Ошибка парсинга JSON ответа от LLM: {str(e)}. Ответ (первые 500 символов): {response[:500]}")
        except Exception as e:
            if "DEEPSEEK_API_KEY" in str(e):
                raise
            raise Exception(f"Ошибка при генерации оценок через LLM: {str(e)}")