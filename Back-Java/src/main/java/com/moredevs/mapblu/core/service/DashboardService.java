package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.response.DashboardStatsResponse;
import com.moredevs.mapblu.core.dto.response.OcorrenciaResponse;
import com.moredevs.mapblu.core.dto.response.PagedResponse;
import com.moredevs.mapblu.core.mapper.OcorrenciaMapper;
import com.moredevs.mapblu.core.repository.OcorrenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Serviço para operações de dashboard e estatísticas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final OcorrenciaMapper ocorrenciaMapper;

    /**
     * Obtém estatísticas gerais do dashboard usando queries otimizadas do banco de dados.
     * 
     * @param periodoInicio início do período (opcional, se null usa mês atual)
     * @param periodoFim fim do período (opcional, se null usa agora)
     * @return estatísticas do dashboard
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse obterEstatisticas(LocalDateTime periodoInicio, LocalDateTime periodoFim) {
        // Se não especificado, usar mês atual como padrão
        if (periodoInicio == null || periodoFim == null) {
            YearMonth mesAtual = YearMonth.now();
            periodoInicio = mesAtual.atDay(1).atStartOfDay();
            periodoFim = LocalDateTime.now();
        }

        final LocalDateTime inicio = periodoInicio;
        final LocalDateTime fim = periodoFim;

        // Usar queries otimizadas do banco de dados em vez de filtrar em memória
        long totalOcorrencias = ocorrenciaRepository.countByDataCriacaoBetween(inicio, fim);
        long ocorrenciasCriticas = ocorrenciaRepository.countCriticasByDataCriacaoBetween(inicio, fim);
        long ocorrenciasEmAndamento = ocorrenciaRepository.countByStatusAndDataCriacaoBetween(
                StatusOcorrencia.EM_ANDAMENTO, inicio, fim);
        long ocorrenciasPendentes = ocorrenciaRepository.countByStatusAndDataCriacaoBetween(
                StatusOcorrencia.PENDENTE, inicio, fim);
        long ocorrenciasResolvidas = ocorrenciaRepository.countByStatusAndDataCriacaoBetween(
                StatusOcorrencia.RESOLVIDO, inicio, fim);

        // Gravidade média do período usando query otimizada
        Double gravidadeMedia = ocorrenciaRepository.avgGravidadeByDataCriacaoBetween(inicio, fim);
        if (gravidadeMedia == null) {
            gravidadeMedia = 0.0;
        }

        Map<String, Long> ocorrenciasPorTipo = new HashMap<>();
        List<Object[]> tiposCount = ocorrenciaRepository.countByTipoProblemaAndDataCriacaoBetween(inicio, fim);
        for (Object[] result : tiposCount) {
            TipoProblema tipo = (TipoProblema) result[0];
            Long count = (Long) result[1];
            ocorrenciasPorTipo.put(tipo != null ? tipo.name() : "OUTROS", count);
        }

        // Estatísticas por bairro - buscar ocorrências do período e agrupar
        List<Ocorrencia> ocorrenciasDoPeriodo = ocorrenciaRepository.findAllByDataCriacaoBetween(inicio, fim);
        Map<String, Long> ocorrenciasPorBairro = ocorrenciasDoPeriodo.stream()
                .collect(Collectors.groupingBy(
                        oc -> oc.getBairro() != null ? oc.getBairro() : "Não informado",
                        Collectors.counting()
                ));

        Map<String, Long> ocorrenciasPorStatus = new HashMap<>();
        ocorrenciasPorStatus.put(StatusOcorrencia.PENDENTE.name(), ocorrenciasPendentes);
        ocorrenciasPorStatus.put(StatusOcorrencia.EM_ANDAMENTO.name(), ocorrenciasEmAndamento);
        ocorrenciasPorStatus.put(StatusOcorrencia.RESOLVIDO.name(), ocorrenciasResolvidas);
        ocorrenciasPorStatus.put(StatusOcorrencia.CANCELADO.name(), 
                ocorrenciaRepository.countByStatusAndDataCriacaoBetween(StatusOcorrencia.CANCELADO, inicio, fim));

        return DashboardStatsResponse.builder()
                .totalOcorrencias(totalOcorrencias)
                .ocorrenciasCriticas(ocorrenciasCriticas)
                .ocorrenciasEmAndamento(ocorrenciasEmAndamento)
                .ocorrenciasPendentes(ocorrenciasPendentes)
                .ocorrenciasResolvidas(ocorrenciasResolvidas)
                .ocorrenciasPorTipo(ocorrenciasPorTipo)
                .ocorrenciasPorBairro(ocorrenciasPorBairro)
                .ocorrenciasPorStatus(ocorrenciasPorStatus)
                .gravidadeMedia(gravidadeMedia)
                .ocorrenciasDoMes(totalOcorrencias) // Para compatibilidade
                .periodoInicio(inicio)
                .periodoFim(fim)
                .build();
    }

    /**
     * Obtém ocorrências do período especificado para o dashboard.
     * 
     * @param page página
     * @param size tamanho da página
     * @param periodoInicio início do período (opcional, se null usa mês atual)
     * @param periodoFim fim do período (opcional, se null usa agora)
     * @return página de ocorrências do período
     */
    @Transactional(readOnly = true)
    public PagedResponse<OcorrenciaResponse> obterOcorrenciasDoMes(int page, int size, LocalDateTime periodoInicio, LocalDateTime periodoFim) {
        // Se não especificado, usar mês atual como padrão
        if (periodoInicio == null || periodoFim == null) {
            YearMonth mesAtual = YearMonth.now();
            periodoInicio = mesAtual.atDay(1).atStartOfDay();
            periodoFim = LocalDateTime.now();
        }

        // Usar query otimizada com filtro de data diretamente no banco
        Pageable pageable = PageRequest.of(page, size);
        Page<Ocorrencia> pageResult = ocorrenciaRepository.findByDataCriacaoBetween(
                periodoInicio, periodoFim, pageable
        );

        List<OcorrenciaResponse> content = pageResult.getContent().stream()
                .map(ocorrenciaMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<OcorrenciaResponse>builder()
                .content(content)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();
    }
}


