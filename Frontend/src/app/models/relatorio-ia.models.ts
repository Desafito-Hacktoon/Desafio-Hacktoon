/**
 * Modelos TypeScript para Feature 1: Relatórios IA
 */

export enum TipoRelatorio {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
  CUSTOMIZADO = 'CUSTOMIZADO'
}

export enum StatusRelatorio {
  GERANDO = 'GERANDO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO'
}

export interface RelatorioRequest {
  tipoRelatorio: TipoRelatorio;
  periodoInicio: string; // ISO 8601 format
  periodoFim: string; // ISO 8601 format
  usuarioSolicitante?: string;
  filtros?: Record<string, any>;
}

export interface RelatorioResponse {
  id: string;
  tipoRelatorio: TipoRelatorio;
  periodoInicio: string;
  periodoFim: string;
  titulo: string;
  resumoExecutivo?: string;
  conteudoCompleto: RelatorioConteudo;
  metricasCalculadas?: MetricasAgregadas;
  areasCriticas?: AreaCritica[];
  recomendacoes?: Recomendacao[];
  filtrosAplicados?: Record<string, any>;
  modeloIAUsado?: string;
  status: StatusRelatorio;
  dataGeracao: string;
  dataConclusao?: string;
  tempoProcessamentoMs?: number;
  usuarioSolicitante?: string;
}

export interface RelatorioConteudo {
  resumoExecutivo?: string;
  principaisAchados?: string[];
  areasCriticas?: AreaCritica[];
  tendencias?: Tendencia;
  recomendacoes?: Recomendacao[];
  insights?: string[];
}

export interface AreaCritica {
  bairro: string;
  tipoProblema?: string;
  gravidadeMedia: number;
  totalOcorrencias: number;
  razao?: string;
}

export interface Tendencia {
  crescimento?: string;
  padroesTemporais?: string;
  correlacoes?: string;
}

export interface Recomendacao {
  prioridade: 'alta' | 'media' | 'baixa';
  acao: string;
  justificativa: string;
  impactoEsperado: string;
}

export interface MetricasAgregadas {
  totalOcorrencias: number;
  totalOcorrenciasPeriodoAnterior: number;
  variacaoPercentual?: number;
  gravidadeMedia?: number;
  gravidadeMaxima?: number;
  gravidadeMinima?: number;
  topBairrosCriticos?: BairroCritico[];
  distribuicaoPorTipo?: DistribuicaoTipo[];
  distribuicaoPorBairro?: DistribuicaoBairro[];
  distribuicaoGravidade?: Record<string, number>;
  padroesTemporais?: PadroesTemporais;
  correlacoes?: Record<string, any>;
  areasCriticas?: AreaCritica[];
}

export interface BairroCritico {
  bairro: string;
  total: number;
  gravidadeMedia: number;
  gravidadeMaxima: number;
}

export interface DistribuicaoTipo {
  tipoProblema: string;
  total: number;
  percentual: number;
}

export interface DistribuicaoBairro {
  bairro: string;
  total: number;
  percentual: number;
}

export interface PadroesTemporais {
  distribuicaoPorDiaSemana?: Record<string, number>;
  distribuicaoPorHora?: Record<string, number>;
  diaMaisCritico?: string;
  horaMaisCritica?: number;
}

export interface RelatorioFilterRequest {
  tipoRelatorio?: TipoRelatorio;
  status?: StatusRelatorio;
  dataInicio?: string;
  dataFim?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

