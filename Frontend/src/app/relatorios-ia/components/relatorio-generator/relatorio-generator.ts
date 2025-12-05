import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RelatorioIAService } from '../../services/relatorio-ia.service';
import {
  RelatorioRequest,
  TipoRelatorio
} from '../../../models/relatorio-ia.models';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-relatorio-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ZardCardComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardIconComponent
  ],
  templateUrl: './relatorio-generator.html',
  styleUrl: './relatorio-generator.css'
})
export class RelatorioGeneratorComponent implements OnInit {
  tipoRelatorio = signal<TipoRelatorio>(TipoRelatorio.CUSTOMIZADO);
  periodoInicio = signal<string>('');
  periodoFim = signal<string>('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  TipoRelatorio = TipoRelatorio;
  tiposRelatorio = Object.values(TipoRelatorio);

  constructor(
    private relatorioIAService: RelatorioIAService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    this.periodoInicio.set(this.formatarDataISO(inicioMes));
    this.periodoFim.set(this.formatarDataISO(fimMes));
  }

  selecionarTipoRapido(tipo: TipoRelatorio): void {
    this.tipoRelatorio.set(tipo);
    
    let request: RelatorioRequest;
    switch (tipo) {
      case TipoRelatorio.DIARIO:
        request = this.relatorioIAService.criarRequestDiario();
        break;
      case TipoRelatorio.SEMANAL:
        request = this.relatorioIAService.criarRequestSemanal();
        break;
      case TipoRelatorio.MENSAL:
        request = this.relatorioIAService.criarRequestMensal();
        break;
      default:
        return;
    }
    
    this.periodoInicio.set(request.periodoInicio);
    this.periodoFim.set(request.periodoFim);
  }

  gerarRelatorio(): void {
    const inicio = this.periodoInicio();
    const fim = this.periodoFim();
    
    if (!inicio || !fim) {
      this.error.set('Por favor, preencha o período de início e fim.');
      return;
    }

    if (new Date(inicio) >= new Date(fim)) {
      this.error.set('A data de início deve ser anterior à data de fim.');
      return;
    }

    const diasDiferenca = (new Date(fim).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24);
    if (diasDiferenca > 365) {
      this.error.set('O período não pode ser maior que 365 dias.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const request: RelatorioRequest = {
      tipoRelatorio: this.tipoRelatorio(),
      periodoInicio: inicio,
      periodoFim: fim
    };

    this.relatorioIAService.gerarRelatorio(request).subscribe({
      next: (relatorio) => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/relatorios-ia', relatorio.id]);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Erro ao gerar relatório. Tente novamente.');
        console.error('Erro ao gerar relatório:', err);
      }
    });
  }

  onTipoChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.tipoRelatorio.set(newValue as TipoRelatorio);
  }

  getTipoRelatorioLabel(tipo: TipoRelatorio): string {
    const labels: Record<TipoRelatorio, string> = {
      [TipoRelatorio.DIARIO]: 'Diário',
      [TipoRelatorio.SEMANAL]: 'Semanal',
      [TipoRelatorio.MENSAL]: 'Mensal',
      [TipoRelatorio.CUSTOMIZADO]: 'Customizado'
    };
    return labels[tipo] || tipo;
  }

  voltar(): void {
    this.router.navigate(['/relatorios-ia']);
  }

  formatarDataISO(data: Date): string {
    return data.toISOString().slice(0, 16);
  }
}

