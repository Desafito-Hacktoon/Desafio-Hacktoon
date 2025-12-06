package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.response.MetricasAgregadasResponse;
import com.moredevs.mapblu.core.repository.OcorrenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço responsável por agregar dados de ocorrências para análise pela IA.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OcorrenciaAggregator {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final StatisticsCalculator statisticsCalculator;
    private final PatternDetector patternDetector;

    /**
     * Agrega métricas de ocorrências para um período específico.
     */
    public MetricasAgregadasResponse agregarMetricas(
            LocalDateTime periodoInicio,
            LocalDateTime periodoFim,
            Map<String, Object> filtros) {

        log.debug("Agregando métricas para período: {} até {}", periodoInicio, periodoFim);

        List<Ocorrencia> ocorrencias = ocorrenciaRepository.findAllByDataCriacaoBetween(
                periodoInicio, periodoFim);

        if (filtros != null && !filtros.isEmpty()) {
            ocorrencias = aplicarFiltros(ocorrencias, filtros);
        }

        long diasPeriodo = Duration.between(periodoInicio, periodoFim).toDays();
        LocalDateTime periodoAnteriorInicio = periodoInicio.minusDays(diasPeriodo);
        LocalDateTime periodoAnteriorFim = periodoInicio;

        List<Ocorrencia> ocorrenciasPeriodoAnterior = ocorrenciaRepository.findAllByDataCriacaoBetween(
                periodoAnteriorInicio, periodoAnteriorFim);

        if (filtros != null && !filtros.isEmpty()) {
            ocorrenciasPeriodoAnterior = aplicarFiltros(ocorrenciasPeriodoAnterior, filtros);
        }

        long totalOcorrencias = ocorrencias.size();
        long totalOcorrenciasAnterior = ocorrenciasPeriodoAnterior.size();
        double variacaoPercentual = calcularVariacaoPercentual(totalOcorrenciasAnterior, totalOcorrencias);

        Double gravidadeMedia = statisticsCalculator.calcularGravidadeMedia(ocorrencias);
        Integer gravidadeMaxima = statisticsCalculator.calcularGravidadeMaxima(ocorrencias);
        Integer gravidadeMinima = statisticsCalculator.calcularGravidadeMinima(ocorrencias);

        List<Map<String, Object>> topBairrosCriticos = calcularTopBairrosCriticos(ocorrencias, 10);

        List<Map<String, Object>> distribuicaoPorTipo = calcularDistribuicaoPorTipo(ocorrencias);

        List<Map<String, Object>> distribuicaoPorBairro = calcularDistribuicaoPorBairro(ocorrencias);

        Map<Integer, Long> distribuicaoGravidade = calcularDistribuicaoGravidade(ocorrencias);

        Map<String, Object> padroesTemporais = patternDetector.detectarPadroesTemporais(ocorrencias);

        Map<String, Object> correlacoes = patternDetector.detectarCorrelacoes(ocorrencias);

        List<Map<String, Object>> areasCriticas = identificarAreasCriticas(ocorrencias);

        return MetricasAgregadasResponse.builder()
                .totalOcorrencias(totalOcorrencias)
                .totalOcorrenciasPeriodoAnterior(totalOcorrenciasAnterior)
                .variacaoPercentual(variacaoPercentual)
                .gravidadeMedia(gravidadeMedia)
                .gravidadeMaxima(gravidadeMaxima)
                .gravidadeMinima(gravidadeMinima)
                .topBairrosCriticos(topBairrosCriticos)
                .distribuicaoPorTipo(distribuicaoPorTipo)
                .distribuicaoPorBairro(distribuicaoPorBairro)
                .distribuicaoGravidade(distribuicaoGravidade)
                .padroesTemporais(padroesTemporais)
                .correlacoes(correlacoes)
                .areasCriticas(areasCriticas)
                .build();
    }

    private List<Ocorrencia> aplicarFiltros(List<Ocorrencia> ocorrencias, Map<String, Object> filtros) {
        return ocorrencias.stream()
                .filter(o -> {
                    if (filtros.containsKey("tipoProblema")) {
                        TipoProblema tipoFiltro = TipoProblema.valueOf(filtros.get("tipoProblema").toString());
                        if (!o.getTipoProblema().equals(tipoFiltro)) {
                            return false;
                        }
                    }
                    if (filtros.containsKey("bairro")) {
                        String bairroFiltro = filtros.get("bairro").toString().toLowerCase();
                        if (!o.getBairro().toLowerCase().contains(bairroFiltro)) {
                            return false;
                        }
                    }
                    if (filtros.containsKey("gravidadeMin")) {
                        Integer gravidadeMin = Integer.parseInt(filtros.get("gravidadeMin").toString());
                        if (o.getGravidade() < gravidadeMin) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private double calcularVariacaoPercentual(long anterior, long atual) {
        if (anterior == 0) {
            return atual > 0 ? 100.0 : 0.0;
        }
        return ((double) (atual - anterior) / anterior) * 100.0;
    }

    private List<Map<String, Object>> calcularTopBairrosCriticos(List<Ocorrencia> ocorrencias, int top) {
        Map<String, List<Ocorrencia>> porBairro = ocorrencias.stream()
                .collect(Collectors.groupingBy(Ocorrencia::getBairro));

        return porBairro.entrySet().stream()
                .map(entry -> {
                    String bairro = entry.getKey();
                    List<Ocorrencia> ocorrenciasBairro = entry.getValue();
                    double gravidadeMedia = ocorrenciasBairro.stream()
                            .mapToInt(Ocorrencia::getGravidade)
                            .average()
                            .orElse(0.0);
                    int gravidadeMaxima = ocorrenciasBairro.stream()
                            .mapToInt(Ocorrencia::getGravidade)
                            .max()
                            .orElse(0);

                    Map<String, Object> map = new HashMap<>();
                    map.put("bairro", bairro);
                    map.put("total", ocorrenciasBairro.size());
                    map.put("gravidadeMedia", Math.round(gravidadeMedia * 10.0) / 10.0);
                    map.put("gravidadeMaxima", gravidadeMaxima);
                    return map;
                })
                .sorted((a, b) -> {
                    int maxA = (Integer) a.get("gravidadeMaxima");
                    int maxB = (Integer) b.get("gravidadeMaxima");
                    if (maxA != maxB) {
                        return Integer.compare(maxB, maxA);
                    }
                    return Integer.compare((Integer) b.get("total"), (Integer) a.get("total"));
                })
                .limit(top)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> calcularDistribuicaoPorTipo(List<Ocorrencia> ocorrencias) {
        long total = ocorrencias.size();
        if (total == 0) {
            return Collections.emptyList();
        }

        Map<TipoProblema, Long> porTipo = ocorrencias.stream()
                .collect(Collectors.groupingBy(Ocorrencia::getTipoProblema, Collectors.counting()));

        return porTipo.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("tipoProblema", entry.getKey().name());
                    map.put("total", entry.getValue());
                    map.put("percentual", Math.round((entry.getValue() * 100.0 / total) * 10.0) / 10.0);
                    return map;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("total"), (Long) a.get("total")))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> calcularDistribuicaoPorBairro(List<Ocorrencia> ocorrencias) {
        long total = ocorrencias.size();
        if (total == 0) {
            return Collections.emptyList();
        }

        Map<String, Long> porBairro = ocorrencias.stream()
                .collect(Collectors.groupingBy(Ocorrencia::getBairro, Collectors.counting()));

        return porBairro.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("bairro", entry.getKey());
                    map.put("total", entry.getValue());
                    map.put("percentual", Math.round((entry.getValue() * 100.0 / total) * 10.0) / 10.0);
                    return map;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("total"), (Long) a.get("total")))
                .limit(20)
                .collect(Collectors.toList());
    }

    private Map<Integer, Long> calcularDistribuicaoGravidade(List<Ocorrencia> ocorrencias) {
        return ocorrencias.stream()
                .collect(Collectors.groupingBy(Ocorrencia::getGravidade, Collectors.counting()));
    }

    private List<Map<String, Object>> identificarAreasCriticas(List<Ocorrencia> ocorrencias) {
        return ocorrencias.stream()
                .filter(o -> o.getGravidade() >= 8)
                .collect(Collectors.groupingBy(Ocorrencia::getBairro))
                .entrySet().stream()
                .filter(entry -> entry.getValue().size() >= 3)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("bairro", entry.getKey());
                    map.put("totalCriticas", entry.getValue().size());
                    map.put("gravidadeMedia", entry.getValue().stream()
                            .mapToInt(Ocorrencia::getGravidade)
                            .average()
                            .orElse(0.0));
                    return map;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("totalCriticas"), (Integer) a.get("totalCriticas")))
                .limit(10)
                .collect(Collectors.toList());
    }
}

