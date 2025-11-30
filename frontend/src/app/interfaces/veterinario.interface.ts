export interface Veterinario {
  id?: number;
  user_id?: number;
  nombre_completo: string;
  email: string;        
  cedula: string;       
  especialidad: string;
  turno: string;        
  foto_url?: string;
  is_active?: number;   
  password?: string;    
}