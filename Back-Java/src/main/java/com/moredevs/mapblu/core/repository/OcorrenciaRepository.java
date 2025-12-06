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
     * Busca ocorrências com filtros opcionais incluindo filtro de data.
     * 
     * @param tipoProblema filtro por tipo de problema (opcional)
     * @param bairro filtro por bairro (opcional)
     * @param status filtro por status (opcional)
     * @param gravidadeMin filtro por gravidade mínima (opcional)
     * @param gravidadeMax filtro por gravidade máxima (opcional)
     * @param dataInicio filtro por data de início (opcional)
     * @param dataFim filtro por data de fim (opcional)
     * @param pageable paginação e ordenação
     * @return página de ocorrências filtradas
     */
    @Query(value = "SELECT * FROM ocorrencias o WHERE " +
           "(CAST(:tipoProblema AS VARCHAR) IS NULL OR o.tipo_problema = CAST(:tipoProblema AS VARCHAR)) AND " +
           "(CAST(:bairro AS VARCHAR) IS NULL OR o.bairro ILIKE '%' || CAST(:bairro AS VARCHAR) || '%') AND " +
           "(CAST(:status AS VARCHAR) IS NULL OR o.status = CAST(:status AS VARCHAR)) AND " +
           "(CAST(:gravidadeMin AS INTEGER) IS NULL OR o.gravidade >= CAST(:gravidadeMin AS INTEGER)) AND " +
           "(CAST(:gravidadeMax AS INTEGER) IS NULL OR o.gravidade <= CAST(:gravidadeMax AS INTEGER)) AND " +
           "(CAST(:dataInicio AS TIMESTAMP) IS NULL OR o.data_criacao >= CAST(:dataInicio AS TIMESTAMP)) AND " +
           "(CAST(:dataFim AS TIMESTAMP) IS NULL OR o.data_criacao <= CAST(:dataFim AS TIMESTAMP)) " +
           "ORDER BY o.data_criacao DESC",
           countQuery = "SELECT COUNT(*) FROM ocorrencias o WHERE " +
           "(CAST(:tipoProblema AS VARCHAR) IS NULL OR o.tipo_problema = CAST(:tipoProblema AS VARCHAR)) AND " +
           "(CAST(:bairro AS VARCHAR) IS NULL OR o.bairro ILIKE '%' || CAST(:bairro AS VARCHAR) || '%') AND " +
           "(CAST(:status AS VARCHAR) IS NULL OR o.status = CAST(:status AS VARCHAR)) AND " +
           "(CAST(:gravidadeMin AS INTEGER) IS NULL OR o.gravidade >= CAST(:gravidadeMin AS INTEGER)) AND " +
           "(CAST(:gravidadeMax AS INTEGER) IS NULL OR o.gravidade <= CAST(:gravidadeMax AS INTEGER)) AND " +
           "(CAST(:dataInicio AS TIMESTAMP) IS NULL OR o.data_criacao >= CAST(:dataInicio AS TIMESTAMP)) AND " +
           "(CAST(:dataFim AS TIMESTAMP) IS NULL OR o.data_criacao <= CAST(:dataFim AS TIMESTAMP))",
           nativeQuery = true)
    Page<Ocorrencia> findByFilters(
        @Param("tipoProblema") String tipoProblema,
        @Param("bairro") String bairro,
        @Param("status") String status,
        @Param("gravidadeMin") Integer gravidadeMin,
        @Param("gravidadeMax") Integer gravidadeMax,
        @Param("dataInicio") java.time.LocalDateTime dataInicio,
        @Param("dataFim") java.time.LocalDateTime dataFim,
        Pageable pageable
    );

    /**
     * Conta ocorrências por tipo de problema.
     * 
     * @param bairro filtro por bairro (opcional)
     * @return lista de arrays [TipoProblema, Long] com contagem
     */
    @Query(value = "SELECT o.tipo_problema, COUNT(o.id) FROM ocorrencias o " +
           "WHERE (CAST(:bairro AS VARCHAR) IS NULL OR o.bairro ILIKE '%' || CAST(:bairro AS VARCHAR) || '%') " +
           "AND o.status != 'RESOLVIDO' " +
           "GROUP BY o.tipo_problema " +
           "ORDER BY COUNT(o.id) DESC",
           nativeQuery = true)
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
    @Query(value = "SELECT AVG(o.gravidade) FROM ocorrencias o " +
           "WHERE (CAST(:bairro AS VARCHAR) IS NULL OR o.bairro ILIKE '%' || CAST(:bairro AS VARCHAR) || '%') " +
           "AND o.status != 'RESOLVIDO'",
           nativeQuery = true)
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

    /**
     * Busca ocorrências do mês atual.
     * 
     * @param inicioMes início do mês
     * @param fimMes fim do mês
     * @param pageable paginação e ordenação
     * @return página de ocorrências do mês
     */
    @Query("SELECT o FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicioMes AND o.dataCriacao <= :fimMes " +
           "ORDER BY o.dataCriacao DESC")
    Page<Ocorrencia> findByDataCriacaoBetween(
        @Param("inicioMes") java.time.LocalDateTime inicioMes,
        @Param("fimMes") java.time.LocalDateTime fimMes,
        Pageable pageable
    );

    /**
     * Conta ocorrências no período especificado.
     * 
     * @param inicio início do período
     * @param fim fim do período
     * @return total de ocorrências no período
     */
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim")
    long countByDataCriacaoBetween(
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Conta ocorrências críticas no período especificado.
     * 
     * @param inicio início do período
     * @param fim fim do período
     * @return total de ocorrências críticas no período
     */
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim AND " +
           "o.gravidade >= 8")
    long countCriticasByDataCriacaoBetween(
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Conta ocorrências por status no período especificado.
     * 
     * @param status status da ocorrência
     * @param inicio início do período
     * @param fim fim do período
     * @return total de ocorrências com o status no período
     */
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE " +
           "o.status = :status AND " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim")
    long countByStatusAndDataCriacaoBetween(
        @Param("status") StatusOcorrencia status,
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Calcula a gravidade média no período especificado.
     * 
     * @param inicio início do período
     * @param fim fim do período
     * @return gravidade média ou null se não houver ocorrências
     */
    @Query("SELECT AVG(o.gravidade) FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim AND " +
           "o.gravidade IS NOT NULL")
    Double avgGravidadeByDataCriacaoBetween(
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Conta ocorrências por tipo no período especificado.
     * 
     * @param inicio início do período
     * @param fim fim do período
     * @return lista de arrays [TipoProblema, Long] com contagem
     */
    @Query("SELECT o.tipoProblema, COUNT(o) FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim " +
           "GROUP BY o.tipoProblema " +
           "ORDER BY COUNT(o) DESC")
    List<Object[]> countByTipoProblemaAndDataCriacaoBetween(
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Busca todas as ocorrências do período (sem paginação).
     * 
     * @param inicio início do período
     * @param fim fim do período
     * @return lista de ocorrências do período
     */
    @Query("SELECT o FROM Ocorrencia o WHERE " +
           "o.dataCriacao >= :inicio AND o.dataCriacao <= :fim " +
           "ORDER BY o.dataCriacao DESC")
    List<Ocorrencia> findAllByDataCriacaoBetween(
        @Param("inicio") java.time.LocalDateTime inicio,
        @Param("fim") java.time.LocalDateTime fim
    );

    /**
     * Agrupa ocorrências em grid dinâmico usando PostGIS.
     * Retorna células do grid com contagem e gravidade média.
     * 
     * @param minLat latitude mínima da bounding box
     * @param maxLat latitude máxima da bounding box
     * @param minLng longitude mínima da bounding box
     * @param maxLng longitude máxima da bounding box
     * @param gridSize tamanho do grid em metros (convertido para Web Mercator)
     * @param tipoProblema filtro por tipo (opcional)
     * @param dataInicio data de início do período (opcional)
     * @param dataFim data de fim do período (opcional)
     * @return lista de arrays [center_lng, center_lat, count, avg_gravidade, max_gravidade]
     */
    @Query(value = "SELECT " +
           "ST_X(ST_Centroid(ST_Collect(o.coordenadas))) as center_lng, " +
           "ST_Y(ST_Centroid(ST_Collect(o.coordenadas))) as center_lat, " +
           "COUNT(o.id) as count, " +
           "AVG(o.gravidade) as avg_gravidade, " +
           "MAX(o.gravidade) as max_gravidade " +
           "FROM ocorrencias o " +
           "WHERE ST_Within(o.coordenadas, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)) " +
           "AND (CAST(:tipoProblema AS VARCHAR) IS NULL OR o.tipo_problema = CAST(:tipoProblema AS VARCHAR)) " +
           "AND (CAST(:dataInicio AS TIMESTAMP) IS NULL OR o.data_criacao >= CAST(:dataInicio AS TIMESTAMP)) " +
           "AND (CAST(:dataFim AS TIMESTAMP) IS NULL OR o.data_criacao <= CAST(:dataFim AS TIMESTAMP)) " +
           "GROUP BY ST_SnapToGrid(ST_Transform(o.coordenadas, 3857), :gridSize) " +
           "HAVING COUNT(o.id) > 0 " +
           "ORDER BY count DESC",
           nativeQuery = true)
    List<Object[]> aggregateByGrid(
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        @Param("gridSize") double gridSize,
        @Param("tipoProblema") String tipoProblema,
        @Param("dataInicio") java.time.LocalDateTime dataInicio,
        @Param("dataFim") java.time.LocalDateTime dataFim
    );

    /**
     * Agrupa ocorrências em hexágonos usando PostGIS.
     * Retorna pontos hexagonais com contagem e intensidade.
     * 
     * @param minLat latitude mínima da bounding box
     * @param maxLat latitude máxima da bounding box
     * @param minLng longitude mínima da bounding box
     * @param maxLng longitude máxima da bounding box
     * @param hexSize tamanho do hexágono em graus decimais
     * @param tipoProblema filtro por tipo (opcional)
     * @param dataInicio data de início do período (opcional)
     * @param dataFim data de fim do período (opcional)
     * @return lista de arrays [lng, lat, count, avg_gravidade]
     */
    @Query(value = "SELECT " +
           "ST_X(ST_Centroid(ST_Collect(o.coordenadas))) as lng, " +
           "ST_Y(ST_Centroid(ST_Collect(o.coordenadas))) as lat, " +
           "COUNT(o.id) as count, " +
           "AVG(o.gravidade) as avg_gravidade " +
           "FROM ocorrencias o " +
           "WHERE ST_Within(o.coordenadas, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)) " +
           "AND (CAST(:tipoProblema AS VARCHAR) IS NULL OR o.tipo_problema = CAST(:tipoProblema AS VARCHAR)) " +
           "AND (CAST(:dataInicio AS TIMESTAMP) IS NULL OR o.data_criacao >= CAST(:dataInicio AS TIMESTAMP)) " +
           "AND (CAST(:dataFim AS TIMESTAMP) IS NULL OR o.data_criacao <= CAST(:dataFim AS TIMESTAMP)) " +
           "GROUP BY ST_SnapToGrid(ST_Transform(o.coordenadas, 3857), :hexSize) " +
           "HAVING COUNT(o.id) > 0 " +
           "ORDER BY count DESC",
           nativeQuery = true)
    List<Object[]> aggregateByHexagon(
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        @Param("hexSize") double hexSize,
        @Param("tipoProblema") String tipoProblema,
        @Param("dataInicio") java.time.LocalDateTime dataInicio,
        @Param("dataFim") java.time.LocalDateTime dataFim
    );

    /**
     * Busca ocorrências dentro de uma bounding box.
     * 
     * @param minLat latitude mínima
     * @param maxLat latitude máxima
     * @param minLng longitude mínima
     * @param maxLng longitude máxima
     * @param tipoProblema filtro por tipo (opcional)
     * @param dataInicio data de início do período (opcional)
     * @param dataFim data de fim do período (opcional)
     * @return lista de ocorrências dentro da bounding box
     */
    @Query(value = "SELECT * FROM ocorrencias o WHERE " +
           "ST_Within(o.coordenadas, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)) = true " +
           "AND (CAST(:tipoProblema AS VARCHAR) IS NULL OR o.tipo_problema = CAST(:tipoProblema AS VARCHAR)) " +
           "AND (CAST(:dataInicio AS TIMESTAMP) IS NULL OR o.data_criacao >= CAST(:dataInicio AS TIMESTAMP)) " +
           "AND (CAST(:dataFim AS TIMESTAMP) IS NULL OR o.data_criacao <= CAST(:dataFim AS TIMESTAMP)) " +
           "ORDER BY o.gravidade DESC, o.data_criacao DESC",
           nativeQuery = true)
    List<Ocorrencia> findWithinBoundingBox(
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        @Param("tipoProblema") String tipoProblema,
        @Param("dataInicio") java.time.LocalDateTime dataInicio,
        @Param("dataFim") java.time.LocalDateTime dataFim
    );
}

