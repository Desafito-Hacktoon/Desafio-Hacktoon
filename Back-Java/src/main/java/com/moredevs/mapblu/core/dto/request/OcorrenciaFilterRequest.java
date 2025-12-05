package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaFilterRequest {
    private TipoProblema tipoProblema;
    private String bairro;
    private StatusOcorrencia status;
    private Integer gravidadeMin;
    private Integer gravidadeMax;
    private Double latitude;
    private Double longitude;
    private Double raioMetros;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
}
