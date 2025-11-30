from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, date
from db import get_db_connection
import json

app = Flask(__name__)
# Permitir CORS para que Angular consuma la API sin problemas
CORS(app, resources={r"/api/*": {"origins": "*"}})
















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












# FUNCIONES AUXILIARES #

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
    





















# RUTAS DE LA API


@app.route('/', methods=['GET'])
def home():
    return jsonify({"mensaje": "API Patitas Felices - Estilo Escolar Online 🟢"})

# 1. LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    try:
        user = leer_usuario(request.json['email'])
        # Compara la contraseña enviada con la guardada en BD
        if user and user['password_hash'] == request.json['password']:
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
            return jsonify({'usuario': {'id': user['id'], 'email': user['email'], 'role': user['role'], 'nombre': nombre, 'perfil_id': perfil_id}, 'mensaje': 'Login exitoso', 'exito': True})
        return jsonify({'mensaje': 'Contraseña incorrecta', 'exito': False})
    except Exception as ex:
        return jsonify({'mensaje': 'Error: ' + str(ex), 'exito': False})
    
































# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS
# GESTION DE MASCOTAS

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




























#GESTION DE CITAS#
#GESTION DE CITAS#
#GESTION DE CITAS#
#GESTION DE CITAS#


# LISTAR CITAS
@app.route('/api/citas', methods=['GET'])
def listar_citas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Auto-cancelación de citas vencidas
        cursor.execute("UPDATE citas SET estado = 'cancelada' WHERE fecha_hora < NOW() AND estado = 'pendiente'")
        conn.commit()

        mascota_id = request.args.get('mascota_id')
        veterinario_id = request.args.get('veterinario_id')
        
      
        sql = """
            SELECT c.id, c.fecha_hora, c.motivo, c.estado, 
                   m.nombre as nombre_mascota, 
                   m.especie,
                   v.nombre_completo as nombre_veterinario,
                   cli.nombre_completo as nombre_cliente
            FROM citas c
            JOIN mascotas m ON c.mascota_id = m.id
            JOIN clientes cli ON m.cliente_id = cli.id
            LEFT JOIN veterinarios v ON c.veterinario_id = v.id
            WHERE 1=1
        """
        
        params = []
        
        if mascota_id:
            sql += " AND c.mascota_id = %s"
            params.append(mascota_id)
            
        if veterinario_id:
            sql += " AND c.veterinario_id = %s"
            params.append(veterinario_id)
            
        sql += " ORDER BY c.fecha_hora DESC"
            
        cursor.execute(sql, tuple(params))
        datos = format_fecha(cursor.fetchall())
        conn.close()
        return jsonify({'citas': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    


#AGREGAR CITA
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
    



# ACTUALIZAR CITA
@app.route('/api/citas/<id>', methods=['PUT'])
def actualizar_cita(id):
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Construimos la query dinámicamente según lo que se envíe
        campos = []
        valores = []
        
        if 'estado' in d:
            campos.append("estado = %s")
            valores.append(d['estado'])
        if 'veterinario_id' in d:
            campos.append("veterinario_id = %s")
            valores.append(d['veterinario_id'])
        if 'fecha_hora' in d:
            campos.append("fecha_hora = %s")
            valores.append(d['fecha_hora'])
            
        if not campos:
            return jsonify({'mensaje': 'No hay datos para actualizar', 'exito': False})
            
        valores.append(id)
        sql = f"UPDATE citas SET {', '.join(campos)} WHERE id = %s"
        
        cursor.execute(sql, tuple(valores))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Cita actualizada correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})

















#GESTION DE FACTURASS#
#GESTION DE FACTURASS#
#GESTION DE FACTURASS#
#GESTION DE FACTURASS#
#GESTION DE FACTURASS#
#GESTION DE FACTURASS#

