/**
 * Modelos TypeScript para Insights IA
 */

export enum TipoInsight {
  AREA_CRITICA = 'AREA_CRITICA',
  TENDENCIA = 'TENDENCIA',
  PADRAO = 'PADRAO',
  PREDICAO = 'PREDICAO',
  EXPLICACAO = 'EXPLICACAO',
  PERGUNTA_LIVRE = 'PERGUNTA_LIVRE'
}

export interface InsightResponse {
  id: string;
  tipo: TipoInsight;
  insight: string;
  confianca?: number;
  relevancia?: number;
  dadosSuporte?: Record<string, any>;
  recomendacoes?: string[];
  dataGeracao: string;
  modeloIA?: string;
  doCache: boolean;
}

export interface InsightAreaCriticaRequest {
  bairro: string;
  tipoProblema?: string;
  periodo?: string;
  periodoFim?: string;
}

export interface InsightTendenciaRequest {
  tipoProblema: string;
  periodo?: string;
  periodoFim?: string;
  bairro?: string;
}

export interface InsightPadraoRequest {
  filtros?: Record<string, any>;
}

export interface InsightPredicaoRequest {
  horizonte: number;
  area?: string;
}

export interface InsightExplicacaoRequest {
  contexto?: Record<string, any>;
  pergunta?: string;
}

export interface InsightPerguntaRequest {
  pergunta: string;
  contexto?: Record<string, any>;
}

