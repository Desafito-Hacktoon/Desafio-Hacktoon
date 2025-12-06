import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InsightService } from '../../services/insight.service';
import {
  InsightResponse,
  TipoInsight
} from '../../../models/insight.models';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-insights-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardIconComponent
  ],
  templateUrl: './insights-list.html',
  styleUrl: './insights-list.css'
})
export class InsightsListComponent implements OnInit {
  insights = signal<InsightResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  tipoSelecionado = signal<string>('');
  TipoInsight = TipoInsight;
  tiposInsight = Object.values(TipoInsight);

  constructor(
    private insightService: InsightService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Por padrão, não carregamos insights - eles são gerados sob demanda
  }

  getTipoInsightLabel(tipo: TipoInsight): string {
    const labels: Record<TipoInsight, string> = {
      [TipoInsight.AREA_CRITICA]: 'Área Crítica',
      [TipoInsight.TENDENCIA]: 'Tendência',
      [TipoInsight.PADRAO]: 'Padrão',
      [TipoInsight.PREDICAO]: 'Predição',
      [TipoInsight.EXPLICACAO]: 'Explicação',
      [TipoInsight.PERGUNTA_LIVRE]: 'Pergunta Livre'
    };
    return labels[tipo] || tipo;
  }

  navegarParaGerar(tipo: TipoInsight): void {
    this.router.navigate(['/insights-ia/gerar'], { 
      queryParams: { tipo: tipo } 
    });
  }

  onTipoChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.tipoSelecionado.set(newValue);
    if (newValue) {
      this.navegarParaGerar(newValue as TipoInsight);
    }
  }
}

