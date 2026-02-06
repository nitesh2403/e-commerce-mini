import pyodbc
import os
from dotenv import load_dotenv

# Try loading from current directory (backend)
load_dotenv('.env')

server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
driver = '{ODBC Driver 17 for SQL Server}'

print(f"Connecting to {server}...")
print(f"User: {username}")
print(f"Database: {database}")

if not server:
    print("Error: Environment variables not loaded!")
    exit(1)

conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}'
print(f"ConnectionString: {conn_str}")

try:
    conn = pyodbc.connect(conn_str)
    print("Connection Successful!")
    conn.close()
except Exception as e:
    print(f"Connection Failed: {e}")
