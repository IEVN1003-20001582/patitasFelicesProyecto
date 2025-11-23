export interface Usuario {
  id?: number;
  email: string;
  password?: string; // Opcional, solo se envía al crear/loguear
  rol: 'admin' | 'veterinario' | 'cliente';
  nombre?: string; // Nombre del perfil asociado
  perfil_id?: number; // ID del cliente o veterinario asociado
}

export interface LoginResponse {
  success: boolean;
  usuario: Usuario;
  token: string;
}