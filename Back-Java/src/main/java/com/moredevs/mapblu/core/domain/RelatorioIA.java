package com.moredevs.mapblu.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade que representa um relatório gerado automaticamente pela IA.
 * Armazena relatórios diários, semanais, mensais e customizados.
 */
@Entity
@Table(name = "relatorios_ia", indexes = {
    @Index(name = "idx_relatorios_tipo", columnList = "tipo_relatorio"),
    @Index(name = "idx_relatorios_periodo", columnList = "periodo_inicio, periodo_fim"),
    @Index(name = "idx_relatorios_status", columnList = "status"),
    @Index(name = "idx_relatorios_data_geracao", columnList = "data_geracao")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RelatorioIA {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_relatorio", nullable = false, length = 50)
    @NotNull(message = "Tipo de relatório é obrigatório")
    private TipoRelatorio tipoRelatorio;

    @Column(name = "periodo_inicio", nullable = false)
    @NotNull(message = "Período de início é obrigatório")
    private LocalDateTime periodoInicio;

    @Column(name = "periodo_fim", nullable = false)
    @NotNull(message = "Período de fim é obrigatório")
    private LocalDateTime periodoFim;

    @Column(name = "titulo", nullable = false, length = 255)
    @NotNull(message = "Título é obrigatório")
    private String titulo;

    @Column(name = "resumo_executivo", columnDefinition = "TEXT")
    private String resumoExecutivo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conteudo_completo", nullable = false, columnDefinition = "jsonb")
    @NotNull(message = "Conteúdo completo é obrigatório")
    @Builder.Default
    private Map<String, Object> conteudoCompleto = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metricas_calculadas", columnDefinition = "jsonb")
    private Map<String, Object> metricasCalculadas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "areas_criticas", columnDefinition = "jsonb")
    private Map<String, Object> areasCriticas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recomendacoes", columnDefinition = "jsonb")
    private Map<String, Object> recomendacoes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filtros_aplicados", columnDefinition = "jsonb")
    private Map<String, Object> filtrosAplicados;

    @Column(name = "modelo_ia_usado", length = 50)
    private String modeloIAUsado;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status é obrigatório")
    @Builder.Default
    private StatusRelatorio status = StatusRelatorio.GERANDO;

    @Column(name = "data_geracao", nullable = false, updatable = false)
    private LocalDateTime dataGeracao;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "tempo_processamento_ms")
    private Integer tempoProcessamentoMs;

    @Column(name = "usuario_solicitante", length = 100)
    private String usuarioSolicitante;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        dataGeracao = LocalDateTime.now();
        if (status == null) {
            status = StatusRelatorio.GERANDO;
        }
        if (conteudoCompleto == null) {
            conteudoCompleto = new HashMap<>();
        }
        if (metadata == null) {
            metadata = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (status == StatusRelatorio.CONCLUIDO && dataConclusao == null) {
            dataConclusao = LocalDateTime.now();
        }
    }

    /**
     * Enum para tipos de relatório.
     */
    public enum TipoRelatorio {
        DIARIO,
        SEMANAL,
        MENSAL,
        CUSTOMIZADO
    }

    /**
     * Enum para status do relatório.
     */
    public enum StatusRelatorio {
        GERANDO,
        CONCLUIDO,
        ERRO
    }
}

