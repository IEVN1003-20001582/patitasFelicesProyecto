import mysql.connector
import os
import certifi  # <--- IMPORTANTE: Importar certifi
from dotenv import load_dotenv

# Cargar variables de entorno una sola vez al importar el módulo
load_dotenv()

def get_db_connection():
    """
    Establece y retorna una conexión a la base de datos TiDB.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_DATABASE'),
            # Opciones de SSL requeridas por TiDB Cloud
            ssl_verify_identity=True,
            # SOLUCIÓN: Usar certifi.where() para dar la ruta exacta del certificado en Windows/Linux
            ssl_ca=certifi.where() 
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error conectando a la BD: {err}")
        return None