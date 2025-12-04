export enum TipoProblema {
  BURACO = 'BURACO',
  PAVIMENTACAO = 'PAVIMENTACAO',
  SINALIZACAO = 'SINALIZACAO',
  GUIA_SARJETA = 'GUIA_SARJETA',
  PONTE_VIADUTO = 'PONTE_VIADUTO',
  ILUMINACAO = 'ILUMINACAO',
  POSTE_CAIDO = 'POSTE_CAIDO',
  LAMPADA_QUEIMADA = 'LAMPADA_QUEIMADA',
  LIMPEZA = 'LIMPEZA',
  LIXO_ACUMULADO = 'LIXO_ACUMULADO',
  COLETA_LIXO = 'COLETA_LIXO',
  PODA_ARVORE = 'PODA_ARVORE',
  ARVORE_CAIDA = 'ARVORE_CAIDA',
  EROSÃO = 'EROSÃO',
  DENGUE = 'DENGUE',
  DRENAGEM = 'DRENAGEM',
  ALAGAMENTO = 'ALAGAMENTO',
  VAZAMENTO_AGUA = 'VAZAMENTO_AGUA',
  ESGOTO = 'ESGOTO',
  BOCA_LOBO = 'BOCA_LOBO',
  SAUDE = 'SAUDE',
  ANIMAIS_ABANDONADOS = 'ANIMAIS_ABANDONADOS',
  ANIMAIS_SOLTOS = 'ANIMAIS_SOLTOS',
  TRANSPORTE = 'TRANSPORTE',
  PARADA_ONIBUS = 'PARADA_ONIBUS',
  CICLOVIA = 'CICLOVIA',
  CALCADA = 'CALCADA',
  ACESSIBILIDADE = 'ACESSIBILIDADE',
  SEGURANCA = 'SEGURANCA',
  AREA_USO_DROGAS = 'AREA_USO_DROGAS',
  VANDALISMO = 'VANDALISMO',
  PARQUE = 'PARQUE',
  PLAYGROUND = 'PLAYGROUND',
  ACADEMIA_AR_LIVRE = 'ACADEMIA_AR_LIVRE',
  MOBILIARIO_URBANO = 'MOBILIARIO_URBANO',
  OUTROS = 'OUTROS'
}

export enum StatusOcorrencia {
  PENDENTE = 'PENDENTE',
  EM_AVALIACAO = 'EM_AVALIACAO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  PROBLEMA_IDENTIFICADO = 'PROBLEMA_IDENTIFICADO',
  RESOLVIDO = 'RESOLVIDO',
  CANCELADO = 'CANCELADO'
}

export interface OcorrenciaRequest {
  tipoProblema: TipoProblema;
  descricao?: string;
  bairro: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  gravidade: number;
  gravidadeIA?: number;
  status?: StatusOcorrencia;
  secretariaOrigem?: string;
  metadata?: Record<string, any>;
}

export interface OcorrenciaResponse {
  id: string;
  tipoProblema: TipoProblema;
  descricao?: string;
  bairro: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  gravidade: number;
  gravidadeIA?: number;
  status: StatusOcorrencia;
  secretariaOrigem?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  metadata?: Record<string, any>;
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

export interface OcorrenciaFilterRequest {
  tipoProblema?: TipoProblema;
  bairro?: string;
  status?: StatusOcorrencia;
  gravidadeMin?: number;
  gravidadeMax?: number;
  dataInicio?: string; // ISO string format
  dataFim?: string; // ISO string format
}


