export interface DatoGrafico {
    etiqueta: string;
    valor: number;
    porcentaje?: number;
    color?: string;
}

export interface DashboardData {
    kpis: {
        ingresos: number;
        citas: number;
        nuevos_clientes: number;
        ticket_promedio: number;
    };
    graficos: {
        ingresos_mensuales: DatoGrafico[];
        tipos_cita: DatoGrafico[];
        top_productos: DatoGrafico[];
    };
}