import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mascota } from '../interfaces/mascota.interface';

@Injectable({
  providedIn: 'root'
})
export class MascotasService {
  private apiUrl = 'http://127.0.0.1:5000/api'; // Base URL

  constructor(private http: HttpClient) { }


}