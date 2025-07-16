import pandas as pd
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal, engine
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from models import Process, Threat, RiskDetail, DetailedRiskReport, IntegralThreatRating

def get_color_for_rating(rating: str) -> str:
    """Возвращает цвет для заданного рейтинга"""
    rating = rating.lower() if rating else ''
    if 'критический' in rating:
        return '#dc3545'  # красный
    elif 'высокий' in rating:
        return '#ffc107'  # желтый
    elif 'средний' in rating:
        return '#fd7e14'  # оранжевый
    elif 'низкий' in rating:
        return '#28a745'  # зеленый
    return '#6c757d'  # серый по умолчанию

def clean_value(value) -> str:
    """Очищает значение от NaN и приводит к строке"""
    if pd.isna(value):
        return ''
    return str(value).strip()

def normalize_text(text) -> str:
    """Нормализует текст для сравнения"""
    if pd.isna(text):
        return ''
    return str(text).strip().lower()

def normalize_reserved_flag(value) -> str:
    """Нормализует значение флага резервирования"""
    if pd.isna(value):
        return 'нет данных'
    value = str(value).strip().lower()
    if value == 'в плане':
        return 'да'
    if value == 'не в плане':
        return 'нет'
    return 'нет данных'

def import_data():
    try:
        # Определяем пути к файлам относительно корневой директории backend
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        integral_file = os.path.join(backend_dir, 'ОТЧЁТ_Интегральный_рейтинг_рисков_непрерывности_на_09_07_25.xlsx')
        detailed_file = os.path.join(backend_dir, 'ОТЧЁТ_Детальный_расчёт_рисков_непрерывности_на_09_07_25.xlsx')

        # Читаем файлы Excel с явным указанием кодировки
        df_integral = pd.read_excel(integral_file, engine='openpyxl')
        df_detailed = pd.read_excel(detailed_file, engine='openpyxl')

        # Выводим колонки для проверки
        print("Колонки в файле интегрального рейтинга:", df_integral.columns.tolist())
        print("Колонки в файле детального отчета:", df_detailed.columns.tolist())

        db = SessionLocal()

        try:
            # Очищаем существующие данные
            db.query(models.RiskDetail).delete()
            db.query(models.DetailedRiskReport).delete()
            db.query(models.IntegralThreatRating).delete()
            db.query(models.Threat).delete()
            db.query(models.Process).delete()
            db.commit()
            print("База данных очищена.")
            
            # Создаем словари для хранения процессов и угроз
            processes = {}
            threats = {}
            
            # Создаем словарь для хранения данных из интегрального отчета
            integral_data = {}
            for _, row in df_integral.iterrows():
                process_sid = clean_value(row.get('Процесс sid'))
                threat_type = normalize_text(row.get('Тип угрозы'))
                threat_scenario = normalize_text(row.get('Сценарий угрозы'))
                key = (process_sid, threat_type, threat_scenario)
                
                # Получаем значение резервирования
                as_reserved = normalize_reserved_flag(row.get('АС зарезервирована в РЦОД'))
                if as_reserved == 'нет данных':
                    # Пробуем получить из комментария
                    comment = clean_value(row.get('АС зарезервирована в РЦОД (комментарий)'))
                    if comment:
                        as_reserved = normalize_reserved_flag(comment)
                
                integral_data[key] = {
                    'high_risk_count': clean_value(row.get('Количество высоких рисков (числитель метки)')),
                    'total_risk_count': clean_value(row.get('Количество рисков (знаменатель метки)')),
                    'process_threat_rating': clean_value(row.get('Рейтинг процесса для угрозы = по максимальным рискам =')),
                    'as_reserved_in_rcod': as_reserved
                }
            
            # Импортируем данные из интегрального рейтинга (df_integral)
            for _, row in df_integral.iterrows():
                process_sid = clean_value(row.get('Процесс sid'))
                if not process_sid:
                    continue
                
                # Если процесс еще не создан, создаем его
                if process_sid not in processes:
                    process = models.Process(
                        sid=process_sid,
                        name=clean_value(row.get('Наименование процесса')),
                        risk_label=clean_value(row.get('Метка риска')),
                        owner_block=clean_value(row.get('Блок - владелец процесса')),
                        department=clean_value(row.get('Подразделение')),
                        rating=float(clean_value(row.get('Рейтинг')) or '0')
                    )
                    db.add(process)
                    db.flush()
                    processes[process_sid] = process
                
                # Добавляем угрозу для процесса
                threat_type = normalize_text(row.get('Тип угрозы'))
                threat_scenario = normalize_text(row.get('Сценарий угрозы'))
                threat_key = (process_sid, threat_type, threat_scenario)
                if threat_key not in threats:
                    threat = models.Threat(
                        type=clean_value(row.get('Тип угрозы')),
                        scenario=clean_value(row.get('Сценарий угрозы')),
                        integral_risk_level=clean_value(row.get('Итоговый интегральный уровень риска процесса')),
                        highest_risk_level=clean_value(row.get('Уровень наиболее высокого риска процесса /угрозы')),
                        process_sid=process_sid
                    )
                    db.add(threat)
                    db.flush()
                    threats[threat_key] = threat
                
                # Добавляем интегральный рейтинг угрозы
                threat_rating = clean_value(row.get('Итоговый интегральный уровень риска процесса'))
                integral_rating = models.IntegralThreatRating(
                    process_sid=process_sid,
                    threat_type=clean_value(row.get('Тип угрозы')),
                    threat_scenario=clean_value(row.get('Сценарий угрозы')),
                    threat_rating=threat_rating,
                    color=get_color_for_rating(threat_rating)
                )
                db.add(integral_rating)
            
            # Импортируем данные из детального отчета (df_detailed)
            for _, row in df_detailed.iterrows():
                process_sid = clean_value(row.get('Процесс sid'))
                if not process_sid:
                    continue
                
                threat_type = normalize_text(row.get('Тип угрозы'))
                threat_scenario = normalize_text(row.get('Сценарий угрозы'))
                threat_key = (process_sid, threat_type, threat_scenario)
                
                # Находим угрозу
                threat = threats.get(threat_key)
                
                # Получаем данные из интегрального отчета
                integral_info = integral_data.get(threat_key, {})
                
                # Добавляем детальный отчет
                if threat:
                    # Нормализуем флаг резервирования АС из детального отчета
                    as_reserved_flag = normalize_reserved_flag(row.get('АС зарезервирована в РЦОД'))
                    
                    detailed_risk = models.DetailedRiskReport(
                        process=clean_value(row.get('Наименование процесса')),
                        process_sid=process_sid,
                        threat_type=clean_value(row.get('Тип угрозы')),
                        threat_scenario=clean_value(row.get('Сценарий угрозы')),
                        impact_type=clean_value(row.get('Тип влияния')),
                        risk_subcategory=clean_value(row.get('Подкатегория риска', '')),
                        risk_group=clean_value(row.get('Группа риска', '')),
                        risk_subgroup=clean_value(row.get('Подгруппа риска', '')),
                        integral_risk=clean_value(row.get('Результат оценки рисков')),
                        operational_risk=clean_value(row.get('Рейтинг угрозы')),
                        reputational_risk=clean_value(row.get('Репутационный риск', '')),
                        regulatory_risk=clean_value(row.get('Регуляторный риск', '')),
                        financial_risk=clean_value(row.get('Финансовый риск', '')),
                        impact_assessment=clean_value(row.get('Воздействие риска')),
                        probability_assessment=clean_value(row.get('Оценка вероятности', '')),
                        control_assessment=clean_value(row.get('Оценка контроля', '')),
                        risk_level=clean_value(row.get('Метка риска')),
                        rto_hours=clean_value(row.get('RTO процесса, ч.')),
                        mtpd=clean_value(row.get('MTPD процесса')),
                        tr=clean_value(row.get('TR')),
                        risk_assessment_explanation=clean_value(row.get('Автопояснение по результату оценки рисков')),
                        as_reserved_in_rcod=as_reserved_flag,
                        threat_id=threat.id
                    )
                    db.add(detailed_risk)
                    
                    # Создаем запись RiskDetail с правильными полями
                    risk_detail = models.RiskDetail(
                        process_sid=process_sid,
                        threat_type=clean_value(row.get('Тип угрозы')),
                        threat_scenario=clean_value(row.get('Сценарий угрозы')),
                        impact_type=clean_value(row.get('Тип влияния')),
                        risk_impact=clean_value(row.get('Воздействие риска')),
                        risk_assessment=clean_value(row.get('Результат оценки рисков')),
                        risk_label=clean_value(row.get('Метка риска')),
                        risk_assessment_explanation=clean_value(row.get('Автопояснение по результату оценки рисков')),
                        as_reserved_in_rcod=as_reserved_flag,
                        high_risk_count=integral_info.get('high_risk_count', ''),
                        total_risk_count=integral_info.get('total_risk_count', ''),
                        process_threat_rating=integral_info.get('process_threat_rating', ''),
                        rto_hours=clean_value(row.get('RTO процесса, ч.')),
                        mtpd=clean_value(row.get('MTPD процесса')),
                        tr=clean_value(row.get('TR')),
                        threat_id=threat.id
                    )
                    db.add(risk_detail)
            
            db.commit()
            print("\nДанные успешно импортированы!")
        except Exception as e:
            db.rollback()
            print(f"Ошибка при импорте данных: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"Ошибка при чтении файлов: {e}")

if __name__ == "__main__":
    import_data()
