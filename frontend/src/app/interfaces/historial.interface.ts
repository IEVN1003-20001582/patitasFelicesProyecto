export interface Historial {
    id?: number;
    mascota_id: number;
    veterinario_id: number;
    veterinario?: string; // Nombre del vet
    fecha?: string;
    
    // CAMBIOS AQUÍ PARA COINCIDIR CON LA BD:
    diagnostico?: string; // Agregamos diagnostico
    tratamiento_aplicado: string; // Antes era 'notas'
    medicamentos_recetados?: string; // Antes era 'medicamentos'
}