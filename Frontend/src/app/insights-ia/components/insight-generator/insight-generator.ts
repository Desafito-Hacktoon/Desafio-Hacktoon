import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { InsightService } from '../../services/insight.service';
import {
  TipoInsight,
  InsightResponse,
  InsightAreaCriticaRequest,
  InsightTendenciaRequest,
  InsightPadraoRequest,
  InsightPredicaoRequest,
  InsightExplicacaoRequest,
  InsightPerguntaRequest
} from '../../../models/insight.models';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { BAIRROS_BLUMENAU } from '@shared/constants/bairros-blumenau';

@Component({
  selector: 'app-insight-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    JsonPipe,
    ZardCardComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardIconComponent
  ],
  templateUrl: './insight-generator.html',
  styleUrl: './insight-generator.css'
})
export class InsightGeneratorComponent implements OnInit {
  tipoInsight = signal<TipoInsight | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  insight = signal<InsightResponse | null>(null);

  areaCriticaForm = signal<InsightAreaCriticaRequest>({
    bairro: '',
    tipoProblema: '',
    periodo: '',
    periodoFim: ''
  });

  tendenciaForm = signal<InsightTendenciaRequest>({
    tipoProblema: '',
    periodo: '',
    periodoFim: '',
    bairro: ''
  });

  predicaoForm = signal<InsightPredicaoRequest>({
    horizonte: 30,
    area: ''
  });

  explicacaoForm = signal<InsightExplicacaoRequest>({
    pergunta: '',
    contexto: {}
  });

  perguntaForm = signal<InsightPerguntaRequest>({
    pergunta: '',
    contexto: {}
  });

  TipoInsight = TipoInsight;
  tiposInsight = Object.values(TipoInsight);
  bairros = BAIRROS_BLUMENAU;

  constructor(
    private insightService: InsightService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tipo = this.route.snapshot.queryParams['tipo'];
    if (tipo) {
      this.tipoInsight.set(tipo as TipoInsight);
      this.definirValoresPadrao();
    }
  }

  definirValoresPadrao(): void {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    const periodoInicio = this.insightService.formatarDataISO(inicioMes);
    const periodoFim = this.insightService.formatarDataISO(fimMes);

    this.areaCriticaForm.update(form => ({
      ...form,
      periodo: periodoInicio,
      periodoFim: periodoFim
    }));

    this.tendenciaForm.update(form => ({
      ...form,
      periodo: periodoInicio,
      periodoFim: periodoFim
    }));
  }

  gerarInsight(): void {
    const tipo = this.tipoInsight();
    if (!tipo) {
      this.error.set('Selecione um tipo de insight');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.insight.set(null);

    let request$: Observable<InsightResponse>;

    switch (tipo) {
      case TipoInsight.AREA_CRITICA:
        if (!this.areaCriticaForm().bairro) {
          this.error.set('Bairro é obrigatório');
          this.loading.set(false);
          return;
        }
        request$ = this.insightService.gerarInsightAreaCritica(this.areaCriticaForm());
        break;

      case TipoInsight.TENDENCIA:
        if (!this.tendenciaForm().tipoProblema) {
          this.error.set('Tipo de problema é obrigatório');
          this.loading.set(false);
          return;
        }
        request$ = this.insightService.gerarInsightTendencia(this.tendenciaForm());
        break;

      case TipoInsight.PADRAO:
        request$ = this.insightService.gerarInsightPadrao({});
        break;

      case TipoInsight.PREDICAO:
        if (!this.predicaoForm().horizonte || this.predicaoForm().horizonte <= 0) {
          this.error.set('Horizonte deve ser maior que 0');
          this.loading.set(false);
          return;
        }
        request$ = this.insightService.gerarInsightPredicao(this.predicaoForm());
        break;

      case TipoInsight.EXPLICACAO:
        request$ = this.insightService.gerarInsightExplicacao(this.explicacaoForm());
        break;

      case TipoInsight.PERGUNTA_LIVRE:
        if (!this.perguntaForm().pergunta) {
          this.error.set('Pergunta é obrigatória');
          this.loading.set(false);
          return;
        }
        request$ = this.insightService.responderPergunta(this.perguntaForm());
        break;

      default:
        this.error.set('Tipo de insight não suportado');
        this.loading.set(false);
        return;
    }

    request$.subscribe({
      next: (response) => {
        this.insight.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Erro ao gerar insight. Tente novamente.');
        this.loading.set(false);
        console.error('Erro ao gerar insight:', err);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/insights-ia']);
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

  getConfiancaClass(confianca?: number): string {
    if (!confianca) return 'bg-gray-100 text-gray-800';
    if (confianca >= 0.8) return 'bg-green-100 text-green-800';
    if (confianca >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  temDadosSuporte(dadosSuporte?: Record<string, any>): boolean {
    return dadosSuporte != null && Object.keys(dadosSuporte).length > 0;
  }

  atualizarAreaCriticaBairro(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.areaCriticaForm.update(f => ({ ...f, bairro: value }));
  }

  atualizarAreaCriticaTipoProblema(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.areaCriticaForm.update(f => ({ ...f, tipoProblema: value }));
  }

  atualizarAreaCriticaPeriodo(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.areaCriticaForm.update(f => ({ ...f, periodo: value }));
  }

  atualizarAreaCriticaPeriodoFim(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.areaCriticaForm.update(f => ({ ...f, periodoFim: value }));
  }

  atualizarTendenciaTipoProblema(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tendenciaForm.update(f => ({ ...f, tipoProblema: value }));
  }

  atualizarTendenciaBairro(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tendenciaForm.update(f => ({ ...f, bairro: value }));
  }

  onBairroAreaCriticaChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.areaCriticaForm.update(f => ({ ...f, bairro: newValue }));
  }

  onBairroTendenciaChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.tendenciaForm.update(f => ({ ...f, bairro: newValue || undefined }));
  }

  onBairroPredicaoChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.predicaoForm.update(f => ({ ...f, area: newValue || undefined }));
  }

  atualizarTendenciaPeriodo(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tendenciaForm.update(f => ({ ...f, periodo: value }));
  }

  atualizarTendenciaPeriodoFim(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tendenciaForm.update(f => ({ ...f, periodoFim: value }));
  }

  atualizarPredicaoHorizonte(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 30;
    this.predicaoForm.update(f => ({ ...f, horizonte: value }));
  }

  atualizarPredicaoArea(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.predicaoForm.update(f => ({ ...f, area: value }));
  }

  atualizarExplicacaoPergunta(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.explicacaoForm.update(f => ({ ...f, pergunta: value }));
  }

  atualizarPerguntaLivre(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.perguntaForm.update(f => ({ ...f, pergunta: value }));
  }

  onTipoInsightChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    if (newValue && Object.values(TipoInsight).includes(newValue as TipoInsight)) {
      this.tipoInsight.set(newValue as TipoInsight);
      this.definirValoresPadrao();
    }
  }
}

