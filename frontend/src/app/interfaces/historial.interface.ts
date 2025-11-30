export interface Historial {
    id?: number;
    mascota_id: number;
    veterinario_id: number;
    veterinario?: string; 
    fecha?: string;
    
    
    diagnostico?: string;
    tratamiento_aplicado: string; 
    medicamentos_recetados?: string;
}