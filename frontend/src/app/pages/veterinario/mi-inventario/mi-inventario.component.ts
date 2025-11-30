import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mi-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-inventario.component.html',
  
})
export class MiInventarioComponent {

searchTerm: string = '';

  productos = [
    { id: 1, nombre: 'Vacuna Rabia', categoria: 'Medicamentos', stock: 45, minimo: 10 },
    { id: 2, nombre: 'Alimento Seco 5kg', categoria: 'Alimentos', stock: 8, minimo: 15 }, 
    { id: 3, nombre: 'Shampoo Antialergico', categoria: 'Higiene', stock: 0, minimo: 5 },  
    { id: 4, nombre: 'Pipeta Antipulgas', categoria: 'Medicamentos', stock: 25, minimo: 10 },
    { id: 5, nombre: 'Juguete Hueso Goma', categoria: 'Juguetes', stock: 12, minimo: 5 }
  ];

  get productosAtencion(): number {
    return this.productos.filter(p => p.stock <= p.minimo).length;
  }

  getEstadoColor(producto: any): string {
    if (producto.stock === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (producto.stock <= producto.minimo) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  }

  getEstadoTexto(producto: any): string {
    if (producto.stock === 0) return 'Agotado';
    if (producto.stock <= producto.minimo) return 'Stock Bajo';
    return 'En Stock';
  }

  solicitarStock(producto: any) {
    if(confirm(`¿Deseas enviar una solicitud de resurtido para: ${producto.nombre}?`)) {
      alert('Solicitud enviada al Administrador correctamente.');
    }
  }


}
