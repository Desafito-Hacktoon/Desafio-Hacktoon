import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HeatmapService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtém dados de hexágonos com ocorrências
   * Similar ao sistema usado por Uber e 99
   * Consome a API do backend Java
   */
  getHexagonHeatmap(filters?: {
    tipoProblema?: string;
    bairro?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
    periodoInicio?: string | Date;
    periodoFim?: string | Date;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.tipoProblema) {
        params = params.set('tipoProblema', filters.tipoProblema);
      }
      if (filters.bairro) {
        params = params.set('bairro', filters.bairro);
      }
      if (filters.minLat !== undefined) {
        params = params.set('minLat', filters.minLat.toString());
      }
      if (filters.maxLat !== undefined) {
        params = params.set('maxLat', filters.maxLat.toString());
      }
      if (filters.minLng !== undefined) {
        params = params.set('minLng', filters.minLng.toString());
      }
      if (filters.maxLng !== undefined) {
        params = params.set('maxLng', filters.maxLng.toString());
      }
      if (filters.periodoInicio) {
        const val = typeof filters.periodoInicio === 'string' 
          ? filters.periodoInicio 
          : this.formatarDataLocal(filters.periodoInicio);
        params = params.set('periodoInicio', val);
      }
      if (filters.periodoFim) {
        const val = typeof filters.periodoFim === 'string' 
          ? filters.periodoFim 
          : this.formatarDataLocal(filters.periodoFim);
        params = params.set('periodoFim', val);
      }
    }

    return this.http.get(`${this.apiUrl}/heatmap/hexagons`, { params });
  }

  /**
   * Método legado - mantido para compatibilidade
   * Retorna zonas do heatmap (polígonos) para Flutter
   */
  getHeatmap(filters?: {
    tipoProblema?: string;
    bairro?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
    gridSize?: number;
    periodoInicio?: string | Date;
    periodoFim?: string | Date;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.tipoProblema) {
        params = params.set('tipoProblema', filters.tipoProblema);
      }
      if (filters.bairro) {
        params = params.set('bairro', filters.bairro);
      }
      if (filters.minLat !== undefined) {
        params = params.set('minLat', filters.minLat.toString());
      }
      if (filters.maxLat !== undefined) {
        params = params.set('maxLat', filters.maxLat.toString());
      }
      if (filters.minLng !== undefined) {
        params = params.set('minLng', filters.minLng.toString());
      }
      if (filters.maxLng !== undefined) {
        params = params.set('maxLng', filters.maxLng.toString());
      }
      if (filters.gridSize !== undefined) {
        params = params.set('gridSize', filters.gridSize.toString());
      }
      if (filters.periodoInicio) {
        const val = typeof filters.periodoInicio === 'string' 
          ? filters.periodoInicio 
          : this.formatarDataLocal(filters.periodoInicio);
        params = params.set('periodoInicio', val);
      }
      if (filters.periodoFim) {
        const val = typeof filters.periodoFim === 'string' 
          ? filters.periodoFim 
          : this.formatarDataLocal(filters.periodoFim);
        params = params.set('periodoFim', val);
      }
    }

    return this.http.get(`${this.apiUrl}/heatmap`, { params });
  }

  /**
   * Formata data local para o formato esperado pela API (yyyy-MM-ddTHH:mm:ss)
   */
  private formatarDataLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
