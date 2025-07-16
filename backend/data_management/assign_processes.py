import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal, engine
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
from sqlalchemy.orm import Session
import random

def assign_processes():
    """Назначает процессы случайным владельцам"""
    db = SessionLocal()
    try:
        # Получаем всех владельцев
        owners = db.query(models.Owner).all()
        if not owners:
            print("Ошибка: нет владельцев в базе данных")
            return

        # Получаем все процессы
        processes = db.query(models.Process).all()
        if not processes:
            print("Ошибка: нет процессов в базе данных")
            return

        # Распределяем процессы между владельцами
        for process in processes:
            # Выбираем случайного владельца
            owner = random.choice(owners)
            process.owner_id = owner.id
            print(f"Процесс '{process.name}' назначен владельцу {owner.full_name}")

        db.commit()
        print("\nПроцессы успешно распределены между владельцами!")

    except Exception as e:
        print(f"Ошибка при назначении процессов: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    assign_processes()
