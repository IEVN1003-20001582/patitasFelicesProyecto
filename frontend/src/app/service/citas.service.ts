import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../interfaces/cita.interface';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = 'http://127.0.0.1:5000/api/citas';

  constructor(private http: HttpClient) { }


}