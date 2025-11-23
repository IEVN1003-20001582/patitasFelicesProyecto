import mysql.connector
from db import get_db_connection
import random
from datetime import datetime, timedelta

def init_db():
    print("🛠️  INICIANDO RE-ESTRUCTURACIÓN DE LA BASE DE DATOS (VERSIÓN EXTENDIDA)...")
    conn = get_db_connection()

    if conn is None:
        print("❌ No se pudo conectar a la base de datos.")
        return

    try:
        cursor = conn.cursor()

        # ==========================================
        # 1. BORRAR TABLAS (Limpieza)
        # ==========================================
        print("🗑️  Borrando tablas antiguas...")
        tablas = ["detalle_factura", "facturas", "historial_medico", "citas", 
                  "productos", "mascotas", "veterinarios", "clientes", "usuarios"]
        for tabla in tablas:
            cursor.execute(f"DROP TABLE IF EXISTS {tabla}")

        # ==========================================
        # 2. CREACIÓN DE TABLAS
        # ==========================================
        print("🏗️  Creando tablas...")
        
        cursor.execute("""
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'veterinario', 'cliente') NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

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

        # ==========================================
        # 3. INSERTAR DATOS MASIVOS (SEEDERS)
        # ==========================================
        print("🌱  Sembrando datos de prueba...")

        # --- A. USUARIOS (1 Admin, 5 Vets, 9 Clientes) ---
        users_data = [
            ('admin@patitas.com', 'admin123', 'admin'),
            # 5 Veterinarios
            ('vet1@patitas.com', 'vet123', 'veterinario'),
            ('vet2@patitas.com', 'vet123', 'veterinario'),
            ('vet3@patitas.com', 'vet123', 'veterinario'),
            ('vet4@patitas.com', 'vet123', 'veterinario'),
            ('vet5@patitas.com', 'vet123', 'veterinario'),
            # 9 Clientes
            ('juan@gmail.com', 'client123', 'cliente'),
            ('maria@hotmail.com', 'client123', 'cliente'),
            ('pedro@yahoo.com', 'client123', 'cliente'),
            ('luisa@gmail.com', 'client123', 'cliente'),
            ('carlos@outlook.com', 'client123', 'cliente'),
            ('ana@gmail.com', 'client123', 'cliente'),
            ('sofia@gmail.com', 'client123', 'cliente'),
            ('miguel@gmail.com', 'client123', 'cliente'),
            ('lucia@gmail.com', 'client123', 'cliente')
        ]
        cursor.executemany("INSERT INTO usuarios (email, password, rol) VALUES (%s, %s, %s)", users_data)
        conn.commit()

        # Obtener IDs para relacionar
        def get_id(email):
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
            return cursor.fetchone()[0]

        # --- B. PERFILES VETERINARIOS (5) ---
        vets_profiles = [
            (get_id('vet1@patitas.com'), 'Dr. Israel González', '1234567', 'Cardiología'),
            (get_id('vet2@patitas.com'), 'Dra. Mariana López', '7654321', 'Dermatología'),
            (get_id('vet3@patitas.com'), 'Dr. Roberto Ruiz', '1122334', 'Cirugía General'),
            (get_id('vet4@patitas.com'), 'Dra. Elena Torres', '4455667', 'Medicina Interna'),
            (get_id('vet5@patitas.com'), 'Dr. Alejandro Diaz', '9988776', 'Odontología')
        ]
        cursor.executemany("INSERT INTO veterinarios (usuario_id, nombre_completo, cedula, especialidad) VALUES (%s, %s, %s, %s)", vets_profiles)
        
        # --- C. PERFILES CLIENTES (9) ---
        clients_profiles = [
            (get_id('juan@gmail.com'), 'Juan Pérez', '555-0101', 'Col. Centro #123'),
            (get_id('maria@hotmail.com'), 'Maria Gómez', '555-0102', 'Av. Vallarta #456'),
            (get_id('pedro@yahoo.com'), 'Pedro Almodovar', '555-0103', 'Calle 5 de Mayo #789'),
            (get_id('luisa@gmail.com'), 'Luisa Lane', '555-0104', 'Metropolis #10'),
            (get_id('carlos@outlook.com'), 'Carlos Santana', '555-0105', 'Calle Musica #88'),
            (get_id('ana@gmail.com'), 'Ana Frank', '555-0106', 'Calle Diario #11'),
            (get_id('sofia@gmail.com'), 'Sofia Vergara', '555-0107', 'Hollywood Blvd'),
            (get_id('miguel@gmail.com'), 'Miguel Hidalgo', '555-0108', 'Dolores Hidalgo #1810'),
            (get_id('lucia@gmail.com'), 'Lucia Méndez', '555-0109', 'Televisa San Angel')
        ]
        cursor.executemany("INSERT INTO clientes (usuario_id, nombre_completo, telefono, direccion) VALUES (%s, %s, %s, %s)", clients_profiles)
        conn.commit()

        # Recuperar IDs de Perfiles para Mascotas y Citas
        cursor.execute("SELECT id FROM clientes")
        client_ids = [row[0] for row in cursor.fetchall()] # Lista de IDs de clientes [1, 2, 3...]
        
        cursor.execute("SELECT id FROM veterinarios")
        vet_ids = [row[0] for row in cursor.fetchall()]   # Lista de IDs de veterinarios

        # --- D. PRODUCTOS (10) ---
        productos_data = [
            ('VAC-001', 'Vacuna Rabia', 'Vacunas', 350.00, 50, 10),
            ('VAC-002', 'Vacuna Parvovirus', 'Vacunas', 400.00, 45, 10),
            ('ALI-001', 'Croquetas Premium Perro 20kg', 'Alimento', 1200.50, 20, 5),
            ('ALI-002', 'Croquetas Gato Salmón 5kg', 'Alimento', 450.00, 15, 5),
            ('JUG-001', 'Pelota de Hule Indestructible', 'Juguetes', 150.00, 100, 10),
            ('MED-001', 'Antibiótico General 500mg', 'Medicamento', 200.00, 8, 20), # Stock BAJO (8 < 20)
            ('ACC-001', 'Collar Antipulgas', 'Accesorios', 250.00, 30, 5),
            ('HIG-001', 'Shampoo Hipoalergénico', 'Higiene', 180.00, 25, 5),
            ('SNA-001', 'Premios de Tocino', 'Snacks', 80.00, 200, 20),
            ('MED-002', 'Desparasitante Total', 'Medicamento', 120.00, 60, 10)
        ]
        cursor.executemany("INSERT INTO productos (sku, nombre, categoria, precio_venta, stock_actual, stock_minimo) VALUES (%s, %s, %s, %s, %s, %s)", productos_data)

        # --- E. MASCOTAS (12) ---
        # Asignamos mascotas a clientes al azar o secuencialmente
        mascotas_data = [
            (client_ids[0], 'Firulais', 'Perro', 'Golden Retriever', '2020-05-10', 28.5, 'M', 'Pollo'),
            (client_ids[0], 'Pelusa', 'Gato', 'Persa', '2021-02-15', 4.2, 'H', 'Ninguna'),
            (client_ids[1], 'Rex', 'Perro', 'Pastor Alemán', '2019-08-20', 32.0, 'M', 'Ninguna'),
            (client_ids[2], 'Nemo', 'Pez', 'Payaso', '2023-01-01', 0.1, 'M', 'Ninguna'),
            (client_ids[3], 'Simba', 'Gato', 'Mestizo', '2022-11-30', 5.0, 'M', 'Polvo'),
            (client_ids[4], 'Luna', 'Perro', 'Husky', '2021-06-15', 22.0, 'H', 'Ninguna'),
            (client_ids[5], 'Thor', 'Perro', 'Bulldog', '2020-03-10', 25.0, 'M', 'Pasto'),
            (client_ids[6], 'Lola', 'Conejo', 'Cabeza de León', '2023-04-05', 1.5, 'H', 'Ninguna'),
            (client_ids[7], 'Rocky', 'Perro', 'Boxer', '2018-12-25', 30.0, 'M', 'Ninguna'),
            (client_ids[8], 'Coco', 'Gato', 'Siamés', '2020-09-09', 4.5, 'M', 'Lana'),
            (client_ids[0], 'Hércules', 'Hámster', 'Sirio', '2023-10-01', 0.2, 'M', 'Ninguna'),
            (client_ids[1], 'Bella', 'Perro', 'Chihuahua', '2022-01-20', 2.5, 'H', 'Ninguna')
        ]
        cursor.executemany("INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, peso, sexo, alergias) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", mascotas_data)
        conn.commit()

        # Recuperar IDs de Mascotas
        cursor.execute("SELECT id FROM mascotas")
        pet_ids = [row[0] for row in cursor.fetchall()]

        # --- F. CITAS (10) ---
        citas_data = [
            (pet_ids[0], vet_ids[0], datetime.now() + timedelta(days=1), 'Consulta', 'Revisión anual', 'Confirmada'),
            (pet_ids[1], vet_ids[1], datetime.now() + timedelta(days=2), 'Vacuna', 'Refuerzo Rabia', 'Pendiente'),
            (pet_ids[2], vet_ids[2], datetime.now() - timedelta(days=5), 'Cirugía', 'Esterilización', 'Completada'),
            (pet_ids[5], vet_ids[3], datetime.now() - timedelta(days=2), 'Consulta', 'Vómitos recurrentes', 'Completada'),
            (pet_ids[6], vet_ids[4], datetime.now() + timedelta(days=5), 'Limpieza Dental', 'Sarro excesivo', 'Confirmada'),
            (pet_ids[7], vet_ids[0], datetime.now() - timedelta(days=10), 'Consulta', 'Revisión general', 'Cancelada'),
            (pet_ids[8], vet_ids[1], datetime.now() + timedelta(days=3), 'Vacuna', 'Quíntuple', 'Pendiente'),
            (pet_ids[9], vet_ids[2], datetime.now() - timedelta(days=20), 'Urgencia', 'Atropellamiento leve', 'Completada'),
            (pet_ids[0], vet_ids[3], datetime.now() + timedelta(days=7), 'Baño', 'Baño medicado', 'Pendiente'),
            (pet_ids[11], vet_ids[0], datetime.now() - timedelta(days=1), 'Consulta', 'Tos perrera', 'Completada')
        ]
        cursor.executemany("INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, tipo, motivo, estado) VALUES (%s, %s, %s, %s, %s, %s)", citas_data)
        conn.commit()

        # Recuperar citas completadas para historial
        cursor.execute("SELECT id, mascota_id, veterinario_id FROM citas WHERE estado = 'Completada'")
        citas_completadas = cursor.fetchall()

        # --- G. HISTORIAL MÉDICO (Basado en citas completadas) ---
        historial_data = [
            (citas_completadas[0][0], citas_completadas[0][1], citas_completadas[0][2], 'Esterilización exitosa', 'Reposo 5 días, Analgésico cada 12h'),
            (citas_completadas[1][0], citas_completadas[1][1], citas_completadas[1][2], 'Infección estomacal', 'Dieta blanda, Suero oral'),
            (citas_completadas[2][0], citas_completadas[2][1], citas_completadas[2][2], 'Contusiones menores', 'Antiinflamatorio inyectado'),
            (citas_completadas[3][0], citas_completadas[3][1], citas_completadas[3][2], 'Tos de las perreras', 'Jarabe expectorante, Aislamiento')
        ]
        # Agregamos uno extra sin cita (urgencia directa)
        historial_data.append((None, pet_ids[0], vet_ids[0], 'Reacción alérgica leve', 'Antihistamínico dosis única'))
        
        cursor.executemany("INSERT INTO historial_medico (cita_id, mascota_id, veterinario_id, diagnostico, tratamiento) VALUES (%s, %s, %s, %s, %s)", historial_data)

        # --- H. FACTURAS (5) ---
        facturas_data = [
            (client_ids[0], datetime.now(), 1500.00, 'Pagada'),
            (client_ids[1], datetime.now(), 350.00, 'Pendiente'),
            (client_ids[2], datetime.now(), 4500.00, 'Pagada'),
            (client_ids[3], datetime.now(), 800.00, 'Pendiente'),
            (client_ids[4], datetime.now(), 1200.00, 'Pagada')
        ]
        cursor.executemany("INSERT INTO facturas (cliente_id, fecha, total, estado) VALUES (%s, %s, %s, %s)", facturas_data)
        conn.commit()

        print("\n✅ ¡BASE DE DATOS LLENA DE VIDA!")
        print(f"   - {len(users_data)} Usuarios creados")
        print(f"   - {len(vets_profiles)} Veterinarios")
        print(f"   - {len(clients_profiles)} Clientes")
        print(f"   - {len(mascotas_data)} Mascotas")
        print(f"   - {len(productos_data)} Productos")
        print(f"   - {len(citas_data)} Citas")
        print("   Todo listo para probar tu API.")

    except mysql.connector.Error as err:
        print(f"\n❌ Error SQL: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    init_db()