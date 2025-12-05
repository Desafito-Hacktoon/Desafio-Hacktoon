package com.moredevs.mapblu.core.repository;

import com.moredevs.mapblu.core.domain.RelatorioIA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository para operações de persistência da entidade RelatorioIA.
 */
@Repository
public interface RelatorioIARepository extends JpaRepository<RelatorioIA, UUID>, JpaSpecificationExecutor<RelatorioIA> {

    /**
     * Busca o último relatório de um tipo específico.
     */
    @Query("SELECT r FROM RelatorioIA r WHERE " +
           "r.tipoRelatorio = :tipoRelatorio AND " +
           "r.status = 'CONCLUIDO' " +
           "ORDER BY r.dataGeracao DESC")
    Optional<RelatorioIA> findUltimoPorTipo(@Param("tipoRelatorio") RelatorioIA.TipoRelatorio tipoRelatorio);

    /**
     * Busca relatórios em geração (para monitoramento).
     */
    @Query("SELECT r FROM RelatorioIA r WHERE r.status = 'GERANDO' ORDER BY r.dataGeracao ASC")
    List<RelatorioIA> findEmGeracao();

    /**
     * Conta relatórios por tipo.
     */
    long countByTipoRelatorio(RelatorioIA.TipoRelatorio tipoRelatorio);

    /**
     * Conta relatórios por status.
     */
    long countByStatus(RelatorioIA.StatusRelatorio status);
}
