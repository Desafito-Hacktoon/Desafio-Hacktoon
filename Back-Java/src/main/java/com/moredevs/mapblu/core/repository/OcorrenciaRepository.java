package com.moredevs.mapblu.core.repository;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository para operações de persistência da entidade Ocorrencia.
 * Inclui queries customizadas para filtros, estatísticas e análises geoespaciais.
 */
@Repository
public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID> {

    /**
     * Busca ocorrências com filtros opcionais.
     * 
     * @param tipoProblema filtro por tipo de problema (opcional)
     * @param bairro filtro por bairro (opcional)
     * @param status filtro por status (opcional)
     * @param gravidadeMin filtro por gravidade mínima (opcional)
     * @param pageable paginação e ordenação
     * @return página de ocorrências filtradas
     */
    @Query("SELECT o FROM Ocorrencia o WHERE " +
           "(:tipoProblema IS NULL OR o.tipoProblema = :tipoProblema) AND " +
           "(:bairro IS NULL OR LOWER(o.bairro) LIKE LOWER(CONCAT('%', :bairro, '%'))) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:gravidadeMin IS NULL OR o.gravidade >= :gravidadeMin) AND " +
           "(:gravidadeMax IS NULL OR o.gravidade <= :gravidadeMax)")
    Page<Ocorrencia> findByFilters(
        @Param("tipoProblema") TipoProblema tipoProblema,
        @Param("bairro") String bairro,
        @Param("status") StatusOcorrencia status,
        @Param("gravidadeMin") Integer gravidadeMin,
        @Param("gravidadeMax") Integer gravidadeMax,
        Pageable pageable
    );

    /**
     * Conta ocorrências por tipo de problema.
     * 
     * @param bairro filtro por bairro (opcional)
     * @return lista de arrays [TipoProblema, Long] com contagem
     */
    @Query("SELECT o.tipoProblema, COUNT(o) FROM Ocorrencia o " +
           "WHERE (:bairro IS NULL OR LOWER(o.bairro) LIKE LOWER(CONCAT('%', :bairro, '%'))) " +
           "AND o.status != 'RESOLVIDO' " +
           "GROUP BY o.tipoProblema " +
           "ORDER BY COUNT(o) DESC")
    List<Object[]> countByTipoProblema(@Param("bairro") String bairro);

    /**
     * Encontra os bairros mais críticos baseado em gravidade e quantidade.
     * 
     * @param pageable paginação
     * @return lista de arrays [bairro, total, gravidadeMedia, gravidadeMaxima]
     */
    @Query("SELECT o.bairro, COUNT(o) as total, AVG(o.gravidade) as gravidadeMedia, " +
           "MAX(o.gravidade) as gravidadeMaxima " +
           "FROM Ocorrencia o " +
           "WHERE o.status != 'RESOLVIDO' " +
           "GROUP BY o.bairro " +
           "ORDER BY gravidadeMaxima DESC, total DESC")
    List<Object[]> findBairrosCriticos(Pageable pageable);

    /**
     * Calcula a gravidade média das ocorrências.
     * 
     * @param bairro filtro por bairro (opcional)
     * @return gravidade média ou null se não houver ocorrências
     */
    @Query("SELECT AVG(o.gravidade) FROM Ocorrencia o " +
           "WHERE (:bairro IS NULL OR LOWER(o.bairro) LIKE LOWER(CONCAT('%', :bairro, '%'))) " +
           "AND o.status != 'RESOLVIDO'")
    Double avgGravidade(@Param("bairro") String bairro);

    /**
     * Conta ocorrências por tipo de problema.
     * 
     * @param tipoProblema tipo de problema
     * @return quantidade de ocorrências
     */
    long countByTipoProblema(TipoProblema tipoProblema);

    /**
     * Conta ocorrências por bairro.
     * 
     * @param bairro nome do bairro
     * @return quantidade de ocorrências
     */
    long countByBairro(String bairro);

    /**
     * Conta ocorrências por status.
     * 
     * @param status status da ocorrência
     * @return quantidade de ocorrências
     */
    long countByStatus(StatusOcorrencia status);

    /**
     * Busca ocorrências dentro de um raio (em metros) de um ponto.
     * Utiliza PostGIS para cálculo de distância.
     * 
     * @param point ponto central
     * @param radiusInMeters raio em metros
     * @param pageable paginação
     * @return página de ocorrências dentro do raio
     */
    @Query(value = "SELECT * FROM ocorrencias " +
           "WHERE ST_DWithin(coordenadas, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusInMeters) " +
           "AND (:tipoProblema IS NULL OR tipo_problema = CAST(:tipoProblema AS VARCHAR)) " +
           "AND status != 'RESOLVIDO' " +
           "ORDER BY ST_Distance(coordenadas, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)",
           nativeQuery = true)
    Page<Ocorrencia> findNearby(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusInMeters") double radiusInMeters,
        @Param("tipoProblema") String tipoProblema,
        Pageable pageable
    );

    /**
     * Busca ocorrências críticas (gravidade >= 8).
     * 
     * @param pageable paginação
     * @return página de ocorrências críticas
     */
    @Query("SELECT o FROM Ocorrencia o " +
           "WHERE o.gravidade >= 8 AND o.status != 'RESOLVIDO' " +
           "ORDER BY o.gravidade DESC, o.dataCriacao DESC")
    Page<Ocorrencia> findCriticas(Pageable pageable);

    /**
     * Conta total de ocorrências ativas (não resolvidas).
     * 
     * @return quantidade de ocorrências ativas
     */
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE o.status != 'RESOLVIDO'")
    long countAtivas();

    /**
     * Busca ocorrências por bairro e tipo.
     * 
     * @param bairro nome do bairro
     * @param tipoProblema tipo de problema
     * @return lista de ocorrências
     */
    List<Ocorrencia> findByBairroAndTipoProblema(String bairro, TipoProblema tipoProblema);
}

