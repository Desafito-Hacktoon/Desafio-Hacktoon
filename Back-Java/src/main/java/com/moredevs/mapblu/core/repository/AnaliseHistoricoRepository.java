package com.moredevs.mapblu.core.repository;

import com.moredevs.mapblu.core.domain.AnaliseHistorico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository para operações de persistência da entidade AnaliseHistorico.
 */
@Repository
public interface AnaliseHistoricoRepository extends JpaRepository<AnaliseHistorico, UUID> {

    /**
     * Busca análises com filtros opcionais.
     */
    @Query("SELECT a FROM AnaliseHistorico a WHERE " +
           "(:tipoAnalise IS NULL OR a.tipoAnalise = :tipoAnalise) AND " +
           "(:sucesso IS NULL OR a.sucesso = :sucesso) AND " +
           "(:dataInicio IS NULL OR a.dataExecucao >= :dataInicio) AND " +
           "(:dataFim IS NULL OR a.dataExecucao <= :dataFim) " +
           "ORDER BY a.dataExecucao DESC")
    Page<AnaliseHistorico> findByFilters(
        @Param("tipoAnalise") AnaliseHistorico.TipoAnalise tipoAnalise,
        @Param("sucesso") Boolean sucesso,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        Pageable pageable
    );

    /**
     * Calcula o total de tokens usados em um período.
     */
    @Query("SELECT COALESCE(SUM(a.tokensUsados), 0) FROM AnaliseHistorico a WHERE " +
           "a.dataExecucao >= :dataInicio AND a.dataExecucao <= :dataFim")
    Long sumTokensUsados(
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim
    );

    /**
     * Calcula o custo total estimado em um período.
     */
    @Query("SELECT COALESCE(SUM(a.custoEstimado), 0) FROM AnaliseHistorico a WHERE " +
           "a.dataExecucao >= :dataInicio AND a.dataExecucao <= :dataFim")
    Double sumCustoEstimado(
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim
    );

    /**
     * Conta análises por tipo.
     */
    long countByTipoAnalise(AnaliseHistorico.TipoAnalise tipoAnalise);

    /**
     * Conta análises bem-sucedidas.
     */
    long countBySucessoTrue();

    /**
     * Conta análises com erro.
     */
    long countBySucessoFalse();
}

