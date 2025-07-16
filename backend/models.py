from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)
    processes = relationship("Process", back_populates="owner")

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    sid = Column(String, unique=True, index=True)  # Process SID
    name = Column(String, index=True)  # Наименование процесса
    risk_label = Column(String)  # Метка риска
    owner_block = Column(String)  # Блок - владелец процесса
    department = Column(String)  # Подразделение
    rating = Column(Float)  # Рейтинг
    owner_id = Column(Integer, ForeignKey("owners.id"))  # Связь с владельцем
    owner = relationship("Owner", back_populates="processes")
    threats = relationship("Threat", back_populates="process")

class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # Тип угрозы
    scenario = Column(String)  # Сценарий угрозы
    integral_risk_level = Column(String)  # Итоговый интегральный уровень риска угрозы
    highest_risk_level = Column(String)  # Уровень наиболее высокого риска угрозы
    process_sid = Column(String, ForeignKey("processes.sid"))  # Изменено с process_id на process_sid
    process = relationship("Process", back_populates="threats")
    risk_details = relationship("RiskDetail", back_populates="threat")
    detailed_risks = relationship("DetailedRiskReport", back_populates="threat")

class IntegralThreatRating(Base):
    __tablename__ = "integral_threat_ratings"

    id = Column(Integer, primary_key=True, index=True)
    process_sid = Column(String, index=True)
    threat_type = Column(String)
    threat_scenario = Column(String)
    threat_rating = Column(String)
    color = Column(String)

class RiskDetail(Base):
    __tablename__ = "risk_details"

    id = Column(Integer, primary_key=True, index=True)
    process_sid = Column(String, index=True)  # Process SID для связи
    threat_type = Column(String)  # Тип угрозы
    threat_scenario = Column(String)  # Сценарий угрозы
    impact_type = Column(String)  # Тип влияния
    
    # Воздействие риска
    risk_impact = Column(String)  # Воздействие риска
    
    # Результаты оценки риска
    risk_assessment = Column(String)  # Результаты оценки риска
    risk_label = Column(String)  # Метки риска
    risk_assessment_explanation = Column(String)  # Автопояснение результатов оценки риска
    
    # Базовая информация из интегрального отчета
    high_risk_count = Column(String)  # Количество высоких рисков (числитель метки)
    total_risk_count = Column(String)  # Количество рисков (знаменатель метки)
    process_threat_rating = Column(String)  # Рейтинг процесса для угрозы = по максимальным рискам =
    
    # Новые поля
    as_reserved_in_rcod = Column(String)  # АС зарезервирована в РЦОД (комментарий)
    rto_hours = Column(String)  # RTO процесса, ч.
    mtpd = Column(String)  # MTPD процесса
    tr = Column(String)  # TR
    
    threat_id = Column(Integer, ForeignKey("threats.id"))
    threat = relationship("Threat", back_populates="risk_details")

class DetailedRiskReport(Base):
    __tablename__ = "detailed_risk_reports"

    id = Column(Integer, primary_key=True, index=True)
    process = Column(String)  # Процесс
    process_sid = Column(String, index=True)  # Process SID для связи
    threat_type = Column(String)  # Тип угрозы
    threat_scenario = Column(String)  # Сценарий угрозы
    
    # Основные показатели
    impact_type = Column(String)  # Тип влияния (переименовано с risk_category)
    risk_subcategory = Column(String)  # Подкатегория риска
    risk_group = Column(String)  # Группа риска
    risk_subgroup = Column(String)  # Подгруппа риска
    
    # Оценки рисков
    integral_risk = Column(String)  # Интегральный риск
    operational_risk = Column(String)  # Операционный риск
    reputational_risk = Column(String)  # Репутационный риск
    regulatory_risk = Column(String)  # Регуляторный риск
    financial_risk = Column(String)  # Финансовый риск
    
    # Дополнительные параметры
    impact_assessment = Column(String)  # Оценка воздействия
    probability_assessment = Column(String)  # Оценка вероятности
    control_assessment = Column(String)  # Оценка контроля
    risk_level = Column(String)  # Уровень риска
    
    # Новые поля
    rto_hours = Column(String)  # RTO процесса, ч.
    mtpd = Column(String)  # MTPD процесса
    tr = Column(String)  # TR
    risk_assessment_explanation = Column(String)  # Автопояснение по результату оценки рисков
    as_reserved_in_rcod = Column(String)  # АС зарезервирована в РЦОД (да/нет)
    
    # Связь с угрозой
    threat_id = Column(Integer, ForeignKey("threats.id"))
    threat = relationship("Threat", back_populates="detailed_risks")
