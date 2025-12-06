package com.moredevs.mapblu.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade que armazena cache de insights gerados pela IA.
 * Usado para evitar reprocessamento e melhorar performance.
 */
@Entity
@Table(name = "insights_cache", indexes = {
    @Index(name = "idx_insights_tipo", columnList = "tipo_insight"),
    @Index(name = "idx_insights_hash", columnList = "hash_contexto"),
    @Index(name = "idx_insights_expiracao", columnList = "data_expiracao"),
    @Index(name = "idx_insights_relevancia", columnList = "relevancia")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InsightCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_insight", nullable = false, length = 50)
    @NotNull(message = "Tipo de insight é obrigatório")
    private TipoInsight tipoInsight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "contexto", nullable = false, columnDefinition = "jsonb")
    @NotNull(message = "Contexto é obrigatório")
    @Builder.Default
    private Map<String, Object> contexto = new HashMap<>();

    @Column(name = "insight_texto", nullable = false, columnDefinition = "TEXT")
    @NotNull(message = "Texto do insight é obrigatório")
    private String insightTexto;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_suporte", columnDefinition = "jsonb")
    private Map<String, Object> dadosSuporte;

    @Column(name = "confianca", precision = 3, scale = 2)
    private BigDecimal confianca;

    @Column(name = "relevancia")
    private Integer relevancia;

    @Column(name = "modelo_ia_usado", length = 50)
    private String modeloIAUsado;

    @Column(name = "data_geracao", nullable = false, updatable = false)
    private LocalDateTime dataGeracao;

    @Column(name = "data_expiracao")
    private LocalDateTime dataExpiracao;

    @Column(name = "hash_contexto", nullable = false, unique = true, length = 64)
    @NotNull(message = "Hash do contexto é obrigatório")
    private String hashContexto;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        dataGeracao = LocalDateTime.now();
        if (contexto == null) {
            contexto = new HashMap<>();
        }
        if (metadata == null) {
            metadata = new HashMap<>();
        }
    }

    /**
     * Verifica se o insight está expirado.
     */
    public boolean isExpirado() {
        return dataExpiracao != null && LocalDateTime.now().isAfter(dataExpiracao);
    }

    /**
     * Enum para tipos de insight.
     */
    public enum TipoInsight {
        AREA_CRITICA,
        TENDENCIA,
        PADRAO,
        PREDICAO,
        EXPLICACAO
    }
}

