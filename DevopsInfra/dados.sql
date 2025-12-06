-- ============================================================================
-- Script SQL para PostgreSQL com PostGIS
-- Criação do schema e dados de teste para Blumenau, SC
-- Este script popula o banco de dados com dados de teste
-- Executado automaticamente na inicialização do sistema
-- ============================================================================

-- Garantir que PostGIS está habilitado
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Garantir que pgcrypto está habilitado (necessário para função digest)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CRIAÇÃO DAS TABELAS (se não existirem)
-- ============================================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabela de ocorrências
CREATE TABLE IF NOT EXISTS ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_problema VARCHAR(50) NOT NULL,
    descricao TEXT,
    bairro VARCHAR(100) NOT NULL,
    endereco TEXT,
    coordenadas geometry(Point, 4326) NOT NULL,
    gravidade INTEGER NOT NULL CHECK (gravidade >= 1 AND gravidade <= 10),
    gravidade_ia INTEGER CHECK (gravidade_ia IS NULL OR (gravidade_ia >= 1 AND gravidade_ia <= 10)),
    status VARCHAR(25) NOT NULL DEFAULT 'PENDENTE',
    secretaria_origem VARCHAR(50),
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de relatórios IA
CREATE TABLE IF NOT EXISTS relatorios_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_relatorio VARCHAR(50) NOT NULL,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fim TIMESTAMP NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    resumo_executivo TEXT,
    conteudo_completo JSONB NOT NULL DEFAULT '{}'::jsonb,
    metricas_calculadas JSONB,
    areas_criticas JSONB,
    recomendacoes JSONB,
    filtros_aplicados JSONB,
    modelo_ia_usado VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'GERANDO',
    data_geracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP,
    tempo_processamento_ms INTEGER,
    usuario_solicitante VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de análises histórico
CREATE TABLE IF NOT EXISTS analises_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_analise VARCHAR(50) NOT NULL,
    entrada_dados JSONB NOT NULL DEFAULT '{}'::jsonb,
    saida_ia JSONB NOT NULL DEFAULT '{}'::jsonb,
    prompt_usado TEXT,
    modelo_ia_usado VARCHAR(50),
    tempo_resposta_ms INTEGER,
    tokens_usados INTEGER,
    custo_estimado NUMERIC(10,6),
    sucesso BOOLEAN NOT NULL DEFAULT true,
    erro_mensagem TEXT,
    data_execucao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de insights cache
CREATE TABLE IF NOT EXISTS insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_insight VARCHAR(50) NOT NULL,
    contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
    insight_texto TEXT NOT NULL,
    dados_suporte JSONB,
    confianca NUMERIC(3,2),
    relevancia INTEGER,
    modelo_ia_usado VARCHAR(50),
    data_geracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP,
    hash_contexto VARCHAR(64) NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para ocorrências
