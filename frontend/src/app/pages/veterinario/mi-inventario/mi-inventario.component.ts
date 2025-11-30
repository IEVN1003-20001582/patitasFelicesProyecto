import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Producto } from '../../../interfaces/producto.interface';
import { ProductosService } from '../../../service/productos.service';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-mi-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-inventario.component.html',

})
export class MiInventarioComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  
  kpis = { totalProductos: 0, agotados: 0, stockBajo: 0 };

  mostrarModalSolicitar = false;
  mostrarModalFiltros = false;
  
  prodSeleccionado: any = null;
  textoBusqueda = '';
  filtroEstado = 'todos';
  
  usuarioActual: any = null;

  constructor(
    private productosService: ProductosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
  
    this.usuarioActual = this.authService.getUsuarioActualValue(); 
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe((res: any) => {
      let lista = res.productos || (Array.isArray(res) ? res : []);
      
      this.productos = lista.map((p: any) => {
        let estado: 'En Stock' | 'Stock Bajo' | 'Agotado' = 'En Stock';
        if (p.stock_actual <= 0) estado = 'Agotado';
        else if (p.stock_actual <= p.stock_minimo) estado = 'Stock Bajo';
        return { ...p, estado: estado };
      });

      this.productosFiltrados = [...this.productos];
      this.calcularKPIs();
    }, err => console.error(err));
  }

  calcularKPIs() {
    this.kpis.totalProductos = this.productos.length;
    this.kpis.agotados = this.productos.filter(p => p.estado === 'Agotado').length;
    this.kpis.stockBajo = this.productos.filter(p => p.estado === 'Stock Bajo').length;
  }

  filtrar() {
    const txt = this.textoBusqueda.toLowerCase();
    
    this.productosFiltrados = this.productos.filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(txt) || (p.sku && p.sku.toLowerCase().includes(txt));
      const coincideEstado = this.filtroEstado === 'todos' || 
                             (this.filtroEstado === 'Bajo' && (p.estado === 'Stock Bajo' || p.estado === 'Agotado'));
      
      return coincideTexto && coincideEstado;
    });
  }
  
  aplicarFiltros() {
      this.filtrar();
      this.cerrarModalFiltros();
  }


  
  abrirModalSolicitar(prod: any) {
    this.prodSeleccionado = prod;
    this.mostrarModalSolicitar = true;
  }

  confirmarSolicitud() {
    if (!this.prodSeleccionado) return;
    

    const uid = this.usuarioActual ? this.usuarioActual.id : 0;
    const nombreVet = this.usuarioActual ? this.usuarioActual.nombre : 'Un Veterinario';

   
    this.productosService.solicitarResurtido(this.prodSeleccionado.id, this.prodSeleccionado.nombre, uid).subscribe(res => {
        if (res.exito) {
            Swal.fire({
                title: 'Solicitud Enviada',
                text: `Se ha notificado al administrador sobre el producto: ${this.prodSeleccionado.nombre}`,
                icon: 'success',
                confirmButtonColor: '#48C9B0'
            });
        } else {
            Swal.fire('Error', 'No se pudo enviar la notificación.', 'error');
        }
        this.cerrarModalSolicitar();
    }, err => {
       
         console.error(err);
         Swal.fire('Solicitud Registrada', 'El administrador revisará el inventario.', 'success');
         this.cerrarModalSolicitar();
    });
  }


  cerrarModalSolicitar() { this.mostrarModalSolicitar = false; }
  
  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }
}