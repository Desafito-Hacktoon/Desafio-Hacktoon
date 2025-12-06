package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Serviço para cálculos estatísticos sobre ocorrências.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsCalculator {

    /**
     * Calcula a gravidade média das ocorrências.
     */
    public Double calcularGravidadeMedia(List<Ocorrencia> ocorrencias) {
        if (ocorrencias == null || ocorrencias.isEmpty()) {
            return null;
        }
        return ocorrencias.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .average()
                .orElse(0.0);
    }

    /**
     * Calcula a gravidade máxima.
     */
    public Integer calcularGravidadeMaxima(List<Ocorrencia> ocorrencias) {
        if (ocorrencias == null || ocorrencias.isEmpty()) {
            return null;
        }
        return ocorrencias.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .max()
                .orElse(0);
    }

    /**
     * Calcula a gravidade mínima.
     */
    public Integer calcularGravidadeMinima(List<Ocorrencia> ocorrencias) {
        if (ocorrencias == null || ocorrencias.isEmpty()) {
            return null;
        }
        return ocorrencias.stream()
                .mapToInt(Ocorrencia::getGravidade)
                .min()
                .orElse(0);
    }

    /**
     * Calcula a mediana da gravidade.
     */
    public Double calcularGravidadeMediana(List<Ocorrencia> ocorrencias) {
        if (ocorrencias == null || ocorrencias.isEmpty()) {
            return null;
        }
        List<Integer> gravidades = ocorrencias.stream()
                .map(Ocorrencia::getGravidade)
                .sorted()
                .collect(Collectors.toList());

        int size = gravidades.size();
        if (size % 2 == 0) {
            return (gravidades.get(size / 2 - 1) + gravidades.get(size / 2)) / 2.0;
        } else {
            return gravidades.get(size / 2).doubleValue();
        }
    }

    /**
     * Calcula o desvio padrão da gravidade.
     */
    public Double calcularDesvioPadraoGravidade(List<Ocorrencia> ocorrencias) {
        if (ocorrencias == null || ocorrencias.size() < 2) {
            return null;
        }
        Double media = calcularGravidadeMedia(ocorrencias);
        if (media == null) {
            return null;
        }

        double somaQuadrados = ocorrencias.stream()
                .mapToDouble(o -> Math.pow(o.getGravidade() - media, 2))
                .sum();

        return Math.sqrt(somaQuadrados / ocorrencias.size());
    }
}

