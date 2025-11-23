export interface Cita {
  id?: number;
  mascota_id: number;
  veterinario_id: number;
  fecha_hora: string; // Formato ISO string
  tipo: 'Consulta' | 'Vacuna' | 'Cirugía' | 'Estética';
  motivo: string;
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
  // Campos opcionales para mostrar en tablas
  mascota_nombre?: string;
  veterinario_nombre?: string;
  dueno_nombre?: string;
}