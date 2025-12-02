package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.request.OcorrenciaFilterRequest;
import com.moredevs.mapblu.core.dto.request.OcorrenciaRequest;
import com.moredevs.mapblu.core.dto.response.OcorrenciaResponse;
import com.moredevs.mapblu.core.dto.response.PagedResponse;
import com.moredevs.mapblu.core.exception.EntityNotFoundException;
import com.moredevs.mapblu.core.mapper.OcorrenciaMapper;
import com.moredevs.mapblu.core.repository.OcorrenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.moredevs.mapblu.shared.constant.Constants.Cache.*;

/**
 * Service para operações de negócio relacionadas a ocorrências.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OcorrenciaService {

    private final OcorrenciaRepository repository;
    private final OcorrenciaMapper mapper;

    /**
     * Cria uma nova ocorrência.
     */
    @CacheEvict(value = {CACHE_OCORRENCIAS, CACHE_STATS, CACHE_BAIRROS_CRITICOS}, allEntries = true)
    public OcorrenciaResponse criar(OcorrenciaRequest request) {
        log.info("Criando nova ocorrência: tipo={}, bairro={}", request.getTipoProblema(), request.getBairro());
        
        Ocorrencia ocorrencia = mapper.toEntity(request);
        Ocorrencia saved = repository.save(ocorrencia);
        
        log.info("Ocorrência criada com sucesso: id={}", saved.getId());
        return mapper.toResponse(saved);
    }

    /**
     * Busca ocorrência por ID.
     */
    @Cacheable(value = CACHE_OCORRENCIAS, key = "#id")
    @Transactional(readOnly = true)
    public OcorrenciaResponse buscarPorId(UUID id) {
        log.debug("Buscando ocorrência por ID: {}", id);
        
        Ocorrencia ocorrencia = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ocorrência não encontrada com ID: " + id));
        
        return mapper.toResponse(ocorrencia);
    }

    /**
     * Lista ocorrências com filtros e paginação.
     */
    @Cacheable(value = CACHE_OCORRENCIAS)
    @Transactional(readOnly = true)
    public PagedResponse<OcorrenciaResponse> listar(OcorrenciaFilterRequest filtros, Pageable pageable) {
        log.debug("Listando ocorrências com filtros: {}", filtros);
        
        Page<Ocorrencia> page = repository.findByFilters(
                filtros.getTipoProblema(),
                filtros.getBairro(),
                filtros.getStatus(),
                filtros.getGravidadeMin(),
                filtros.getGravidadeMax(),
                pageable
        );
        
        return toPagedResponse(page);
    }

    /**
     * Busca ocorrências próximas a uma localização.
     */
    @Cacheable(value = CACHE_OCORRENCIAS)
    @Transactional(readOnly = true)
    public PagedResponse<OcorrenciaResponse> buscarProximas(
            Double latitude, 
            Double longitude, 
            Double raioMetros,
            TipoProblema tipoProblema,
            Pageable pageable
    ) {
        log.debug("Buscando ocorrências próximas: lat={}, lng={}, raio={}m", latitude, longitude, raioMetros);
        
        if (raioMetros == null || raioMetros <= 0) {
            raioMetros = 5000.0; // 5km padrão
        }
        
        String tipoProblemaStr = tipoProblema != null ? tipoProblema.name() : null;
        Page<Ocorrencia> page = repository.findNearby(
                latitude,
                longitude,
                raioMetros,
                tipoProblemaStr,
                pageable
        );
        
        return toPagedResponse(page);
    }

    /**
     * Atualiza uma ocorrência.
     */
    @CacheEvict(value = {CACHE_OCORRENCIAS, CACHE_STATS, CACHE_BAIRROS_CRITICOS}, allEntries = true)
    public OcorrenciaResponse atualizar(UUID id, OcorrenciaRequest request) {
        log.info("Atualizando ocorrência: id={}", id);
        
        Ocorrencia ocorrencia = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ocorrência não encontrada com ID: " + id));
        
        mapper.updateEntity(ocorrencia, request);
        Ocorrencia updated = repository.save(ocorrencia);
        
        log.info("Ocorrência atualizada com sucesso: id={}", updated.getId());
        return mapper.toResponse(updated);
    }

    /**
     * Atualiza o status de uma ocorrência.
     */
    @CacheEvict(value = {CACHE_OCORRENCIAS, CACHE_STATS, CACHE_BAIRROS_CRITICOS}, allEntries = true)
    public OcorrenciaResponse atualizarStatus(UUID id, StatusOcorrencia status) {
        log.info("Atualizando status da ocorrência: id={}, status={}", id, status);
        
        Ocorrencia ocorrencia = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ocorrência não encontrada com ID: " + id));
        
        ocorrencia.setStatus(status);
        Ocorrencia updated = repository.save(ocorrencia);
        
        return mapper.toResponse(updated);
    }

    /**
     * Remove uma ocorrência.
     */
    @CacheEvict(value = {CACHE_OCORRENCIAS, CACHE_STATS, CACHE_BAIRROS_CRITICOS}, allEntries = true)
    public void remover(UUID id) {
        log.info("Removendo ocorrência: id={}", id);
        
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Ocorrência não encontrada com ID: " + id);
        }
        
        repository.deleteById(id);
        log.info("Ocorrência removida com sucesso: id={}", id);
    }

    /**
     * Busca ocorrências críticas.
     */
    @Cacheable(value = CACHE_OCORRENCIAS)
    @Transactional(readOnly = true)
    public PagedResponse<OcorrenciaResponse> buscarCriticas(Pageable pageable) {
        log.debug("Buscando ocorrências críticas");
        
        Page<Ocorrencia> page = repository.findCriticas(pageable);
        return toPagedResponse(page);
    }

    /**
     * Converte Page para PagedResponse.
     */
    private PagedResponse<OcorrenciaResponse> toPagedResponse(Page<Ocorrencia> page) {
        List<OcorrenciaResponse> content = mapper.toResponseList(page.getContent());
        
        return PagedResponse.<OcorrenciaResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}

