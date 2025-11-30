import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private apiUrl = 'http://127.0.0.1:5000/api/reportes';

  constructor(private http: HttpClient) { }

  obtenerDashboard(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.apiUrl}/dashboard`;
    if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    return this.http.get<any>(url);
  }
  

  exportarCSV(data: any[], nombreArchivo: string) {
    const replacer = (key: any, value: any) => value === null ? '' : value; 
    const header = Object.keys(data[0]);
    let csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}