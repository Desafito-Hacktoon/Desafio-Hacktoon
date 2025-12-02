package com.moredevs.mapblu.core.mapper;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.dto.request.OcorrenciaRequest;
import com.moredevs.mapblu.core.dto.response.OcorrenciaResponse;
import com.moredevs.mapblu.shared.util.GeoUtil;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper para conversão entre Entity e DTOs.
 */
@Component
public class OcorrenciaMapper {

    /**
     * Converte Request para Entity.
     */
    public Ocorrencia toEntity(OcorrenciaRequest request) {
        Point coordenadas = GeoUtil.createPoint(request.getLatitude(), request.getLongitude());
        
        return Ocorrencia.builder()
                .tipoProblema(request.getTipoProblema())
                .descricao(request.getDescricao())
                .bairro(request.getBairro())
                .endereco(request.getEndereco())
                .coordenadas(coordenadas)
                .gravidade(request.getGravidade())
                .gravidadeIA(request.getGravidadeIA())
                .status(request.getStatus() != null ? request.getStatus() : StatusOcorrencia.PENDENTE)
                .secretariaOrigem(request.getSecretariaOrigem())
                .metadata(request.getMetadata())
                .build();
    }

    /**
     * Converte Entity para Response.
     */
    public OcorrenciaResponse toResponse(Ocorrencia ocorrencia) {
        return OcorrenciaResponse.builder()
                .id(ocorrencia.getId())
                .tipoProblema(ocorrencia.getTipoProblema())
                .descricao(ocorrencia.getDescricao())
                .bairro(ocorrencia.getBairro())
                .endereco(ocorrencia.getEndereco())
                .latitude(GeoUtil.getLatitude(ocorrencia.getCoordenadas()))
                .longitude(GeoUtil.getLongitude(ocorrencia.getCoordenadas()))
                .gravidade(ocorrencia.getGravidade())
                .gravidadeIA(ocorrencia.getGravidadeIA())
                .status(ocorrencia.getStatus())
                .secretariaOrigem(ocorrencia.getSecretariaOrigem())
                .dataCriacao(ocorrencia.getDataCriacao())
                .dataAtualizacao(ocorrencia.getDataAtualizacao())
                .metadata(ocorrencia.getMetadata())
                .build();
    }

    /**
     * Converte lista de Entities para lista de Responses.
     */
    public List<OcorrenciaResponse> toResponseList(List<Ocorrencia> ocorrencias) {
        return ocorrencias.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Atualiza Entity com dados do Request.
     */
    public void updateEntity(Ocorrencia ocorrencia, OcorrenciaRequest request) {
        if (request.getTipoProblema() != null) {
            ocorrencia.setTipoProblema(request.getTipoProblema());
        }
        if (request.getDescricao() != null) {
            ocorrencia.setDescricao(request.getDescricao());
        }
        if (request.getBairro() != null) {
            ocorrencia.setBairro(request.getBairro());
        }
        if (request.getEndereco() != null) {
            ocorrencia.setEndereco(request.getEndereco());
        }
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point coordenadas = GeoUtil.createPoint(request.getLatitude(), request.getLongitude());
            ocorrencia.setCoordenadas(coordenadas);
        }
        if (request.getGravidade() != null) {
            ocorrencia.setGravidade(request.getGravidade());
        }
        if (request.getGravidadeIA() != null) {
            ocorrencia.setGravidadeIA(request.getGravidadeIA());
        }
        if (request.getStatus() != null) {
            ocorrencia.setStatus(request.getStatus());
        }
        if (request.getSecretariaOrigem() != null) {
            ocorrencia.setSecretariaOrigem(request.getSecretariaOrigem());
        }
        if (request.getMetadata() != null) {
            ocorrencia.setMetadata(request.getMetadata());
        }
    }
}
