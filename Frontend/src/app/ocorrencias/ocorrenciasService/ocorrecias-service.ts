import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  OcorrenciaResponse,
  OcorrenciaRequest,
  PagedResponse,
  OcorrenciaFilterRequest,
  TipoProblema,
  StatusOcorrencia
} from '../../models/ocorrencia.models';

@Injectable({
  providedIn: 'root',
})
export class OcorreciasService {
  private readonly apiUrl = `${environment.apiUrl}/ocorrencias`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as ocorrências com filtros e paginação
   */
  listar(
    filtros?: OcorrenciaFilterRequest,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'dataCriacao',
    sortDir: string = 'DESC'
  ): Observable<PagedResponse<OcorrenciaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (filtros) {
      if (filtros.tipoProblema) {
        params = params.set('tipoProblema', filtros.tipoProblema);
      }
      if (filtros.bairro) {
        params = params.set('bairro', filtros.bairro);
      }
      if (filtros.status) {
        params = params.set('status', filtros.status);
      }
      if (filtros.gravidadeMin !== undefined) {
        params = params.set('gravidadeMin', filtros.gravidadeMin.toString());
      }
      if (filtros.gravidadeMax !== undefined) {
        params = params.set('gravidadeMax', filtros.gravidadeMax.toString());
      }
      if (filtros.dataInicio) {
        let dataInicioISO: string;
        if (typeof filtros.dataInicio === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(filtros.dataInicio)) {
          dataInicioISO = filtros.dataInicio;
        } else {
          const date = new Date(filtros.dataInicio);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          dataInicioISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }
        params = params.set('dataInicio', dataInicioISO);
      }
      if (filtros.dataFim) {
        let dataFimISO: string;
        if (typeof filtros.dataFim === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(filtros.dataFim)) {
          dataFimISO = filtros.dataFim;
        } else {
          const date = new Date(filtros.dataFim);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          dataFimISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }
        params = params.set('dataFim', dataFimISO);
      }
    }

    return this.http.get<PagedResponse<OcorrenciaResponse>>(this.apiUrl, { params });
  }

  /**
   * Busca uma ocorrência por ID
   */
  buscarPorId(id: string): Observable<OcorrenciaResponse> {
    return this.http.get<OcorrenciaResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria uma nova ocorrência
   */
  criar(ocorrencia: OcorrenciaRequest): Observable<OcorrenciaResponse> {
    return this.http.post<OcorrenciaResponse>(this.apiUrl, ocorrencia);
  }

  /**
   * Atualiza uma ocorrência existente
   */
  atualizar(id: string, ocorrencia: OcorrenciaRequest): Observable<OcorrenciaResponse> {
    return this.http.put<OcorrenciaResponse>(`${this.apiUrl}/${id}`, ocorrencia);
  }

  /**
   * Atualiza apenas o status de uma ocorrência (apenas ADMIN)
   */
  atualizarStatus(id: string, status: StatusOcorrencia): Observable<OcorrenciaResponse> {
    return this.http.patch<OcorrenciaResponse>(
      `${this.apiUrl}/${id}/status`,
      null,
      { params: { status } }
    );
  }

  /**
   * Remove uma ocorrência (apenas ADMIN)
   */
  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca ocorrências próximas a uma localização
   */
  buscarProximas(
    latitude: number,
    longitude: number,
    raioMetros?: number,
    tipoProblema?: TipoProblema,
    page: number = 0,
    size: number = 20
  ): Observable<PagedResponse<OcorrenciaResponse>> {
    let params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (raioMetros) {
      params = params.set('raioMetros', raioMetros.toString());
    }
    if (tipoProblema) {
      params = params.set('tipoProblema', tipoProblema);
    }

    return this.http.get<PagedResponse<OcorrenciaResponse>>(
      `${this.apiUrl}/proximas`,
      { params }
    );
  }

  /**
   * Busca ocorrências críticas (gravidade >= 8)
   */
  buscarCriticas(page: number = 0, size: number = 20): Observable<PagedResponse<OcorrenciaResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<OcorrenciaResponse>>(
      `${this.apiUrl}/criticas`,
      { params }
    );
  }

  /**
   * Método de compatibilidade: retorna lista simples de ocorrências
   * (mantido para compatibilidade com código existente)
   */
  getOcorrenciasData(): Observable<OcorrenciaResponse[]> {
    return this.listar(undefined, 0, 1000).pipe(
      map((pagedResponse) => pagedResponse.content as OcorrenciaResponse[])
    );
  }
}
