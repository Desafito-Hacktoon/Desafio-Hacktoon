package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço para detectar padrões em ocorrências.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PatternDetector {

    /**
     * Detecta padrões temporais nas ocorrências.
     */
    public Map<String, Object> detectarPadroesTemporais(List<Ocorrencia> ocorrencias) {
        Map<String, Object> padroes = new HashMap<>();

        Map<DayOfWeek, Long> porDiaSemana = ocorrencias.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getDataCriacao().getDayOfWeek(),
                        Collectors.counting()
                ));

        Map<String, Long> distribuicaoPorDiaSemana = new LinkedHashMap<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            distribuicaoPorDiaSemana.put(day.name(), porDiaSemana.getOrDefault(day, 0L));
        }
        padroes.put("distribuicaoPorDiaSemana", distribuicaoPorDiaSemana);

        Map<Integer, Long> porHora = ocorrencias.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getDataCriacao().getHour(),
                        Collectors.counting()
                ));

        Map<String, Long> distribuicaoPorHora = new LinkedHashMap<>();
        for (int hora = 0; hora < 24; hora++) {
            distribuicaoPorHora.put(String.valueOf(hora), porHora.getOrDefault(hora, 0L));
        }
        padroes.put("distribuicaoPorHora", distribuicaoPorHora);

        Optional<Map.Entry<DayOfWeek, Long>> diaMaisCritico = porDiaSemana.entrySet().stream()
                .max(Map.Entry.comparingByValue());
        if (diaMaisCritico.isPresent()) {
            padroes.put("diaMaisCritico", diaMaisCritico.get().getKey().name());
        }

        Optional<Map.Entry<Integer, Long>> horaMaisCritica = porHora.entrySet().stream()
                .max(Map.Entry.comparingByValue());
        if (horaMaisCritica.isPresent()) {
            padroes.put("horaMaisCritica", horaMaisCritica.get().getKey());
        }

        return padroes;
    }

    /**
     * Detecta correlações entre variáveis.
     */
    public Map<String, Object> detectarCorrelacoes(List<Ocorrencia> ocorrencias) {
        Map<String, Object> correlacoes = new HashMap<>();

        Map<String, Map<String, Long>> tipoPorBairro = ocorrencias.stream()
                .collect(Collectors.groupingBy(
                        Ocorrencia::getBairro,
                        Collectors.groupingBy(
                                o -> o.getTipoProblema().name(),
                                Collectors.counting()
                        )
                ));

        Map<String, String> tipoMaisComumPorBairro = new HashMap<>();
        tipoPorBairro.forEach((bairro, tipos) -> {
            Optional<Map.Entry<String, Long>> tipoMaisComum = tipos.entrySet().stream()
                    .max(Map.Entry.comparingByValue());
            tipoMaisComum.ifPresent(entry -> tipoMaisComumPorBairro.put(bairro, entry.getKey()));
        });
        correlacoes.put("tipoMaisComumPorBairro", tipoMaisComumPorBairro);

        Map<String, Map<String, Double>> gravidadeMediaPorTipoEBairro = ocorrencias.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getTipoProblema().name(),
                        Collectors.groupingBy(
                                Ocorrencia::getBairro,
                                Collectors.averagingInt(Ocorrencia::getGravidade)
                        )
                ));

        Map<String, String> bairroMaisCriticoPorTipo = new HashMap<>();
        gravidadeMediaPorTipoEBairro.forEach((tipo, bairros) -> {
            Optional<Map.Entry<String, Double>> bairroMaisCritico = bairros.entrySet().stream()
                    .max(Map.Entry.comparingByValue());
            bairroMaisCritico.ifPresent(entry -> bairroMaisCriticoPorTipo.put(tipo, entry.getKey()));
        });
        correlacoes.put("bairroMaisCriticoPorTipo", bairroMaisCriticoPorTipo);

        return correlacoes;
    }

    /**
     * Detecta anomalias (valores fora do padrão esperado).
     */
    public List<Map<String, Object>> detectarAnomalias(List<Ocorrencia> ocorrencias) {
        List<Map<String, Object>> anomalias = new ArrayList<>();

        if (ocorrencias.isEmpty()) {
            return anomalias;
        }

        double gravidadeMedia = ocorrencias.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .average()
                .orElse(0.0);

        double desvioPadrao = Math.sqrt(
                ocorrencias.stream()
                        .mapToDouble(o -> Math.pow(o.getGravidade() - gravidadeMedia, 2))
                        .average()
                        .orElse(0.0)
        );

        double limiteSuperior = gravidadeMedia + (2 * desvioPadrao);
        ocorrencias.stream()
                .filter(o -> o.getGravidade() > limiteSuperior)
                .forEach(o -> {
                    Map<String, Object> anomalia = new HashMap<>();
                    anomalia.put("id", o.getId());
                    anomalia.put("bairro", o.getBairro());
                    anomalia.put("tipoProblema", o.getTipoProblema().name());
                    anomalia.put("gravidade", o.getGravidade());
                    anomalia.put("gravidadeMedia", gravidadeMedia);
                    anomalia.put("desvio", o.getGravidade() - gravidadeMedia);
                    anomalias.add(anomalia);
                });

        return anomalias;
    }
}

