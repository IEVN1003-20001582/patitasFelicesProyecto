import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../../service/configuracion.service';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterLink], 
  templateUrl: './bienvenida.component.html',
 
})
export class BienvenidaComponent {
    nombreClinica = '';

    constructor(private configService: ConfiguracionService) {
        this.configService.infoClinica$.subscribe(info => {
            this.nombreClinica = info.nombre;
        });
    }




}