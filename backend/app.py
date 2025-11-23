from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from db import get_db_connection

app = Flask(__name__)
# Permitir CORS para que Angular consuma la API sin problemas
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==========================================
# 0. UTILIDADES
# ==========================================
def format_date(date_obj):
    """Convierte fechas de la BD a string para JSON"""
    if isinstance(date_obj, (datetime, float)):
        return date_obj.strftime("%Y-%m-%d %H:%M:%S")
    return str(date_obj)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"mensaje": "API Patitas Felices V2.0 - Lista para producción 🚀"})

# ==========================================
# 1. AUTENTICACIÓN (LOGIN MEJORADO)
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Sin conexión a BD"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Buscar usuario base
        cursor.execute("SELECT * FROM usuarios WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()

        if user:
            # 2. Buscar perfil específico según el rol
            perfil_id = user['id'] # Por defecto (Admin)
            nombre = "Administrador"
            
            if user['rol'] == 'cliente':
                cursor.execute("SELECT id, nombre_completo FROM clientes WHERE usuario_id = %s", (user['id'],))
                perfil = cursor.fetchone()
                if perfil:
                    perfil_id = perfil['id']
                    nombre = perfil['nombre_completo']
            
            elif user['rol'] == 'veterinario':
                cursor.execute("SELECT id, nombre_completo FROM veterinarios WHERE usuario_id = %s", (user['id'],))
                perfil = cursor.fetchone()
                if perfil:
                    perfil_id = perfil['id']
                    nombre = perfil['nombre_completo']

            return jsonify({
                "success": True,
                "rol": user['rol'],
                "usuario_id": user['id'], # ID de login
                "perfil_id": perfil_id,   # ID de la tabla clientes/vets
                "nombre": nombre,
                "email": user['email']
            })
        else:
            return jsonify({"success": False, "mensaje": "Credenciales inválidas"}), 401
    finally:
        if conn and conn.is_connected(): conn.close()

# ==========================================
# 2. DASHBOARD (KPIs)
# ==========================================
@app.route('/api/dashboard/kpis', methods=['GET'])
def get_kpis():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Consultas rápidas para los contadores del Dashboard
        cursor.execute("SELECT COUNT(*) FROM clientes")
        total_clientes = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM mascotas")
        total_mascotas = cursor.fetchone()[0]
        
        # Citas de HOY
        hoy = datetime.now().strftime('%Y-%m-%d')
        cursor.execute(f"SELECT COUNT(*) FROM citas WHERE DATE(fecha_hora) = '{hoy}'")
        citas_hoy = cursor.fetchone()[0]
        
        # Ingresos de HOY
        cursor.execute(f"SELECT SUM(total) FROM facturas WHERE DATE(fecha) = '{hoy}'")
        ingresos_hoy = cursor.fetchone()[0] or 0

        return jsonify({
            "total_clientes": total_clientes,
            "total_mascotas": total_mascotas,
            "citas_hoy": citas_hoy,
            "ingresos_hoy": float(ingresos_hoy)
        })
    finally:
        conn.close()

# ==========================================
# 3. GESTIÓN DE CLIENTES Y VETS
# ==========================================
@app.route('/api/clientes', methods=['GET', 'POST'])
def clientes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        cursor.execute("SELECT c.*, u.email FROM clientes c JOIN usuarios u ON c.usuario_id = u.id")
        resultado = cursor.fetchall()
        conn.close()
        return jsonify(resultado)
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            # Transacción: Crear Usuario -> Crear Cliente
            conn.start_transaction()
            cursor.execute("INSERT INTO usuarios (email, password, rol) VALUES (%s, %s, 'cliente')", 
                           (data['email'], '12345678')) # Password default
            uid = cursor.lastrowid
            
            cursor.execute("INSERT INTO clientes (usuario_id, nombre_completo, telefono, direccion) VALUES (%s, %s, %s, %s)",
                           (uid, data['nombre'], data['telefono'], data['direccion']))
            conn.commit()
            return jsonify({"mensaje": "Cliente creado"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

@app.route('/api/veterinarios', methods=['GET'])
def get_vets():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM veterinarios")
    res = cursor.fetchall()
    conn.close()
    return jsonify(res)

# ==========================================
# 4. MASCOTAS
# ==========================================
@app.route('/api/mascotas', methods=['GET', 'POST'])
def manage_mascotas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        # Si viene ?cliente_id=5 en la URL, filtramos (Para el Portal Cliente)
        cliente_id = request.args.get('cliente_id')
        query = "SELECT m.*, c.nombre_completo as dueno FROM mascotas m JOIN clientes c ON m.cliente_id = c.id"
        
        if cliente_id:
            query += f" WHERE m.cliente_id = {cliente_id}"
            
        cursor.execute(query)
        res = cursor.fetchall()
        conn.close()
        return jsonify(res)

    if request.method == 'POST':
        data = request.get_json()
        query = """INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, peso, sexo, alergias)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        vals = (data['cliente_id'], data['nombre'], data['especie'], data.get('raza'), 
                data.get('fecha_nacimiento'), data.get('peso'), data.get('sexo'), data.get('alergias'))
        cursor.execute(query, vals)
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Mascota registrada"}), 201

# ==========================================
# 5. CITAS (AGENDA)
# ==========================================
@app.route('/api/citas', methods=['GET', 'POST'])
def manage_citas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        # Filtros opcionales
        vet_id = request.args.get('veterinario_id')
        cliente_id = request.args.get('cliente_id') # Para ver historial de mis mascotas
        
        query = """
            SELECT cit.*, m.nombre as mascota, c.nombre_completo as dueno, v.nombre_completo as veterinario
            FROM citas cit
            JOIN mascotas m ON cit.mascota_id = m.id
            JOIN clientes c ON m.cliente_id = c.id
            JOIN veterinarios v ON cit.veterinario_id = v.id
        """
        
        conditions = []
        if vet_id: conditions.append(f"cit.veterinario_id = {vet_id}")
        # Si busco por cliente, tengo que unir tablas, pero usaremos la lógica de mascota
        if cliente_id: conditions.append(f"m.cliente_id = {cliente_id}")
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY cit.fecha_hora DESC"
        
        cursor.execute(query)
        res = cursor.fetchall()
        conn.close()
        return jsonify(res)

    if request.method == 'POST':
        data = request.get_json()
        cursor.execute("INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, tipo, motivo) VALUES (%s, %s, %s, %s, %s)",
                       (data['mascota_id'], data['veterinario_id'], data['fecha_hora'], data['tipo'], data['motivo']))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Cita agendada"}), 201

# ==========================================
# 6. INVENTARIO
# ==========================================
@app.route('/api/productos', methods=['GET', 'POST'])
def manage_productos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        cursor.execute("SELECT * FROM productos")
        return jsonify(cursor.fetchall())
        
    if request.method == 'POST':
        data = request.get_json()
        cursor.execute("INSERT INTO productos (sku, nombre, categoria, precio_venta, stock_actual, stock_minimo) VALUES (%s, %s, %s, %s, %s, %s)",
                       (data['sku'], data['nombre'], data['categoria'], data['precio'], data['stock'], data['minimo']))
        conn.commit()
        return jsonify({"mensaje": "Producto agregado"}), 201

# ==========================================
# 7. FACTURACIÓN Y DETALLES (¡CRÍTICO!)
# ==========================================
@app.route('/api/facturas', methods=['GET', 'POST'])
def manage_facturas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        cursor.execute("""
            SELECT f.*, c.nombre_completo as cliente 
            FROM facturas f JOIN clientes c ON f.cliente_id = c.id 
            ORDER BY f.fecha DESC
        """)
        return jsonify(cursor.fetchall())

    if request.method == 'POST':
        # Recibe: { cliente_id: 1, items: [ {producto_id: 5, cantidad: 2, precio: 100, concepto: "X"} ] }
        data = request.get_json()
        try:
            conn.start_transaction()
            
            # 1. Calcular Total
            total_factura = sum(item['cantidad'] * item['precio'] for item in data['items'])
            
            # 2. Crear Cabecera Factura
            cursor.execute("INSERT INTO facturas (cliente_id, total, estado) VALUES (%s, %s, 'Pagada')", 
                           (data['cliente_id'], total_factura))
            factura_id = cursor.lastrowid
            
            # 3. Insertar Detalles y Restar Stock
            for item in data['items']:
                subtotal = item['cantidad'] * item['precio']
                
                # Guardar detalle
                cursor.execute("""
                    INSERT INTO detalle_factura (factura_id, producto_id, concepto, cantidad, precio_unitario, subtotal)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (factura_id, item.get('producto_id'), item['concepto'], item['cantidad'], item['precio'], subtotal))
                
                # Restar inventario si es producto
                if item.get('producto_id'):
                    cursor.execute("UPDATE productos SET stock_actual = stock_actual - %s WHERE id = %s", 
                                   (item['cantidad'], item['producto_id']))

            conn.commit()
            return jsonify({"mensaje": "Venta registrada con éxito", "folio": factura_id}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()

# ==========================================
# 8. HISTORIAL Y VACUNAS (VETERINARIO)
# ==========================================
@app.route('/api/vacunas', methods=['GET', 'POST'])
def manage_vacunas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        mascota_id = request.args.get('mascota_id')
        query = "SELECT * FROM vacunas_aplicadas"
        if mascota_id: query += f" WHERE mascota_id = {mascota_id}"
        cursor.execute(query)
        return jsonify(cursor.fetchall())

    if request.method == 'POST':
        data = request.get_json()
        cursor.execute("""
            INSERT INTO vacunas_aplicadas (mascota_id, nombre_vacuna, fecha_aplicacion, fecha_proxima_dosis, veterinario_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['mascota_id'], data['nombre'], data['fecha'], data['proxima'], data['vet_id']))
        conn.commit()
        return jsonify({"mensaje": "Vacuna registrada"}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)