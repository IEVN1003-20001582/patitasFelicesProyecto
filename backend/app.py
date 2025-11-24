from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, date
from db import get_db_connection

app = Flask(__name__)
# Permitir CORS para que Angular consuma la API sin problemas
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==========================================
# FUNCIONES AUXILIARES
# ==========================================


def format_fecha(data):
    """
    Recorre una lista de diccionarios y convierte los objetos 
    de tipo 'date' o 'datetime' a string (ISO format) 
    para que JSON no falle.
    """
    if not data:
        return []
    for item in data:
        for key, value in item.items():
            if isinstance(value, (date, datetime)):
                item[key] = value.isoformat()
    return data



def leer_usuario(email):
    """Busca un usuario por email para validar login"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT id, email, password_hash, role FROM users WHERE email = %s"
        cursor.execute(sql, (email,))
        datos = cursor.fetchone()
        conn.close()
        return datos
    except Exception as ex:
        print('Error al leer usuario:', ex)
        return None

def leer_mascota(id):
    """Busca una mascota por ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT m.*, c.nombre_completo as nombre_dueno 
            FROM mascotas m
            JOIN clientes c ON m.cliente_id = c.id
            WHERE m.id = %s
        """
        cursor.execute(sql, (id,))
        datos = cursor.fetchone()
        conn.close()
        
        if datos and isinstance(datos.get('fecha_nacimiento'), (date, datetime)):
            datos['fecha_nacimiento'] = datos['fecha_nacimiento'].isoformat()
            
        return datos
    except Exception as ex:
        print('Error al leer mascota:', ex)
        return None

# ==========================================
# RUTAS DE LA API
# ==========================================

@app.route('/', methods=['GET'])
def home():
    return jsonify({"mensaje": "API Patitas Felices - Estilo Escolar Online 🟢"})

# 1. LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    try:
        user = leer_usuario(request.json['email'])
        
        if user is not None:
            if user['password_hash'] == request.json['password']:
                nombre = "Administrador"
                perfil_id = user['id']
                
                conn = get_db_connection()
                cursor = conn.cursor(dictionary=True)
                
                if user['role'] == 'cliente':
                    cursor.execute("SELECT id, nombre_completo FROM clientes WHERE user_id = %s", (user['id'],))
                    perfil = cursor.fetchone()
                    if perfil:
                        nombre = perfil['nombre_completo']
                        perfil_id = perfil['id']
                elif user['role'] == 'veterinario':
                    cursor.execute("SELECT id, nombre_completo FROM veterinarios WHERE user_id = %s", (user['id'],))
                    perfil = cursor.fetchone()
                    if perfil:
                        nombre = perfil['nombre_completo']
                        perfil_id = perfil['id']
                
                conn.close()

                return jsonify({
                    'usuario': {
                        'id': user['id'],
                        'email': user['email'],
                        'role': user['role'],
                        'nombre': nombre,
                        'perfil_id': perfil_id
                    },
                    'mensaje': 'Login exitoso',
                    'exito': True
                })
            else:
                return jsonify({'mensaje': 'Contraseña incorrecta', 'exito': False})
        else:
            return jsonify({'mensaje': 'Usuario no encontrado', 'exito': False})
    except Exception as ex:
        return jsonify({'mensaje': 'Error en login: ' + str(ex), 'exito': False})


# 2. MASCOTAS
@app.route('/api/mascotas', methods=['GET'])
def listar_mascotas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cliente_id = request.args.get('cliente_id')
        
        if cliente_id:
            sql = """
                SELECT m.*, c.nombre_completo as nombre_dueno 
                FROM mascotas m
                JOIN clientes c ON m.cliente_id = c.id
                WHERE m.cliente_id = %s AND m.estado = 'activo'
            """
            cursor.execute(sql, (cliente_id,))
        else:
            sql = """
                SELECT m.*, c.nombre_completo as nombre_dueno 
                FROM mascotas m
                JOIN clientes c ON m.cliente_id = c.id
                WHERE m.estado = 'activo'
            """
            cursor.execute(sql)
            
        datos = cursor.fetchall()
        
        for fila in datos:
            if isinstance(fila.get('fecha_nacimiento'), (date, datetime)):
                fila['fecha_nacimiento'] = fila['fecha_nacimiento'].isoformat()
            # Asegurar que peso sea float
            if fila.get('peso'):
                fila['peso'] = float(fila['peso'])
                
        conn.close()
        # Retornamos estructura escolar: { mascotas: [...], exito: true }
        return jsonify({'mascotas': datos, 'mensaje': 'Mascotas listadas', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al listar mascotas: ' + str(ex), 'exito': False})

@app.route('/api/mascotas', methods=['POST'])
def registrar_mascota():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """INSERT INTO mascotas (cliente_id, nombre, especie, raza, fecha_nacimiento, sexo, peso, alergias)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        valores = (
            request.json['cliente_id'],
            request.json['nombre'],
            request.json['especie'],
            request.json['raza'],
            request.json['fecha_nacimiento'],
            request.json['sexo'],
            request.json['peso'],
            request.json.get('alergias', '')
        )
        cursor.execute(sql, valores)
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Mascota registrada correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al registrar mascota: ' + str(ex), 'exito': False})

