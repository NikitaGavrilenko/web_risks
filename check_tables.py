import sqlite3

conn = sqlite3.connect('backend/risks.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Таблицы в базе:', cursor.fetchall())
conn.close()
