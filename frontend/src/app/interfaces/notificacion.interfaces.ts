export interface Notificacion {
  id: number;
  user_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  enlace?: string;
  leido: number;
  created_at: string;
}
