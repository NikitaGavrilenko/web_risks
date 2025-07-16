from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import models
from database import get_db, engine
from data_management.import_data import import_data
from data_management.update_schema import add_column_if_not_exists
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_
import hashlib
from datetime import datetime, timedelta
import jwt
from typing import Optional

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Создаем таблицы при запуске
models.Base.metadata.create_all(bind=engine)

# Обновляем схему базы данных если нужно
add_column_if_not_exists()

# Настройки JWT
SECRET_KEY = "your-secret-key"  # В продакшене использовать безопасный ключ
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str) -> str:
    """Хеширует пароль с использованием SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля хешу"""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Получает текущего пользователя по токену"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(models.Owner).filter(models.Owner.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Эндпоинт для получения токена доступа"""
    user = db.query(models.Owner).filter(models.Owner.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: models.Owner = Depends(get_current_user)):
    """Получает информацию о текущем пользователе"""
    return {
        "username": current_user.username,
        "full_name": current_user.full_name
    }

@app.get("/users/me/processes")
async def read_user_processes(
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает список процессов текущего пользователя"""
    processes = db.query(models.Process).filter(models.Process.owner_id == current_user.id).all()
    return processes

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/import-data")
def import_data_endpoint():
    try:
        import_data()
        return {"status": "success", "message": "Data imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/processes")
def get_processes(
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    processes = db.query(models.Process).filter(models.Process.owner_id == current_user.id).all()
    return processes

@app.get("/process/{process_sid}")
def get_process(
    process_sid: str, 
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    process = db.query(models.Process).filter(
        and_(models.Process.sid == process_sid, models.Process.owner_id == current_user.id)
    ).first()
    if process is None:
        raise HTTPException(status_code=404, detail="Process not found")
    return process

@app.get("/threats/{process_sid}")
def get_threats(
    process_sid: str,
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверяем принадлежность процесса пользователю
    process = db.query(models.Process).filter(
        and_(models.Process.sid == process_sid, models.Process.owner_id == current_user.id)
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")

    # Получаем все угрозы для процесса
    threats = db.query(models.Threat).filter(
        models.Threat.process_sid == process_sid
    ).all()
    
    # Получаем все рейтинги для процесса
    ratings = db.query(models.IntegralThreatRating).filter(
        models.IntegralThreatRating.process_sid == process_sid
    ).all()
    
    # Создаем словарь для быстрого поиска рейтинга
    ratings_dict = {
        (r.threat_type.lower() if r.threat_type else '', 
         r.threat_scenario.lower() if r.threat_scenario else ''): r
        for r in ratings
    }
    
    # Используем словарь для удаления дубликатов
    unique_threats = {}
    for threat in threats:
        key = (threat.type, threat.scenario)
        if key not in unique_threats:
            unique_threats[key] = threat
    
    # Объединяем данные
    result = []
    for threat in unique_threats.values():
        threat_dict = {
            "id": threat.id,
            "type": threat.type or '',
            "scenario": threat.scenario or '',
            "integral_risk_level": threat.integral_risk_level or '',
            "highest_risk_level": threat.highest_risk_level or '',
            "process_sid": threat.process_sid or '',
        }
        
        # Ищем соответствующий рейтинг
        rating_key = (
            threat.type.lower() if threat.type else '',
            threat.scenario.lower() if threat.scenario else ''
        )
        rating = ratings_dict.get(rating_key)
        
        if rating:
            threat_dict["threat_rating"] = rating.threat_rating
            threat_dict["threat_rating_color"] = rating.color
        else:
            threat_dict["threat_rating"] = ''
            threat_dict["threat_rating_color"] = '#6c757d'  # серый цвет по умолчанию
            
        result.append(threat_dict)
    
    return result

@app.get("/risk-details/{process_sid}")
def get_risk_details(
    process_sid: str,
    threat_type: str | None = None,
    threat_scenario: str | None = None,
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверяем принадлежность процесса пользователю
    process = db.query(models.Process).filter(
        and_(models.Process.sid == process_sid, models.Process.owner_id == current_user.id)
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    query = db.query(models.RiskDetail).filter(models.RiskDetail.process_sid == process_sid)
    
    if threat_type is not None:
        query = query.filter(models.RiskDetail.threat_type == threat_type)
    if threat_scenario is not None:
        query = query.filter(models.RiskDetail.threat_scenario == threat_scenario)
    
    risk_details = query.first()
    if risk_details is None:
        raise HTTPException(status_code=404, detail="Risk details not found")
    return risk_details

@app.get("/detailed-risk-report/{process_sid}")
def get_detailed_risk_report(
    process_sid: str,
    threat_type: str | None = None,
    threat_scenario: str | None = None,
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверяем принадлежность процесса пользователю
    process = db.query(models.Process).filter(
        and_(models.Process.sid == process_sid, models.Process.owner_id == current_user.id)
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    query = db.query(models.DetailedRiskReport).filter(models.DetailedRiskReport.process_sid == process_sid)
    
    if threat_type is not None:
        query = query.filter(models.DetailedRiskReport.threat_type == threat_type)
    if threat_scenario is not None:
        query = query.filter(models.DetailedRiskReport.threat_scenario == threat_scenario)
    
    reports = query.all()
    if not reports:
        raise HTTPException(status_code=404, detail="Reports not found")
    return reports

@app.get("/integral-threat-ratings/{process_sid}")
def get_integral_threat_ratings(
    process_sid: str,
    current_user: models.Owner = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверяем принадлежность процесса пользователю
    process = db.query(models.Process).filter(
        and_(models.Process.sid == process_sid, models.Process.owner_id == current_user.id)
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    ratings = db.query(models.IntegralThreatRating).filter(
        models.IntegralThreatRating.process_sid == process_sid
    ).all()
    return ratings
