package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
