import {Component, OnInit, computed, signal} from '@angular/core';
import {DatePipe, NgClass, CommonModule} from '@angular/common';
import {DashboardService} from '../dashboardService/dashboard-service';
import {Ocorrencia} from '../../models/Ocorrencia';
import colors = require('tailwindcss/colors');
import {Piechart} from '../../models/piechart';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '@shared/components/table/table.component';
import {ZardPaginationComponent} from '@shared/components/pagination/pagination.component';
import {ZardInputDirective} from '@shared/components/input/input.directive';
import {ZardSelectComponent} from '@shared/components/select/select.component';
import {ZardSelectItemComponent} from '@shared/components/select/select-item.component';
import {ZardButtonComponent} from '@shared/components/button/button.component';
import {ZardCardComponent} from '@shared/components/card/card.component';
import {ZardPieChartComponent} from '@shared/components/chart/pie-chart.component';
import {ZardLineChartComponent, LineChartData} from '@shared/components/chart/line-chart.component';
import {ZardDatePickerComponent} from '@shared/components/date-picker/date-picker.component';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardPaginationComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardPieChartComponent,
    ZardLineChartComponent,
    ZardDatePickerComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  ocorrenciasOriginais = signal<Ocorrencia[]>([]);
  ocorrencias = signal<Ocorrencia[]>([]);
  currentPage = signal(1);
  itemsPerPage = signal(5);
  itemsPerPageOptions = [5, 10, 20, 50];
  
  // Filtros
  filtroBusca = signal('');
  filtroStatus = signal<string>('');
  filtroBairro = signal<string>('');
  filtroTipo = signal<string>('');
  
  pieData!: Piechart;
  pieOptions: any;

  pieData2!: Piechart;
  pieOptions2: any;

  pieData3!: Piechart;
  pieOptions3: any;
  
  // Gráfico de linha - Ocorrências por dia
  lineChartData!: LineChartData;
  lineChartOptions: any;
  
  // Filtros de período para o gráfico de linha
  dataInicio = signal<Date | null>(null);
  dataFim = signal<Date | null>(null);
  
  // Opções para os selects
  statusOptions = ['ABERTO', 'EM_ANDAMENTO', 'FECHADO'];
  bairrosOptions = computed(() => {
    const bairros = new Set(this.ocorrenciasOriginais().map(oc => oc.bairro));
    return Array.from(bairros).sort();
  });
  tiposOptions = computed(() => {
    const tipos = new Set(this.ocorrenciasOriginais().map(oc => oc.tipoProblema));
    return Array.from(tipos).sort();
  });

  // Métricas para os cards
  totalOcorrencias = computed(() => {
    return this.ocorrenciasOriginais().length;
  });

  ocorrenciasCriticas = computed(() => {
    return this.ocorrenciasOriginais().filter(oc => oc.gravidade >= 8).length;
  });

  ocorrenciasEmAndamento = computed(() => {
    return this.ocorrenciasOriginais().filter(oc => 
      oc.status === 'EM_ANDAMENTO' || oc.status === 'Em Andamento'
    ).length;
  });

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dashboardService.getDashboardData().subscribe(data => {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      const ocorrenciasFiltradas = data.filter((oc: Ocorrencia) => {
        const dataCriacao = new Date(oc.dataCriacao);
        return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual;
      });
      
      this.ocorrenciasOriginais.set(ocorrenciasFiltradas);
      
      // Inicializar período padrão (últimos 30 dias)
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      
      this.dataFim.set(dataFim);
      this.dataInicio.set(dataInicio);
      
      this.aplicarFiltros();
      this.atualizarGraficos();
    });
  }

  get ocorrenciasDoMes(): Ocorrencia[] {
    return this.ocorrencias();
  }

  aplicarFiltros() {
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    const busca = this.filtroBusca().toLowerCase().trim();
    if (busca) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => 
        oc.tipoProblema.toLowerCase().includes(busca) ||
        oc.descricao.toLowerCase().includes(busca) ||
        oc.bairro.toLowerCase().includes(busca) ||
        oc.endereco.toLowerCase().includes(busca) ||
        oc.secretariaOrigem.toLowerCase().includes(busca)
      );
    }
    
    if (this.filtroStatus()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.status === this.filtroStatus());
    }
    
    if (this.filtroBairro()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.bairro === this.filtroBairro());
    }
    
    if (this.filtroTipo()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.tipoProblema === this.filtroTipo());
    }
    
    this.ocorrencias.set(ocorrenciasFiltradas);
    this.currentPage.set(1);
    this.atualizarGraficos();
  }

  onStatusChange(value: string | string[]) {
    this.filtroStatus.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  onBairroChange(value: string | string[]) {
    this.filtroBairro.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  onTipoChange(value: string | string[]) {
    this.filtroTipo.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.filtroBusca.set('');
    this.filtroStatus.set('');
    this.filtroBairro.set('');
    this.filtroTipo.set('');
    this.aplicarFiltros();
  }

  paginatedOcorrencias = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.ocorrencias().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.ocorrencias().length / this.itemsPerPage());
  });

  paginationInfo = computed(() => {
    const total = this.ocorrencias().length;
    const start = total === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), total);
    return {
      start,
      end,
      total,
      currentPage: this.currentPage(),
      totalPages: this.totalPages(),
    };
  });

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onItemsPerPageChange(value: string | string[]) {
    const newValue = Array.isArray(value) ? parseInt(value[0]) : parseInt(value as string);
    if (!isNaN(newValue) && newValue > 0) {
      this.itemsPerPage.set(newValue);
      this.currentPage.set(1);
    }
  }

  navigateToDetail(id: string) {
    this.router.navigate(['/ocorrencias', id]);
  }

  atualizarGraficos() {
    const ocorrencias = this.ocorrencias();
    
    // Gráfico por tipo de problema
    const tipos = ocorrencias.reduce((acc, oc) => {
      acc[oc.tipoProblema] = (acc[oc.tipoProblema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData = this.gerarPieData(tipos, ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF']);
    this.pieOptions = this.gerarPieOptions();

    // Gráfico por bairro
    const bairros = ocorrencias.reduce((acc, oc) => {
      acc[oc.bairro] = (acc[oc.bairro] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData2 = this.gerarPieData(bairros,['#9C27B0', '#FF9800', '#03A9F4', '#8BC34A']);
    this.pieOptions2 = this.gerarPieOptions();

    // Gráfico por status
    const status = ocorrencias.reduce((acc, oc) => {
      acc[oc.status] = (acc[oc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData3 = this.gerarPieData(status, ['#009688', '#f44335', '#ffc107']);
    this.pieOptions3 = this.gerarPieOptions();
    
    this.atualizarGraficoLinha();
  }
  
  atualizarGraficoLinha() {
    const dataInicio = this.dataInicio();
    const dataFim = this.dataFim();
    
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    if (dataInicio) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => {
        const dataCriacao = new Date(oc.dataCriacao);
        return dataCriacao >= dataInicio;
      });
    }
    
    if (dataFim) {
      const fimComHora = new Date(dataFim);
      fimComHora.setHours(23, 59, 59, 999); // Incluir o dia inteiro
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => {
        const dataCriacao = new Date(oc.dataCriacao);
        return dataCriacao <= fimComHora;
      });
    }
    
    const ocorrenciasPorDia = ocorrenciasFiltradas.reduce((acc, oc) => {
      const dataCriacao = new Date(oc.dataCriacao);
      const dataFormatada = this.formatarData(dataCriacao);
      acc[dataFormatada] = (acc[dataFormatada] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const todasAsDatas: string[] = [];
    if (dataInicio && dataFim) {
      const dataAtual = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      while (dataAtual <= fim) {
        todasAsDatas.push(this.formatarData(new Date(dataAtual)));
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    } else {
      // Se não houver período definido, usar todas as datas das ocorrências
      const datasUnicas = Object.keys(ocorrenciasPorDia).sort();
      todasAsDatas.push(...datasUnicas);
    }
    
    const labels = todasAsDatas.map(data => {
      const [dia, mes, ano] = data.split('/');
      return `${dia}/${mes}`;
    });
    
    const dados = todasAsDatas.map(data => ocorrenciasPorDia[data] || 0);
    
    this.lineChartData = {
      labels,
      datasets: [
        {
          label: 'Ocorrências',
          data: dados,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
    
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context: any) => {
              const index = context[0].dataIndex;
              return todasAsDatas[index];
            },
            label: (context: any) => {
              return `${context.dataset.label}: ${context.parsed.y} ocorrência(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Data',
          },
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Quantidade de Ocorrências',
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0,
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
    };
  }
  
  formatarData(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  
  onPeriodoChange() {
    this.atualizarGraficoLinha();
  }
  
  onDataInicioChange(date: Date | null) {
    this.dataInicio.set(date);
    this.onPeriodoChange();
  }
  
  onDataFimChange(date: Date | null) {
    this.dataFim.set(date);
    this.onPeriodoChange();
  }

    private gerarPieData(obj: Record<string, number>, color:string[]):Piechart{
      return {
        labels: Object.keys(obj),
        datasets: [
          {
            data: Object.values(obj),
            backgroundColor: color
          }
        ]
      };
    }

  private gerarPieOptions() {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom', // posição da legenda: top, left, right, bottom
        },
      }
    };
  }
}


