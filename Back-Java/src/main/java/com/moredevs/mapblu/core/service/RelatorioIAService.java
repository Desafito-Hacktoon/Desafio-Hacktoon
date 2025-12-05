package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.AnaliseHistorico;
import com.moredevs.mapblu.core.domain.RelatorioIA;
import com.moredevs.mapblu.core.dto.request.RelatorioRequest;
import com.moredevs.mapblu.core.dto.response.MetricasAgregadasResponse;
import com.moredevs.mapblu.core.dto.response.RelatorioResponse;
import com.moredevs.mapblu.core.repository.AnaliseHistoricoRepository;
import com.moredevs.mapblu.core.repository.RelatorioIARepository;
import com.moredevs.mapblu.core.service.ai.PromptBuilder;
import com.moredevs.mapblu.core.service.ai.ResponseParser;
import com.moredevs.mapblu.infraestructure.integration.OpenRouterAIService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static com.moredevs.mapblu.shared.constant.Constants.Cache;

/**
 * Serviço principal para geração de relatórios pela IA.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RelatorioIAService {

    private final RelatorioIARepository relatorioIARepository;
    private final AnaliseHistoricoRepository analiseHistoricoRepository;
    private final OcorrenciaAggregator ocorrenciaAggregator;
    private final PromptBuilder promptBuilder;
    private final ResponseParser responseParser;
    private final OpenRouterAIService openRouterAIService;
    private final ObjectMapper objectMapper;

    /**
     * Gera um relatório de forma assíncrona.
     */
    @Async
    public CompletableFuture<RelatorioResponse> gerarRelatorioAsync(RelatorioRequest request) {
        return CompletableFuture.completedFuture(gerarRelatorio(request));
    }

    /**
     * Gera um relatório completo.
     */
    public RelatorioResponse gerarRelatorio(RelatorioRequest request) {
        log.info("Iniciando geração de relatório tipo: {}, período: {} até {}",
                request.getTipoRelatorio(), request.getPeriodoInicio(), request.getPeriodoFim());

        long inicioProcessamento = System.currentTimeMillis();

        // Cria registro inicial
        RelatorioIA relatorio = RelatorioIA.builder()
                .tipoRelatorio(request.getTipoRelatorio())
                .periodoInicio(request.getPeriodoInicio())
                .periodoFim(request.getPeriodoFim())
                .status(RelatorioIA.StatusRelatorio.GERANDO)
                .titulo("Relatório " + request.getTipoRelatorio().name().toLowerCase() + " - " +
                        request.getPeriodoInicio().toLocalDate())
                .usuarioSolicitante(request.getUsuarioSolicitante())
                .filtrosAplicados(request.getFiltros())
                .build();

        relatorio = relatorioIARepository.save(relatorio);

        try {
            MetricasAgregadasResponse metricas = ocorrenciaAggregator.agregarMetricas(
                    request.getPeriodoInicio(),
                    request.getPeriodoFim(),
                    request.getFiltros());

            @SuppressWarnings("unchecked")
            Map<String, Object> metricasMap = objectMapper.convertValue(metricas, Map.class);
            relatorio.setMetricasCalculadas(metricasMap);

            String promptSistema = promptBuilder.construirPromptSistema();
            String promptUsuario = promptBuilder.construirPromptRelatorio(
                    metricas, request.getPeriodoInicio(), request.getPeriodoFim());

            long inicioIA = System.currentTimeMillis();
            String respostaIA = openRouterAIService.chamarIA(promptSistema, promptUsuario);
            long tempoIA = System.currentTimeMillis() - inicioIA;

            Map<String, Object> conteudoParseado = responseParser.parsearRespostaRelatorio(respostaIA);

            relatorio.setConteudoCompleto(conteudoParseado);
            relatorio.setResumoExecutivo(extrairResumoExecutivo(conteudoParseado));
            relatorio.setAreasCriticas(extrairAreasCriticas(conteudoParseado));
            relatorio.setRecomendacoes(extrairRecomendacoes(conteudoParseado));
            relatorio.setStatus(RelatorioIA.StatusRelatorio.CONCLUIDO);
            relatorio.setDataConclusao(LocalDateTime.now());
            relatorio.setTempoProcessamentoMs((int) (System.currentTimeMillis() - inicioProcessamento));
            relatorio.setModeloIAUsado(openRouterAIService.getModeloUsado());

            relatorio = relatorioIARepository.save(relatorio);

            salvarHistorico(relatorio, promptUsuario, respostaIA, tempoIA, true, null);

            log.info("Relatório gerado com sucesso: {}", relatorio.getId());

            return converterParaResponse(relatorio);

        } catch (Exception e) {
            log.error("Erro ao gerar relatório: {}", e.getMessage(), e);
            
            relatorio.setStatus(RelatorioIA.StatusRelatorio.ERRO);
            relatorio.setTempoProcessamentoMs((int) (System.currentTimeMillis() - inicioProcessamento));
            relatorioIARepository.save(relatorio);

            salvarHistorico(relatorio, null, null, 0, false, e.getMessage());

            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }

    /**
     * Busca relatórios com filtros.
     */
    @Transactional(readOnly = true)
    public Page<RelatorioResponse> buscarRelatorios(
            RelatorioIA.TipoRelatorio tipoRelatorio,
            RelatorioIA.StatusRelatorio status,
            LocalDateTime dataInicio,
            LocalDateTime dataFim,
            Pageable pageable) {

        Page<RelatorioIA> relatorios = relatorioIARepository.findByFilters(
                tipoRelatorio, status, dataInicio, dataFim, pageable);

        return relatorios.map(this::converterParaResponse);
    }

    /**
     * Busca relatório por ID.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = Cache.CACHE_HEATMAP, key = "'relatorio:' + #id")
    public RelatorioResponse buscarPorId(UUID id) {
        RelatorioIA relatorio = relatorioIARepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Relatório não encontrado: " + id));
        return converterParaResponse(relatorio);
    }

    /**
     * Busca último relatório de um tipo.
     */
    @Transactional(readOnly = true)
    public RelatorioResponse buscarUltimoPorTipo(RelatorioIA.TipoRelatorio tipoRelatorio) {
        return relatorioIARepository.findUltimoPorTipo(tipoRelatorio)
                .map(this::converterParaResponse)
                .orElse(null);
    }

    /**
     * Converte entidade para DTO de resposta.
     */
    private RelatorioResponse converterParaResponse(RelatorioIA relatorio) {
        return RelatorioResponse.builder()
                .id(relatorio.getId())
                .tipoRelatorio(relatorio.getTipoRelatorio())
                .periodoInicio(relatorio.getPeriodoInicio())
                .periodoFim(relatorio.getPeriodoFim())
                .titulo(relatorio.getTitulo())
                .resumoExecutivo(relatorio.getResumoExecutivo())
                .conteudoCompleto(relatorio.getConteudoCompleto())
                .metricasCalculadas(relatorio.getMetricasCalculadas())
                .areasCriticas(relatorio.getAreasCriticas())
                .recomendacoes(relatorio.getRecomendacoes())
                .filtrosAplicados(relatorio.getFiltrosAplicados())
                .modeloIAUsado(relatorio.getModeloIAUsado())
                .status(relatorio.getStatus())
                .dataGeracao(relatorio.getDataGeracao())
                .dataConclusao(relatorio.getDataConclusao())
                .tempoProcessamentoMs(relatorio.getTempoProcessamentoMs())
                .usuarioSolicitante(relatorio.getUsuarioSolicitante())
                .build();
    }

    private String extrairResumoExecutivo(Map<String, Object> conteudo) {
        Object resumo = conteudo.get("resumoExecutivo");
        if (resumo != null) {
            return responseParser.truncarTexto(resumo.toString(), 2000);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extrairAreasCriticas(Map<String, Object> conteudo) {
        Object areas = conteudo.get("areasCriticas");
        if (areas instanceof Map) {
            return (Map<String, Object>) areas;
        }
        return new HashMap<>();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extrairRecomendacoes(Map<String, Object> conteudo) {
        Object recomendacoes = conteudo.get("recomendacoes");
        if (recomendacoes instanceof Map) {
            return (Map<String, Object>) recomendacoes;
        }
        return new HashMap<>();
    }

    private void salvarHistorico(
            RelatorioIA relatorio,
            String prompt,
            String resposta,
            long tempoMs,
            boolean sucesso,
            String erro) {

        try {
            Map<String, Object> entrada = new HashMap<>();
            entrada.put("tipoRelatorio", relatorio.getTipoRelatorio().name());
            entrada.put("periodoInicio", relatorio.getPeriodoInicio().toString());
            entrada.put("periodoFim", relatorio.getPeriodoFim().toString());

            Map<String, Object> saida = new HashMap<>();
            if (resposta != null) {
                saida.put("resposta", resposta);
            }

            AnaliseHistorico historico = AnaliseHistorico.builder()
                    .tipoAnalise(AnaliseHistorico.TipoAnalise.RELATORIO)
                    .entradaDados(entrada)
                    .saidaIA(saida)
                    .promptUsado(prompt)
                    .modeloIAUsado(relatorio.getModeloIAUsado())
                    .tempoRespostaMs((int) tempoMs)
                    .sucesso(sucesso)
                    .erroMensagem(erro)
                    .build();

            analiseHistoricoRepository.save(historico);
        } catch (Exception e) {
            log.error("Erro ao salvar histórico de análise: {}", e.getMessage());
        }
    }
}

