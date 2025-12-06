import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RelatorioIAService } from '../../services/relatorio-ia.service';
import {
  RelatorioResponse,
  TipoRelatorio,
  StatusRelatorio,
  AreaCritica,
  Recomendacao
} from '../../../models/relatorio-ia.models';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-relatorio-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, ZardCardComponent, ZardButtonComponent, ZardIconComponent],
  templateUrl: './relatorio-detail.html',
  styleUrl: './relatorio-detail.css'
})
export class RelatorioDetailComponent implements OnInit {
  relatorio = signal<RelatorioResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  TipoRelatorio = TipoRelatorio;
  StatusRelatorio = StatusRelatorio;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private relatorioIAService: RelatorioIAService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarRelatorio(id);
    } else {
      this.error.set('ID do relatório não fornecido');
    }
  }

  carregarRelatorio(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.relatorioIAService.buscarPorId(id).subscribe({
      next: (relatorio: RelatorioResponse) => {
        this.relatorio.set(relatorio);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar relatório. Tente novamente.');
        this.loading.set(false);
        console.error('Erro ao carregar relatório:', err);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/relatorios-ia']);
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleString('pt-BR');
  }

  getStatusBadgeClass(status: StatusRelatorio): string {
    switch (status) {
      case StatusRelatorio.CONCLUIDO:
        return 'bg-green-100 text-green-800';
      case StatusRelatorio.GERANDO:
        return 'bg-yellow-100 text-yellow-800';
      case StatusRelatorio.ERRO:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPrioridadeBadgeClass(prioridade: string): string {
    switch (prioridade.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
}

