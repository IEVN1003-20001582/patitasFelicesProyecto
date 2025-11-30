export interface Usuario {
  id?: number;
  email: string;
  password?: string; 
  rol: 'admin' | 'veterinario' | 'cliente';
  nombre?: string; 
  perfil_id?: number; 
}

export interface LoginResponse {
  success: boolean;
  usuario: Usuario;
  token: string;
}