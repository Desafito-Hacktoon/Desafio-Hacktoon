import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Ocorrencia} from '../../models/Ocorrencia';

@Injectable({
  providedIn: 'root',
})
export class OcorreciasService {
  constructor(private http: HttpClient) {}

  getOcorrenciasData(): Observable<Ocorrencia[]> {
    return this.http.get<Ocorrencia[]>('mock-ocorrencias.json');
  }
}
