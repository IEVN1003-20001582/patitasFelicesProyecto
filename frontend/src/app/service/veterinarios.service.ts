import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Veterinario } from '../interfaces/veterinario.interface';

@Injectable({
  providedIn: 'root'
})
export class VeterinariosService {
  private apiUrl = 'http://127.0.0.1:5000/api/veterinarios';

  constructor(private http: HttpClient) { }


}