# 1. LEER FACTURAS
@app.route('/api/facturas', methods=['GET'])
def get_facturas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT f.*, c.nombre_completo as nombre_cliente
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            ORDER BY f.fecha_emision DESC
        """
        cursor.execute(sql)
        facturas = format_fecha(cursor.fetchall())

        for f in facturas:
            cursor.execute("SELECT * FROM detalle_factura WHERE factura_id = %s", (f['id'],))
            f['detalles'] = cursor.fetchall()
            
        conn.close()
        return jsonify({'facturas': facturas, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})




# 2. BUSCAR CARGOS PENDIENTES
@app.route('/api/cargos-pendientes/<cliente_id>', methods=['GET'])
def get_cargos_pendientes(cliente_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cargos = []
        
        sql_historial = """
            SELECT h.id, h.fecha, h.diagnostico, h.tratamiento_aplicado, m.nombre as mascota
            FROM historial_medico h
            JOIN mascotas m ON h.mascota_id = m.id
            WHERE m.cliente_id = %s AND h.facturado = FALSE
        """
        cursor.execute(sql_historial, (cliente_id,))
        servicios = cursor.fetchall()
        
        for s in servicios:
            cargos.append({
                'tipo': 'cita',
                'id_origen': s['id'],
                'descripcion': f"Servicio Vet: {s['diagnostico']} - {s['tratamiento_aplicado']} ({s['mascota']})",
                'cantidad': 1,
                'precio_unitario': 350.00,
                'importe': 350.00
            })

        sql_vacunas = """
            SELECT v.id, v.fecha_aplicacion, p.nombre as vacuna, m.nombre as mascota, p.precio_venta
            FROM vacunacion v
            JOIN mascotas m ON v.mascota_id = m.id
            JOIN productos p ON v.producto_id = p.id
            WHERE m.cliente_id = %s AND v.facturado = FALSE
        """
        cursor.execute(sql_vacunas, (cliente_id,))
        vacunas = cursor.fetchall()
        
        for v in vacunas:
            cargos.append({
                'tipo': 'vacuna',
                'id_origen': v['id'],
                'descripcion': f"Vacunación: {v['vacuna']} ({v['mascota']})",
                'cantidad': 1,
                'precio_unitario': float(v['precio_venta']),
                'importe': float(v['precio_venta'])
            })
        
        conn.close()
        return jsonify({'cargos': cargos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})





# 3. CREAR FACTURA Y MARCAR CARGOS COMO PAGADOS
@app.route('/api/facturas', methods=['POST'])
def crear_factura():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        

        folio = f"PF-{int(datetime.now().timestamp())}"
        
       
        sql_factura = """
            INSERT INTO facturas (cliente_id, folio_factura, subtotal, impuestos, total, estado, metodo_pago)
            VALUES (%s, %s, %s, %s, %s, 'pendiente', %s)
        """
        cursor.execute(sql_factura, (
            d['cliente_id'], folio, d['subtotal'], 0, d['total'], 'Efectivo'
        ))
        factura_id = cursor.lastrowid
        
      
        for item in d['items']:
            # Guardar detalle
            sql_detalle = """
                INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, importe)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql_detalle, (
                factura_id, item['descripcion'], item['cantidad'], item['precio_unitario'], item['importe']
            ))
            
         
            if item.get('tipo') == 'cita':
                cursor.execute("UPDATE historial_medico SET facturado = TRUE WHERE id = %s", (item['id_origen'],))
            elif item.get('tipo') == 'vacuna':
                cursor.execute("UPDATE vacunacion SET facturado = TRUE WHERE id = %s", (item['id_origen'],))
            
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Factura generada correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



