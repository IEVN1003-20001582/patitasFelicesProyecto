import mysql.connector
import random
from datetime import datetime, timedelta
from db import get_db_connection  # Importamos tu conexión de TiDB

# ==========================================
# DATOS DE PRUEBA (LISTAS)
# ==========================================
NOMBRES = ["Ana", "Carlos", "Beatriz", "David", "Elena", "Fernando", "Gabriela", "Hugo", "Isabel", "Juan", "Karen", "Luis", "Maria", "Nicolas", "Olivia", "Pedro", "Queta", "Roberto", "Sofia", "Tomas"]
APELLIDOS = ["Gomez", "Perez", "Rodriguez", "Lopez", "Martinez", "Sanchez", "Diaz", "Torres", "Ramirez", "Flores", "Acosta", "Ruiz", "Hernandez", "Vargas", "Mendoza"]
RAZAS = [("Perro", "Golden Retriever"), ("Perro", "Pug"), ("Perro", "Pastor Aleman"), ("Perro", "Husky"), ("Gato", "Persa"), ("Gato", "Siames"), ("Gato", "Angora"), ("Ave", "Canario"), ("Roedor", "Hamster")]
ESPECIALIDADES = ["General", "Cirugía", "Dermatología", "Cardiología", "Ortopedia"]
PRODUCTOS_LIST = [
    ("Vacuna Rabia", "Vacunas", 350.00), ("Vacuna Parvo", "Vacunas", 400.00), ("Croquetas Adulto 10kg", "Alimento", 800.00),
    ("Croquetas Cachorro 5kg", "Alimento", 450.00), ("Desparasitante", "Medicamento", 150.00), ("Shampoo Antipulgas", "Higiene", 200.00),
    ("Collar Antipulgas", "Higiene", 300.00), ("Consulta General", "Servicios", 300.00), ("Limpieza Dental", "Servicios", 1200.00),
    ("Juguete Hueso", "Accesorios", 100.00)
]
MOTIVOS_CITA = ["Revisión anual", "Vacunación", "Tiene vómito", "No quiere comer", "Cojera pata derecha", "Chequeo general", "Limpieza dental", "Corte de uñas", "Esterilización", "Alergia en piel"]

