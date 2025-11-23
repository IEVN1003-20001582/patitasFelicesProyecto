import { Routes } from '@angular/router';

// Públicas
import { LoginComponent } from './pages/public/login/login.component';
import { BienvenidaComponent } from './pages/public/bienvenida/bienvenida.component';

// Admin
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { GestionCitasComponent } from './pages/admin/gestion-citas/gestion-citas.component';
// ... importa los demás componentes de admin aquí

// Veterinario
import { AgendaComponent } from './pages/veterinario/agenda/agenda.component';
// ... importa los demás de vet

// Cliente
import { MiPortalComponent } from './pages/cliente/mi-portal/mi-portal.component';

// Guards (Protección de rutas - lo veremos luego)
// import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
    { path: 'bienvenida', component: BienvenidaComponent },
    { path: 'login', component: LoginComponent },

    // Rutas de Admin
    { path: 'admin/dashboard', component: DashboardComponent },
    { path: 'admin/citas', component: GestionCitasComponent },
    // ... añade las demás rutas de admin

    // Rutas de Veterinario
    { path: 'veterinario/agenda', component: AgendaComponent },
    // ... añade las demás rutas de vet

    // Rutas de Cliente
    { path: 'cliente/portal', component: MiPortalComponent },

    // Ruta comodín (404)
    { path: '**', redirectTo: 'bienvenida' }
];