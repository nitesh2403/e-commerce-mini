import pyodbc
import os
from dotenv import load_dotenv

# Try loading from current directory or backend subdir
if os.path.exists('.env'):
    load_dotenv('.env')
elif os.path.exists('backend/.env'):
    load_dotenv('backend/.env')
else:
    print("Warning: .env not found")

server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
driver = '{ODBC Driver 17 for SQL Server}'

print(f"Testing Windows Authentication to {server}...")

# Trusted_Connection=yes uses the current Windows User credentials
conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};Trusted_Connection=yes;'
print(f"ConnectionString: {conn_str}")

try:
    conn = pyodbc.connect(conn_str)
    print("Windows Authentication Connection Successful! ✅")
    conn.close()
except Exception as e:
    print(f"Windows Auth Failed: {e}")
