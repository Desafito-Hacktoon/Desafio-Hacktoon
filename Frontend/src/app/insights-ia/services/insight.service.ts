import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InsightResponse,
  InsightAreaCriticaRequest,
  InsightTendenciaRequest,
  InsightPadraoRequest,
  InsightPredicaoRequest,
  InsightExplicacaoRequest,
  InsightPerguntaRequest
} from '../../models/insight.models';

@Injectable({
  providedIn: 'root'
})
export class InsightService {
  private readonly apiUrl = `${environment.apiUrl}/insights`;

  constructor(private http: HttpClient) {}

  /**
   * Gera insight sobre área crítica.
   */
  gerarInsightAreaCritica(request: InsightAreaCriticaRequest): Observable<InsightResponse> {
    let params = new HttpParams().set('bairro', request.bairro);
    
    if (request.tipoProblema) {
      params = params.set('tipoProblema', request.tipoProblema);
    }
    if (request.periodo) {
      params = params.set('periodo', request.periodo);
    }
    if (request.periodoFim) {
      params = params.set('periodoFim', request.periodoFim);
    }

    return this.http.get<InsightResponse>(`${this.apiUrl}/area-critica`, { params });
  }

  /**
   * Gera insight de tendência.
   */
  gerarInsightTendencia(request: InsightTendenciaRequest): Observable<InsightResponse> {
    let params = new HttpParams().set('tipoProblema', request.tipoProblema);
    
    if (request.periodo) {
      params = params.set('periodo', request.periodo);
    }
    if (request.periodoFim) {
      params = params.set('periodoFim', request.periodoFim);
    }
    if (request.bairro) {
      params = params.set('bairro', request.bairro);
    }

    return this.http.get<InsightResponse>(`${this.apiUrl}/tendencia`, { params });
  }

  /**
   * Gera insight de padrão.
   */
  gerarInsightPadrao(request?: InsightPadraoRequest): Observable<InsightResponse> {
    let params = new HttpParams();
    
    if (request?.filtros) {
      Object.keys(request.filtros).forEach(key => {
        params = params.set(`filtros.${key}`, String(request.filtros![key]));
      });
    }

    return this.http.get<InsightResponse>(`${this.apiUrl}/padrao`, { params });
  }

  /**
   * Gera insight preditivo.
   */
  gerarInsightPredicao(request: InsightPredicaoRequest): Observable<InsightResponse> {
    let params = new HttpParams().set('horizonte', request.horizonte.toString());
    
    if (request.area) {
      params = params.set('area', request.area);
    }

    return this.http.get<InsightResponse>(`${this.apiUrl}/predicao`, { params });
  }

  /**
   * Gera insight explicativo.
   */
  gerarInsightExplicacao(request?: InsightExplicacaoRequest): Observable<InsightResponse> {
    let params = new HttpParams();
    
    if (request?.contexto) {
      Object.keys(request.contexto).forEach(key => {
        params = params.set(`contexto.${key}`, String(request.contexto![key]));
      });
    }
    if (request?.pergunta) {
      params = params.set('pergunta', request.pergunta);
    }

    return this.http.get<InsightResponse>(`${this.apiUrl}/explicar`, { params });
  }

  /**
   * Responde pergunta livre sobre ocorrências.
   */
  responderPergunta(request: InsightPerguntaRequest): Observable<InsightResponse> {
    return this.http.post<InsightResponse>(`${this.apiUrl}/pergunta`, request);
  }

  /**
   * Formata data para ISO 8601 (formato esperado pelo backend).
   */
  formatarDataISO(data: Date): string {
    return data.toISOString().slice(0, 19);
  }
}