# 4. MARCAR PAGADA
@app.route('/api/facturas/<id>/pagar', methods=['PUT'])
def pagar_factura(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE facturas SET estado = 'pagada' WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Factura marcada como pagada', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



















# ==========================================
# GESTIÓN DE INVENTARIO
# ==========================================

# LEER 
@app.route('/api/productos', methods=['GET'])
def get_productos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN configuracion_categorias_producto c ON p.categoria_id = c.id
            ORDER BY p.nombre ASC
        """
        cursor.execute(sql)
        datos = cursor.fetchall()
        conn.close()
        return jsonify({'productos': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})




# CREAR PRODUCTO
@app.route('/api/productos', methods=['POST'])
def crear_producto():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
    
        cat_id = d.get('categoria_id')
        if isinstance(cat_id, str) and not cat_id.isdigit():
        
             cursor.execute("SELECT id FROM configuracion_categorias_producto WHERE nombre = %s", (cat_id,))
             res = cursor.fetchone()
             if res: cat_id = res[0]
             else: cat_id = 1 

        sql = """
            INSERT INTO productos (categoria_id, nombre, descripcion, sku, proveedor, precio_costo, precio_venta, stock_actual, stock_minimo, imagen_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        vals = (
            cat_id, 
            d['nombre'], 
            d.get('descripcion', ''), 
            d.get('sku', ''), 
            d.get('proveedor', ''), 
            d.get('precio_costo', 0), 
            d['precio_venta'], 
            d['stock_actual'], 
            d['stock_minimo'], 
            d.get('imagen_url', '')
        )
        cursor.execute(sql, vals)
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto agregado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    

    

# EDITAR PRODUCTO
@app.route('/api/productos/<id>', methods=['PUT'])
def actualizar_producto(id):
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cat_id = d.get('categoria_id')

        sql = """
            UPDATE productos 
            SET nombre=%s, descripcion=%s, sku=%s, proveedor=%s, precio_costo=%s, precio_venta=%s, stock_actual=%s, stock_minimo=%s, imagen_url=%s
            WHERE id=%s
        """
        vals = (
            d['nombre'], 
            d.get('descripcion', ''), 
            d.get('sku', ''), 
            d.get('proveedor', ''), 
            d.get('precio_costo', 0), 
            d['precio_venta'], 
            d['stock_actual'], 
            d['stock_minimo'], 
            d.get('imagen_url', ''),
            id
        )
        cursor.execute(sql, vals)
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto actualizado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



# AJUSTE RÁPIDO DE STOCK
@app.route('/api/productos/<id>/stock', methods=['PATCH'])
def ajustar_stock(id):
    try:
        d = request.json
        nuevo_stock = d['stock']
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE productos SET stock_actual = %s WHERE id = %s", (nuevo_stock, id))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Stock ajustado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    






# ELIMINAR 
@app.route('/api/productos/<id>', methods=['DELETE'])
def eliminar_producto(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Ojo: Si hay ventas, el DELETE fallará por FK. Mejor hacer Soft Delete (estado='Inactivo') si tienes la columna.
        # Si no, DELETE físico.
        cursor.execute("DELETE FROM productos WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto eliminado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'No se puede eliminar (tiene historial)', 'exito': False})


























# GESTIÓN DE VETERINARIOS
# GESTIÓN DE VETERINARIOS
# GESTIÓN DE VETERINARIOS
# GESTIÓN DE VETERINARIOS
# GESTIÓN DE VETERINARIOS
# GESTIÓN DE VETERINARIOS


# LEER
@app.route('/api/veterinarios', methods=['GET'])
def get_veterinarios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT v.*, u.email, u.is_active
            FROM veterinarios v
            JOIN users u ON v.user_id = u.id
            ORDER BY v.nombre_completo ASC
        """
        cursor.execute(sql)
        datos = cursor.fetchall()
        conn.close()
        return jsonify({'veterinarios': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    

# CREAR
@app.route('/api/veterinarios', methods=['POST'])
def crear_veterinario():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Crear Login (Rol 'veterinario')
        password = d.get('password', '123456') # Default si no envían
        cursor.execute("INSERT INTO users (email, password_hash, role, is_active) VALUES (%s, %s, 'veterinario', 1)", (d['email'], password))
        user_id = cursor.lastrowid
        
        # 2. Crear Perfil
        sql = """
            INSERT INTO veterinarios (user_id, nombre_completo, cedula_profesional, especialidad, turno, foto_url)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        vals = (user_id, d['nombre_completo'], d['cedula'], d['especialidad'], d['turno'], d.get('foto_url', ''))
        cursor.execute(sql, vals)
        
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Veterinario registrado correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



# EDITAR
@app.route('/api/veterinarios/<id>', methods=['PUT'])
def actualizar_veterinario(id):
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            UPDATE veterinarios 
            SET nombre_completo=%s, cedula_profesional=%s, especialidad=%s, turno=%s, foto_url=%s
            WHERE id=%s
        """
        vals = (d['nombre_completo'], d['cedula'], d['especialidad'], d['turno'], d.get('foto_url', ''), id)
        cursor.execute(sql, vals)
        
    
        if 'email' in d:
             cursor.execute("SELECT user_id FROM veterinarios WHERE id=%s", (id,))
             res = cursor.fetchone()
             if res:
                 cursor.execute("UPDATE users SET email=%s WHERE id=%s", (d['email'], res[0]))

        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Datos actualizados', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    





# DESACTIVAR (Soft Delete)
@app.route('/api/veterinarios/<id>', methods=['DELETE'])
def eliminar_veterinario(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
    
        cursor.execute("SELECT user_id FROM veterinarios WHERE id=%s", (id,))
        res = cursor.fetchone()
        
        if res:
            cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (res[0],))
            
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Acceso de veterinario desactivado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})














































# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)
# GESTIÓN DE CLIENTES (CRUD)


@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    try:

        estado = request.args.get('estado') 
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
     
        sql = """
            SELECT c.*, 
                   (SELECT COUNT(*) FROM mascotas m WHERE m.cliente_id = c.id AND m.estado = 'activo') as num_mascotas
            FROM clientes c
        """
        
        if estado:
            sql += " WHERE c.estado = %s"
            params = (estado,)
            cursor.execute(sql, params)
        else:
          
            sql += " ORDER BY FIELD(c.estado, 'Activo', 'Inactivo'), c.nombre_completo ASC"
            cursor.execute(sql)
            
        datos = cursor.fetchall()
        conn.close()
        return jsonify({'clientes': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



# CREAR CLIENTE

@app.route('/api/clientes', methods=['POST'])
def crear_cliente():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        

        cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'cliente')", (d['email'], '123456'))
        user_id = cursor.lastrowid
        
  
        sql = """INSERT INTO clientes (user_id, nombre_completo, telefono, direccion, email_contacto, estado)
                 VALUES (%s, %s, %s, %s, %s, 'Activo')"""
        cursor.execute(sql, (user_id, d['nombre'], d['telefono'], d['direccion'], d['email']))
        
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Cliente registrado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



# ACTUALIZAR CLIENTE

@app.route('/api/clientes/<id>', methods=['PUT'])
def actualizar_cliente(id):
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "UPDATE clientes SET nombre_completo=%s, telefono=%s, direccion=%s, email_contacto=%s WHERE id=%s"
        cursor.execute(sql, (d['nombre'], d['telefono'], d['direccion'], d['email'], id))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Cliente actualizado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})





# ARCHIVAR CLIENTE

@app.route('/api/clientes/<id>', methods=['DELETE'])
def archivar_cliente(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE clientes SET estado = 'Inactivo' WHERE id = %s", (id,))
        
   
        cursor.execute("UPDATE mascotas SET estado = 'archivado' WHERE cliente_id = %s", (id,))
        

        cursor.execute("SELECT user_id FROM clientes WHERE id = %s", (id,))
        res = cursor.fetchone()
        if res and res[0]:
            cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (res[0],))

        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Cliente archivado (Soft Delete)', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})





















# HISTORIAL MÉDICO Y VACUNAS
# HISTORIAL MÉDICO Y VACUNAS



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
    



# AGREGAR REGISTRO AL HISTORIAL
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
    






























# ==========================================
# MÓDULO DE REPORTES Y ANALÍTICA
# ==========================================

@app.route('/api/reportes/dashboard', methods=['GET'])
def get_reportes_dashboard():
    try:
        # Filtros de fechas (opcionales, por defecto último mes)
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        # Clausula WHERE dinámica
        where_date_facturas = ""
        where_date_citas = ""
        params = []
        
        if fecha_inicio and fecha_fin:
            where_date_facturas = "AND fecha_emision BETWEEN %s AND %s"
            where_date_citas = "AND fecha_hora BETWEEN %s AND %s"
            params = [fecha_inicio, fecha_fin]

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. KPIS PRINCIPALES

        # Ingresos Totales
        sql_ingresos = f"SELECT SUM(total) as total FROM facturas WHERE estado='pagada' {where_date_facturas}"
        cursor.execute(sql_ingresos, params if fecha_inicio else ())
        ingresos = cursor.fetchone()['total'] or 0

        # Citas Completadas
        sql_citas = f"SELECT COUNT(*) as total FROM citas WHERE estado='completada' {where_date_citas}"
        cursor.execute(sql_citas, params if fecha_inicio else ())
        citas_total = cursor.fetchone()['total'] or 0

        # Ticket Promedio
        ticket_promedio = (ingresos / citas_total) if citas_total > 0 else 0

        # Nuevos Clientes
        cursor.execute("SELECT COUNT(*) as total FROM clientes")
        nuevos_clientes = cursor.fetchone()['total']


        # 2. DATOS PARA GRÁFICOS
        
        # Gráfico 1: Ingresos por Mes (Últimos 6 meses o rango)
        # Nota: TiDB/MySQL usa DATE_FORMAT
        sql_graf_ingresos = """
            SELECT DATE_FORMAT(fecha_emision, '%Y-%m') as etiqueta, SUM(total) as valor 
            FROM facturas 
            WHERE estado='pagada' 
            GROUP BY etiqueta 
            ORDER BY etiqueta DESC LIMIT 6
        """
        cursor.execute(sql_graf_ingresos)
        graf_ingresos = cursor.fetchall()[::-1] # Invertir para cronológico

        # Gráfico 2: Tipos de Cita (Distribución)
        sql_graf_citas = """
            SELECT ctc.nombre as etiqueta, COUNT(*) as valor
            FROM citas c
            JOIN configuracion_tipos_cita ctc ON c.tipo_cita_id = ctc.id
            GROUP BY ctc.nombre
        """
        cursor.execute(sql_graf_citas)
        graf_citas = cursor.fetchall()

        # Gráfico 3: Productos Más Vendidos (Top 5)
        sql_graf_productos = """
            SELECT descripcion as etiqueta, SUM(cantidad) as valor
            FROM detalle_factura
            GROUP BY descripcion
            ORDER BY valor DESC LIMIT 5
        """
        cursor.execute(sql_graf_productos)
        graf_productos = cursor.fetchall()

        conn.close()

        return jsonify({
            'kpis': {
                'ingresos': float(ingresos),
                'citas': citas_total,
                'nuevos_clientes': nuevos_clientes,
                'ticket_promedio': float(ticket_promedio)
            },
            'graficos': {
                'ingresos_mensuales': graf_ingresos, # 
                'tipos_cita': graf_citas,            
                'top_productos': graf_productos
            },
            'exito': True
        })

    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
































# ==========================================
# MÓDULO DE CONFIGURACIÓN
# ==========================================

# --- 1. INFORMACIÓN DE LA CLÍNICA (Archivo JSON) ---
CONFIG_FILE = 'clinica_config.json'

def cargar_config_clinica():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return { # Default
        'nombre': 'Patitas Felices',
        'telefono': '555-0000',
        'direccion': 'Calle Principal #123',
        'iva': 16,
        'moneda': '$'
    }







@app.route('/api/config/clinica', methods=['GET'])
def get_info_clinica():
    return jsonify(cargar_config_clinica())




@app.route('/api/config/clinica', methods=['POST'])
def save_info_clinica():
    try:
        datos = request.json
        with open(CONFIG_FILE, 'w') as f:
            json.dump(datos, f)
        return jsonify({'mensaje': 'Información actualizada', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    






# --- 2. CAMBIAR CONTRASEÑA ---
@app.route('/api/cambiar-password', methods=['POST'])
def cambiar_password():
    try:
        d = request.json
        user_id = d['user_id']
        old_pass = d['actual']
        new_pass = d['nueva']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar anterior
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        res = cursor.fetchone()
        
        if res and res[0] == old_pass:
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_pass, user_id))
            conn.commit()
            conn.close()
            return jsonify({'mensaje': 'Contraseña actualizada', 'exito': True})
        else:
            conn.close()
            return jsonify({'mensaje': 'La contraseña actual es incorrecta', 'exito': False})
            
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    







# --- 3. TIPOS DE CITA 
@app.route('/api/config/tipos-cita', methods=['GET'])
def get_tipos_cita():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM configuracion_tipos_cita ORDER BY nombre ASC")
        datos = cursor.fetchall()
        conn.close()
        return jsonify({'tipos': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    





@app.route('/api/config/tipos-cita', methods=['POST'])
def add_tipo_cita():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO configuracion_tipos_cita (nombre, duracion_minutos, precio_base) VALUES (%s, %s, %s)", 
                       (d['nombre'], d['duracion'], d['precio']))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Agregado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    






@app.route('/api/config/tipos-cita/<id>', methods=['DELETE'])
def delete_tipo_cita(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM configuracion_tipos_cita WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Eliminado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al eliminar (puede estar en uso)', 'exito': False})
    






# --- 4. CATEGORÍAS 
@app.route('/api/config/categorias', methods=['GET'])
def get_categorias():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM configuracion_categorias_producto ORDER BY nombre ASC")
        datos = cursor.fetchall()
        conn.close()
        return jsonify({'categorias': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    





@app.route('/api/config/categorias', methods=['POST'])
def add_categoria():
    try:
        d = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO configuracion_categorias_producto (nombre) VALUES (%s)", (d['nombre'],))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Agregada', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    



@app.route('/api/config/categorias/<id>', methods=['DELETE'])

def delete_categoria(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM configuracion_categorias_producto WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Eliminado', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': 'Error al eliminar', 'exito': False})
    





# --- 5. ACTUALIZAR PERFIL USUARIO (Email) ---
@app.route('/api/usuario/<id>', methods=['PUT'])
def actualizar_perfil_usuario(id):
    try:
        d = request.json
        nuevo_email = d.get('email')
        
        if not nuevo_email:
            return jsonify({'mensaje': 'El email es obligatorio', 'exito': False})
            
       
        conn = get_db_connection()
        cursor = conn.cursor()
        
       
        cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (nuevo_email, id))
        if cursor.fetchone():
            conn.close()
            return jsonify({'mensaje': 'Este correo ya está en uso por otro usuario', 'exito': False})

        # Actualizar
        cursor.execute("UPDATE users SET email = %s WHERE id = %s", (nuevo_email, id))
        
      
        cursor.execute("UPDATE clientes SET email_contacto = %s WHERE user_id = %s", (nuevo_email, id))
       
        
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Perfil actualizado correctamente', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    













#NOTIFICACIONES
#NOTIFICACIONES
#NOTIFICACIONES
#NOTIFICACIONES
#NOTIFICACIONES
#NOTIFICACIONES


@app.route('/api/notificaciones', methods=['GET'])
def get_notificaciones():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'notificaciones': [], 'exito': False})

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = "SELECT * FROM notificaciones WHERE user_id = %s ORDER BY created_at DESC LIMIT 20"
        cursor.execute(sql, (user_id,))
        
        datos = format_fecha(cursor.fetchall())
        conn.close()
        return jsonify({'notificaciones': datos, 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': str(ex), 'exito': False})
    










    


# MANEJO DE ERROR 404
def pagina_no_encontrada(error):
    return "<h1>La página que intentas buscar no existe...</h1>", 404

if __name__ == '__main__':
    app.register_error_handler(404, pagina_no_encontrada)
    app.run(debug=True, port=5000)