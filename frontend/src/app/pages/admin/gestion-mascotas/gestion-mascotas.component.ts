import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Para peticiones directas si el servicio no tiene el método

import { MascotasService } from '../../../service/mascotas.service';
import { ClientesService } from '../../../service/clientes.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ProductosService } from '../../../service/productos.service';


import { Cliente } from '../../../interfaces/cliente.interface';
import { Veterinario } from '../../../interfaces/veterinario.interface';
import { Producto } from '../../../interfaces/producto.interface';

@Component({
  selector: 'app-gestion-mascotas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-mascotas.component.html'
})
export class GestionMascotasComponent   {
  
}