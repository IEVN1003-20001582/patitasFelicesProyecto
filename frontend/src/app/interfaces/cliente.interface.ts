export interface Cliente {
    id?: number;
    user_id?: number;
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    num_mascotas?: number;
    estado?: string; // 'Activo' | 'Inactivo'
}