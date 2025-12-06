import {Component, OnInit, computed, signal, inject, viewChild, TemplateRef} from '@angular/core';
import {DatePipe, NgClass, CommonModule} from '@angular/common';
import {DashboardService} from '../dashboardService/dashboard-service';
import {DashboardStatsResponse, PeriodoSelecionado} from '../../models/dashboard.models';
import {OcorrenciaFilterRequest, OcorrenciaResponse} from '../../models/ocorrencia.models';
import {OcorreciasService} from '../../ocorrencias/ocorrenciasService/ocorrecias-service';
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
import {ZardIconComponent} from '@shared/components/icon/icon.component';
import type {ZardIcon} from '@shared/components/icon/icons';
import {ZardSegmentedComponent} from '@shared/components/segmented/segmented.component';
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
    ZardIconComponent,
    ZardSegmentedComponent,
    ZardDatePickerComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  // Expor Math para uso no template
  Math = Math;
  
  ocorrenciasOriginais = signal<OcorrenciaResponse[]>([]);
  ocorrencias = signal<OcorrenciaResponse[]>([]);
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
  
  // Período selecionado para os cards e gráficos
  periodoSelecionado = signal<PeriodoSelecionado>('esse-mes');
  
  // Opções de período
  periodosOptions: { value: PeriodoSelecionado; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'essa-semana', label: 'Essa Semana' },
    { value: 'esse-mes', label: 'Esse Mês' }
  ];
  
  // Período de datas selecionado para período customizado
  periodoDataSelecionado = signal<Date[] | null>(null);
  
  // Label do período selecionado
  periodoSelecionadoLabel = computed(() => {
    // Se houver período customizado selecionado, mostrar as datas
    const periodoCustom = this.periodoDataSelecionado();
    if (periodoCustom && periodoCustom.length === 2) {
      const inicio = periodoCustom[0];
      const fim = periodoCustom[1];
      const inicioFormatado = this.formatarDataParaExibicao(inicio);
      const fimFormatado = this.formatarDataParaExibicao(fim);
      return `${inicioFormatado} - ${fimFormatado}`;
    }
    
    // Caso contrário, mostrar o label do período pré-definido
    const periodo = this.periodoSelecionado();
    const option = this.periodosOptions.find(p => p.value === periodo);
    return option?.label || 'Período';
  });
  
  /**
   * Formata uma data para exibição no formato dd/MM/yyyy
   */
  private formatarDataParaExibicao(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  
  // Opções para os selects - todos os status disponíveis do enum StatusOcorrencia
  statusOptions = [
    'PENDENTE',
    'EM_AVALIACAO',
    'EM_ANDAMENTO',
    'PROBLEMA_IDENTIFICADO',
    'RESOLVIDO',
    'CANCELADO'
  ];
  bairrosOptions = computed(() => {
    const bairros = new Set(this.ocorrenciasOriginais().map(oc => oc.bairro));
    return Array.from(bairros).sort();
  });
  tiposOptions = computed(() => {
    const tipos = new Set(this.ocorrenciasOriginais().map(oc => oc.tipoProblema));
    return Array.from(tipos).sort();
  });

  // Estatísticas do backend
  dashboardStats = signal<DashboardStatsResponse | null>(null);
  dashboardStatsAnterior = signal<DashboardStatsResponse | null>(null);
  isLoadingStats = signal(false);

  // Métricas para os cards (usando dados do backend quando disponível)
  totalOcorrencias = computed(() => {
    return this.dashboardStats()?.totalOcorrencias ?? this.ocorrenciasOriginais().length;
  });

  ocorrenciasCriticas = computed(() => {
    return this.dashboardStats()?.ocorrenciasCriticas ?? this.ocorrenciasOriginais().filter(oc => oc.gravidade >= 8).length;
  });

  ocorrenciasEmAndamento = computed(() => {
    return this.dashboardStats()?.ocorrenciasEmAndamento ?? this.ocorrenciasOriginais().filter(oc => 
      oc.status === 'EM_ANDAMENTO'
    ).length;
  });

  // Funções para calcular porcentagem de variação
  calcularVariacaoPercentual = (valorAtual: number, valorAnterior: number): number | null => {
    if (!valorAnterior || valorAnterior === 0) return null;
    const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    return Math.round(variacao * 10) / 10; // Arredondar para 1 casa decimal
  };

  variacaoTotalOcorrencias = computed(() => {
    const atual = this.totalOcorrencias();
    const anterior = this.dashboardStatsAnterior()?.totalOcorrencias ?? 0;
    return this.calcularVariacaoPercentual(atual, anterior);
  });

  variacaoOcorrenciasCriticas = computed(() => {
    const atual = this.ocorrenciasCriticas();
    const anterior = this.dashboardStatsAnterior()?.ocorrenciasCriticas ?? 0;
    return this.calcularVariacaoPercentual(atual, anterior);
  });

  variacaoOcorrenciasEmAndamento = computed(() => {
    const atual = this.ocorrenciasEmAndamento();
    const anterior = this.dashboardStatsAnterior()?.ocorrenciasEmAndamento ?? 0;
    return this.calcularVariacaoPercentual(atual, anterior);
  });

  constructor(
    private dashboardService: DashboardService,
    private ocorrenciasService: OcorreciasService,
    private router: Router
  ) {}

  ngOnInit() {
    // Carregar estatísticas do dashboard com período padrão (esse mês)
    this.carregarEstatisticas();

    // Carregar ocorrências do período selecionado
    this.carregarOcorrencias();
  }

  get ocorrenciasDoMes(): OcorrenciaResponse[] {
    return this.ocorrencias();
  }

  aplicarFiltros() {
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    const busca = this.filtroBusca().toLowerCase().trim();
    if (busca) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => 
        oc.tipoProblema.toLowerCase().includes(busca) ||
        (oc.descricao?.toLowerCase() || '').includes(busca) ||
        oc.bairro.toLowerCase().includes(busca) ||
        (oc.endereco?.toLowerCase() || '').includes(busca) ||
        (oc.secretariaOrigem?.toLowerCase() || '').includes(busca)
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

  private getPaletaCores(): string[] {
    return [
      '#E8523A', '#3A82E8', '#37C26C', '#C537E8', '#E8A237',
      '#2EC4B6', '#E83A78', '#4090D9', '#55C93E', '#D9733E',
      '#B24AD9', '#3EC9A5', '#C9C93E', '#E85E3A', '#3A6FE8',
      '#3AE85E', '#D93AB2', '#E89C3A', '#3AE8C2', '#E83A56',
      '#4A7FE0', '#66CF4C', '#D95C3A', '#AF3AE8', '#3AD9A1',
      '#C7D93A', '#E84A3A', '#3A5CE8', '#3AE84A', '#D93A98',
      '#E8903A', '#29BFAF', '#E83A43', '#4E8EE0', '#5CD953',
      '#D9853A', '#B23AE0', '#3AD9B8', '#D7D93A', '#E8733A',
      '#3A8BE8', '#3AE874', '#D93A6C', '#E8B33A', '#32C29F',
      '#E84F3A', '#5086DF', '#4CD96A', '#D95A3A', '#9E3AE0',
      '#3AD9C5', '#C2D93A', '#E87E3A', '#3A99E8', '#3AE88A',
      '#D93A59', '#E8C23A', '#25B8A3', '#E85A3A', '#4F8DE0',
      '#62D946', '#D96B3A', '#A83AE0', '#3AD9BB', '#D0D93A',
      '#E86A3A', '#3AAAE8', '#3AE8A1', '#D93A46', '#E8D03A',
      '#2EBF95', '#E8643A', '#477FE0', '#4CD987', '#D9713A',
      '#983AE0', '#3AD2D9', '#B7D93A', '#E87A3A', '#3AB7E8',
      '#3AE8B7', '#D93A3A', '#E8DD3A', '#2EBF7E', '#E85C3A',
      '#4A89E0', '#46D97A', '#D97D3A', '#8E3AE0', '#3AC7D9',
      '#A8D93A', '#E8883A', '#3AC4E8', '#3AE8C5', '#D9423A'
    ];
  }

  atualizarGraficos() {
    const ocorrencias = this.ocorrencias();
    const stats = this.dashboardStats();
    
    // Se temos estatísticas do backend, usar elas (mais eficiente)
    if (stats) {
      this.atualizarGraficosComStats(stats);
      // Ainda atualizar gráfico de linha com ocorrências filtradas
      this.atualizarGraficoLinha();
      return;
    }
    
    // Fallback: calcular a partir das ocorrências locais
    // Gráfico por tipo de problema
    const tipos = ocorrencias.reduce((acc, oc) => {
      acc[oc.tipoProblema] = (acc[oc.tipoProblema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paletaCores = this.getPaletaCores();

    this.pieData = this.gerarPieData(tipos, paletaCores);
    this.pieOptions = this.gerarPieOptions();

    // Gráfico por bairro
    const bairros = ocorrencias.reduce((acc, oc) => {
      acc[oc.bairro] = (acc[oc.bairro] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData2 = this.gerarPieData(bairros, paletaCores);
    this.pieOptions2 = this.gerarPieOptions();

    // Gráfico por status
    const status = ocorrencias.reduce((acc, oc) => {
      acc[oc.status] = (acc[oc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData3 = this.gerarPieData(status, paletaCores);
    this.pieOptions3 = this.gerarPieOptions();
    
    this.atualizarGraficoLinha();
  }

  private atualizarGraficosComStats(stats: DashboardStatsResponse) {
    const paletaCores = this.getPaletaCores();

    this.pieData = this.gerarPieData(stats.ocorrenciasPorTipo, paletaCores);
    this.pieOptions = this.gerarPieOptions();

    this.pieData2 = this.gerarPieData(stats.ocorrenciasPorBairro, paletaCores);
    this.pieOptions2 = this.gerarPieOptions();

    this.pieData3 = this.gerarPieData(stats.ocorrenciasPorStatus, paletaCores);
    this.pieOptions3 = this.gerarPieOptions();
  }
  
  atualizarGraficoLinha() {
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    const dataInicio = periodo.inicio;
    const dataFim = periodo.fim;
    
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => {
      const dataCriacao = new Date(oc.dataCriacao);
      return dataCriacao >= dataInicio && dataCriacao <= dataFim;
    });
    
    const ocorrenciasPorDia = ocorrenciasFiltradas.reduce((acc, oc) => {
      const dataCriacao = new Date(oc.dataCriacao);
      const dataFormatada = this.formatarData(dataCriacao);
      acc[dataFormatada] = (acc[dataFormatada] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Gerar todas as datas do período
    const todasAsDatas: string[] = [];
    const dataAtual = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    while (dataAtual <= fim) {
      todasAsDatas.push(this.formatarData(new Date(dataAtual)));
      dataAtual.setDate(dataAtual.getDate() + 1);
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
          borderColor: '#135ce4', // Azul do ícone do título
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(19, 92, 228, 0.3)'); // Azul mais escuro no topo
            gradient.addColorStop(1, 'rgba(19, 92, 228, 0.05)'); // Azul muito claro na parte inferior
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#135ce4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#0f4bc4',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
    
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Remover legenda como na imagem
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            title: (context: any) => {
              const index = context[0].dataIndex;
              return todasAsDatas[index];
            },
            label: (context: any) => {
              return `${context.parsed.y} ocorrência(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: false, // Remover título do eixo X
          },
          grid: {
            display: true,
            drawBorder: false,
            color: 'rgba(0, 0, 0, 0.05)',
            borderDash: [5, 5], // Linha pontilhada
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          display: true,
          title: {
            display: false, // Remover título do eixo Y
          },
          beginAtZero: true,
          grid: {
            display: true,
            drawBorder: false,
            color: 'rgba(0, 0, 0, 0.05)',
            borderDash: [5, 5], // Linha pontilhada
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
            },
            stepSize: undefined, // Deixar Chart.js calcular automaticamente
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

    private gerarPieData(obj: Record<string, number>, color:string[]):Piechart{
      const labels = Object.keys(obj);
      const data = Object.values(obj);
      
      // Criar uma paleta expandida ciclando através das cores disponíveis
      const backgroundColor = labels.map((_, index) => {
        return color[index % color.length];
      });
      
      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor
          }
        ]
      };
    }

  private gerarPieOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Remove a legenda
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxPadding: 6
        }
      }
    };
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado
   * Se houver um período customizado selecionado, usa ele em vez do período pré-definido
   * Retorna datas no timezone local, mas formatadas para UTC para evitar problemas
   */
  private calcularPeriodo(periodo: PeriodoSelecionado): { inicio: Date; fim: Date } {
    // Se houver período customizado selecionado, usar ele
    const periodoCustom = this.periodoDataSelecionado();
    if (periodoCustom && periodoCustom.length === 2) {
      const inicio = new Date(periodoCustom[0]);
      const fim = new Date(periodoCustom[1]);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }
    const agora = new Date();
    const inicio = new Date();
    const fim = new Date();
    
    // Resetar horas para início do dia
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    
    switch (periodo) {
      case 'hoje':
        // Já está configurado acima
        break;
        
      case 'ontem':
        inicio.setDate(inicio.getDate() - 1);
        fim.setDate(fim.getDate() - 1);
        break;
        
      case 'essa-semana':
        // Segunda-feira da semana atual
        const diaSemana = inicio.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
        const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
        inicio.setDate(inicio.getDate() + diasParaSegunda);
        break;
        
      case 'esse-mes':
        inicio.setDate(1); // Primeiro dia do mês
        break;
        
      case 'ultimos-90-dias':
        inicio.setDate(inicio.getDate() - 90);
        break;
        
      case 'ultimo-ano':
        inicio.setFullYear(inicio.getFullYear() - 1);
        inicio.setMonth(0, 1); // Janeiro do ano passado
        inicio.setDate(1);
        break;
    }
    
    return { inicio, fim };
  }

  /**
   * Formata uma data para o formato ISO 8601 esperado pelo Spring Boot
   * Formato: yyyy-MM-ddTHH:mm:ss
   * IMPORTANTE: Usa a HORA LOCAL do navegador.
   * Isso garante que se o usuário pede "Hoje a partir das 00:00", enviamos "00:00",
   * alinhando com o banco de dados que provavelmente armazena a data/hora local de criação.
   */
  private formatarDataParaAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Carrega ocorrências do período selecionado usando o endpoint de ocorrências com filtros
   */
  carregarOcorrencias() {
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    
    // Formatar datas no formato esperado pelo backend (sem timezone, usando horário local)
    const dataInicioFormatada = this.formatarDataParaAPI(periodo.inicio);
    const dataFimFormatada = this.formatarDataParaAPI(periodo.fim);
    
    // Usar o endpoint de ocorrências com filtros de data
    const filtros: OcorrenciaFilterRequest = {
      dataInicio: dataInicioFormatada,
      dataFim: dataFimFormatada
    };
    
    // Buscar todas as ocorrências do período (usando tamanho grande para pegar todas)
    this.ocorrenciasService.listar(filtros, 0, 1000, 'dataCriacao', 'DESC').subscribe({
      next: (response) => {
        this.ocorrenciasOriginais.set(response.content);
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar ocorrências:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url
        });
        // Limpar ocorrências em caso de erro
        this.ocorrenciasOriginais.set([]);
        this.ocorrencias.set([]);
      }
    });
  }

  /**
   * Calcula o período anterior baseado no período atual selecionado
   */
  private calcularPeriodoAnterior(periodo: PeriodoSelecionado): { inicio: Date; fim: Date } {
    // Se houver período customizado, calcular período anterior baseado nele
    const periodoCustom = this.periodoDataSelecionado();
    if (periodoCustom && periodoCustom.length === 2) {
      const periodoAtual = this.calcularPeriodo(periodo);
      const duracao = periodoAtual.fim.getTime() - periodoAtual.inicio.getTime();
      
      const inicioAnterior = new Date(periodoAtual.inicio);
      inicioAnterior.setTime(inicioAnterior.getTime() - duracao - 1);
      
      const fimAnterior = new Date(periodoAtual.inicio);
      fimAnterior.setTime(fimAnterior.getTime() - 1);
      
      inicioAnterior.setHours(0, 0, 0, 0);
      fimAnterior.setHours(23, 59, 59, 999);
      
      return { inicio: inicioAnterior, fim: fimAnterior };
    }
    
    const periodoAtual = this.calcularPeriodo(periodo);
    const duracao = periodoAtual.fim.getTime() - periodoAtual.inicio.getTime();
    
    const inicioAnterior = new Date(periodoAtual.inicio.getTime() - duracao - 1);
    const fimAnterior = new Date(periodoAtual.inicio.getTime() - 1);
    
    return { inicio: inicioAnterior, fim: fimAnterior };
  }

  /**
   * Carrega estatísticas do dashboard com o período selecionado
   */
  carregarEstatisticas() {
    this.isLoadingStats.set(true);
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    
    // Usar as datas formatadas para UTC (mesmo formato usado em carregarOcorrencias)
    const dataInicioFormatada = this.formatarDataParaAPI(periodo.inicio);
    const dataFimFormatada = this.formatarDataParaAPI(periodo.fim);

    // Buscar estatísticas do período atual
    this.dashboardService.getDashboardStats(dataInicioFormatada, dataFimFormatada).subscribe({
      next: (stats) => {
        this.dashboardStats.set(stats);
        this.isLoadingStats.set(false);
        // Atualizar gráficos com dados do backend
        this.atualizarGraficosComStats(stats);
        
        // Buscar estatísticas do período anterior para comparação
        this.carregarEstatisticasPeriodoAnterior();
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          error: error.error
        });
        this.isLoadingStats.set(false);
      }
    });
  }

  /**
   * Carrega estatísticas do período anterior para comparação
   */
  private carregarEstatisticasPeriodoAnterior() {
    const periodoAnterior = this.calcularPeriodoAnterior(this.periodoSelecionado());
    const dataInicioAnteriorFormatada = this.formatarDataParaAPI(periodoAnterior.inicio);
    const dataFimAnteriorFormatada = this.formatarDataParaAPI(periodoAnterior.fim);

    this.dashboardService.getDashboardStats(dataInicioAnteriorFormatada, dataFimAnteriorFormatada).subscribe({
      next: (stats) => {
        this.dashboardStatsAnterior.set(stats);
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas do período anterior:', error);
        // Não bloquear a UI se falhar ao carregar período anterior
      }
    });
  }

  /**
   * Handler para mudança de período
   */
  onPeriodoChange(value: string | string[]) {
    const periodo = Array.isArray(value) ? value[0] : value;
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Limpar período de datas quando mudar período pré-definido
    this.periodoDataSelecionado.set(null);
    // Recarregar tanto estatísticas quanto ocorrências
    this.carregarEstatisticas();
    this.carregarOcorrencias();
    // Atualizar gráfico de linha com o novo período
    this.atualizarGraficoLinha();
  }
  
  /**
   * Computed para o valor do segmented - retorna vazio se houver período customizado
   */
  periodoSegmentedValue = computed(() => {
    const periodoCustom = this.periodoDataSelecionado();
    // Se houver período customizado selecionado, não mostrar nenhum segmented selecionado
    if (periodoCustom && periodoCustom.length === 2) {
      return '';
    }
    return this.periodoSelecionado();
  });

  /**
   * Retorna a classe CSS apropriada para o badge de status (estilo minimalista com bordas e texto coloridos)
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'border border-blue-500 text-blue-600 bg-transparent';
      case 'CANCELADO':
        return 'border border-red-500 text-red-600 bg-transparent';
      case 'RESOLVIDO':
        return 'border border-green-500 text-green-600 bg-transparent';
      case 'PROBLEMA_IDENTIFICADO':
        return 'border border-orange-500 text-orange-600 bg-transparent';
      case 'PENDENTE':
        return 'border border-gray-500 text-gray-600 bg-transparent';
      case 'EM_AVALIACAO':
        return 'border border-yellow-500 text-yellow-600 bg-transparent';
      default:
        return 'border border-gray-500 text-gray-600 bg-transparent';
    }
  }

  /**
   * Retorna o ícone apropriado para cada status
   */
  getStatusIcon(status: string): ZardIcon {
    switch (status) {
      case 'PENDENTE':
        return 'clock';
      case 'EM_AVALIACAO':
        return 'clock';
      case 'EM_ANDAMENTO':
        return 'clock';
      case 'PROBLEMA_IDENTIFICADO':
        return 'circle-alert';
      case 'RESOLVIDO':
        return 'circle-check';
      case 'CANCELADO':
        return 'circle-x';
      default:
        return 'circle';
    }
  }

  /**
   * Formata o tipo de problema para exibição legível
   * Ex: BOCA_LOBO -> Boca de lobo
   */
  formatarTipoProblema(tipo: string): string {
    if (!tipo) return tipo;
    
    // Mapeamento de tipos específicos para textos mais legíveis
    const mapeamento: Record<string, string> = {
      'BOCA_LOBO': 'Boca de lobo',
      'GUIA_SARJETA': 'Guia ou sarjeta',
      'PONTE_VIADUTO': 'Ponte ou viaduto',
      'POSTE_CAIDO': 'Poste caído',
      'LAMPADA_QUEIMADA': 'Lâmpada queimada',
      'LIXO_ACUMULADO': 'Lixo acumulado',
      'COLETA_LIXO': 'Coleta de lixo',
      'PODA_ARVORE': 'Poda de árvore',
      'ARVORE_CAIDA': 'Árvore caída',
      'VAZAMENTO_AGUA': 'Vazamento de água',
      'ANIMAIS_ABANDONADOS': 'Animais abandonados',
      'ANIMAIS_SOLTOS': 'Animais soltos',
      'PARADA_ONIBUS': 'Parada de ônibus',
      'AREA_USO_DROGAS': 'Área de uso de drogas',
      'MOBILIARIO_URBANO': 'Mobiliário urbano',
      'ACADEMIA_AR_LIVRE': 'Academia ao ar livre',
    };

    // Se houver mapeamento específico, usar ele
    if (mapeamento[tipo]) {
      return mapeamento[tipo];
    }

    // Caso contrário, converter underscore para espaço e capitalizar
    return tipo
      .toLowerCase()
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  /**
   * Handler para mudança de período de datas customizado
   */
  onDataChange(dates: Date | Date[] | null) {
    if (dates === null) {
      this.periodoDataSelecionado.set(null);
      return;
    }
    
    const datesArray = Array.isArray(dates) ? dates : [dates];
    
    // Quando apenas uma data é selecionada, armazenar temporariamente
    if (datesArray.length === 1) {
      this.periodoDataSelecionado.set(datesArray);
      // Limpar seleção do segmented quando começar a selecionar data
      this.periodoSelecionado.set('esse-mes'); // Resetar para um valor padrão, mas não será exibido como selecionado
      return;
    }
    
    // Quando um período completo é selecionado (duas datas), recarregar dados
    if (datesArray.length === 2) {
      // Ordenar as datas para garantir que a primeira seja o início e a segunda o fim
      const sortedDates = [...datesArray].sort((a, b) => a.getTime() - b.getTime());
      this.periodoDataSelecionado.set(sortedDates);
      
      // Limpar seleção do segmented quando período customizado é selecionado
      this.periodoSelecionado.set('esse-mes'); // Resetar para um valor padrão, mas não será exibido como selecionado
      
      // Recarregar estatísticas e ocorrências com o período customizado
      this.carregarEstatisticas();
      this.carregarOcorrencias();
      this.atualizarGraficoLinha();
    }
  }
}


