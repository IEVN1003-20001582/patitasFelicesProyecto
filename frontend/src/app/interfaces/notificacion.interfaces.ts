export interface Notificacion {
    id: number;
    user_id: number;
    titulo: string;
    mensaje: string;
    leido: number; // 0 = No leída, 1 = Leída 
    tipo: 'Stock' | 'Cita' | 'Sistema' | 'Vacuna';
    created_at: string;
}