CREATE INDEX IF NOT EXISTS idx_ocorrencias_coordenadas ON ocorrencias USING GIST (coordenadas);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_bairro ON ocorrencias (bairro);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_tipo ON ocorrencias (tipo_problema);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_gravidade ON ocorrencias (gravidade);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias (status);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data_criacao ON ocorrencias (data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status_gravidade ON ocorrencias (status, gravidade DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_metadata ON ocorrencias USING GIN (metadata);

-- Índices para relatórios IA
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios_ia (tipo_relatorio);
CREATE INDEX IF NOT EXISTS idx_relatorios_periodo ON relatorios_ia (periodo_inicio, periodo_fim);
CREATE INDEX IF NOT EXISTS idx_relatorios_status ON relatorios_ia (status);
CREATE INDEX IF NOT EXISTS idx_relatorios_data_geracao ON relatorios_ia (data_geracao);

-- Índices para análises histórico
CREATE INDEX IF NOT EXISTS idx_analises_tipo ON analises_historico (tipo_analise);
CREATE INDEX IF NOT EXISTS idx_analises_data ON analises_historico (data_execucao);
CREATE INDEX IF NOT EXISTS idx_analises_sucesso ON analises_historico (sucesso);

-- Índices para insights cache
CREATE INDEX IF NOT EXISTS idx_insights_tipo ON insights_cache (tipo_insight);
CREATE INDEX IF NOT EXISTS idx_insights_hash ON insights_cache (hash_contexto);
CREATE INDEX IF NOT EXISTS idx_insights_expiracao ON insights_cache (data_expiracao);
CREATE INDEX IF NOT EXISTS idx_insights_relevancia ON insights_cache (relevancia);

-- ============================================================================
-- LIMPEZA DE DADOS EXISTENTES (para permitir re-execução)
-- ============================================================================

-- Limpar dados existentes mantendo estrutura
TRUNCATE TABLE insights_cache CASCADE;
TRUNCATE TABLE analises_historico CASCADE;
TRUNCATE TABLE relatorios_ia CASCADE;
TRUNCATE TABLE ocorrencias CASCADE;
DELETE FROM users WHERE email != 'admin@mapblu.com';

-- ============================================================================
-- CRIAÇÃO DO USUÁRIO ADMINISTRADOR
-- ============================================================================

-- Hash BCrypt para senha "admin123456" com strength 12
-- IMPORTANTE: Este hash foi gerado com BCryptPasswordEncoder(12).encode("admin123456")
-- 
-- Para regenerar o hash se necessário, use uma das opções:
-- 1. Java: new BCryptPasswordEncoder(12).encode("admin123456")
-- 2. Online: https://bcrypt-generator.com/ (rounds: 12, password: admin123456)
-- 3. Python: bcrypt.hashpw(b'admin123456', bcrypt.gensalt(rounds=12)).decode('utf-8')
-- 4. Veja o arquivo docs/gerar-hash-admin.md para mais detalhes
--
-- Hash válido para "admin123456" (strength 12) - 60 caracteres:
-- NOTA: Se este hash não funcionar, gere um novo usando uma das opções acima

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA GERAÇÃO DE DADOS ALEATÓRIOS
-- ============================================================================

-- Função para gerar coordenadas aleatórias em Blumenau
CREATE OR REPLACE FUNCTION random_coord_blumenau() RETURNS geometry AS $$
BEGIN
    RETURN ST_SetSRID(ST_MakePoint(
        -49.0661 + (random() * 0.1 - 0.05),  -- Longitude: -49.0661 ± 0.05
        -26.9194 + (random() * 0.1 - 0.05)   -- Latitude: -26.9194 ± 0.05
    ), 4326);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar coordenadas reais baseadas no bairro de Blumenau
CREATE OR REPLACE FUNCTION coord_por_bairro(nome_bairro TEXT) RETURNS geometry AS $$
DECLARE
    lon_centro NUMERIC;
    lat_centro NUMERIC;
    variacao NUMERIC := 0.008; -- ~900m de variação
BEGIN
    -- Coordenadas reais aproximadas dos principais bairros de Blumenau
    CASE nome_bairro
        WHEN 'Centro' THEN
            lon_centro := -49.0661;
            lat_centro := -26.9194;
        WHEN 'Velha' THEN
            lon_centro := -49.0712;
            lat_centro := -26.9087;
        WHEN 'Garcia' THEN
            lon_centro := -49.0815;
            lat_centro := -26.9123;
        WHEN 'Itoupava Seca' THEN
            lon_centro := -49.0523;
            lat_centro := -26.8956;
        WHEN 'Itoupava Central' THEN
            lon_centro := -49.0456;
            lat_centro := -26.8845;
        WHEN 'Itoupava Norte' THEN
            lon_centro := -49.0812;
            lat_centro := -26.8923;
        WHEN 'Vila Nova' THEN
            lon_centro := -49.0745;
            lat_centro := -26.9012;
        WHEN 'Ponta Aguda' THEN
            lon_centro := -49.0634;
            lat_centro := -26.9287;
        WHEN 'Água Verde' THEN
            lon_centro := -49.0589;
            lat_centro := -26.9167;
        WHEN 'Progresso' THEN
            lon_centro := -49.0512;
            lat_centro := -26.9078;
        WHEN 'Bom Retiro' THEN
            lon_centro := -49.0389;
            lat_centro := -26.8923;
        WHEN 'Glória' THEN
            lon_centro := -49.0756;
            lat_centro := -26.9198;
        WHEN 'Fortaleza' THEN
            lon_centro := -49.0923;
            lat_centro := -26.9345;
        WHEN 'Salto Weissbach' THEN
            lon_centro := -49.0891;
            lat_centro := -26.9456;
        WHEN 'Fidélis' THEN
            lon_centro := -49.0567;
            lat_centro := -26.9012;
        WHEN 'Valparaíso' THEN
            lon_centro := -49.0345;
            lat_centro := -26.8689;
        WHEN 'Testo Salto' THEN
            lon_centro := -49.0678;
            lat_centro := -26.8876;
        WHEN 'Vila Formosa' THEN
            lon_centro := -49.0712;
            lat_centro := -26.9134;
        WHEN 'Badenfurt' THEN
            lon_centro := -49.0489;
            lat_centro := -26.9234;
        WHEN 'Jardim Blumenau' THEN
            lon_centro := -49.0598;
            lat_centro := -26.9089;
        WHEN 'Escola Agrícola' THEN
            lon_centro := -49.0434;
            lat_centro := -26.8798;
        WHEN 'Tribess' THEN
            lon_centro := -49.0521;
            lat_centro := -26.8945;
        WHEN 'Vila Itoupava' THEN
            lon_centro := -49.0423;
            lat_centro := -26.8765;
        WHEN 'Vorstadt' THEN
            lon_centro := -49.0512;
            lat_centro := -26.9189;
        WHEN 'Victor Konder' THEN
            lon_centro := -49.0723;
            lat_centro := -26.9012;
        WHEN 'Itoupavazinha' THEN
            lon_centro := -49.1012;
            lat_centro := -26.8345;
        WHEN 'Salto do Norte' THEN
            lon_centro := -49.1123;
            lat_centro := -26.8432;
        WHEN 'Velha Central' THEN
            lon_centro := -49.1234;
            lat_centro := -26.9123;
        WHEN 'Passo Manso' THEN
            lon_centro := -49.1345;
            lat_centro := -26.9012;
        ELSE
            -- Bairro não mapeado, usar coordenadas do centro com maior variação
            lon_centro := -49.0661;
            lat_centro := -26.9194;
            variacao := 0.12;
    END CASE;
    
    -- Retornar coordenada com pequena variação aleatória dentro do bairro
    RETURN ST_SetSRID(ST_MakePoint(
        lon_centro + (random() * variacao * 2 - variacao),
        lat_centro + (random() * variacao * 2 - variacao)
    ), 4326);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar coordenadas agrupadas (clusters) para mapa de calor
CREATE OR REPLACE FUNCTION random_coord_cluster(centro_lon NUMERIC, centro_lat NUMERIC, raio NUMERIC) RETURNS geometry AS $$
DECLARE
    angulo NUMERIC;
    distancia NUMERIC;
    lon_offset NUMERIC;
    lat_offset NUMERIC;
BEGIN
    -- Gerar ângulo aleatório (0 a 2π)
    angulo := random() * 2 * pi();
    -- Gerar distância aleatória dentro do raio (distribuição uniforme)
    distancia := random() * raio;
    -- Calcular offset em graus (aproximadamente 111km por grau)
    lon_offset := distancia * cos(angulo) / 111.0;
    lat_offset := distancia * sin(angulo) / 111.0;
    
    RETURN ST_SetSRID(ST_MakePoint(
        centro_lon + lon_offset,
        centro_lat + lat_offset
    ), 4326);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar data aleatória entre duas datas
CREATE OR REPLACE FUNCTION random_date(start_date TIMESTAMP, end_date TIMESTAMP) RETURNS TIMESTAMP AS $$
BEGIN
    RETURN start_date + (random() * (end_date - start_date));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO PARA GERAR DESCRIÇÕES DETALHADAS DE OCORRÊNCIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_descricao_detalhada(tipo_problema TEXT, bairro_nome TEXT, gravidade_val INTEGER) RETURNS TEXT AS $$
    DECLARE
        descricao_detalhada TEXT;
        dimensoes TEXT;
        situacao TEXT;
        impacto TEXT;
        detalhes_tecnicos TEXT;
    BEGIN
        -- Gerar dimensões aleatórias
        dimensoes := CASE 
            WHEN random() < 0.3 THEN 'aproximadamente ' || (50 + floor(random() * 200))::TEXT || 'cm de diâmetro'
            WHEN random() < 0.6 THEN 'cerca de ' || (1 + floor(random() * 5))::TEXT || ' metros de extensão'
            WHEN random() < 0.8 THEN 'área de aproximadamente ' || (5 + floor(random() * 50))::TEXT || ' metros quadrados'
            ELSE 'dimensões variadas'
        END;
        
        -- Situação específica
        situacao := CASE 
            WHEN random() < 0.3 THEN 'após período de chuvas intensas'
            WHEN random() < 0.5 THEN 'devido ao desgaste natural'
            WHEN random() < 0.7 THEN 'provavelmente causado por ação de terceiros'
            WHEN random() < 0.85 THEN 'agravado pelas condições climáticas'
            ELSE 'identificado durante vistoria de rotina'
        END;
        
        -- Impacto
        impacto := CASE 
            WHEN gravidade_val >= 8 THEN 'representa risco imediato à segurança pública e requer intervenção urgente'
            WHEN gravidade_val >= 6 THEN 'afeta significativamente o tráfego e a segurança dos moradores'
            WHEN gravidade_val >= 4 THEN 'causa transtornos aos pedestres e veículos da região'
            ELSE 'requer atenção para evitar agravamento da situação'
        END;
        
        -- Descrições específicas por tipo
        CASE tipo_problema
            WHEN 'BURACO' THEN
                descricao_detalhada := 'Buraco de ' || dimensoes || ' identificado na via pública do bairro ' || bairro_nome || 
                    '. O problema foi ' || situacao || ' e ' || impacto || 
                    '. A profundidade estimada é de ' || (10 + floor(random() * 40))::TEXT || 'cm, expondo a base da pavimentação. ' ||
                    'Há risco de danos a veículos, especialmente motocicletas. Múltiplos moradores relataram o problema. ' ||
                    'Recomenda-se sinalização temporária até a correção definitiva.';
                    
            WHEN 'ILUMINACAO' THEN
                descricao_detalhada := 'Problema de iluminação pública identificado no bairro ' || bairro_nome || 
                    '. Trecho de aproximadamente ' || (50 + floor(random() * 300))::TEXT || ' metros sem iluminação adequada. ' ||
                    'Foram identificadas ' || (1 + floor(random() * 8))::TEXT || ' lâmpadas queimadas ou com funcionamento intermitente. ' ||
                    situacao || '. ' || impacto || 
                    '. A área escura representa risco à segurança dos pedestres, especialmente no período noturno. ' ||
                    'Moradores relatam aumento de sensação de insegurança e ocorrências de furtos na região.';
                    
            WHEN 'LIXO_ACUMULADO' THEN
                descricao_detalhada := 'Acúmulo significativo de lixo em área pública do bairro ' || bairro_nome || 
                    '. Volume estimado de aproximadamente ' || (5 + floor(random() * 30))::TEXT || ' metros cúbicos de resíduos. ' ||
                    'O material inclui ' || CASE WHEN random() < 0.5 THEN 'lixo doméstico, entulho de construção' ELSE 'móveis velhos, eletrônicos descartados' END ||
                    ' e outros resíduos. ' || situacao || '. ' || impacto || 
                    '. O acúmulo atrai animais e pode servir como criadouro de mosquitos, representando risco à saúde pública. ' ||
                    'Odor forte incomoda moradores próximos. Necessária remoção imediata e identificação dos responsáveis.';
                    
            WHEN 'SINALIZACAO' THEN
                descricao_detalhada := 'Problema na sinalização de trânsito no bairro ' || bairro_nome || 
                    '. Identificadas ' || (1 + floor(random() * 5))::TEXT || ' placas com problemas: ' ||
                    CASE WHEN random() < 0.3 THEN 'derrubadas ou inclinadas'
                         WHEN random() < 0.6 THEN 'desgastadas e ilegíveis'
                         ELSE 'ausentes ou danificadas'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A falta de sinalização adequada aumenta o risco de acidentes de trânsito, especialmente em cruzamentos. ' ||
                    'Pedestres e motoristas enfrentam dificuldades de orientação. Urgente restauração da sinalização.';
                    
            WHEN 'DENGUE' THEN
                descricao_detalhada := 'Possível foco de dengue identificado no bairro ' || bairro_nome || 
                    '. Foram encontrados ' || (1 + floor(random() * 10))::TEXT || ' recipientes com água parada servindo como criadouros de mosquitos Aedes aegypti. ' ||
                    'Os focos incluem ' || CASE WHEN random() < 0.3 THEN 'pneus abandonados'
                                                 WHEN random() < 0.6 THEN 'vasos de plantas e garrafas'
                                                 ELSE 'calhas entupidas e lajes'
                                            END || '. ' || impacto || 
                    '. Área com histórico de casos de dengue. Necessária ação imediata da equipe de controle de endemias. ' ||
                    'Recomenda-se aplicação de larvicida e orientação aos moradores sobre prevenção. Risco de propagação da doença.';
                    
            WHEN 'CALCADA' THEN
                descricao_detalhada := 'Problemas na calçada do bairro ' || bairro_nome || 
                    '. Trecho de aproximadamente ' || (10 + floor(random() * 100))::TEXT || ' metros com ' ||
                    CASE WHEN random() < 0.3 THEN 'blocos soltos e desnivelados'
                         WHEN random() < 0.6 THEN 'buracos e rachaduras profundas'
                         ELSE 'ausência de calçada ou calçada completamente destruída'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A situação compromete a acessibilidade, especialmente para cadeirantes, idosos e pessoas com mobilidade reduzida. ' ||
                    'Pedestres são forçados a caminhar na rua, aumentando o risco de acidentes. Necessária reconstrução ou reparo urgente.';
                    
            WHEN 'BOCA_LOBO' THEN
                descricao_detalhada := 'Boca de lobo (bueiro) com problemas no bairro ' || bairro_nome || 
                    '. Identificado ' || CASE WHEN random() < 0.4 THEN 'entupimento total'
                                              WHEN random() < 0.7 THEN 'tampa quebrada ou ausente'
                                              ELSE 'desnivelamento e má instalação'
                                         END || '. ' || situacao || '. ' || impacto || 
                    '. O problema impede o escoamento adequado da água da chuva, causando alagamentos e formação de poças. ' ||
                    'Em dias de chuva, a água transborda para a via, aumentando o risco de acidentes. ' ||
                    'Material acumulado inclui folhas, lixo e terra. Necessária limpeza e manutenção imediata.';
                    
            WHEN 'PODA_ARVORE' THEN
                descricao_detalhada := 'Necessidade de poda de árvore no bairro ' || bairro_nome || 
                    '. Árvore de aproximadamente ' || (5 + floor(random() * 15))::TEXT || ' metros de altura com ' ||
                    CASE WHEN random() < 0.4 THEN 'galhos muito próximos à fiação elétrica'
                         WHEN random() < 0.7 THEN 'galhos baixos obstruindo passagem de veículos e pedestres'
                         ELSE 'galhos secos e com risco de queda'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. Os galhos representam risco de curto-circuito e interrupção do fornecimento de energia. ' ||
                    'Em caso de ventos fortes ou tempestades, há risco de queda de galhos causando danos materiais e pessoais. ' ||
                    'Poda preventiva urgente recomendada pela equipe técnica.';
                    
            WHEN 'VAZAMENTO_AGUA' THEN
                descricao_detalhada := 'Vazamento de água identificado no bairro ' || bairro_nome || 
                    '. Vazamento de ' || CASE WHEN random() < 0.3 THEN 'grande proporção'
                                             WHEN random() < 0.7 THEN 'média intensidade'
                                             ELSE 'pequeno mas constante'
                                        END || ' na ' ||
                    CASE WHEN random() < 0.5 THEN 'rede de distribuição principal'
                         ELSE 'calçada ou via pública'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. Água jorrando ou escorrendo pela via, causando desperdício e formação de poças. ' ||
                    'O vazamento pode estar causando deslocamento de solo e risco de desabamento de calçada. ' ||
                    'Moradores relatam possível aumento na conta de água. Equipe da SAMAE deve ser acionada imediatamente.';
                    
            WHEN 'VANDALISMO' THEN
                descricao_detalhada := 'Ato de vandalismo identificado no bairro ' || bairro_nome || 
                    '. Foram identificados ' || CASE WHEN random() < 0.4 THEN 'pichações em muros e fachadas'
                                                     WHEN random() < 0.7 THEN 'danos ao mobiliário urbano'
                                                     ELSE 'destruição de equipamentos públicos'
                                                END || '. ' || situacao || '. ' || impacto || 
                    '. O vandalismo degrada o ambiente urbano e causa prejuízos ao patrimônio público. ' ||
                    'Área afetada de aproximadamente ' || (2 + floor(random() * 20))::TEXT || ' metros quadrados. ' ||
                    'Necessária limpeza, reparo ou substituição dos equipamentos danificados. Recomenda-se aumento da fiscalização.';
                    
            WHEN 'ESGOTO' THEN
                descricao_detalhada := 'Problema com esgoto no bairro ' || bairro_nome || 
                    '. Identificado ' || CASE WHEN random() < 0.4 THEN 'vazamento de esgoto na via pública'
                                              WHEN random() < 0.7 THEN 'esgoto a céu aberto'
                                              ELSE 'transbordamento de esgoto'
                                         END || '. ' || situacao || '. ' || impacto || 
                    '. Odor forte e insuportável incomoda moradores e transeuntes. Risco de contaminação do solo e água. ' ||
                    'O problema representa grave risco à saúde pública, podendo causar doenças. ' ||
                    'Água servida escorre pela rua, criando ambiente insalubre. Ação imediata da SAMAE necessária.';
                    
            WHEN 'LAMPADA_QUEIMADA' THEN
                descricao_detalhada := 'Lâmpada de iluminação pública queimada no bairro ' || bairro_nome || 
                    '. Poste localizado em área de ' || CASE WHEN random() < 0.4 THEN 'alto movimento de pedestres'
                                                             WHEN random() < 0.7 THEN 'residencial'
                                                             ELSE 'comercial'
                                                        END || 
                    ' sem iluminação há aproximadamente ' || (1 + floor(random() * 30))::TEXT || ' dias. ' || impacto || 
                    '. A falta de iluminação aumenta a sensação de insegurança e o risco de acidentes e crimes. ' ||
                    'Moradores evitam circular pela área no período noturno. Substituição urgente da lâmpada necessária.';
                    
            WHEN 'GUIA_SARJETA' THEN
                descricao_detalhada := 'Problemas na guia e sarjeta do bairro ' || bairro_nome || 
                    '. Trecho de aproximadamente ' || (5 + floor(random() * 50))::TEXT || ' metros com ' ||
                    CASE WHEN random() < 0.4 THEN 'guia quebrada e pedaços soltos'
                         WHEN random() < 0.7 THEN 'sarjeta entupida impedindo escoamento'
                         ELSE 'guia e sarjeta completamente destruídas'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A água da chuva não escoa adequadamente, formando poças e causando alagamentos. ' ||
                    'Pedaços soltos representam risco de acidentes para veículos e pedestres. Necessária reconstrução ou reparo.';
                    
            WHEN 'PARADA_ONIBUS' THEN
                descricao_detalhada := 'Problema na parada de ônibus do bairro ' || bairro_nome || 
                    '. Parada com ' || CASE WHEN random() < 0.3 THEN 'vidro quebrado e estrutura danificada'
                                            WHEN random() < 0.6 THEN 'ausência de cobertura'
                                            ELSE 'banco quebrado e falta de informação'
                                       END || '. ' || situacao || '. ' || impacto || 
                    '. Passageiros ficam expostos às intempéries e sem informações sobre horários de ônibus. ' ||
                    'Aproximadamente ' || (20 + floor(random() * 80))::TEXT || ' usuários são afetados diariamente. ' ||
                    'Necessária manutenção ou substituição da estrutura para garantir conforto e segurança dos passageiros.';
                    
            WHEN 'MOBILIARIO_URBANO' THEN
                descricao_detalhada := 'Problema no mobiliário urbano do bairro ' || bairro_nome || 
                    '. Identificado ' || CASE WHEN random() < 0.3 THEN 'banco público quebrado'
                                              WHEN random() < 0.6 THEN 'lixeira pública danificada'
                                              ELSE 'equipamento de exercício com defeito'
                                         END || ' no ' ||
                    CASE WHEN random() < 0.5 THEN 'parque público'
                         ELSE 'praça ou área de lazer'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. O equipamento danificado não pode ser utilizado e representa risco de ferimentos. ' ||
                    'A falta de manutenção degrada o ambiente público e reduz a qualidade de vida dos moradores. ' ||
                    'Necessária reparação ou substituição do mobiliário.';
                    
            WHEN 'ARVORE_CAIDA' THEN
                descricao_detalhada := 'Árvore caída no bairro ' || bairro_nome || 
                    '. Árvore de aproximadamente ' || (8 + floor(random() * 12))::TEXT || ' metros de altura ' ||
                    CASE WHEN random() < 0.4 THEN 'caída sobre a via, bloqueando completamente o tráfego'
                         WHEN random() < 0.7 THEN 'caída sobre fiação elétrica, representando risco de incêndio'
                         ELSE 'com galhos grandes caídos na calçada e via'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A árvore caída impede a passagem de veículos e pedestres. ' ||
                    'Se sobre fiação, há risco de curto-circuito e incêndio. ' ||
                    'Remoção urgente necessária pela equipe especializada. Via pode precisar ser interditada temporariamente.';
                    
            WHEN 'PAVIMENTACAO' THEN
                descricao_detalhada := 'Problemas na pavimentação do bairro ' || bairro_nome || 
                    '. Trecho de aproximadamente ' || (50 + floor(random() * 200))::TEXT || ' metros com ' ||
                    CASE WHEN random() < 0.3 THEN 'asfalto completamente destruído'
                         WHEN random() < 0.6 THEN 'múltiplos buracos e rachaduras'
                         ELSE 'pavimentação em mau estado de conservação'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A via está praticamente intransitável, causando danos aos veículos e desconforto aos motoristas. ' ||
                    'Múltiplos acidentes já foram reportados na região. Necessário recapeamento ou reconstrução completa da via.';
                    
            WHEN 'DRENAGEM' THEN
                descricao_detalhada := 'Problema no sistema de drenagem do bairro ' || bairro_nome || 
                    '. Sistema de drenagem ' || CASE WHEN random() < 0.4 THEN 'completamente entupido'
                                                     WHEN random() < 0.7 THEN 'com capacidade reduzida'
                                                     ELSE 'inexistente ou inadequado'
                                                END || '. ' || situacao || '. ' || impacto || 
                    '. A água da chuva não escoa adequadamente, causando alagamentos frequentes. ' ||
                    'Em dias de chuva forte, a água invade calçadas e pode entrar em residências. ' ||
                    'Necessária limpeza, desobstrução ou instalação de sistema de drenagem adequado.';
                    
            WHEN 'ALAGAMENTO' THEN
                descricao_detalhada := 'Alagamento identificado no bairro ' || bairro_nome || 
                    '. Área de aproximadamente ' || (100 + floor(random() * 500))::TEXT || ' metros quadrados alagada. ' ||
                    'Nível de água de aproximadamente ' || (20 + floor(random() * 80))::TEXT || ' centímetros. ' ||
                    situacao || '. ' || impacto || 
                    '. O alagamento impede a circulação de veículos e pedestres. ' ||
                    CASE WHEN random() < 0.5 THEN (1 + floor(random() * 10))::TEXT || ' residências foram afetadas pela água.'
                         ELSE (1 + floor(random() * 5))::TEXT || ' veículos ficaram presos na água.'
                    END ||
                    ' Bombeiros foram acionados. Necessária ação imediata da Defesa Civil.';
                    
            WHEN 'EROSÃO' THEN
                descricao_detalhada := 'Processo de erosão identificado no bairro ' || bairro_nome || 
                    '. Área de aproximadamente ' || (50 + floor(random() * 500))::TEXT || ' metros quadrados afetada. ' ||
                    CASE WHEN random() < 0.5 THEN 'Deslizamento de terra em área residencial.'
                         ELSE 'Erosão em encosta próxima a via pública.'
                    END || ' ' || situacao || '. ' || impacto || 
                    '. ' || CASE WHEN random() < 0.5 THEN (1 + floor(random() * 5))::TEXT || ' residências estão em risco.'
                                  ELSE 'Via pública está comprometida.'
                             END ||
                    ' Risco de desabamento e perda de vidas. Evacuação pode ser necessária. ' ||
                    'Monitoramento 24 horas recomendado. Ação imediata da Defesa Civil e Geologia.';
                    
            WHEN 'POSTE_CAIDO' THEN
                descricao_detalhada := 'Poste de iluminação caído no bairro ' || bairro_nome || 
                    '. Poste de aproximadamente ' || (8 + floor(random() * 4))::TEXT || ' metros ' ||
                    CASE WHEN random() < 0.5 THEN 'caído sobre a via, bloqueando completamente o tráfego'
                         ELSE 'inclinado com risco iminente de queda'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. Cabos elétricos expostos representam risco grave de eletrocussão. ' ||
                    'Via interditada para segurança. Energia elétrica pode ter sido cortada na região. ' ||
                    'Equipe de emergência da CELESC deve ser acionada imediatamente. Risco de incêndio.';
                    
            WHEN 'PONTE_VIADUTO' THEN
                descricao_detalhada := 'Problema estrutural em ponte/viaduto no bairro ' || bairro_nome || 
                    '. Identificadas ' || CASE WHEN random() < 0.4 THEN 'rachaduras estruturais visíveis'
                                               WHEN random() < 0.7 THEN 'corrosão em elementos estruturais'
                                               ELSE 'afundamento ou deslocamento de estrutura'
                                          END || '. ' || situacao || '. ' || impacto || 
                    '. A estrutura apresenta sinais de comprometimento que podem levar ao colapso. ' ||
                    'Risco extremo em caso de enchente ou sobrecarga. Inspeção técnica urgente por engenheiro estrutural. ' ||
                    'Pode ser necessário interdição parcial ou total até avaliação completa.';
                    
            WHEN 'CICLOVIA' THEN
                descricao_detalhada := 'Problema na ciclovia do bairro ' || bairro_nome || 
                    '. Trecho de aproximadamente ' || (20 + floor(random() * 150))::TEXT || ' metros com ' ||
                    CASE WHEN random() < 0.4 THEN 'buracos e rachaduras'
                         WHEN random() < 0.7 THEN 'desníveis perigosos'
                         ELSE 'pavimentação completamente destruída'
                    END || '. ' || situacao || '. ' || impacto || 
                    '. A ciclovia está perigosa para uso, representando risco de acidentes para ciclistas. ' ||
                    'Múltiplos ciclistas relataram quedas e danos às bicicletas. ' ||
                    'Necessária manutenção urgente para garantir segurança dos usuários.';
                    
            WHEN 'ACESSIBILIDADE' THEN
                descricao_detalhada := 'Problema de acessibilidade no bairro ' || bairro_nome || 
                    '. Identificada ' || CASE WHEN random() < 0.4 THEN 'ausência de rampa de acesso'
                                              WHEN random() < 0.7 THEN 'rampa quebrada ou inadequada'
                                              ELSE 'calçada completamente inacessível'
                                         END || '. ' || impacto || 
                    '. O local é inacessível para cadeirantes, pessoas com mobilidade reduzida e carrinhos de bebê. ' ||
                    'Violação da legislação de acessibilidade. Necessária instalação ou correção de rampa de acesso ' ||
                    'seguindo normas técnicas. Garantir acesso universal é obrigatório.';
                    
            WHEN 'ANIMAIS_ABANDONADOS' THEN
                descricao_detalhada := 'Animais abandonados identificados no bairro ' || bairro_nome || 
                    '. Foram avistados ' || (1 + floor(random() * 5))::TEXT || ' ' ||
                    CASE WHEN random() < 0.6 THEN 'cães'
                         ELSE 'gatos'
                    END || ' abandonados na via pública. ' || impacto || 
                    '. Os animais estão ' || CASE WHEN random() < 0.5 THEN 'agressivos e representam risco de mordidas'
                                                   ELSE 'desnutridos e precisam de cuidados veterinários'
                                              END || '. ' ||
                    'Risco de acidentes de trânsito e transmissão de doenças. ' ||
                    'Necessário resgate e encaminhamento para abrigo ou adoção responsável.';
                    
            WHEN 'COLETA_LIXO' THEN
                descricao_detalhada := 'Problema na coleta de lixo do bairro ' || bairro_nome || 
                    '. Coleta de lixo não realizada há ' || (1 + floor(random() * 14))::TEXT || ' dias. ' ||
                    'Lixo acumulado em volume de aproximadamente ' || (10 + floor(random() * 50))::TEXT || ' metros cúbicos. ' ||
                    impacto || '. O acúmulo de lixo atrai animais, causa mau cheiro e representa risco à saúde pública. ' ||
                    'Moradores relatam aumento de insetos e roedores. Necessária coleta imediata e regularização do serviço.';
                    
            WHEN 'LIMPEZA' THEN
                descricao_detalhada := 'Necessidade de limpeza urbana no bairro ' || bairro_nome || 
                    '. Área de aproximadamente ' || (50 + floor(random() * 300))::TEXT || ' metros quadrados com ' ||
                    CASE WHEN random() < 0.5 THEN 'lixo espalhado após coleta'
                         ELSE 'folhas e detritos acumulados'
                    END || '. ' || impacto || 
                    '. A falta de limpeza degrada o ambiente urbano e causa transtornos aos moradores. ' ||
                    'Necessária varrição e limpeza da área para manter a qualidade de vida no bairro.';
                    
            WHEN 'PARQUE' THEN
                descricao_detalhada := 'Problema no parque público do bairro ' || bairro_nome || 
                    '. Identificados problemas como ' || CASE WHEN random() < 0.3 THEN 'bancos quebrados e equipamentos danificados'
                                                             WHEN random() < 0.6 THEN 'pista de caminhada com buracos'
                                                             ELSE 'iluminação inadequada e falta de manutenção'
                                                        END || '. ' || impacto || 
                    '. O parque não oferece condições adequadas de uso e lazer para a comunidade. ' ||
                    'Equipamentos quebrados representam risco de acidentes. Necessária manutenção e revitalização do espaço público.';
                    
            ELSE
                descricao_detalhada := 'Problema identificado no bairro ' || bairro_nome || 
                    '. ' || situacao || '. ' || impacto || 
                    '. Situação que requer atenção das autoridades competentes para resolução adequada.';
        END CASE;
        
        RETURN descricao_detalhada;
    END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DADOS DE TESTE - OCORRÊNCIAS
-- Período: Janeiro 2024 até 6 de Dezembro 2025
-- Coordenadas aproximadas de Blumenau: -26.9194, -49.0661
-- ============================================================================

DO $$
DECLARE
    tipos_problema TEXT[] := ARRAY[
        'BURACO', 'ILUMINACAO', 'LIXO_ACUMULADO', 'SINALIZACAO', 'DENGUE',
        'CALCADA', 'BOCA_LOBO', 'PODA_ARVORE', 'VAZAMENTO_AGUA', 'VANDALISMO',
        'ESGOTO', 'LAMPADA_QUEIMADA', 'GUIA_SARJETA', 'PARADA_ONIBUS',
        'MOBILIARIO_URBANO', 'ARVORE_CAIDA', 'PAVIMENTACAO', 'DRENAGEM',
        'ALAGAMENTO', 'EROSÃO', 'POSTE_CAIDO', 'PONTE_VIADUTO', 'CICLOVIA',
        'ACESSIBILIDADE', 'ANIMAIS_ABANDONADOS', 'COLETA_LIXO', 'LIMPEZA', 'PARQUE'
    ];
    
    bairros TEXT[] := ARRAY[
        'Centro', 'Velha', 'Garcia', 'Itoupava Seca', 'Itoupava Central',
        'Itoupava Norte', 'Vila Nova', 'Ponta Aguda', 'Água Verde', 'Progresso',
        'Bom Retiro', 'Glória', 'Fortaleza', 'Salto Weissbach', 'Fidélis',
        'Valparaíso', 'Testo Salto', 'Vila Formosa', 'Badenfurt', 'Jardim Blumenau',
        'Escola Agrícola', 'Tribess', 'Vila Itoupava', 'Vorstadt', 'Victor Konder',
        'Itoupavazinha', 'Salto do Norte', 'Velha Central', 'Passo Manso'
    ];
    
    status_vals TEXT[] := ARRAY['PENDENTE', 'EM_AVALIACAO', 'EM_ANDAMENTO', 'PROBLEMA_IDENTIFICADO', 'RESOLVIDO', 'CANCELADO'];
    
    secretarias TEXT[] := ARRAY[
        'Secretaria de Obras', 'Secretaria de Meio Ambiente', 'Secretaria de Trânsito',
        'Secretaria de Saúde', 'SAMAE', 'CELESC', 'Defesa Civil', 'Guarda Municipal',
        'Secretaria de Transportes', 'Secretaria de Planejamento', 'Secretaria de Esportes'
    ];
    
    data_inicio TIMESTAMP := '2024-01-01 00:00:00';
    data_fim TIMESTAMP := '2025-12-06 23:59:59';
    i INTEGER;
    total_ocorrencias INTEGER := 2500; -- Total de ocorrências a gerar (aumentado para distribuição melhor)
    tipo TEXT;
    bairro TEXT;
    status_val TEXT;
    secretaria TEXT;
    descricao TEXT;
    gravidade INTEGER;
    gravidade_ia INTEGER;
    endereco TEXT;
    coord geometry;
    data_criacao TIMESTAMP;
    data_atualizacao TIMESTAMP;
    metadata_json JSONB;
BEGIN
    -- Gerar ocorrências aleatórias com distribuição uniforme mas com variação natural
    FOR i IN 1..total_ocorrencias LOOP
        -- Selecionar valores aleatórios
        tipo := tipos_problema[1 + floor(random() * array_length(tipos_problema, 1))::INTEGER];
        bairro := bairros[1 + floor(random() * array_length(bairros, 1))::INTEGER];
        status_val := status_vals[1 + floor(random() * array_length(status_vals, 1))::INTEGER];
        secretaria := secretarias[1 + floor(random() * array_length(secretarias, 1))::INTEGER];
        
        -- Gerar gravidade primeiro para usar na descrição
        gravidade := CASE 
            WHEN random() < 0.1 THEN 9 + floor(random() * 2)::INTEGER  -- 10% críticas (9-10)
            WHEN random() < 0.3 THEN 7 + floor(random() * 2)::INTEGER  -- 20% altas (7-8)
            WHEN random() < 0.6 THEN 5 + floor(random() * 2)::INTEGER  -- 30% médias (5-6)
            WHEN random() < 0.85 THEN 3 + floor(random() * 2)::INTEGER -- 25% baixas (3-4)
            ELSE 1 + floor(random() * 2)::INTEGER                      -- 15% muito baixas (1-2)
        END;
        
        -- Gerar descrição detalhada baseada no tipo usando a função
        descricao := gerar_descricao_detalhada(tipo, bairro, gravidade);
        
        -- Gravidade IA (pode ser NULL ou próxima da gravidade manual)
        gravidade_ia := CASE 
            WHEN random() < 0.1 THEN NULL
            ELSE gravidade + floor((random() - 0.5) * 2)::INTEGER
        END;
        IF gravidade_ia IS NOT NULL THEN
            gravidade_ia := GREATEST(1, LEAST(10, gravidade_ia));
        END IF;
        
        -- Gerar data aleatória no período com distribuição uniforme
        -- Evitar concentração em dezembro: se for dezembro 2025, reduzir probabilidade
        IF random() < 0.95 THEN
            -- 95% das ocorrências distribuídas uniformemente até novembro 2025
            data_criacao := data_inicio + (random() * (TIMESTAMP '2025-11-30 23:59:59' - data_inicio));
        ELSE
            -- 5% das ocorrências em dezembro (para não concentrar)
            data_criacao := TIMESTAMP '2025-12-01 00:00:00' + (random() * (data_fim - TIMESTAMP '2025-12-01 00:00:00'));
        END IF;
        
        -- Data de atualização (70% das vezes após criação)
        data_atualizacao := CASE 
            WHEN random() < 0.7 THEN data_criacao + (random() * INTERVAL '30 days')
            ELSE NULL
        END;
        
        -- Endereço aleatório
        endereco := 'Rua ' || bairro || ', ' || (100 + floor(random() * 2000))::TEXT;
        
        -- Coordenadas reais baseadas no bairro
        coord := coord_por_bairro(bairro);
        
        -- Metadata JSONB
        metadata_json := jsonb_build_object(
            'reclamacoes', floor(random() * 20)::INTEGER,
            'fotos', floor(random() * 10)::INTEGER,
            'prioridade', CASE WHEN gravidade >= 8 THEN 'alta' WHEN gravidade >= 5 THEN 'media' ELSE 'baixa' END,
            'area_afetada_m2', floor(random() * 500)::INTEGER,
            'risco_imediato', gravidade >= 8,
            'monitoramento', gravidade >= 7
        );
        
        -- Inserir ocorrência
        INSERT INTO ocorrencias (
            id, tipo_problema, descricao, bairro, endereco, coordenadas,
            gravidade, gravidade_ia, status, secretaria_origem,
            data_criacao, data_atualizacao, metadata
        ) VALUES (
            gen_random_uuid(), tipo, descricao, bairro, endereco, coord,
            gravidade, gravidade_ia, status_val, secretaria,
            data_criacao, data_atualizacao, metadata_json
        );
        
        -- Log progresso a cada 100 registros
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Inseridas % ocorrências...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de % ocorrências inseridas', total_ocorrencias;
END $$;

-- ============================================================================
-- OCORRÊNCIAS ADICIONAIS PARA DEZEMBRO 2025 - MAPA DE CALOR
-- Gerando clusters de ocorrências próximas para visualização de calor
-- ============================================================================

DO $$
DECLARE
    tipos_problema TEXT[] := ARRAY[
        'BURACO', 'ILUMINACAO', 'LIXO_ACUMULADO', 'SINALIZACAO', 'DENGUE',
        'CALCADA', 'BOCA_LOBO', 'PODA_ARVORE', 'VAZAMENTO_AGUA', 'VANDALISMO',
        'ESGOTO', 'LAMPADA_QUEIMADA', 'GUIA_SARJETA', 'PARADA_ONIBUS',
        'MOBILIARIO_URBANO', 'ARVORE_CAIDA', 'PAVIMENTACAO', 'DRENAGEM',
        'ALAGAMENTO', 'EROSÃO', 'POSTE_CAIDO', 'PONTE_VIADUTO', 'CICLOVIA',
        'ACESSIBILIDADE', 'ANIMAIS_ABANDONADOS', 'COLETA_LIXO', 'LIMPEZA', 'PARQUE'
    ];
    
    bairros TEXT[] := ARRAY[
        'Centro', 'Velha', 'Garcia', 'Itoupava Seca', 'Itoupava Central',
        'Itoupava Norte', 'Vila Nova', 'Ponta Aguda', 'Água Verde', 'Progresso',
        'Bom Retiro', 'Glória', 'Fortaleza', 'Salto Weissbach', 'Fidélis',
        'Valparaíso', 'Testo Salto', 'Vila Formosa', 'Badenfurt', 'Jardim Blumenau',
        'Escola Agrícola', 'Tribess', 'Vila Itoupava', 'Vorstadt', 'Victor Konder',
        'Itoupavazinha', 'Salto do Norte', 'Velha Central', 'Passo Manso'
    ];
    
    status_vals TEXT[] := ARRAY['PENDENTE', 'EM_AVALIACAO', 'EM_ANDAMENTO', 'PROBLEMA_IDENTIFICADO', 'RESOLVIDO', 'CANCELADO'];
    
    secretarias TEXT[] := ARRAY[
        'Secretaria de Obras', 'Secretaria de Meio Ambiente', 'Secretaria de Trânsito',
        'Secretaria de Saúde', 'SAMAE', 'CELESC', 'Defesa Civil', 'Guarda Municipal',
        'Secretaria de Transportes', 'Secretaria de Planejamento', 'Secretaria de Esportes'
    ];
    
    -- Centros de clusters para mapa de calor (coordenadas reais dos bairros de Blumenau)
    -- Estrutura: longitude, latitude, nome_bairro, raio_km
    cluster_lons NUMERIC[] := ARRAY[-49.0661, -49.0712, -49.0815, -49.0523, -49.0456, -49.0745, -49.0634, -49.0589];
    cluster_lats NUMERIC[] := ARRAY[-26.9194, -26.9087, -26.9123, -26.8956, -26.8845, -26.9012, -26.9287, -26.9167];
    cluster_bairros TEXT[] := ARRAY['Centro', 'Velha', 'Garcia', 'Itoupava Seca', 'Itoupava Central', 'Vila Nova', 'Ponta Aguda', 'Água Verde'];
    cluster_raios NUMERIC[] := ARRAY[0.015, 0.012, 0.014, 0.010, 0.012, 0.012, 0.010, 0.012]; -- raios aumentados para dispersão (~1.0-1.5km)
    
    data_inicio_dez TIMESTAMP := '2025-12-01 00:00:00';
    data_fim_dez TIMESTAMP := '2025-12-06 23:59:59';
    total_ocorrencias_dez INTEGER := 120; -- 120 ocorrências adicionais em dezembro (reduzido para uniformidade)
    ocorrencias_por_dia INTEGER; -- Variável por dia (varia para criar gráfico com subidas e descidas)
    
    i INTEGER;
    j INTEGER;
    tipo TEXT;
    bairro TEXT;
    status_val TEXT;
    secretaria TEXT;
    descricao TEXT;
    gravidade INTEGER;
    gravidade_ia INTEGER;
    endereco TEXT;
    coord geometry;
    data_criacao TIMESTAMP;
    data_atualizacao TIMESTAMP;
    metadata_json JSONB;
    cluster_idx INTEGER;
    dia_atual DATE;
    hora_aleatoria INTEGER;
    dia_num INTEGER;
BEGIN
    RAISE NOTICE 'Gerando % ocorrências adicionais para dezembro 2025 (mapa de calor)...', total_ocorrencias_dez;
    
    -- Gerar ocorrências distribuídas pelos 6 dias de dezembro (1 a 6)
    -- Criar variação intencional para gráfico de linha com subidas e descidas
    -- Padrão: dias alternados com mais e menos ocorrências
    FOR dia_num IN 1..6 LOOP
        dia_atual := ('2025-12-01'::DATE + (dia_num - 1) * INTERVAL '1 day')::DATE;
        
        -- Variar quantidade de ocorrências por dia criando padrão de subida/descida
        -- Dias ímpares: mais ocorrências (15-25), dias pares: menos ocorrências (10-20)
        IF dia_num % 2 = 1 THEN
            ocorrencias_por_dia := 15 + floor(random() * 11)::INTEGER; -- 15-25 ocorrências
        ELSE
            ocorrencias_por_dia := 10 + floor(random() * 11)::INTEGER; -- 10-20 ocorrências
        END IF;
        
        -- Gerar múltiplas ocorrências por dia, mais dispersas
        FOR i IN 1..ocorrencias_por_dia LOOP
            -- 60% das ocorrências em clusters, 40% completamente aleatórias para dispersão
            IF random() < 0.6 THEN
                -- Selecionar um cluster aleatório
                cluster_idx := 1 + floor(random() * array_length(cluster_lons, 1))::INTEGER;
                bairro := cluster_bairros[cluster_idx];
            ELSE
                -- Ocorrência completamente aleatória (dispersa)
                cluster_idx := NULL;
                bairro := bairros[1 + floor(random() * array_length(bairros, 1))::INTEGER];
            END IF;
            
            -- Selecionar valores aleatórios
            tipo := tipos_problema[1 + floor(random() * array_length(tipos_problema, 1))::INTEGER];
            status_val := status_vals[1 + floor(random() * array_length(status_vals, 1))::INTEGER];
            secretaria := secretarias[1 + floor(random() * array_length(secretarias, 1))::INTEGER];
            
            -- Gerar gravidade (mais críticas em dezembro devido ao período de chuvas)
            gravidade := CASE 
                WHEN random() < 0.15 THEN 9 + floor(random() * 2)::INTEGER  -- 15% críticas (9-10)
                WHEN random() < 0.35 THEN 7 + floor(random() * 2)::INTEGER  -- 20% altas (7-8)
                WHEN random() < 0.65 THEN 5 + floor(random() * 2)::INTEGER  -- 30% médias (5-6)
                WHEN random() < 0.85 THEN 3 + floor(random() * 2)::INTEGER -- 20% baixas (3-4)
                ELSE 1 + floor(random() * 2)::INTEGER                      -- 15% muito baixas (1-2)
            END;
            
            -- Gerar descrição detalhada
            descricao := gerar_descricao_detalhada(tipo, bairro, gravidade);
            
            -- Gravidade IA
            gravidade_ia := CASE 
                WHEN random() < 0.1 THEN NULL
                ELSE gravidade + floor((random() - 0.5) * 2)::INTEGER
            END;
            IF gravidade_ia IS NOT NULL THEN
                gravidade_ia := GREATEST(1, LEAST(10, gravidade_ia));
            END IF;
            
            -- Gerar data/hora específica do dia
            hora_aleatoria := floor(random() * 24)::INTEGER;
            data_criacao := dia_atual + (hora_aleatoria || ' hours')::INTERVAL + 
                           (floor(random() * 60) || ' minutes')::INTERVAL;
            
            -- Data de atualização (80% das vezes após criação)
            data_atualizacao := CASE 
                WHEN random() < 0.8 THEN data_criacao + (random() * INTERVAL '2 days')
                ELSE NULL
            END;
            
            -- Endereço aleatório
            endereco := 'Rua ' || bairro || ', ' || (100 + floor(random() * 2000))::TEXT;
            
            -- Coordenadas: clusters ou baseadas no bairro real
            IF cluster_idx IS NOT NULL THEN
                -- Coordenadas agrupadas no cluster (raio aumentado para dispersão)
                coord := random_coord_cluster(
                    cluster_lons[cluster_idx],  -- longitude do centro
                    cluster_lats[cluster_idx],  -- latitude do centro
                    cluster_raios[cluster_idx]  -- raio do cluster (aumentado)
                );
            ELSE
                -- Coordenadas reais baseadas no bairro selecionado
                coord := coord_por_bairro(bairro);
            END IF;
            
            -- Metadata JSONB
            metadata_json := jsonb_build_object(
                'reclamacoes', floor(random() * 25)::INTEGER,
                'fotos', floor(random() * 12)::INTEGER,
                'prioridade', CASE WHEN gravidade >= 8 THEN 'alta' WHEN gravidade >= 5 THEN 'media' ELSE 'baixa' END,
                'area_afetada_m2', floor(random() * 600)::INTEGER,
                'risco_imediato', gravidade >= 8,
                'monitoramento', gravidade >= 7,
                'periodo_chuvas', true,
                'cluster_dezembro_2025', true
            );
            
            -- Inserir ocorrência
            INSERT INTO ocorrencias (
                id, tipo_problema, descricao, bairro, endereco, coordenadas,
                gravidade, gravidade_ia, status, secretaria_origem,
                data_criacao, data_atualizacao, metadata
            ) VALUES (
                gen_random_uuid(), tipo, descricao, bairro, endereco, coord,
                gravidade, gravidade_ia, status_val, secretaria,
                data_criacao, data_atualizacao, metadata_json
            );
        END LOOP;
        
        RAISE NOTICE 'Inseridas ocorrências para %', dia_atual;
    END LOOP;
    
    RAISE NOTICE 'Total de % ocorrências adicionais inseridas para dezembro 2025', total_ocorrencias_dez;
END $$;

-- ============================================================================
-- DADOS DE TESTE - RELATÓRIOS IA
-- ============================================================================

DO $$
DECLARE
    tipos_relatorio TEXT[] := ARRAY['DIARIO', 'SEMANAL', 'MENSAL', 'CUSTOMIZADO'];
    status_relatorio TEXT[] := ARRAY['GERANDO', 'CONCLUIDO', 'ERRO'];
    modelos_ia TEXT[] := ARRAY['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'];
    data_inicio TIMESTAMP := '2024-01-01 00:00:00';
    data_fim TIMESTAMP := '2025-12-06 23:59:59';
    periodo_inicio TIMESTAMP;
    periodo_fim TIMESTAMP;
    data_geracao TIMESTAMP;
    data_conclusao TIMESTAMP;
    i INTEGER;
    total_relatorios INTEGER := 500;
    tipo TEXT;
    status_val TEXT;
    modelo TEXT;
    titulo TEXT;
    resumo TEXT;
    tempo_processamento INTEGER;
BEGIN
    FOR i IN 1..total_relatorios LOOP
        tipo := tipos_relatorio[1 + floor(random() * array_length(tipos_relatorio, 1))::INTEGER];
        status_val := status_relatorio[1 + floor(random() * array_length(status_relatorio, 1))::INTEGER];
        modelo := modelos_ia[1 + floor(random() * array_length(modelos_ia, 1))::INTEGER];
        
        -- Gerar período baseado no tipo
        data_geracao := random_date(data_inicio, data_fim);
        CASE tipo
            WHEN 'DIARIO' THEN
                periodo_inicio := date_trunc('day', data_geracao);
                periodo_fim := periodo_inicio + INTERVAL '1 day';
            WHEN 'SEMANAL' THEN
                periodo_inicio := date_trunc('week', data_geracao);
                periodo_fim := periodo_inicio + INTERVAL '1 week';
            WHEN 'MENSAL' THEN
                periodo_inicio := date_trunc('month', data_geracao);
                periodo_fim := periodo_inicio + INTERVAL '1 month';
            ELSE
                periodo_inicio := data_geracao - INTERVAL '7 days';
                periodo_fim := data_geracao;
        END CASE;
        
        titulo := 'Relatório ' || tipo || ' - ' || to_char(periodo_inicio, 'DD/MM/YYYY');
        resumo := 'Análise automática de ocorrências no período de ' || 
                  to_char(periodo_inicio, 'DD/MM/YYYY') || ' a ' || 
                  to_char(periodo_fim, 'DD/MM/YYYY');
        
        tempo_processamento := 1000 + floor(random() * 5000)::INTEGER;
        
        data_conclusao := CASE 
            WHEN status_val = 'CONCLUIDO' THEN data_geracao + (tempo_processamento || ' milliseconds')::INTERVAL
            WHEN status_val = 'ERRO' THEN data_geracao + INTERVAL '5 minutes'
            ELSE NULL
        END;
        
        INSERT INTO relatorios_ia (
            id, tipo_relatorio, periodo_inicio, periodo_fim, titulo, resumo_executivo,
            conteudo_completo, metricas_calculadas, areas_criticas, recomendacoes,
            filtros_aplicados, modelo_ia_usado, status, data_geracao, data_conclusao,
            tempo_processamento_ms, usuario_solicitante, metadata
        ) VALUES (
            gen_random_uuid(), tipo, periodo_inicio, periodo_fim, titulo, resumo,
            jsonb_build_object(
                'total_ocorrencias', floor(random() * 500)::INTEGER,
                'ocorrencias_criticas', floor(random() * 50)::INTEGER,
                'taxa_resolucao', round((random() * 100)::NUMERIC, 2)
            ),
            jsonb_build_object(
                'media_gravidade', round((random() * 10)::NUMERIC, 2),
                'tempo_medio_resolucao', floor(random() * 30)::INTEGER
            ),
            jsonb_build_object(
                'bairros_criticos', ARRAY['Centro', 'Velha', 'Garcia']
            ),
            jsonb_build_object(
                'acoes_recomendadas', ARRAY['Aumentar fiscalização', 'Melhorar infraestrutura']
            ),
            jsonb_build_object('filtro_periodo', true),
            modelo, status_val, data_geracao, data_conclusao,
            tempo_processamento, 'admin@mapblu.com',
            jsonb_build_object('versao', '1.0', 'gerado_automaticamente', true)
        );
        
        IF i % 50 = 0 THEN
            RAISE NOTICE 'Inseridos % relatórios...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de % relatórios inseridos', total_relatorios;
END $$;

-- ============================================================================
-- DADOS DE TESTE - ANÁLISES HISTÓRICO
-- ============================================================================

DO $$
DECLARE
    tipos_analise TEXT[] := ARRAY['RELATORIO', 'INSIGHT', 'CLASSIFICACAO'];
    modelos_ia TEXT[] := ARRAY['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'];
    data_inicio TIMESTAMP := '2024-01-01 00:00:00';
    data_fim TIMESTAMP := '2025-12-06 23:59:59';
    data_execucao TIMESTAMP;
    i INTEGER;
    total_analises INTEGER := 1000;
    tipo TEXT;
    modelo TEXT;
    sucesso BOOLEAN;
    tempo_resposta INTEGER;
    tokens INTEGER;
    custo NUMERIC;
    erro_msg TEXT;
BEGIN
    FOR i IN 1..total_analises LOOP
        tipo := tipos_analise[1 + floor(random() * array_length(tipos_analise, 1))::INTEGER];
        modelo := modelos_ia[1 + floor(random() * array_length(modelos_ia, 1))::INTEGER];
        data_execucao := random_date(data_inicio, data_fim);
        sucesso := random() > 0.05; -- 95% de sucesso
        tempo_resposta := 500 + floor(random() * 3000)::INTEGER;
        tokens := 100 + floor(random() * 2000)::INTEGER;
        custo := round((tokens * 0.0001)::NUMERIC, 6);
        erro_msg := CASE WHEN NOT sucesso THEN 'Erro ao processar análise' ELSE NULL END;
        
        INSERT INTO analises_historico (
            id, tipo_analise, entrada_dados, saida_ia, prompt_usado,
            modelo_ia_usado, tempo_resposta_ms, tokens_usados, custo_estimado,
            sucesso, erro_mensagem, data_execucao, metadata
        ) VALUES (
            gen_random_uuid(), tipo,
            jsonb_build_object('ocorrencias_analisadas', floor(random() * 100)::INTEGER),
            jsonb_build_object('resultado', 'Análise concluída com sucesso'),
            'Analise as seguintes ocorrências e gere insights relevantes',
            modelo, tempo_resposta, tokens, custo,
            sucesso, erro_msg, data_execucao,
            jsonb_build_object('versao_api', '1.0', 'ambiente', 'producao')
        );
        
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Inseridas % análises...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de % análises inseridas', total_analises;
END $$;

-- ============================================================================
-- DADOS DE TESTE - INSIGHTS CACHE
-- ============================================================================

DO $$
DECLARE
    tipos_insight TEXT[] := ARRAY['AREA_CRITICA', 'TENDENCIA', 'PADRAO', 'PREDICAO', 'EXPLICACAO'];
    modelos_ia TEXT[] := ARRAY['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
    data_inicio TIMESTAMP := '2024-01-01 00:00:00';
    data_fim TIMESTAMP := '2025-12-06 23:59:59';
    data_geracao TIMESTAMP;
    data_expiracao TIMESTAMP;
    i INTEGER;
    total_insights INTEGER := 300;
    tipo TEXT;
    modelo TEXT;
    contexto_hash TEXT;
    insight_texto TEXT;
    confianca NUMERIC;
    relevancia INTEGER;
BEGIN
    FOR i IN 1..total_insights LOOP
        tipo := tipos_insight[1 + floor(random() * array_length(tipos_insight, 1))::INTEGER];
        modelo := modelos_ia[1 + floor(random() * array_length(modelos_ia, 1))::INTEGER];
        data_geracao := random_date(data_inicio, data_fim);
        data_expiracao := data_geracao + INTERVAL '30 days';
        
        contexto_hash := encode(digest(tipo || i::TEXT || random()::TEXT, 'sha256'), 'hex');
        
        insight_texto := CASE tipo
            WHEN 'AREA_CRITICA' THEN 'Identificada área crítica com alta concentração de ocorrências'
            WHEN 'TENDENCIA' THEN 'Tendência de aumento de ocorrências no período analisado'
            WHEN 'PADRAO' THEN 'Padrão identificado: ocorrências concentradas em horários específicos'
            WHEN 'PREDICAO' THEN 'Previsão de aumento de ocorrências nas próximas semanas'
            ELSE 'Explicação detalhada sobre o comportamento das ocorrências'
        END;
        
        confianca := round((0.7 + random() * 0.3)::NUMERIC, 2);
        relevancia := 1 + floor(random() * 10)::INTEGER;
        
        INSERT INTO insights_cache (
            id, tipo_insight, contexto, insight_texto, dados_suporte,
            confianca, relevancia, modelo_ia_usado, data_geracao,
            data_expiracao, hash_contexto, metadata
        ) VALUES (
            gen_random_uuid(), tipo,
            jsonb_build_object('bairro', 'Centro', 'periodo', '2024-01'),
            insight_texto,
            jsonb_build_object('ocorrencias_relacionadas', floor(random() * 50)::INTEGER),
            confianca, relevancia, modelo, data_geracao,
            data_expiracao, contexto_hash,
            jsonb_build_object('gerado_automaticamente', true)
        );
        
        IF i % 50 = 0 THEN
            RAISE NOTICE 'Inseridos % insights...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de % insights inseridos', total_insights;
END $$;

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

DO $$
DECLARE
    total_ocorrencias INTEGER;
    total_relatorios INTEGER;
    total_analises INTEGER;
    total_insights INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_ocorrencias FROM ocorrencias;
    SELECT COUNT(*) INTO total_relatorios FROM relatorios_ia;
    SELECT COUNT(*) INTO total_analises FROM analises_historico;
    SELECT COUNT(*) INTO total_insights FROM insights_cache;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'POPULAÇÃO DO BANCO DE DADOS CONCLUÍDA';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Ocorrências: %', total_ocorrencias;
    RAISE NOTICE 'Relatórios IA: %', total_relatorios;
    RAISE NOTICE 'Análises Histórico: %', total_analises;
    RAISE NOTICE 'Insights Cache: %', total_insights;
    RAISE NOTICE '============================================================================';
END $$;
