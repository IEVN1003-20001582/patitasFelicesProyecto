export interface Cita {
  id?: number;
  mascota_id: number;
  veterinario_id?: number;
  tipo_cita_id?: number;
  fecha_hora: string; 
  motivo: string;
  estado?: string;

  // Campos extra para visualización (vienen del backend)
  nombre_mascota?: string;
  especie?: string;
  nombre_veterinario?: string;
  nombre_cliente?: string; // <--- ESTE ES EL QUE FALTABA



  
}