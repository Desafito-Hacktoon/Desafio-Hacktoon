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
 * Entidade que armazena histórico de análises realizadas pela IA.
 * Usado para auditoria, aprendizado e monitoramento de custos.
 */
@Entity
@Table(name = "analises_historico", indexes = {
    @Index(name = "idx_analises_tipo", columnList = "tipo_analise"),
    @Index(name = "idx_analises_data", columnList = "data_execucao"),
    @Index(name = "idx_analises_sucesso", columnList = "sucesso")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnaliseHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_analise", nullable = false, length = 50)
    @NotNull(message = "Tipo de análise é obrigatório")
    private TipoAnalise tipoAnalise;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entrada_dados", nullable = false, columnDefinition = "jsonb")
    @NotNull(message = "Dados de entrada são obrigatórios")
    @Builder.Default
    private Map<String, Object> entradaDados = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "saida_ia", nullable = false, columnDefinition = "jsonb")
    @NotNull(message = "Saída da IA é obrigatória")
    @Builder.Default
    private Map<String, Object> saidaIA = new HashMap<>();

    @Column(name = "prompt_usado", columnDefinition = "TEXT")
    private String promptUsado;

    @Column(name = "modelo_ia_usado", length = 50)
    private String modeloIAUsado;

    @Column(name = "tempo_resposta_ms")
    private Integer tempoRespostaMs;

    @Column(name = "tokens_usados")
    private Integer tokensUsados;

    @Column(name = "custo_estimado", precision = 10, scale = 6)
    private BigDecimal custoEstimado;

    @Column(name = "sucesso", nullable = false)
    @Builder.Default
    private Boolean sucesso = true;

    @Column(name = "erro_mensagem", columnDefinition = "TEXT")
    private String erroMensagem;

    @Column(name = "data_execucao", nullable = false, updatable = false)
    private LocalDateTime dataExecucao;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        dataExecucao = LocalDateTime.now();
        if (sucesso == null) {
            sucesso = true;
        }
        if (entradaDados == null) {
            entradaDados = new HashMap<>();
        }
        if (saidaIA == null) {
            saidaIA = new HashMap<>();
        }
        if (metadata == null) {
            metadata = new HashMap<>();
        }
    }

    /**
     * Enum para tipos de análise.
     */
    public enum TipoAnalise {
        RELATORIO,
        INSIGHT,
        CLASSIFICACAO
    }
}

