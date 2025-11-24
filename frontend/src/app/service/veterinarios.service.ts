import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VeterinariosService {

  // OPCIÓN A: Apuntar directo al recurso
  private apiUrl = 'http://127.0.0.1:5000/api/veterinarios';

  constructor(private http: HttpClient) { }

  public getVeterinarios(): Observable<any> {
    // ERROR ANTERIOR: return this.http.get(this.apiUrl + '/veterinarios');
    // CORRECCIÓN: Usar la URL tal cual
    return this.http.get<any>(this.apiUrl);
  }
}