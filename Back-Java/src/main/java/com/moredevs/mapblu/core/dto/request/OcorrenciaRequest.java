package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaRequest {

    @NotNull(message = "Tipo de problema é obrigatório")
    private TipoProblema tipoProblema;

    private String descricao;

    @NotNull(message = "Bairro é obrigatório")
    private String bairro;

    private String endereco;

    @NotNull(message = "Latitude é obrigatória")
    @Min(value = -90, message = "Latitude deve estar entre -90 e 90")
    @Max(value = 90, message = "Latitude deve estar entre -90 e 90")
    private Double latitude;

    @NotNull(message = "Longitude é obrigatória")
    @Min(value = -180, message = "Longitude deve estar entre -180 e 180")
    @Max(value = 180, message = "Longitude deve estar entre -180 e 180")
    private Double longitude;

    @NotNull(message = "Gravidade é obrigatória")
    @Min(value = 1, message = "Gravidade deve ser entre 1 e 10")
    @Max(value = 10, message = "Gravidade deve ser entre 1 e 10")
    private Integer gravidade;

    private Integer gravidadeIA;

    private StatusOcorrencia status;

    private String secretariaOrigem;

    private Map<String, Object> metadata;
}
