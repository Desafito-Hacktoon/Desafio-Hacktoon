import { Routes } from '@angular/router';
import { LeafletMapComponent } from "./map/leaflet.map/leaflet.map";
import {Dashboard} from './dashboard/dashboard.component/dashboard';
import {Ocorrencias} from './ocorrencias/ocorrencias.component/ocorrencias';
import {OcorrenciaDetalhe} from './ocorrencia-detalhe/ocorrencia-detalhe';
import {Login} from "./auth/login/login";
import {Singup} from "./auth/singup/singup";
import {authGuard} from "./auth/guards/auth-guard";
import {RelatoriosListComponent} from './relatorios-ia/components/relatorios-list/relatorios-list';
import {RelatorioDetailComponent} from './relatorios-ia/components/relatorio-detail/relatorio-detail';
import {RelatorioGeneratorComponent} from './relatorios-ia/components/relatorio-generator/relatorio-generator';
import {InsightsListComponent} from './insights-ia/components/insights-list/insights-list';
import {InsightGeneratorComponent} from './insights-ia/components/insight-generator/insight-generator';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Singup },
    { path: 'mapa', component: LeafletMapComponent , canActivate: [authGuard] },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'ocorrencias', component: Ocorrencias, canActivate: [authGuard] },
    { path: 'ocorrencias/:id', component: OcorrenciaDetalhe, canActivate: [authGuard] },
    { path: 'relatorios-ia', component: RelatoriosListComponent, canActivate: [authGuard] },
    { path: 'relatorios-ia/gerar', component: RelatorioGeneratorComponent, canActivate: [authGuard] },
    { path: 'relatorios-ia/:id', component: RelatorioDetailComponent, canActivate: [authGuard] },
    { path: 'insights-ia', component: InsightsListComponent, canActivate: [authGuard] },
    { path: 'insights-ia/gerar', component: InsightGeneratorComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
