import mysql.connector
from db import get_db_connection
import random
from datetime import datetime, timedelta

def init_db():
    print("🛠️  INICIANDO RE-ESTRUCTURACIÓN DE LA BASE DE DATOS (VERSIÓN DEFINITIVA)...")
    conn = get_db_connection()

    if conn is None:
        print("❌ No se pudo conectar a la base de datos.")
        return

    try:
        cursor = conn.cursor()

        # ==========================================
        # 1. BORRAR TABLAS (Orden Inverso)
        # ==========================================
        print("🗑️  Borrando tablas antiguas...")
        tablas_a_borrar = [
            "notificaciones", "vacunas_aplicadas", "detalle_factura", "facturas", 
            "historial_medico", "citas", "productos", "mascotas", 
            "veterinarios", "clientes", "usuarios"
        ]
        for tabla in tablas_a_borrar:
            cursor.execute(f"DROP TABLE IF EXISTS {tabla}")

        # ==========================================
        # 2. CREACIÓN DE TABLAS (Estructura Nueva)
        # ==========================================
        print("🏗️  Creando tablas...")
        
        # USUARIOS
        cursor.execute("""
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'veterinario', 'cliente') NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # CLIENTES
        cursor.execute("""
            CREATE TABLE clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT UNIQUE,
                nombre_completo VARCHAR(150) NOT NULL,
                telefono VARCHAR(20),
                direccion TEXT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        """)

        # VETERINARIOS
        cursor.execute("""
            CREATE TABLE veterinarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT UNIQUE NOT NULL,
                nombre_completo VARCHAR(150) NOT NULL,
                cedula VARCHAR(50),
                especialidad VARCHAR(100) DEFAULT 'General',
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        """)

        # NOTIFICACIONES (NUEVA)
        cursor.execute("""
            CREATE TABLE notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                titulo VARCHAR(100),
                mensaje TEXT NOT NULL,
                leida BOOLEAN DEFAULT FALSE,
                tipo ENUM('Cita', 'Stock', 'Vacuna') NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        """)

        # MASCOTAS
        cursor.execute("""
            CREATE TABLE mascotas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                nombre VARCHAR(50) NOT NULL,
                especie VARCHAR(50) NOT NULL,
                raza VARCHAR(50),
                fecha_nacimiento DATE,
                peso DECIMAL(5,2),
                sexo VARCHAR(10),
                alergias TEXT,
                foto_url VARCHAR(255),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            )
        """)

        # PRODUCTOS
        cursor.execute("""
            CREATE TABLE productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sku VARCHAR(50) UNIQUE,
                nombre VARCHAR(100) NOT NULL,
                categoria VARCHAR(50),
                precio_venta DECIMAL(10,2) NOT NULL,
                stock_actual INT NOT NULL DEFAULT 0,
                stock_minimo INT NOT NULL DEFAULT 5
            )
        """)

        # CITAS
        cursor.execute("""
            CREATE TABLE citas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mascota_id INT NOT NULL,
                veterinario_id INT NOT NULL,
                fecha_hora DATETIME NOT NULL,
                tipo VARCHAR(50),
                motivo TEXT,
                estado ENUM('Pendiente', 'Confirmada', 'Completada', 'Cancelada') DEFAULT 'Pendiente',
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id)
            )
        """)

        # HISTORIAL MÉDICO
        cursor.execute("""
            CREATE TABLE historial_medico (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cita_id INT,
                mascota_id INT NOT NULL,
                veterinario_id INT NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                diagnostico TEXT,
                tratamiento TEXT,
                FOREIGN KEY (cita_id) REFERENCES citas(id),
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id)
            )
        """)

        # VACUNAS APLICADAS (NUEVA)
        cursor.execute("""
            CREATE TABLE vacunas_aplicadas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mascota_id INT NOT NULL,
                producto_id INT,
                nombre_vacuna VARCHAR(100) NOT NULL,
                fecha_aplicacion DATE NOT NULL,
                fecha_proxima_dosis DATE,
                veterinario_id INT,
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id)
            )
        """)

        # FACTURAS
        cursor.execute("""
            CREATE TABLE facturas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                total DECIMAL(10,2) NOT NULL,
                estado ENUM('Pagada', 'Pendiente') DEFAULT 'Pendiente',
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            )
        """)

        # DETALLE FACTURA (NUEVA)
        cursor.execute("""
            CREATE TABLE detalle_factura (
                id INT AUTO_INCREMENT PRIMARY KEY,
                factura_id INT NOT NULL,
                producto_id INT,
                concepto VARCHAR(150) NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                precio_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            )
        """)

        # ==========================================
        # 3. INSERTAR DATOS (SEEDERS)
        # ==========================================
        print("🌱  Sembrando datos de prueba...")

        # --- A. USUARIOS ---
        users_data = [
            ('admin@patitas.com', 'admin123', 'admin'),
            ('vet1@patitas.com', 'vet123', 'veterinario'),
            ('vet2@patitas.com', 'vet123', 'veterinario'),
            ('vet3@patitas.com', 'vet123', 'veterinario'),
            ('juan@gmail.com', 'client123', 'cliente'),
            ('maria@hotmail.com', 'client123', 'cliente'),
            ('pedro@yahoo.com', 'client123', 'cliente'),
            ('ana@gmail.com', 'client123', 'cliente')
        ]
        cursor.executemany("INSERT INTO usuarios (email, password, rol) VALUES (%s, %s, %s)", users_data)
        conn.commit()

        # Helper para obtener IDs
        def get_user_id(email):
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
            res = cursor.fetchone()
            return res[0] if res else None

        id_admin = get_user_id('admin@patitas.com')
        id_vet1 = get_user_id('vet1@patitas.com')
        id_vet2 = get_user_id('vet2@patitas.com')
        id_vet3 = get_user_id('vet3@patitas.com')
        
        # --- B. NOTIFICACIONES (Alertas de Prueba) ---
        notif_data = [
            (id_admin, 'Stock Bajo', 'La Vacuna Rabia está por agotarse (Quedan 3)', False, 'Stock'),
            (id_vet1, 'Nueva Cita', 'Se ha agendado una cirugía para mañana', True, 'Cita'),
            (get_user_id('juan@gmail.com'), 'Recordatorio Vacuna', 'A Max le toca su refuerzo pronto', False, 'Vacuna')
        ]
        cursor.executemany("INSERT INTO notificaciones (usuario_id, titulo, mensaje, leida, tipo) VALUES (%s, %s, %s, %s, %s)", notif_data)

        # --- C. PERFILES ---
        cursor.execute("INSERT INTO veterinarios (usuario_id, nombre_completo, cedula, especialidad) VALUES (%s, 'Dr. Israel González', '1234567', 'Cardiología')", (id_vet1,))
        cursor.execute("INSERT INTO veterinarios (usuario_id, nombre_completo, cedula, especialidad) VALUES (%s, 'Dra. Mariana López', '7654321', 'Dermatología')", (id_vet2,))
        cursor.execute("INSERT INTO veterinarios (usuario_id, nombre_completo, cedula, especialidad) VALUES (%s, 'Dr. Roberto Ruiz', '1122334', 'Cirugía General')", (id_vet3,))
        
        clients_data = [
            (get_user_id('juan@gmail.com'), 'Juan Pérez', '555-0101', 'Col. Centro #123'),
            (get_user_id('maria@hotmail.com'), 'Maria Gómez', '555-0102', 'Av. Vallarta #456'),
            (get_user_id('pedro@yahoo.com'), 'Pedro Almodovar', '555-0103', 'Calle 5 de Mayo #789'),
            (get_user_id('ana@gmail.com'), 'Ana Frank', '555-0106', 'Calle Diario #11')
        ]
        cursor.executemany("INSERT INTO clientes (usuario_id, nombre_completo, telefono, direccion) VALUES (%s, %s, %s, %s)", clients_data)
        conn.commit()

        # Obtener IDs de Perfiles
        cursor.execute("SELECT id FROM clientes")
        client_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("SELECT id FROM veterinarios")
        vet_ids = [row[0] for row in cursor.fetchall()]

        # --- D. PRODUCTOS ---
        productos_data = [
            ('VAC-001', 'Vacuna Rabia', 'Vacunas', 350.00, 10, 10),
            ('VAC-002', 'Vacuna Parvovirus', 'Vacunas', 400.00, 45, 10),
            ('ALI-001', 'Croquetas Premium 20kg', 'Alimento', 1200.50, 20, 5),
            ('MED-001', 'Antibiótico General', 'Medicamento', 200.00, 4, 10), # Stock Bajo
            ('SER-001', 'Consulta General', 'Servicios', 300.00, 999, 0),
            ('SER-002', 'Limpieza Dental', 'Servicios', 800.00, 999, 0)
        ]
        cursor.executemany("INSERT INTO productos (sku, nombre, categoria, precio_venta, stock_actual, stock_minimo) VALUES (%s, %s, %s, %s, %s, %s)", productos_data)
        conn.commit()
        
        # Mapa de productos para vacunas
        cursor.execute("SELECT id, nombre FROM productos")
        prod_map = {row[1]: row[0] for row in cursor.fetchall()}

        # --- E. MASCOTAS ---
        mascotas_data = [
            (client_ids[0], 'Firulais', 'Perro', 'Golden', '2020-05-10', 28.5, 'M', 'Pollo'),
            (client_ids[0], 'Pelusa', 'Gato', 'Persa', '2021-02-15', 4.2, 'H', 'Ninguna'),
            (client_ids[1], 'Rex', 'Perro', 'Pastor Alemán', '2019-08-20', 32.0, 'M', 'Ninguna'),
            (client_ids[2], 'Nemo', 'Pez', 'Payaso', '2023-01-01', 0.1, 'M', 'Ninguna'),
            (client_ids[3], 'Luna', 'Perro', 'Husky', '2021-06-15', 22.0, 'H', 'Ninguna')
        ]
        cursor.executemany("INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, peso, sexo, alergias) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", mascotas_data)
        conn.commit()
        
        cursor.execute("SELECT id FROM mascotas")
        pet_ids = [row[0] for row in cursor.fetchall()]

        # --- F. CITAS ---
        citas_data = [
            (pet_ids[0], vet_ids[0], datetime.now() + timedelta(days=1), 'Consulta', 'Revisión anual', 'Confirmada'),
            (pet_ids[1], vet_ids[1], datetime.now() - timedelta(days=2), 'Vacuna', 'Refuerzo', 'Completada'),
            (pet_ids[2], vet_ids[2], datetime.now() - timedelta(days=5), 'Cirugía', 'Esterilización', 'Completada'),
            (pet_ids[3], vet_ids[0], datetime.now() + timedelta(days=3), 'Consulta', 'Manchas blancas', 'Pendiente')
        ]
        cursor.executemany("INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, tipo, motivo, estado) VALUES (%s, %s, %s, %s, %s, %s)", citas_data)
        conn.commit()

        # --- G. HISTORIAL y VACUNAS APLICADAS ---
        # Historial de la cita completada de Pelusa (Vacuna)
        cursor.execute("SELECT id FROM citas WHERE estado='Completada' AND tipo='Vacuna' LIMIT 1")
        cita_vac = cursor.fetchone()
        if cita_vac:
            cursor.execute("""
                INSERT INTO historial_medico (cita_id, mascota_id, veterinario_id, diagnostico, tratamiento)
                VALUES (%s, %s, %s, 'Paciente sano', 'Se aplicó vacuna anual')
            """, (cita_vac[0], pet_ids[1], vet_ids[1]))
            
            # Registrar en tabla vacunas_aplicadas
            cursor.execute("""
                INSERT INTO vacunas_aplicadas (mascota_id, producto_id, nombre_vacuna, fecha_aplicacion, fecha_proxima_dosis, veterinario_id)
                VALUES (%s, %s, 'Vacuna Rabia', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), %s)
            """, (pet_ids[1], prod_map.get('Vacuna Rabia'), vet_ids[1]))

        # --- H. FACTURAS y DETALLE (Complejo) ---
        # Crear una factura pagada para Juan Pérez
        cursor.execute("""
            INSERT INTO facturas (cliente_id, fecha, total, estado) 
            VALUES (%s, NOW(), 0, 'Pagada')
        """, (client_ids[0],))
        factura_id = cursor.lastrowid

        # Agregar detalles a la factura (Consulta + Vacuna)
        items = [
            (factura_id, prod_map.get('Consulta General'), 'Consulta General', 1, 300.00),
            (factura_id, prod_map.get('Vacuna Rabia'), 'Vacuna Rabia (Aplicación)', 1, 350.00)
        ]
        total_factura = 0
        for item in items:
            subtotal = item[3] * item[4]
            total_factura += subtotal
            cursor.execute("""
                INSERT INTO detalle_factura (factura_id, producto_id, concepto, cantidad, precio_unitario, subtotal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (item[0], item[1], item[2], item[3], item[4], subtotal))
        
        # Actualizar total de factura
        cursor.execute("UPDATE facturas SET total = %s WHERE id = %s", (total_factura, factura_id))

        conn.commit()
        print("\n✅ ¡BASE DE DATOS DEFINITIVA LISTA!")
        print(f"   - Se crearon todas las tablas nuevas: Notificaciones, Vacunas, Detalle Factura")
        print(f"   - Se insertaron datos de prueba relacionados.")

    except mysql.connector.Error as err:
        print(f"\n❌ Error SQL: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    init_db()