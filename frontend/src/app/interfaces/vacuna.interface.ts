export interface Vacuna {
    id?: number;
    mascota_id: number;
    veterinario_id: number;
    producto_id: number;
    nombre_vacuna?: string; // Viene del JOIN con productos
    veterinario?: string;   // Viene del JOIN con veterinarios
    fecha_aplicacion: string;
    fecha_proxima?: string;
}