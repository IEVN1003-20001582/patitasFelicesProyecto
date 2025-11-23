export interface Cliente {
  id?: number;
  usuario_id?: number;
  nombre_completo: string;
  telefono: string;
  direccion?: string;
  email?: string; // Dato útil traído del usuario
  mascotas_count?: number; // Dato calculado
}