import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardStatsResponse } from '../../models/dashboard.models';
import { PagedResponse, OcorrenciaResponse } from '../../models/ocorrencia.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Formata uma data para o formato ISO 8601 esperado pelo Spring Boot (yyyy-MM-ddTHH:mm:ss)
   * Usa Hora Local para alinhar com a expectativa do usuário de "Wall Clock Time".
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

  /**
   * Obtém estatísticas gerais do dashboard
   */
  getDashboardStats(periodoInicio?: Date | string, periodoFim?: Date | string): Observable<DashboardStatsResponse> {
    let params = new HttpParams();
    
    if (periodoInicio) {
      const val = typeof periodoInicio === 'string' ? periodoInicio : this.formatarDataLocal(periodoInicio);
      params = params.set('periodoInicio', val);
    }
    if (periodoFim) {
      const val = typeof periodoFim === 'string' ? periodoFim : this.formatarDataLocal(periodoFim);
      params = params.set('periodoFim', val);
    }
    
    return this.http.get<DashboardStatsResponse>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Obtém ocorrências do período especificado
   */
  getOcorrenciasDoMes(page: number = 0, size: number = 20, periodoInicio?: Date | string, periodoFim?: Date | string): Observable<PagedResponse<OcorrenciaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (periodoInicio) {
      const val = typeof periodoInicio === 'string' ? periodoInicio : this.formatarDataLocal(periodoInicio);
      params = params.set('periodoInicio', val);
    }
    if (periodoFim) {
      const val = typeof periodoFim === 'string' ? periodoFim : this.formatarDataLocal(periodoFim);
      params = params.set('periodoFim', val);
    }

    return this.http.get<PagedResponse<OcorrenciaResponse>>(
      `${this.apiUrl}/ocorrencias-mes`,
      { params }
    );
  }

  /**
   * Método de compatibilidade - mantido para não quebrar código existente
   * Retorna ocorrências do mês como array simples
   */
  getDashboardData(): Observable<OcorrenciaResponse[]> {
    return this.getOcorrenciasDoMes(0, 1000).pipe(
      map((response: PagedResponse<OcorrenciaResponse>) => response.content)
    );
  }
}
