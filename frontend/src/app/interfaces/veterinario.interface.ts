export interface Veterinario {
  id?: number;
  usuario_id: number;
  nombre_completo: string;
  cedula: string;
  especialidad: string;
  turno?: string;
  estado?: 'Activo' | 'Inactivo' | 'Vacaciones';
  email?: string;
}