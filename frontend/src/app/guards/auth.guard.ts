import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const usuario = this.authService.getUsuarioActualValue();

    if (usuario) {
   
      
      if (state.url.includes('/admin') && usuario.role !== 'admin') {
          this.router.navigate(['/login']);
          return false;
      }
      
      if (state.url.includes('/veterinario') && usuario.role !== 'veterinario') {
          this.router.navigate(['/login']);
          return false;
      }

      return true;
    }

    
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}