import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RelatorioRequest,
  RelatorioResponse,
  RelatorioFilterRequest,
  TipoRelatorio,
  PagedResponse
} from '../../models/relatorio-ia.models';

@Injectable({
  providedIn: 'root',
})
export class RelatorioIAService {
  private readonly apiUrl = `${environment.apiUrl}/relatorios-ia`;

  constructor(private http: HttpClient) {}

  /**
   * Lista relatórios com filtros e paginação.
   */
  listar(
    filtros?: RelatorioFilterRequest,
    page: number = 0,
    size: number = 20
  ): Observable<PagedResponse<RelatorioResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filtros) {
      if (filtros.tipoRelatorio) {
        params = params.set('tipoRelatorio', filtros.tipoRelatorio);
      }
      if (filtros.status) {
        params = params.set('status', filtros.status);
      }
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
    }

    return this.http.get<PagedResponse<RelatorioResponse>>(this.apiUrl, { params });
  }

  /**
   * Busca relatório por ID.
   */
  buscarPorId(id: string): Observable<RelatorioResponse> {
    return this.http.get<RelatorioResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Gera relatório customizado.
   */
  gerarRelatorio(request: RelatorioRequest): Observable<RelatorioResponse> {
    return this.http.post<RelatorioResponse>(`${this.apiUrl}/gerar`, request);
  }

  /**
   * Busca último relatório de um tipo específico.
   */
  buscarUltimoPorTipo(tipo: TipoRelatorio): Observable<RelatorioResponse> {
    return this.http.get<RelatorioResponse>(`${this.apiUrl}/ultimo/${tipo}`);
  }

  /**
   * Formata data para ISO 8601.
   */
  formatarDataISO(data: Date): string {
    return data.toISOString().slice(0, 19);
  }

  /**
   * Cria request para relatório diário.
   */
  criarRequestDiario(): RelatorioRequest {
    const agora = new Date();
    const inicioDia = new Date(agora);
    inicioDia.setHours(0, 0, 0, 0);
    inicioDia.setDate(inicioDia.getDate() - 1); // Dia anterior

    const fimDia = new Date(inicioDia);
    fimDia.setHours(23, 59, 59, 999);

    return {
      tipoRelatorio: TipoRelatorio.DIARIO,
      periodoInicio: this.formatarDataISO(inicioDia),
      periodoFim: this.formatarDataISO(fimDia),
    };
  }

  /**
   * Cria request para relatório semanal.
   */
  criarRequestSemanal(): RelatorioRequest {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(agora);
    fimSemana.setDate(fimSemana.getDate() - 1);
    fimSemana.setHours(23, 59, 59, 999);

    return {
      tipoRelatorio: TipoRelatorio.SEMANAL,
      periodoInicio: this.formatarDataISO(inicioSemana),
      periodoFim: this.formatarDataISO(fimSemana),
    };
  }

  /**
   * Cria request para relatório mensal.
   */
  criarRequestMensal(): RelatorioRequest {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    inicioMes.setHours(0, 0, 0, 0);

    const fimMes = new Date(agora.getFullYear(), agora.getMonth(), 0);
    fimMes.setHours(23, 59, 59, 999);

    return {
      tipoRelatorio: TipoRelatorio.MENSAL,
      periodoInicio: this.formatarDataISO(inicioMes),
      periodoFim: this.formatarDataISO(fimMes),
    };
  }
}

