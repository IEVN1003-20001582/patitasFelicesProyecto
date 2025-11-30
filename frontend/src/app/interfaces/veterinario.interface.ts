export interface Veterinario {
  id?: number;
  user_id?: number;
  nombre_completo: string;
  email: string;       
  cedula: string;       
  especialidad: string;
  turno: string;        // 'Matutino', 'Vespertino', 'Completo'
  foto_url?: string;
  is_active?: number;   // 1 = Activo, 0 = Inactivo
  password?: string;    
}