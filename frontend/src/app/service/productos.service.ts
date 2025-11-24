import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private apiUrl = 'http://127.0.0.1:5000/api/productos';

  constructor(private http: HttpClient) { }

  public getProductos(): Observable<any> {
    // ERROR ANTERIOR: return this.http.get(this.apiUrl + '/productos'); 
    // CORRECCIÓN:
    return this.http.get<any>(this.apiUrl);
  }
}