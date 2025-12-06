package com.moredevs.mapblu.core.scheduler;

import com.moredevs.mapblu.core.domain.RelatorioIA;
import com.moredevs.mapblu.core.dto.request.RelatorioRequest;
import com.moredevs.mapblu.core.service.RelatorioIAService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Scheduler para geração automática de relatórios.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RelatorioScheduler {

    private final RelatorioIAService relatorioIAService;

    /**
     * Gera relatório diário às 6h da manhã.
     */
    @Scheduled(cron = "${relatorios.ia.diario.cron:0 0 6 * * *}", zone = "America/Sao_Paulo")
    public void gerarRelatorioDiario() {
        log.info("Iniciando geração automática de relatório diário");
        
        try {
            LocalDateTime agora = LocalDateTime.now();
            LocalDateTime inicioDia = agora.toLocalDate().atStartOfDay();
            LocalDateTime fimDia = agora.toLocalDate().atTime(LocalTime.MAX);
            
            // Ajusta para o dia anterior (relatório do dia que passou)
            inicioDia = inicioDia.minusDays(1);
            fimDia = fimDia.minusDays(1);

            RelatorioRequest request = RelatorioRequest.builder()
                    .tipoRelatorio(RelatorioIA.TipoRelatorio.DIARIO)
                    .periodoInicio(inicioDia)
                    .periodoFim(fimDia)
                    .usuarioSolicitante("SISTEMA")
                    .build();

            relatorioIAService.gerarRelatorioAsync(request);
            log.info("Relatório diário agendado com sucesso");
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório diário: {}", e.getMessage(), e);
        }
    }

    /**
     * Gera relatório semanal aos domingos às 8h.
     */
    @Scheduled(cron = "${relatorios.ia.semanal.cron:0 0 8 * * 0}", zone = "America/Sao_Paulo")
    public void gerarRelatorioSemanal() {
        log.info("Iniciando geração automática de relatório semanal");
        
        try {
            LocalDateTime agora = LocalDateTime.now();
            LocalDateTime inicioSemana = agora.minusWeeks(1).toLocalDate().atStartOfDay();
            LocalDateTime fimSemana = agora.minusDays(1).toLocalDate().atTime(LocalTime.MAX);

            RelatorioRequest request = RelatorioRequest.builder()
                    .tipoRelatorio(RelatorioIA.TipoRelatorio.SEMANAL)
                    .periodoInicio(inicioSemana)
                    .periodoFim(fimSemana)
                    .usuarioSolicitante("SISTEMA")
                    .build();

            relatorioIAService.gerarRelatorioAsync(request);
            log.info("Relatório semanal agendado com sucesso");
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório semanal: {}", e.getMessage(), e);
        }
    }

    /**
     * Gera relatório mensal no dia 1 de cada mês às 9h.
     */
    @Scheduled(cron = "${relatorios.ia.mensal.cron:0 0 9 1 * *}", zone = "America/Sao_Paulo")
    public void gerarRelatorioMensal() {
        log.info("Iniciando geração automática de relatório mensal");
        
        try {
            LocalDateTime agora = LocalDateTime.now();
            LocalDateTime inicioMes = agora.minusMonths(1).withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime fimMes = agora.minusDays(1).toLocalDate().atTime(LocalTime.MAX);

            RelatorioRequest request = RelatorioRequest.builder()
                    .tipoRelatorio(RelatorioIA.TipoRelatorio.MENSAL)
                    .periodoInicio(inicioMes)
                    .periodoFim(fimMes)
                    .usuarioSolicitante("SISTEMA")
                    .build();

            relatorioIAService.gerarRelatorioAsync(request);
            log.info("Relatório mensal agendado com sucesso");
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório mensal: {}", e.getMessage(), e);
        }
    }
}

