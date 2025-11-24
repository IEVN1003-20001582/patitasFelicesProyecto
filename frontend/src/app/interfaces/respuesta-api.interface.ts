export interface RespuestaApi {
  mensaje: string;
  exito: boolean;
  [key: string]: any; // Para permitir otros campos dinámicos como 'id', 'usuario', etc.
}