@app.route('/api/mascotas/<id>', methods=['PUT'])
def actualizar_mascota(id):
    try:
        mascota = leer_mascota(id)
        if mascota:
            conn = get_db_connection()
            cursor = conn.cursor()
            sql = """UPDATE mascotas SET nombre=%s, especie=%s, raza=%s, peso=%s, alergias=%s 
                     WHERE id=%s"""
            valores = (
                request.json['nombre'],
                request.json['especie'],
                request.json['raza'],
                request.json['peso'],
                request.json.get('alergias', ''),
                id
            )
            cursor.execute(sql, valores)
            conn.commit()
            conn.close()
            return jsonify({'mensaje': 'Mascota actualizada', 'exito': True})
        else:
            return jsonify({'mensaje': 'Mascota no encontrada', 'exito': False})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al actualizar: ' + str(ex), 'exito': False})

@app.route('/api/mascotas/<id>', methods=['DELETE'])
def eliminar_mascota(id):
    try:
        mascota = leer_mascota(id)
        if mascota:
            conn = get_db_connection()
            cursor = conn.cursor()
            # Soft Delete
            sql = "UPDATE mascotas SET estado = 'archivado' WHERE id = %s"
            cursor.execute(sql, (id,))
            conn.commit()
            conn.close()
            return jsonify({'mensaje': 'Mascota archivada', 'exito': True})
        else:
            return jsonify({'mensaje': 'Mascota no encontrada', 'exito': False})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al eliminar: ' + str(ex), 'exito': False})


