import mysql.connector
import os
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
            ssl_ca="/etc/ssl/certs/ca-certificates.crt" if os.name != 'nt' else None
            # Nota: En Windows (os.name == 'nt'), a veces es mejor dejar que Python maneje el SSL por defecto
            # o descargar el certificado .pem de TiDB y poner la ruta exacta.
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error conectando a la BD: {err}")
        return None