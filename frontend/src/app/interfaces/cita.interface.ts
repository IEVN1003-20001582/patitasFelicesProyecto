export interface Cita {
  id?: number;
  mascota_id: number;
  veterinario_id?: number;
  tipo_cita_id?: number;
  fecha_hora: string; // Formato ISO "YYYY-MM-DD HH:MM:SS"
  motivo: string;
  estado?: string;
}