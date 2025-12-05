package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.RelatorioIA;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO para solicitação de geração de relatório.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioRequest {

    @NotNull(message = "Tipo de relatório é obrigatório")
    private RelatorioIA.TipoRelatorio tipoRelatorio;

    @NotNull(message = "Período de início é obrigatório")
    private LocalDateTime periodoInicio;

    @NotNull(message = "Período de fim é obrigatório")
    private LocalDateTime periodoFim;

    private String usuarioSolicitante;

    /**
     * Filtros opcionais para aplicar na análise.
     */
    private Map<String, Object> filtros;

    /**
     * Valida se o período é válido.
     */
    public boolean isPeriodoValido() {
        if (periodoInicio == null || periodoFim == null) {
            return false;
        }
        return periodoFim.isAfter(periodoInicio);
    }

    /**
     * Valida se o período não é muito grande (máximo 1 ano).
     */
    public boolean isPeriodoDentroDoLimite() {
        if (periodoInicio == null || periodoFim == null) {
            return false;
        }
        return periodoFim.isBefore(periodoInicio.plusYears(1));
    }
}

