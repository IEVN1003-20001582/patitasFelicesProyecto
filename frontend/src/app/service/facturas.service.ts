import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura } from '../interfaces/factura.interface';

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private apiUrl = 'http://127.0.0.1:5000/api/facturas';

  constructor(private http: HttpClient) {}


}