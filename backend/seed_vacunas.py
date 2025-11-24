import mysql.connector
import random
from datetime import datetime, timedelta
from db import get_db_connection

def sembrar_vacunas():
    print("💉 INICIANDO POBLADO DE VACUNAS...")
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------------------------------
        # 1. ASEGURAR QUE EXISTAN PRODUCTOS TIPO 'VACUNA'
        # ---------------------------------------------------------
        print("📦 Verificando catálogo de vacunas...")
        vacunas_base = [
            ("Vacuna Rabia DEFENSOR", "Vacunas", 350.00),
            ("Vacuna Múltiple PUPPY", "Vacunas", 450.00),
            ("Vacuna Bordetella", "Vacunas", 300.00),
            ("Vacuna Giardia", "Vacunas", 380.00),
            ("Vacuna Leucemia Felina", "Vacunas", 400.00),
            ("Vacuna Triple Felina", "Vacunas", 350.00)
        ]

        # Buscar categoría 'Vacunas' o crearla
        cursor.execute("SELECT id FROM configuracion_categorias_producto WHERE nombre = 'Vacunas'")
        cat = cursor.fetchone()
        if not cat:
            cursor.execute("INSERT INTO configuracion_categorias_producto (nombre) VALUES ('Vacunas')")
            cat_id = cursor.lastrowid
        else:
            cat_id = cat['id']

        # Insertar productos si no existen
        for nombre, cat_nombre, precio in vacunas_base:
            cursor.execute("SELECT id FROM productos WHERE nombre = %s", (nombre,))
            prod = cursor.fetchone()
            if not prod:
                sku = f"VAC-{random.randint(1000,9999)}"
                cursor.execute("""
                    INSERT INTO productos (categoria_id, nombre, sku, precio_venta, stock_actual, stock_minimo)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (cat_id, nombre, sku, precio, random.randint(10, 50), 5))
                print(f"   + Creada: {nombre}")

        conn.commit()

        # ---------------------------------------------------------
        # 2. GENERAR HISTORIAL DE VACUNACIÓN
        # ---------------------------------------------------------
        print("🐕 Generando historial de vacunación para mascotas existentes...")
        
        # Obtener IDs necesarios
        cursor.execute("SELECT id FROM mascotas")
        mascotas = cursor.fetchall()
        
        cursor.execute("SELECT id FROM veterinarios")
        veterinarios = cursor.fetchall()
        
        cursor.execute("SELECT id FROM productos WHERE nombre LIKE '%Vacuna%'")
        productos_vacuna = cursor.fetchall()

        if not mascotas or not veterinarios or not productos_vacuna:
            print("⚠️ Faltan datos maestros (mascotas, vets o productos).")
            return

        registros_creados = 0
        for mascota in mascotas:
            # Insertar entre 1 y 3 vacunas por mascota (algunas pasadas)
            cantidad = random.randint(1, 3)
            for _ in range(cantidad):
                vet_id = random.choice(veterinarios)['id']
                prod_id = random.choice(productos_vacuna)['id']
                
                # Fechas aleatorias en el último año
                dias_atras = random.randint(1, 365)
                fecha_aplicacion = datetime.now() - timedelta(days=dias_atras)
                fecha_proxima = fecha_aplicacion + timedelta(days=365) # Próxima anual

                cursor.execute("""
                    INSERT INTO vacunacion (mascota_id, veterinario_id, producto_id, fecha_aplicacion, fecha_proxima_dosis)
                    VALUES (%s, %s, %s, %s, %s)
                """, (mascota['id'], vet_id, prod_id, fecha_aplicacion, fecha_proxima))
                registros_creados += 1

        conn.commit()
        print(f"✅ ¡LISTO! Se insertaron {registros_creados} registros de vacunas en el historial.")
        print("   Ahora tus mascotas deberían tener datos en la pestaña 'Vacunación'.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    sembrar_vacunas()