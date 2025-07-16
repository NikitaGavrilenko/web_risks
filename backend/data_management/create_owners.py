import sys
import os
import hashlib
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal, engine
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import models

# Тестовые данные владельцев
test_owners = [
    {
        "username": "ivanov_ii",
        "full_name": "Иванов Иван Иванович",
        "password": "ivanov123"
    },
    {
        "username": "petrov_pp",
        "full_name": "Петров Петр Петрович",
        "password": "petrov456"
    },
    {
        "username": "sidorov_ss",
        "full_name": "Сидоров Сергей Сергеевич",
        "password": "sidorov789"
    },
    {
        "username": "kozlov_kk",
        "full_name": "Козлов Константин Константинович",
        "password": "kozlov321"
    },
    {
        "username": "smirnov_sm",
        "full_name": "Смирнов Семен Михайлович",
        "password": "smirnov654"
    }
]

def hash_password(password: str) -> str:
    """Хеширует пароль с использованием SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_owners():
    db = SessionLocal()
    try:
        # Создаем владельцев
        for owner_data in test_owners:
            # Проверяем, существует ли уже владелец с таким username
            existing_owner = db.query(models.Owner).filter(
                models.Owner.username == owner_data["username"]
            ).first()
            
            if not existing_owner:
                # Хешируем пароль
                password_hash = hash_password(owner_data["password"])
                
                # Создаем нового владельца
                owner = models.Owner(
                    username=owner_data["username"],
                    full_name=owner_data["full_name"],
                    password_hash=password_hash
                )
                db.add(owner)
                print(f"Добавлен владелец: {owner_data['full_name']}")
            else:
                print(f"Владелец {owner_data['full_name']} уже существует")
        
        db.commit()
        print("Владельцы успешно добавлены в базу данных!")
    
    except Exception as e:
        print(f"Ошибка при добавлении владельцев: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_owners()
