import { Routes } from '@angular/router';
import { LeafletMapComponent } from "./map/leaflet.map/leaflet.map";
import {Dashboard} from './dashboard/dashboard.component/dashboard';
import {Ocorrencias} from './ocorrencias/ocorrencias.component/ocorrencias';
import {OcorrenciaDetalhe} from './ocorrencia-detalhe/ocorrencia-detalhe';
export const routes: Routes = [
  {path: 'mapa', component: LeafletMapComponent},
  {path: 'dashboard', component: Dashboard},
  {path: 'ocorrencias', component: Ocorrencias},
  {path: 'ocorrencias/:id', component: OcorrenciaDetalhe},
  {path: '', redirectTo: '/mapa', pathMatch: 'full'},
];
