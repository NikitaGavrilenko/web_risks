import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
import models

def check_data():
    db = SessionLocal()
    try:
        # Проверяем количество записей в каждой таблице
        process_count = db.query(models.Process).count()
        threat_count = db.query(models.Threat).count()
        risk_detail_count = db.query(models.RiskDetail).count()
        detailed_risk_count = db.query(models.DetailedRiskReport).count()
        integral_rating_count = db.query(models.IntegralThreatRating).count()

        print("\nКоличество записей в таблицах:")
        print(f"Процессы: {process_count}")
        print(f"Угрозы: {threat_count}")
        print(f"Детали рисков: {risk_detail_count}")
        print(f"Детальные отчеты: {detailed_risk_count}")
        print(f"Интегральные рейтинги: {integral_rating_count}")

        # Выводим пример процесса
        if process_count > 0:
            process = db.query(models.Process).first()
            print("\nПример процесса:")
            print(f"SID: {process.sid}")
            print(f"Название: {process.name}")
            print(f"Метка риска: {process.risk_label}")
            print(f"Блок: {process.owner_block}")
            print(f"Подразделение: {process.department}")
            print(f"Рейтинг: {process.rating}")

    finally:
        db.close()

if __name__ == "__main__":
    check_data() 