package com.moredevs.mapblu.core.repository;

import com.moredevs.mapblu.core.domain.InsightCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository para operações de persistência da entidade InsightCache.
 */
@Repository
public interface InsightCacheRepository extends JpaRepository<InsightCache, UUID> {

    /**
     * Busca insight por hash do contexto.
     */
    Optional<InsightCache> findByHashContexto(String hashContexto);

    /**
     * Busca insights por tipo.
     */
    List<InsightCache> findByTipoInsight(InsightCache.TipoInsight tipoInsight);

    /**
     * Busca insights não expirados por tipo.
     */
    @Query("SELECT i FROM InsightCache i WHERE " +
           "i.tipoInsight = :tipoInsight AND " +
           "(i.dataExpiracao IS NULL OR i.dataExpiracao > :agora)")
    List<InsightCache> findNaoExpiradosPorTipo(
        @Param("tipoInsight") InsightCache.TipoInsight tipoInsight,
        @Param("agora") LocalDateTime agora
    );

    /**
     * Remove insights expirados.
     */
    @Modifying
    @Query("DELETE FROM InsightCache i WHERE i.dataExpiracao IS NOT NULL AND i.dataExpiracao < :agora")
    int deleteExpirados(@Param("agora") LocalDateTime agora);

    /**
     * Invalida insights relacionados a um bairro.
     */
    @Modifying
    @Query(value = "DELETE FROM insights_cache WHERE " +
           "tipo_insight = 'AREA_CRITICA' AND " +
           "CAST(contexto AS text) LIKE CONCAT('%', :bairro, '%')",
           nativeQuery = true)
    int invalidarPorBairro(@Param("bairro") String bairro);

    /**
     * Conta insights por tipo.
     */
    long countByTipoInsight(InsightCache.TipoInsight tipoInsight);
}

