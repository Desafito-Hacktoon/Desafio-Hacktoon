export interface DashboardStatsResponse {
  totalOcorrencias: number;
  ocorrenciasCriticas: number;
  ocorrenciasEmAndamento: number;
  ocorrenciasPendentes: number;
  ocorrenciasResolvidas: number;
  ocorrenciasPorTipo: Record<string, number>;
  ocorrenciasPorBairro: Record<string, number>;
  ocorrenciasPorStatus: Record<string, number>;
  gravidadeMedia: number;
  ocorrenciasDoMes: number;
  periodoInicio?: string;
  periodoFim?: string;
}

export type PeriodoSelecionado = 'hoje' | 'ontem' | 'essa-semana' | 'esse-mes' | 'ultimos-90-dias' | 'ultimo-ano';


