from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
# Importamos la función de conexión del archivo db.py
from db import get_db_connection

app = Flask(__name__)
# Permitimos CORS para que Angular (puerto 4200) pueda hacer peticiones
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# ==========================================
# 0. RUTA DE BIENVENIDA (Health Check)
# ==========================================
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "estado": "online",
        "mensaje": "¡Bienvenido a la API de Patitas Felices! 🐾",
        "versión": "1.0.0"
    })

# ==========================================
# 1. AUTENTICACIÓN (LOGIN)
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    """
    Recibe email y password. Retorna el usuario y su perfil asociado (Cliente o Vet).
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Error de conexión a BD"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Buscar en la tabla USUARIOS
        query = "SELECT id, nombre_completo, email, rol FROM usuarios WHERE email = %s AND password = %s"
        # NOTA: En producción, usa bcrypt para comparar hashes, no texto plano.
        cursor.execute("SELECT * FROM usuarios WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()

        if user:
            # 2. Si el usuario existe, buscamos su ID de PERFIL específico
            perfil_id = None
            nombre = "Usuario"

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
            
            elif user['rol'] == 'admin':
                nombre = "Administrador"
                perfil_id = user['id'] # El admin usa su ID de usuario

            return jsonify({
                "success": True,
                "usuario": {
                    "id": user['id'], # ID de login
                    "perfil_id": perfil_id, # ID de la tabla clientes/veterinarios (IMPORTANTE PARA RELACIONES)
                    "email": user['email'],
                    "rol": user['rol'],
                    "nombre": nombre
                },
                "token": "token_simulado_jwt_12345" # Aquí iría un JWT real
            })
        else:
            return jsonify({"success": False, "mensaje": "Credenciales incorrectas"}), 401

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 2. GESTIÓN DE CLIENTES
# ==========================================
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Traemos datos del cliente y su email de la tabla usuarios
        query = """
            SELECT c.*, u.email 
            FROM clientes c
            JOIN usuarios u ON c.usuario_id = u.id
        """
        cursor.execute(query)
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/clientes', methods=['POST'])
def create_cliente():
    """Crea un Usuario y un Cliente al mismo tiempo (Transacción)"""
    data = request.get_json()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        conn.start_transaction()

        # 1. Crear Usuario
        cursor.execute(
            "INSERT INTO usuarios (email, password, rol) VALUES (%s, %s, 'cliente')",
            (data['email'], data['password'])
        )
        usuario_id = cursor.lastrowid

        # 2. Crear Perfil Cliente
        cursor.execute(
            "INSERT INTO clientes (usuario_id, nombre_completo, telefono, direccion) VALUES (%s, %s, %s, %s)",
            (usuario_id, data['nombre_completo'], data.get('telefono'), data.get('direccion'))
        )
        
        conn.commit()
        return jsonify({"mensaje": "Cliente registrado exitosamente"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# ==========================================
# 3. GESTIÓN DE MASCOTAS
# ==========================================
@app.route('/api/mascotas', methods=['GET'])
def get_mascotas():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Incluimos el nombre del dueño
        query = """
            SELECT m.*, c.nombre_completo as dueno 
            FROM mascotas m
            JOIN clientes c ON m.cliente_id = c.id
        """
        cursor.execute(query)
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/mascotas', methods=['POST'])
def create_mascota():
    data = request.get_json()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, peso, sexo, alergias)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        valores = (
            data['cliente_id'], data['nombre'], data['especie'], data.get('raza'),
            data.get('fecha_nacimiento'), data.get('peso'), data.get('sexo'), data.get('alergias')
        )
        cursor.execute(query, valores)
        conn.commit()
        return jsonify({"mensaje": "Mascota creada"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/mascotas/<int:id>', methods=['DELETE'])
def delete_mascota(id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM mascotas WHERE id = %s", (id,))
        conn.commit()
        return jsonify({"mensaje": "Mascota eliminada"}), 200
    finally:
        conn.close()

# ==========================================
# 4. GESTIÓN DE VETERINARIOS
# ==========================================
@app.route('/api/veterinarios', methods=['GET'])
def get_veterinarios():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM veterinarios")
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

# ==========================================
# 5. GESTIÓN DE CITAS
# ==========================================
@app.route('/api/citas', methods=['GET'])
def get_citas():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Traemos nombres de mascota y vet para mostrar en el calendario
        query = """
            SELECT cit.*, m.nombre as mascota, v.nombre_completo as veterinario
            FROM citas cit
            JOIN mascotas m ON cit.mascota_id = m.id
            JOIN veterinarios v ON cit.veterinario_id = v.id
            ORDER BY cit.fecha_hora DESC
        """
        cursor.execute(query)
        # Convertir fechas a string para JSON
        citas = cursor.fetchall()
        return jsonify(citas)
    finally:
        conn.close()

@app.route('/api/citas', methods=['POST'])
def create_cita():
    data = request.get_json()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, tipo, motivo, estado)
            VALUES (%s, %s, %s, %s, %s, 'Pendiente')
        """
        cursor.execute(query, (
            data['mascota_id'], data['veterinario_id'], 
            data['fecha_hora'], data['tipo'], data['motivo']
        ))
        conn.commit()
        return jsonify({"mensaje": "Cita agendada"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/citas/<int:id>/estado', methods=['PUT'])
def update_cita_estado(id):
    data = request.get_json() # Espera {"estado": "Completada"}
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE citas SET estado = %s WHERE id = %s", (data['estado'], id))
        conn.commit()
        return jsonify({"mensaje": "Estado actualizado"}), 200
    finally:
        conn.close()

# ==========================================
# 6. INVENTARIO (PRODUCTOS)
# ==========================================
@app.route('/api/productos', methods=['GET'])
def get_productos():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM productos")
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/productos/bajo-stock', methods=['GET'])
def get_productos_bajos():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM productos WHERE stock_actual < stock_minimo")
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/productos/<int:id>', methods=['PUT'])
def update_stock(id):
    """Actualizar stock (ej. al vender o resurtir)"""
    data = request.get_json() # Espera {"stock_actual": 50}
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE productos SET stock_actual = %s WHERE id = %s", (data['stock_actual'], id))
        conn.commit()
        return jsonify({"mensaje": "Stock actualizado"}), 200
    finally:
        conn.close()

# ==========================================
# 7. HISTORIAL MÉDICO
# ==========================================
@app.route('/api/historial/<int:mascota_id>', methods=['GET'])
def get_historial(mascota_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT h.*, v.nombre_completo as veterinario
            FROM historial_medico h
            JOIN veterinarios v ON h.veterinario_id = v.id
            WHERE h.mascota_id = %s
            ORDER BY h.fecha DESC
        """
        cursor.execute(query, (mascota_id,))
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/historial', methods=['POST'])
def add_historial():
    data = request.get_json()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO historial_medico (cita_id, mascota_id, veterinario_id, diagnostico, tratamiento)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data.get('cita_id'), data['mascota_id'], data['veterinario_id'],
            data['diagnostico'], data['tratamiento']
        ))
        conn.commit()
        return jsonify({"mensaje": "Registro médico agregado"}), 201
    finally:
        conn.close()

# ==========================================
# 8. FACTURACIÓN
# ==========================================
@app.route('/api/facturas', methods=['GET'])
def get_facturas():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT f.*, c.nombre_completo as cliente
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            ORDER BY f.fecha DESC
        """
        cursor.execute(query)
        return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/api/facturas', methods=['POST'])
def create_factura():
    data = request.get_json()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "INSERT INTO facturas (cliente_id, total, estado) VALUES (%s, %s, %s)"
        cursor.execute(query, (data['cliente_id'], data['total'], data['estado']))
        conn.commit()
        return jsonify({"mensaje": "Factura generada"}), 201
    finally:
        conn.close()

# ==========================================
# INICIO DEL SERVIDOR
# ==========================================
if __name__ == '__main__':
    # debug=True permite que el servidor se reinicie si haces cambios en el código
    app.run(debug=True, port=5000)