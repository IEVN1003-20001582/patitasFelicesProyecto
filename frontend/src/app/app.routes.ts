import { Routes } from '@angular/router';

// --- 1. IMPORTACIÓN DE COMPONENTES PÚBLICOS ---
import { BienvenidaComponent } from './pages/public/bienvenida/bienvenida.component';
import { LoginComponent } from './pages/public/login/login.component';

// --- 2. IMPORTACIÓN DE COMPONENTES ADMIN ---
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { GestionCitasComponent } from './pages/admin/gestion-citas/gestion-citas.component';
import { GestionClientesComponent } from './pages/admin/gestion-clientes/gestion-clientes.component';
import { GestionMascotasComponent } from './pages/admin/gestion-mascotas/gestion-mascotas.component';
import { GestionVeterinariosComponent } from './pages/admin/gestion-veterinarios/gestion-veterinarios.component';
import { GestionInventarioComponent } from './pages/admin/gestion-inventario/gestion-inventario.component';
import { GestionFacturacionComponent } from './pages/admin/gestion-facturacion/gestion-facturacion.component';
import { ReportesComponent } from './pages/admin/reportes/reportes.component';
import { ConfiguracionComponent } from './pages/admin/configuracion/configuracion.component';

// --- 3. IMPORTACIÓN DE COMPONENTES VETERINARIO ---
import { AgendaComponent } from './pages/veterinario/agenda/agenda.component';
import { MiInventarioComponent } from './pages/veterinario/mi-inventario/mi-inventario.component';
import { ConfiguracionVeterinarioComponent } from './pages/veterinario/mi-perfil/mi-perfil.component';
import { ClientesVetComponent } from './pages/veterinario/mis-clientes/mis-clientes.component';
import { MisMascotasComponent } from './pages/veterinario/mis-mascotas/mis-mascotas.component';





// --- 4. IMPORTACIÓN DE COMPONENTES CLIENTE ---
import { MiPortalComponent } from './pages/cliente/mi-portal/mi-portal.component';




// --- DEFINICIÓN DE RUTAS ---
export const routes: Routes = [
    
    
    { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },

    // --- ÁREA PÚBLICA ---
    
    { path: 'bienvenida', component: BienvenidaComponent, title: 'Bienvenido a Patitas Felices' },
    { path: 'login', component: LoginComponent, title: 'Iniciar Sesión' },

    // --- ÁREA ADMINISTRADOR ---
   
    { path: 'admin/dashboard', component: DashboardComponent, title: 'Dashboard Admin' },
    { path: 'admin/citas', component: GestionCitasComponent, title: 'Gestión de Citas' },
    { path: 'admin/clientes', component: GestionClientesComponent, title: 'Gestión de Clientes' },
    { path: 'admin/mascotas', component: GestionMascotasComponent, title: 'Gestión de Mascotas' },
    { path: 'admin/veterinarios', component: GestionVeterinariosComponent, title: 'Gestión de Veterinarios' },
    { path: 'admin/inventario', component: GestionInventarioComponent, title: 'Inventario General' },
    { path: 'admin/facturacion', component: GestionFacturacionComponent, title: 'Facturación' },
    { path: 'admin/reportes', component: ReportesComponent, title: 'Reportes y Estadísticas' },
    { path: 'admin/configuracion', component: ConfiguracionComponent, title: 'Configuración del Sistema' },

    // --- ÁREA VETERINARIO ---
    { path: 'veterinario/agenda', component: AgendaComponent, title: 'Mi Agenda' },
    { path: 'veterinario/clientes', component: ClientesVetComponent, title: 'Clientes' },
    { path: 'veterinario/mascotas', component: MisMascotasComponent, title: 'Mascotas' },
    { path: 'veterinario/inventario', component: MiInventarioComponent, title: 'Consulta de Inventario' },
    { path: 'veterinario/perfil', component: ConfiguracionVeterinarioComponent, title: 'Mi Perfil Profesional' },

    // --- ÁREA CLIENTE ---
    { path: 'cliente/portal', component: MiPortalComponent, title: 'Mi Portal' },

    // --- RUTA COMODÍN (404) ---
   
    { path: '**', redirectTo: 'bienvenida' }
];