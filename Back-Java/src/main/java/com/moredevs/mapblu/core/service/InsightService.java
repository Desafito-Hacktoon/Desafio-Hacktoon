package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.AnaliseHistorico;
import com.moredevs.mapblu.core.domain.InsightCache;
import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.response.InsightResponse;
import com.moredevs.mapblu.core.dto.response.MetricasAgregadasResponse;
import com.moredevs.mapblu.core.repository.AnaliseHistoricoRepository;
import com.moredevs.mapblu.core.repository.InsightCacheRepository;
import com.moredevs.mapblu.core.repository.OcorrenciaRepository;
import com.moredevs.mapblu.core.service.ai.PromptBuilder;
import com.moredevs.mapblu.core.service.ai.ResponseParser;
import com.moredevs.mapblu.infraestructure.integration.OpenRouterAIService;
import com.moredevs.mapblu.shared.util.HashUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço principal para geração de insights inteligentes pela IA.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InsightService {

    private final InsightCacheRepository insightCacheRepository;
    private final AnaliseHistoricoRepository analiseHistoricoRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final OcorrenciaAggregator ocorrenciaAggregator;
    private final PromptBuilder promptBuilder;
    private final ResponseParser responseParser;
    private final OpenRouterAIService openRouterAIService;
    private final ObjectMapper objectMapper;

    @Value("${insights.cache.ttl-area-critica:3600}")
    private long ttlAreaCritica;

    @Value("${insights.cache.ttl-tendencia:21600}")
    private long ttlTendencia;

    @Value("${insights.cache.ttl-padrao:86400}")
    private long ttlPadrao;

    @Value("${insights.cache.ttl-predicao:43200}")
    private long ttlPredicao;

    @Value("${insights.cache.ttl-explicacao:86400}")
    private long ttlExplicacao;

    /**
     * Gera insight de área crítica.
     */
    public InsightResponse gerarInsightAreaCritica(String bairro, String tipoProblema, LocalDateTime periodoInicio, LocalDateTime periodoFim) {
        log.info("Gerando insight de área crítica para bairro: {}", bairro);

        Map<String, Object> contexto = criarContextoAreaCritica(bairro, tipoProblema, periodoInicio, periodoFim);
        String hashContexto = HashUtil.gerarHashContexto(contexto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                log.debug("Insight encontrado no cache: {}", hashContexto);
                return converterParaResponse(cache, true);
            }
        }

        List<Ocorrencia> ocorrenciasBairro = buscarOcorrenciasBairro(bairro, tipoProblema, periodoInicio, periodoFim);
        List<Ocorrencia> todasOcorrencias = ocorrenciaRepository.findAllByDataCriacaoBetween(
                periodoInicio != null ? periodoInicio : LocalDateTime.now().minusMonths(1),
                periodoFim != null ? periodoFim : LocalDateTime.now());

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptAreaCritica(bairro, ocorrenciasBairro, todasOcorrencias);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = criarInsightCache(
                InsightCache.TipoInsight.AREA_CRITICA,
                contexto,
                hashContexto,
                respostaParseada,
                ttlAreaCritica);

        insightCache = insightCacheRepository.save(insightCache);

        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    /**
     * Gera insight de tendência.
     */
    public InsightResponse gerarInsightTendencia(String tipoProblema, LocalDateTime periodoInicio, LocalDateTime periodoFim, String bairro) {
        log.info("Gerando insight de tendência para tipo: {}", tipoProblema);

        Map<String, Object> contexto = criarContextoTendencia(tipoProblema, periodoInicio, periodoFim, bairro);
        String hashContexto = HashUtil.gerarHashContexto(contexto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                return converterParaResponse(cache, true);
            }
        }

        TipoProblema tipo = tipoProblema != null ? TipoProblema.valueOf(tipoProblema) : null;
        List<Ocorrencia> ocorrencias = buscarOcorrenciasPorTipo(tipo, bairro, periodoInicio, periodoFim);
        
        LocalDateTime periodoAnteriorInicio = periodoInicio != null ? periodoInicio.minus(ChronoUnit.DAYS.between(periodoInicio, periodoFim), ChronoUnit.DAYS) : LocalDateTime.now().minusMonths(2);
        LocalDateTime periodoAnteriorFim = periodoInicio != null ? periodoInicio : LocalDateTime.now().minusMonths(1);
        List<Ocorrencia> ocorrenciasAnteriores = buscarOcorrenciasPorTipo(tipo, bairro, periodoAnteriorInicio, periodoAnteriorFim);

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptTendencia(tipoProblema, ocorrencias, ocorrenciasAnteriores, periodoInicio, periodoFim);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = criarInsightCache(
                InsightCache.TipoInsight.TENDENCIA,
                contexto,
                hashContexto,
                respostaParseada,
                ttlTendencia);

        insightCache = insightCacheRepository.save(insightCache);
        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    /**
     * Gera insight de padrão.
     */
    public InsightResponse gerarInsightPadrao(Map<String, Object> filtros) {
        log.info("Gerando insight de padrão");

        Map<String, Object> contexto = criarContextoPadrao(filtros);
        String hashContexto = HashUtil.gerarHashContexto(contexto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                return converterParaResponse(cache, true);
            }
        }

        LocalDateTime periodoInicio = LocalDateTime.now().minusMonths(3);
        LocalDateTime periodoFim = LocalDateTime.now();
        MetricasAgregadasResponse metricas = ocorrenciaAggregator.agregarMetricas(periodoInicio, periodoFim, filtros);

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptPadrao(metricas);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = criarInsightCache(
                InsightCache.TipoInsight.PADRAO,
                contexto,
                hashContexto,
                respostaParseada,
                ttlPadrao);

        insightCache = insightCacheRepository.save(insightCache);
        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    /**
     * Gera insight preditivo.
     */
    public InsightResponse gerarInsightPredicao(Integer horizonte, String area) {
        log.info("Gerando insight preditivo - horizonte: {} dias, área: {}", horizonte, area);

        Map<String, Object> contexto = criarContextoPredicao(horizonte, area);
        String hashContexto = HashUtil.gerarHashContexto(contexto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                return converterParaResponse(cache, true);
            }
        }

        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime inicioHistorico = agora.minusMonths(6);
        MetricasAgregadasResponse metricas = ocorrenciaAggregator.agregarMetricas(inicioHistorico, agora, null);

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptPredicao(metricas, horizonte, area);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = criarInsightCache(
                InsightCache.TipoInsight.PREDICAO,
                contexto,
                hashContexto,
                respostaParseada,
                ttlPredicao);

        insightCache = insightCacheRepository.save(insightCache);
        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    /**
     * Gera insight explicativo.
     */
    public InsightResponse gerarInsightExplicacao(Map<String, Object> contexto, String pergunta) {
        log.info("Gerando insight explicativo");

        Map<String, Object> contextoCompleto = criarContextoExplicacao(contexto, pergunta);
        String hashContexto = HashUtil.gerarHashContexto(contextoCompleto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                return converterParaResponse(cache, true);
            }
        }

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptExplicacao(contexto, pergunta);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = criarInsightCache(
                InsightCache.TipoInsight.EXPLICACAO,
                contextoCompleto,
                hashContexto,
                respostaParseada,
                ttlExplicacao);

        insightCache = insightCacheRepository.save(insightCache);
        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    /**
     * Responde pergunta livre sobre ocorrências.
     */
    public InsightResponse responderPergunta(String pergunta, Map<String, Object> contexto) {
        log.info("Respondendo pergunta livre: {}", pergunta);

        Map<String, Object> contextoCompleto = new HashMap<>();
        contextoCompleto.put("pergunta", pergunta);
        if (contexto != null) {
            contextoCompleto.putAll(contexto);
        }

        String hashContexto = HashUtil.gerarHashContexto(contextoCompleto);

        Optional<InsightCache> cacheOpt = insightCacheRepository.findByHashContexto(hashContexto);
        if (cacheOpt.isPresent()) {
            InsightCache cache = cacheOpt.get();
            if (!cache.isExpirado()) {
                return converterParaResponse(cache, true);
            }
        }

        MetricasAgregadasResponse metricas = null;
        if (contexto != null && (contexto.containsKey("bairro") || contexto.containsKey("tipoProblema"))) {
            LocalDateTime periodoInicio = LocalDateTime.now().minusMonths(1);
            LocalDateTime periodoFim = LocalDateTime.now();
            metricas = ocorrenciaAggregator.agregarMetricas(periodoInicio, periodoFim, contexto);
        }

        String promptSistema = promptBuilder.construirPromptSistema();
        String promptUsuario = construirPromptPergunta(pergunta, contexto, metricas);

        long inicioIA = System.currentTimeMillis();
        String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
        long tempoIA = System.currentTimeMillis() - inicioIA;

        Map<String, Object> respostaParseada = parsearRespostaInsight(respostaIA);

        InsightCache insightCache = InsightCache.builder()
                .tipoInsight(InsightCache.TipoInsight.EXPLICACAO)
                .contexto(contextoCompleto)
                .hashContexto(hashContexto)
                .insightTexto(extrairTextoInsight(respostaParseada))
                .dadosSuporte(metricas != null ? extrairDadosSuporteDeMetricas(metricas) : null)
                .confianca(extrairConfianca(respostaParseada))
                .relevancia(extrairRelevancia(respostaParseada))
                .modeloIAUsado(openRouterAIService.getModeloUsado())
                .dataExpiracao(LocalDateTime.now().plusSeconds(ttlExplicacao))
                .build();

        insightCache = insightCacheRepository.save(insightCache);
        salvarHistorico(insightCache, promptUsuario, respostaIA, tempoIA, true, null);

        return converterParaResponse(insightCache, false);
    }

    private Map<String, Object> criarContextoAreaCritica(String bairro, String tipoProblema, LocalDateTime periodoInicio, LocalDateTime periodoFim) {
        Map<String, Object> contexto = new HashMap<>();
        contexto.put("tipo", "AREA_CRITICA");
        contexto.put("bairro", bairro);
        if (tipoProblema != null) contexto.put("tipoProblema", tipoProblema);
        if (periodoInicio != null) contexto.put("periodoInicio", periodoInicio.toString());
        if (periodoFim != null) contexto.put("periodoFim", periodoFim.toString());
        return contexto;
    }

    private Map<String, Object> criarContextoTendencia(String tipoProblema, LocalDateTime periodoInicio, LocalDateTime periodoFim, String bairro) {
        Map<String, Object> contexto = new HashMap<>();
        contexto.put("tipo", "TENDENCIA");
        contexto.put("tipoProblema", tipoProblema);
        if (periodoInicio != null) contexto.put("periodoInicio", periodoInicio.toString());
        if (periodoFim != null) contexto.put("periodoFim", periodoFim.toString());
        if (bairro != null) contexto.put("bairro", bairro);
        return contexto;
    }

    private Map<String, Object> criarContextoPadrao(Map<String, Object> filtros) {
        Map<String, Object> contexto = new HashMap<>();
        contexto.put("tipo", "PADRAO");
        if (filtros != null) contexto.put("filtros", filtros);
        return contexto;
    }

    private Map<String, Object> criarContextoPredicao(Integer horizonte, String area) {
        Map<String, Object> contexto = new HashMap<>();
        contexto.put("tipo", "PREDICAO");
        contexto.put("horizonte", horizonte);
        if (area != null) contexto.put("area", area);
        return contexto;
    }

    private Map<String, Object> criarContextoExplicacao(Map<String, Object> contexto, String pergunta) {
        Map<String, Object> contextoCompleto = new HashMap<>();
        contextoCompleto.put("tipo", "EXPLICACAO");
        if (contexto != null) contextoCompleto.putAll(contexto);
        if (pergunta != null) contextoCompleto.put("pergunta", pergunta);
        return contextoCompleto;
    }

    private List<Ocorrencia> buscarOcorrenciasBairro(String bairro, String tipoProblema, LocalDateTime periodoInicio, LocalDateTime periodoFim) {
        LocalDateTime inicio = periodoInicio != null ? periodoInicio : LocalDateTime.now().minusMonths(1);
        LocalDateTime fim = periodoFim != null ? periodoFim : LocalDateTime.now();
        
        TipoProblema tipo = tipoProblema != null ? TipoProblema.valueOf(tipoProblema) : null;
        return buscarOcorrenciasPorTipo(tipo, bairro, inicio, fim);
    }

    private List<Ocorrencia> buscarOcorrenciasPorTipo(TipoProblema tipo, String bairro, LocalDateTime inicio, LocalDateTime fim) {
        List<Ocorrencia> todas = ocorrenciaRepository.findAllByDataCriacaoBetween(inicio, fim);
        return todas.stream()
                .filter(o -> tipo == null || o.getTipoProblema() == tipo)
                .filter(o -> bairro == null || o.getBairro().equalsIgnoreCase(bairro))
                .collect(Collectors.toList());
    }

    private InsightCache criarInsightCache(
            InsightCache.TipoInsight tipo,
            Map<String, Object> contexto,
            String hashContexto,
            Map<String, Object> respostaParseada,
            long ttlSegundos) {
        
        return InsightCache.builder()
                .tipoInsight(tipo)
                .contexto(contexto)
                .hashContexto(hashContexto)
                .insightTexto(extrairTextoInsight(respostaParseada))
                .dadosSuporte(extrairDadosSuporte(respostaParseada))
                .confianca(extrairConfianca(respostaParseada))
                .relevancia(extrairRelevancia(respostaParseada))
                .modeloIAUsado(openRouterAIService.getModeloUsado())
                .dataExpiracao(LocalDateTime.now().plusSeconds(ttlSegundos))
                .build();
    }

    private String construirPromptAreaCritica(String bairro, List<Ocorrencia> ocorrenciasBairro, List<Ocorrencia> todasOcorrencias) {
        long totalBairro = ocorrenciasBairro.size();
        double gravidadeMediaBairro = ocorrenciasBairro.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .average()
                .orElse(0.0);
        
        double gravidadeMediaCidade = todasOcorrencias.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .average()
                .orElse(0.0);

        Map<String, Long> tiposPorBairro = ocorrenciasBairro.stream()
                .collect(Collectors.groupingBy(o -> o.getTipoProblema().name(), Collectors.counting()));

        StringBuilder prompt = new StringBuilder();
        prompt.append("Analise por que o bairro ").append(bairro).append(" é uma área crítica.\n\n");
        prompt.append("DADOS:\n");
        prompt.append("- Total de ocorrências no bairro: ").append(totalBairro).append("\n");
        prompt.append("- Gravidade média no bairro: ").append(String.format("%.1f", gravidadeMediaBairro)).append("\n");
        prompt.append("- Gravidade média da cidade: ").append(String.format("%.1f", gravidadeMediaCidade)).append("\n");
        prompt.append("- Tipos principais no bairro: ");
        tiposPorBairro.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .forEach(e -> prompt.append(e.getKey()).append(" (").append(e.getValue()).append("), "));
        prompt.append("\n\n");

        prompt.append("Forneça:\n");
        prompt.append("1. Explicação clara e objetiva (2-3 parágrafos)\n");
        prompt.append("2. Principais fatores contribuintes\n");
        prompt.append("3. Comparação com média da cidade\n");
        prompt.append("4. Urgência da situação (1-10)\n\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"texto\", \"fatores\": [\"...\"], \"comparacao\": \"...\", \"urgencia\": 8, \"confianca\": 0.85, \"relevancia\": 8, \"recomendacoes\": [\"...\"]}");

        return prompt.toString();
    }

    private String construirPromptTendencia(String tipoProblema, List<Ocorrencia> ocorrencias, List<Ocorrencia> ocorrenciasAnteriores, LocalDateTime inicio, LocalDateTime fim) {
        long totalAtual = ocorrencias.size();
        long totalAnterior = ocorrenciasAnteriores.size();
        double variacao = totalAnterior > 0 ? ((double)(totalAtual - totalAnterior) / totalAnterior) * 100 : 0;

        StringBuilder prompt = new StringBuilder();
        prompt.append("Analise a tendência de ").append(tipoProblema).append(" no período especificado.\n\n");
        prompt.append("DADOS:\n");
        prompt.append("- Total atual: ").append(totalAtual).append("\n");
        prompt.append("- Total período anterior: ").append(totalAnterior).append("\n");
        prompt.append("- Variação: ").append(String.format("%.1f%%", variacao)).append("\n\n");

        prompt.append("Forneça:\n");
        prompt.append("1. Descrição da tendência\n");
        prompt.append("2. Fatores que podem explicar\n");
        prompt.append("3. Projeção para próximos períodos\n");
        prompt.append("4. Recomendações\n\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"texto\", \"fatores\": [\"...\"], \"projecao\": \"...\", \"recomendacoes\": [\"...\"], \"confianca\": 0.85, \"relevancia\": 7}");

        return prompt.toString();
    }

    private String construirPromptPadrao(MetricasAgregadasResponse metricas) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Identifique padrões interessantes nos dados de ocorrências.\n\n");
        prompt.append("DADOS AGREGADOS:\n");
        prompt.append("- Total de ocorrências: ").append(metricas.getTotalOcorrencias()).append("\n");
        prompt.append("- Gravidade média: ").append(metricas.getGravidadeMedia()).append("\n");
        if (metricas.getPadroesTemporais() != null) {
            prompt.append("- Padrões temporais: ").append(metricas.getPadroesTemporais()).append("\n");
        }
        if (metricas.getCorrelacoes() != null) {
            prompt.append("- Correlações: ").append(metricas.getCorrelacoes()).append("\n");
        }
        prompt.append("\n");

        prompt.append("Forneça:\n");
        prompt.append("1. Padrões identificados\n");
        prompt.append("2. Explicação de cada padrão\n");
        prompt.append("3. Significância\n");
        prompt.append("4. Possíveis ações\n\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"texto\", \"padroes\": [{\"nome\": \"...\", \"explicacao\": \"...\", \"significancia\": \"...\"}], \"acoes\": [\"...\"], \"confianca\": 0.80, \"relevancia\": 7}");

        return prompt.toString();
    }

    private String construirPromptPredicao(MetricasAgregadasResponse metricas, Integer horizonte, String area) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Com base nos dados históricos, preveja possíveis problemas futuros.\n\n");
        prompt.append("DADOS HISTÓRICOS:\n");
        prompt.append("- Total de ocorrências: ").append(metricas.getTotalOcorrencias()).append("\n");
        prompt.append("- Áreas críticas: ").append(metricas.getAreasCriticas() != null ? metricas.getAreasCriticas().size() : 0).append("\n");
        prompt.append("- Horizonte de predição: ").append(horizonte).append(" dias\n");
        if (area != null) prompt.append("- Área de foco: ").append(area).append("\n");
        prompt.append("\n");

        prompt.append("Forneça:\n");
        prompt.append("1. Áreas de risco identificadas\n");
        prompt.append("2. Tipos de problemas prováveis\n");
        prompt.append("3. Período estimado\n");
        prompt.append("4. Nível de confiança (0-1)\n");
        prompt.append("5. Ações preventivas recomendadas\n\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"texto\", \"areasRisco\": [\"...\"], \"problemasProvaveis\": [\"...\"], \"periodoEstimado\": \"...\", \"confianca\": 0.75, \"relevancia\": 8, \"acoesPreventivas\": [\"...\"]}");

        return prompt.toString();
    }

    private String construirPromptExplicacao(Map<String, Object> contexto, String pergunta) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Explique por que o fenômeno está acontecendo no contexto especificado.\n\n");
        prompt.append("CONTEXTO: ").append(contexto != null ? contexto.toString() : "Não especificado").append("\n");
        if (pergunta != null) {
            prompt.append("PERGUNTA ESPECÍFICA: ").append(pergunta).append("\n");
        }
        prompt.append("\n");

        prompt.append("Forneça:\n");
        prompt.append("1. Explicação clara\n");
        prompt.append("2. Causas prováveis\n");
        prompt.append("3. Contexto histórico\n");
        prompt.append("4. Fatores contribuintes\n\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"texto\", \"causas\": [\"...\"], \"contextoHistorico\": \"...\", \"fatores\": [\"...\"], \"confianca\": 0.85, \"relevancia\": 7}");

        return prompt.toString();
    }

    private String construirPromptPergunta(String pergunta, Map<String, Object> contexto, MetricasAgregadasResponse metricas) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Responda à seguinte pergunta sobre ocorrências municipais:\n\n");
        prompt.append("PERGUNTA: ").append(pergunta).append("\n\n");
        
        if (contexto != null && !contexto.isEmpty()) {
            prompt.append("CONTEXTO: ").append(contexto.toString()).append("\n\n");
        }
        
        if (metricas != null) {
            prompt.append("DADOS DISPONÍVEIS:\n");
            prompt.append("- Total de ocorrências: ").append(metricas.getTotalOcorrencias()).append("\n");
            prompt.append("- Gravidade média: ").append(metricas.getGravidadeMedia()).append("\n");
        }
        
        prompt.append("\nForneça uma resposta clara, objetiva e baseada em dados.\n");
        prompt.append("Responda em formato JSON: {\"insight\": \"resposta completa\", \"confianca\": 0.85, \"relevancia\": 7}");

        return prompt.toString();
    }

    private Map<String, Object> parsearRespostaInsight(String respostaIA) {
        try {
            return responseParser.parsearRespostaRelatorio(respostaIA);
        } catch (Exception e) {
            log.warn("Erro ao parsear resposta, usando resposta direta: {}", e.getMessage());
            Map<String, Object> resposta = new HashMap<>();
            resposta.put("insight", responseParser.sanitizarTexto(respostaIA));
            resposta.put("confianca", BigDecimal.valueOf(0.7));
            resposta.put("relevancia", 5);
            return resposta;
        }
    }

    private String extrairTextoInsight(Map<String, Object> resposta) {
        Object insight = resposta.get("insight");
        if (insight != null) {
            return responseParser.sanitizarTexto(insight.toString());
        }
        return "Insight gerado pela IA";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extrairDadosSuporteDeMetricas(MetricasAgregadasResponse metricas) {
        return (Map<String, Object>) objectMapper.convertValue(metricas, Map.class);
    }

    private Map<String, Object> extrairDadosSuporte(Map<String, Object> resposta) {
        Map<String, Object> dados = new HashMap<>();
        if (resposta.containsKey("fatores")) {
            dados.put("fatores", resposta.get("fatores"));
        }
        if (resposta.containsKey("padroes")) {
            dados.put("padroes", resposta.get("padroes"));
        }
        if (resposta.containsKey("areasRisco")) {
            dados.put("areasRisco", resposta.get("areasRisco"));
        }
        return dados.isEmpty() ? null : dados;
    }

    private BigDecimal extrairConfianca(Map<String, Object> resposta) {
        Object confianca = resposta.get("confianca");
        if (confianca instanceof Number) {
            return BigDecimal.valueOf(((Number) confianca).doubleValue());
        }
        return BigDecimal.valueOf(0.8);
    }

    private Integer extrairRelevancia(Map<String, Object> resposta) {
        Object relevancia = resposta.get("relevancia");
        if (relevancia instanceof Number) {
            return ((Number) relevancia).intValue();
        }
        return 7;
    }

    private InsightResponse converterParaResponse(InsightCache cache, boolean doCache) {
        @SuppressWarnings("unchecked")
        List<String> recomendacoes = cache.getDadosSuporte() != null && cache.getDadosSuporte().containsKey("recomendacoes")
                ? (List<String>) cache.getDadosSuporte().get("recomendacoes")
                : Collections.emptyList();

        return InsightResponse.builder()
                .id(cache.getId())
                .tipo(cache.getTipoInsight())
                .insight(cache.getInsightTexto())
                .confianca(cache.getConfianca())
                .relevancia(cache.getRelevancia())
                .dadosSuporte(cache.getDadosSuporte())
                .recomendacoes(recomendacoes)
                .dataGeracao(cache.getDataGeracao())
                .modeloIA(cache.getModeloIAUsado())
                .doCache(doCache)
                .build();
    }

    private void salvarHistorico(
            InsightCache insight,
            String prompt,
            String resposta,
            long tempoMs,
            boolean sucesso,
            String erro) {
        try {
            Map<String, Object> entrada = new HashMap<>();
            entrada.put("tipoInsight", insight.getTipoInsight().name());
            entrada.put("contexto", insight.getContexto());

            Map<String, Object> saida = new HashMap<>();
            if (resposta != null) {
                saida.put("resposta", resposta);
            }

            AnaliseHistorico historico = AnaliseHistorico.builder()
                    .tipoAnalise(AnaliseHistorico.TipoAnalise.INSIGHT)
                    .entradaDados(entrada)
                    .saidaIA(saida)
                    .promptUsado(prompt)
                    .modeloIAUsado(insight.getModeloIAUsado())
                    .tempoRespostaMs((int) tempoMs)
                    .sucesso(sucesso)
                    .erroMensagem(erro)
                    .build();

            analiseHistoricoRepository.save(historico);
        } catch (Exception e) {
            log.error("Erro ao salvar histórico de insight: {}", e.getMessage());
        }
    }
}

