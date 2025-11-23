export interface Mascota {
    id?: number;
    cliente_id: number;
    nombre: string;
    especie: string;
    raza: string;
    fecha_nacimiento?: string;
    peso?: number;
    sexo?: string;
    esterilizado?: string; // Cambiado a string si usas 'Si'/'No' en el select
    alergias?: string;
    foto_url?: string;
    
    // Campos opcionales del backend
    dueno?: string; 
    estado?: 'Activo' | 'Archivado' | 'Fallecido' | 'En Memoria'; // <--- ¡ESTO SOLUCIONA EL ERROR!
}