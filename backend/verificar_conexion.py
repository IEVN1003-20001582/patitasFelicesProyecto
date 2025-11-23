from db import get_db_connection
import mysql.connector

def probar_conexion():
    print("⏳ Iniciando prueba de conexión a TiDB...")
    
    # 1. Intentar obtener la conexión
    conn = get_db_connection()

    if conn and conn.is_connected():
        print("✅ ¡CONEXIÓN EXITOSA!")
        
        try:
            # 2. Crear un cursor para hacer una consulta de prueba
            cursor = conn.cursor()
            
            # 3. Ejecutar consultas informativas
            cursor.execute("SELECT DATABASE();")
            db_name = cursor.fetchone()[0]
            print(f"📂 Base de datos actual: {db_name}")
            
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()[0]
            print(f"🤖 Versión de TiDB/MySQL: {version}")
            
            # 4. Verificar tablas existentes
            cursor.execute("SHOW TABLES;")
            tablas = cursor.fetchall()
            print(f"\n📋 Tablas en '{db_name}':")
            if tablas:
                for tabla in tablas:
                    print(f"   - {tabla[0]}")
            else:
                print("   (No hay tablas creadas todavía)")

        except mysql.connector.Error as err:
            print(f"❌ Error ejecutando consultas: {err}")
        
        finally:
            # 5. Cerrar conexión
            if conn.is_connected():
                cursor.close()
                conn.close()
                print("\n🔒 Conexión cerrada correctamente.")
    else:
        print("❌ FALLO: No se pudo establecer la conexión (conn es None).")
        print("   Revisa tus credenciales en el archivo .env")

if __name__ == "__main__":
    probar_conexion()