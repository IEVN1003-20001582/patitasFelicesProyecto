export interface Mascota {
  id?: number; // Opcional porque al crear no tiene ID aún
  cliente_id: number;
  nombre: string;
  especie: string;
  raza: string;
  fecha_nacimiento: string;
  sexo: string;
  peso: number;
  alergias?: string;
  foto_url?: string;
  estado?: string; // 'activo', 'archivado', 'en_memoria'
  nombre_dueno?: string; // Campo extra que viene del JOIN en el backend
}