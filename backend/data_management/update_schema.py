from sqlalchemy import create_engine, text
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SQLALCHEMY_DATABASE_URL, engine

def add_column_if_not_exists():
    """Добавляет колонку as_reserved_in_rcod в таблицу detailed_risk_reports, если она не существует"""
    with engine.connect() as connection:
        # Check if column exists
        result = connection.execute(text("PRAGMA table_info(detailed_risk_reports);"))
        columns = [row[1] for row in result]  # PRAGMA table_info returns tuples, name is at index 1
        if 'as_reserved_in_rcod' not in columns:
            print("Adding column 'as_reserved_in_rcod' to detailed_risk_reports table...")
            connection.execute(text("ALTER TABLE detailed_risk_reports ADD COLUMN as_reserved_in_rcod TEXT;"))
            print("Column added successfully.")
        else:
            print("Column 'as_reserved_in_rcod' already exists.")

if __name__ == "__main__":
    add_column_if_not_exists() 