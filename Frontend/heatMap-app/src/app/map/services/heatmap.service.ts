import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeatmapService {
  constructor(private http: HttpClient) {}

  getHeatmap(): Observable<any> {
    return this.http.get('mock-heatmap.json');
  }
}
