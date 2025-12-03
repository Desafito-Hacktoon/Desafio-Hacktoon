export interface Ocorrencia {
  id: string;
  tipoProblema: string;
  descricao: string;
  bairro: string;
  endereco: string;
  latitude: number;
  longitude: number;
  gravidade: number;
  gravidadeIA: number;
  status: string;
  secretariaOrigem: string;
  dataCriacao: string;       // pode ser Date também, mas geralmente vem como string ISO
  dataAtualizacao: string;   // idem
  metadata: Record<string, any>;
}
