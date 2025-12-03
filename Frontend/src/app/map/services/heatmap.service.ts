import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeatmapService {
  constructor(private http: HttpClient) {}

  /**
   * Obtém dados de hexágonos com ocorrências
   * Similar ao sistema usado por Uber e 99
   */
  getHexagonHeatmap(): Observable<any> {
    return this.http.get('mock-hexagons.json');
  }

  /**
   * Método legado - mantido para compatibilidade
   */
  getHeatmap(): Observable<any> {
    return this.http.get('mock-heatmap.json');
  }
}
