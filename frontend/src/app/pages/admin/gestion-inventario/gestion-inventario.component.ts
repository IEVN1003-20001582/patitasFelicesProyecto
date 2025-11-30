import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-inventario.component.html',
 
})
export class GestionInventarioComponent {

searchTerm: string = '';

  productos = [
    { id: 1, nombre: 'Vacuna Rabia', categoria: 'Medicamentos', costo: 150, venta: 350, stock: 45, minimo: 10, imagen: 'assets/vacuna.png' },
    { id: 2, nombre: 'Alimento Seco 5kg', categoria: 'Alimentos', costo: 400, venta: 650, stock: 8, minimo: 15, imagen: 'assets/food.png' }, // Stock Bajo
    { id: 3, nombre: 'Shampoo Antialergico', categoria: 'Higiene', costo: 80, venta: 180, stock: 0, minimo: 5, imagen: 'assets/shampoo.png' },  // Agotado
    { id: 4, nombre: 'Pipeta Antipulgas', categoria: 'Medicamentos', costo: 200, venta: 450, stock: 25, minimo: 10, imagen: 'assets/pipeta.png' },
    { id: 5, nombre: 'Juguete Hueso Goma', categoria: 'Juguetes', costo: 30, venta: 90, stock: 12, minimo: 5, imagen: 'assets/toy.png' }
  ];

  get valorTotalInventario(): number {
    return this.productos.reduce((total, p) => total + (p.costo * p.stock), 0);
  }

  get productosBajosStock(): number {
    return this.productos.filter(p => p.stock <= p.minimo).length;
  }

  get totalProductos(): number {
    return this.productos.length;
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

  ajustarStock(producto: any) {
    const nuevoStock = prompt(`Ajuste Rápido para ${producto.nombre}.\nStock Actual: ${producto.stock}\n\nIngrese nuevo stock:`, producto.stock);
    
    if (nuevoStock !== null) {
      const cantidad = parseInt(nuevoStock);
      if (!isNaN(cantidad) && cantidad >= 0) {
        producto.stock = cantidad;
        alert('Stock actualizado correctamente.');
      } else {
        alert('Por favor ingrese un número válido.');
      }
    }
  }

  editarProducto(id: number) {
    alert(`Abrir modal de edición para producto ID: ${id}`);
  }

  eliminarProducto(id: number) {
    if(confirm('¿Estás seguro de eliminar este producto?')) {
      this.productos = this.productos.filter(p => p.id !== id);
    }
  }

}