# 3. CITAS (MODIFICADO PARA AUTO-CANCELAR)
@app.route('/api/citas', methods=['GET'])
def listar_citas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # --- NUEVA LÓGICA: AUTO-CANCELACIÓN ---
        # Si la fecha ya pasó (es menor a hoy) y seguía 'pendiente', la marcamos 'cancelada'
        cursor.execute("""
            UPDATE citas 
            SET estado = 'cancelada' 
            WHERE fecha_hora < NOW() AND estado = 'pendiente'
        """)
        conn.commit() # Guardamos los cambios
        # --------------------------------------

        mascota_id = request.args.get('mascota_id')
        
        sql = """
            SELECT c.id, c.fecha_hora, c.motivo, c.estado, 
                   m.nombre as nombre_mascota, 
                   v.nombre_completo as nombre_veterinario 
            FROM citas c
            JOIN mascotas m ON c.mascota_id = m.id
            LEFT JOIN veterinarios v ON c.veterinario_id = v.id
        """
        params = ()
        if mascota_id:
            sql += " WHERE c.mascota_id = %s ORDER BY c.fecha_hora DESC"
            params = (mascota_id,)
        else:
            sql += " ORDER BY c.fecha_hora DESC"
            
        cursor.execute(sql, params)
        datos = format_fecha(cursor.fetchall())
        conn.close()
        return jsonify({'citas': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

@app.route('/api/citas', methods=['POST'])
def registrar_cita():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """INSERT INTO citas (mascota_id, veterinario_id, tipo_cita_id, fecha_hora, motivo, estado)
                 VALUES (%s, %s, %s, %s, %s, 'pendiente')"""
        valores = (
            request.json['mascota_id'],
            request.json.get('veterinario_id'),
            request.json.get('tipo_cita_id', 1),
            request.json['fecha_hora'],
            request.json['motivo']
        )
        cursor.execute(sql, valores)
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Cita registrada correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al registrar cita: ' + str(ex), 'exito': False})


# 4. PRODUCTOS (ESTO FALTABA)
@app.route('/api/productos', methods=['GET'])
def get_productos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM productos ORDER BY nombre ASC")
        datos = cursor.fetchall()
        conn.close()
        # Retornamos lista directa (como espera tu servicio) o estructura escolar
        # Para consistencia, usaremos lista directa en catalogos simples
        return jsonify(datos) 
    except Exception as ex:
        return jsonify({'mensaje': 'Error: ' + str(ex), 'exito': False})


# 5. VETERINARIOS (ESTO FALTABA)
@app.route('/api/veterinarios', methods=['GET'])
def get_veterinarios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre_completo, especialidad FROM veterinarios")
        datos = cursor.fetchall()
        conn.close()
        return jsonify(datos)
    except Exception as ex:
        return jsonify({'mensaje': 'Error: ' + str(ex), 'exito': False})


# 6. CLIENTES
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre_completo as nombre FROM clientes ORDER BY nombre_completo ASC")
        datos = cursor.fetchall()
        conn.close()
        return jsonify(datos)
    except Exception as ex:
        return jsonify({'mensaje': 'Error: ' + str(ex), 'exito': False})




# HISTORIAL MÉDICO
@app.route('/api/historial', methods=['GET'])
def get_historial():
    try:
        mascota_id = request.args.get('mascota_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT h.*, v.nombre_completo as veterinario
            FROM historial_medico h
            JOIN veterinarios v ON h.veterinario_id = v.id
            WHERE h.mascota_id = %s 
            ORDER BY h.fecha DESC
        """
        cursor.execute(sql, (mascota_id,))
        datos = format_fecha(cursor.fetchall())
        conn.close()

        return jsonify({'historial': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

@app.route('/api/historial', methods=['POST'])
def add_historial():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO historial_medico (mascota_id, veterinario_id, diagnostico, tratamiento_aplicado, medicamentos_recetados)
            VALUES (%s, %s, %s, %s, %s)
        """
        # CORRECCIÓN AQUÍ: Usamos las claves que coinciden con la BD
        # Si no envías diagnóstico, ponemos 'Consulta General' por defecto
        diag = d.get('diagnostico', 'Consulta General')
        vals = (d['mascota_id'], d['veterinario_id'], diag, d['tratamiento_aplicado'], d['medicamentos_recetados'])
        
        cursor.execute(sql, vals)
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Tratamiento agregado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

# VACUNAS
@app.route('/api/vacunas', methods=['GET'])
def get_vacunas():
    try:
        mascota_id = request.args.get('mascota_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT v.*, p.nombre as nombre_vacuna, vet.nombre_completo as veterinario
            FROM vacunacion v
            JOIN productos p ON v.producto_id = p.id
            JOIN veterinarios vet ON v.veterinario_id = vet.id
            WHERE v.mascota_id = %s 
            ORDER BY v.fecha_aplicacion DESC
        """
        cursor.execute(sql, (mascota_id,))
        datos = format_fecha(cursor.fetchall())
        conn.close()

        return jsonify({'vacunas': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

@app.route('/api/vacunas', methods=['POST'])
def add_vacuna():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO vacunacion (mascota_id, veterinario_id, producto_id, fecha_aplicacion, fecha_proxima_dosis)
            VALUES (%s, %s, %s, %s, %s)
        """
        vals = (d['mascota_id'], d['veterinario_id'], d['producto_id'], d['fecha_aplicacion'], d.get('fecha_proxima'))
        cursor.execute(sql, vals)
        
        # Opcional: Descontar stock
        cursor.execute("UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = %s", (d['producto_id'],))
        
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Vacuna registrada', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

# MANEJO DE ERROR 404
def pagina_no_encontrada(error):
    return "<h1>La página que intentas buscar no existe...</h1>", 404

if __name__ == '__main__':
    app.register_error_handler(404, pagina_no_encontrada)
    app.run(debug=True, port=5000)