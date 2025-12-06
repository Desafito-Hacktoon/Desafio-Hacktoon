/**
 * Lista de bairros de Blumenau - SC
 * Fonte: https://www.blumenau.sc.gov.br/secretarias/secretaria-de-desenvolvimento-urbano/pagina/historia-sobre-municipio/divisa-administrativa-bairros
 * 
 * A área urbana de Blumenau é dividida em 35 bairros, incluindo 2 distritos.
 */

export const BAIRROS_BLUMENAU = [
  // Margem direita do rio Itajaí-Açu
  'Vorstadt',
  'Centro',
  'Ribeirão Fresco',
  'Garcia',
  'Da Glória',
  'Progresso',
  'Valparaíso',
  'Vila Formosa',
  'Jardim Blumenau',
  'Bom Retiro',
  'Velha',
  'Velha Central',
  'Velha Grande',
  'Passo Manso',
  'Salto Weissbach',
  'Do Salto',
  'Escola Agrícola',
  'Água Verde',
  'Vila Nova',
  'Itoupava Seca',
  'Victor Konder',
  'Boa Vista',
  
  // Margem esquerda do rio Itajaí-Açu
  'Ponta Aguda',
  'Nova Esperança',
  'Itoupava Norte',
  'Fortaleza',
  'Tribess',
  'Fortaleza Alta',
  'Fidélis',
  'Salto do Norte',
  'Badenfurt',
  'Testo Salto',
  'Itoupavazinha',
  'Itoupava Central',
  'Vila Itoupava'
] as const;

export type BairroBlumenau = typeof BAIRROS_BLUMENAU[number];

