package com.moredevs.mapblu.core.dto.response;

import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaResponse {

    private UUID id;
    private TipoProblema tipoProblema;
    private String descricao;
    private String bairro;
    private String endereco;
    private Double latitude;
    private Double longitude;
    private Integer gravidade;
    private Integer gravidadeIA;
    private StatusOcorrencia status;
    private String secretariaOrigem;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
    private Map<String, Object> metadata;
}