def init_db():
    print("🛠️  INICIANDO RE-ESTRUCTURACIÓN DE LA BASE DE DATOS EN TiDB CLOUD...")
    
    conn = get_db_connection()

    if conn is None:
        print("❌ No se pudo establecer conexión con TiDB. Revisa tu archivo .env")
        return

    try:
        cursor = conn.cursor()

        # ==========================================
        # 1. BORRAR TABLAS (Orden Inverso por FKs)
        # ==========================================
        print("🗑️  Borrando tablas antiguas...")
        
        tablas_viejas = ["usuarios", "vacunas_aplicadas"]
        
        for tabla in tablas_viejas:
            cursor.execute(f"DROP TABLE IF EXISTS {tabla}")
            print(f"   🗑️  Tabla '{tabla}' eliminada.")
            
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        tablas = [
            "notificaciones", "detalle_factura", "facturas", "vacunacion", 
            "historial_medico", "citas", "productos", "configuracion_categorias_producto", 
            "mascotas", "clientes", "veterinarios", "configuracion_tipos_cita", "users"
        ]
        for tabla in tablas:
            cursor.execute(f"DROP TABLE IF EXISTS {tabla}")
            
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        # ==========================================
        # 2. CREACIÓN DE TABLAS (MySQL Syntax)
        # ==========================================
        print("🏗️  Creando tablas nuevas...")

        # 1. USERS
        cursor.execute("""
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'veterinario', 'cliente') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        """)

        # 2. CONFIGURACIONES
        cursor.execute("""
            CREATE TABLE configuracion_tipos_cita (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL,
                duracion_minutos INT DEFAULT 30,
                precio_base DECIMAL(10, 2)
            )
        """)
        cursor.execute("""
            CREATE TABLE configuracion_categorias_producto (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL
            )
        """)

        # 3. PERFILES
        cursor.execute("""
            CREATE TABLE veterinarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE,
                nombre_completo VARCHAR(100) NOT NULL,
                especialidad VARCHAR(50),
                cedula_profesional VARCHAR(50),
                turno ENUM('Matutino', 'Vespertino', 'Completo'),
                foto_url VARCHAR(255),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE,
                nombre_completo VARCHAR(100) NOT NULL,
                telefono VARCHAR(20),
                direccion TEXT,
                email_contacto VARCHAR(150),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # 4. MASCOTAS
        cursor.execute("""
            CREATE TABLE mascotas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                nombre VARCHAR(50) NOT NULL,
                especie VARCHAR(30) NOT NULL,
                raza VARCHAR(50),
                fecha_nacimiento DATE,
                sexo ENUM('Macho', 'Hembra'),
                peso DECIMAL(5, 2),
                foto_url VARCHAR(255),
                alergias TEXT,
                enfermedades_cronicas TEXT,
                estado ENUM('activo', 'archivado', 'en_memoria') DEFAULT 'activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            )
        """)

        # 5. INVENTARIO
        cursor.execute("""
            CREATE TABLE productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                categoria_id INT,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                sku VARCHAR(50) UNIQUE,
                proveedor VARCHAR(100),
                precio_costo DECIMAL(10, 2),
                precio_venta DECIMAL(10, 2),
                stock_actual INT DEFAULT 0,
                stock_minimo INT DEFAULT 5,
                imagen_url VARCHAR(255),
                FOREIGN KEY (categoria_id) REFERENCES configuracion_categorias_producto(id)
            )
        """)

        # 6. CITAS
        cursor.execute("""
            CREATE TABLE citas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mascota_id INT NOT NULL,
                veterinario_id INT,
                tipo_cita_id INT,
                fecha_hora DATETIME NOT NULL,
                motivo TEXT,
                estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show') DEFAULT 'pendiente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id),
                FOREIGN KEY (tipo_cita_id) REFERENCES configuracion_tipos_cita(id)
            )
        """)

        # 7. HISTORIAL Y VACUNAS
        cursor.execute("""
            CREATE TABLE historial_medico (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mascota_id INT NOT NULL,
                veterinario_id INT NOT NULL,
                cita_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                diagnostico TEXT,
                tratamiento_aplicado TEXT,
                medicamentos_recetados TEXT,
                notas_internas TEXT,
                facturado BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id),
                FOREIGN KEY (cita_id) REFERENCES citas(id)
            )
        """)
        cursor.execute("""
            CREATE TABLE vacunacion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mascota_id INT NOT NULL,
                veterinario_id INT,
                producto_id INT,
                fecha_aplicacion DATE NOT NULL,
                fecha_proxima_dosis DATE,
                lote_vacuna VARCHAR(50),
                facturado BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
                FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            )
        """)

        # 8. FACTURACION
        cursor.execute("""
            CREATE TABLE facturas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                folio_factura VARCHAR(20) UNIQUE,
                fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(10, 2),
                impuestos DECIMAL(10, 2),
                total DECIMAL(10, 2),
                estado ENUM('pendiente', 'pagada', 'cancelada', 'vencida') DEFAULT 'pendiente',
                metodo_pago VARCHAR(50),
                pdf_url VARCHAR(255),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            )
        """)
        # Nota: Aquí la columna se llama 'importe', no 'subtotal'
        cursor.execute("""
            CREATE TABLE detalle_factura (
                id INT AUTO_INCREMENT PRIMARY KEY,
                factura_id INT NOT NULL,
                producto_id INT,
                historial_id INT,
                descripcion VARCHAR(200) NOT NULL,
                cantidad INT DEFAULT 1,
                precio_unitario DECIMAL(10, 2),
                importe DECIMAL(10, 2),
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id),
                FOREIGN KEY (historial_id) REFERENCES historial_medico(id)
            )
        """)

        # 9. NOTIFICACIONES
        cursor.execute("""
            CREATE TABLE notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                titulo VARCHAR(100),
                mensaje TEXT,
                leido BOOLEAN DEFAULT FALSE,
                tipo VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        

        

        # ==========================================
        # 3. POBLAR DATOS (20 REGISTROS CADA UNO)
        # ==========================================
        print("🌱  Sembrando datos masivos (20+ por tabla)...")

        # --- SEED: CONFIGURACIÓN ---
        tipos_cita = [("Consulta General", 30, 300), ("Cirugía", 120, 2000), ("Vacunación", 15, 100), ("Estética", 60, 250)]
        cursor.executemany("INSERT INTO configuracion_tipos_cita (nombre, duracion_minutos, precio_base) VALUES (%s, %s, %s)", tipos_cita)
        
        categorias = [("Medicamentos",), ("Alimento",), ("Vacunas",), ("Higiene",), ("Accesorios",), ("Servicios",)]
        cursor.executemany("INSERT INTO configuracion_categorias_producto (nombre) VALUES (%s)", categorias)
        conn.commit()

        # --- SEED: USUARIOS Y PERFILES ---
        # 1 Admin
        cursor.execute("INSERT INTO users (email, password_hash, role) VALUES ('admin@patitas.com', 'hash123', 'admin')")
        
        # 20 Veterinarios
        vet_ids = []
        for i in range(1, 21):
            email = f"vet{i}@patitas.com"
            cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, 'pass123', 'veterinario')", (email,))
            uid = cursor.lastrowid
            
            nombre = f"Dr. {random.choice(NOMBRES)} {random.choice(APELLIDOS)}"
            especialidad = random.choice(ESPECIALIDADES)
            cursor.execute("""
                INSERT INTO veterinarios (user_id, nombre_completo, especialidad, cedula_profesional, turno) 
                VALUES (%s, %s, %s, %s, %s)
            """, (uid, nombre, especialidad, f"CED-{random.randint(10000, 99999)}", random.choice(['Matutino', 'Vespertino'])))
            vet_ids.append(cursor.lastrowid)

        # 20 Clientes
        client_ids = []
        for i in range(1, 21):
            email = f"cliente{i}@gmail.com"
            cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, 'pass123', 'cliente')", (email,))
            uid = cursor.lastrowid
            
            nombre = f"{random.choice(NOMBRES)} {random.choice(APELLIDOS)}"
            cursor.execute("""
                INSERT INTO clientes (user_id, nombre_completo, telefono, direccion, email_contacto) 
                VALUES (%s, %s, %s, %s, %s)
            """, (uid, nombre, f"555-{random.randint(1000,9999)}", f"Calle {random.choice(NOMBRES)} #{random.randint(1,100)}", email))
            client_ids.append(cursor.lastrowid)

        conn.commit()

        # --- SEED: PRODUCTOS (20 Items) ---
        prod_ids = []
        for i in range(20):
            prod_base = random.choice(PRODUCTOS_LIST)
            sku = f"PROD-{i+100}"
            nombre = f"{prod_base[0]} {random.choice(['A', 'B', 'Plus'])}"
            precio = prod_base[2]
            
            cat_id = random.randint(1, 6) 
            
            cursor.execute("""
                INSERT INTO productos (categoria_id, nombre, sku, precio_venta, stock_actual, stock_minimo) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (cat_id, nombre, sku, precio, random.randint(0, 50), 5))
            prod_ids.append(cursor.lastrowid)

        # --- SEED: MASCOTAS (20+ Mascotas) ---
        pet_ids = []
        for i in range(25):
            cliente = random.choice(client_ids)
            raza_data = random.choice(RAZAS)
            nombre = random.choice(["Max", "Luna", "Bella", "Rocky", "Simba", "Coco", "Lola", "Thor", "Zeus", "Nala"])
            
            cursor.execute("""
                INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, sexo, peso) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (cliente, nombre, raza_data[0], raza_data[1], "2020-01-01", random.choice(['Macho', 'Hembra']), random.uniform(2.0, 35.0)))
            pet_ids.append(cursor.lastrowid)
        conn.commit()

        # --- SEED: CITAS (20+ Citas) ---
        cita_ids = []
        for i in range(25):
            mascota = random.choice(pet_ids)
            vet = random.choice(vet_ids)
            tipo = random.randint(1, 4)
            fecha = datetime.now() + timedelta(days=random.randint(-30, 30))
            estado = random.choice(['pendiente', 'confirmada', 'completada', 'cancelada'])
            
            cursor.execute("""
                INSERT INTO citas (mascota_id, veterinario_id, tipo_cita_id, fecha_hora, motivo, estado) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (mascota, vet, tipo, fecha, random.choice(MOTIVOS_CITA), estado))
            cita_ids.append(cursor.lastrowid)

        # --- SEED: HISTORIAL Y VACUNAS ---
        for i in range(20):
            cita = random.choice(cita_ids)
            cursor.execute("SELECT mascota_id, veterinario_id FROM citas WHERE id = %s", (cita,))
            res = cursor.fetchone()
            if res:
                cursor.execute("""
                    INSERT INTO historial_medico (mascota_id, veterinario_id, cita_id, diagnostico, tratamiento_aplicado, facturado) 
                    VALUES (%s, %s, %s, 'Diagnostico de prueba', 'Tratamiento de prueba', %s)
                """, (res[0], res[1], cita, random.choice([True, False])))

            cursor.execute("""
                INSERT INTO vacunacion (mascota_id, veterinario_id, producto_id, fecha_aplicacion, fecha_proxima_dosis) 
                VALUES (%s, %s, %s, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
            """, (random.choice(pet_ids), random.choice(vet_ids), random.choice(prod_ids)))

        # --- SEED: FACTURAS ---
        for i in range(20):
            cliente = random.choice(client_ids)
            total = random.uniform(300, 5000)
            cursor.execute("""
                INSERT INTO facturas (cliente_id, folio_factura, total, estado) 
                VALUES (%s, %s, %s, %s)
            """, (cliente, f"F-{random.randint(1000,9999)}", total, random.choice(['pagada', 'pendiente'])))
            fact_id = cursor.lastrowid
            
            # Detalle: CORREGIDO 'subtotal' por 'importe'
            cursor.execute("""
                INSERT INTO detalle_factura (factura_id, producto_id, descripcion, precio_unitario, importe) 
                VALUES (%s, %s, 'Producto Venta', %s, %s)
            """, (fact_id, random.choice(prod_ids), total, total))

        conn.commit()
        print("\n✅ ¡BASE DE DATOS POBLADA CON ÉXITO!")
        print(f"   - Se crearon 20+ veterinarios, clientes, mascotas, productos y citas.")
        print(f"   - Estructura actualizada con soporte para roles y facturación.")

    except mysql.connector.Error as err:
        print(f"\n❌ Error SQL: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()



if __name__ == "__main__":
    init_db()