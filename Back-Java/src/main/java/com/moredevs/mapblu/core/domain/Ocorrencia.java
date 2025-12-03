package com.moredevs.mapblu.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade que representa uma ocorrência/problema municipal.
 * Utiliza PostGIS para armazenamento de coordenadas geográficas.
 */
@Entity
@Table(name = "ocorrencias", indexes = {
    @Index(name = "idx_ocorrencias_coordenadas", columnList = "coordenadas"),
    @Index(name = "idx_ocorrencias_bairro", columnList = "bairro"),
    @Index(name = "idx_ocorrencias_tipo", columnList = "tipo_problema"),
    @Index(name = "idx_ocorrencias_gravidade", columnList = "gravidade"),
    @Index(name = "idx_ocorrencias_status", columnList = "status"),
    @Index(name = "idx_ocorrencias_data_criacao", columnList = "data_criacao")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_problema", nullable = false, length = 50)
    @NotNull(message = "Tipo de problema é obrigatório")
    private TipoProblema tipoProblema;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "bairro", nullable = false, length = 100)
    @NotNull(message = "Bairro é obrigatório")
    private String bairro;

    @Column(name = "endereco", columnDefinition = "TEXT")
    private String endereco;

    @Column(name = "coordenadas", columnDefinition = "geometry(Point,4326)", nullable = false)
    @NotNull(message = "Coordenadas são obrigatórias")
    private Point coordenadas;

    @Column(name = "gravidade", nullable = false)
    @Min(value = 1, message = "Gravidade deve ser entre 1 e 10")
    @Max(value = 10, message = "Gravidade deve ser entre 1 e 10")
    @NotNull(message = "Gravidade é obrigatória")
    private Integer gravidade;

    @Column(name = "gravidade_ia")
    @Min(value = 1, message = "Gravidade IA deve ser entre 1 e 10")
    @Max(value = 10, message = "Gravidade IA deve ser entre 1 e 10")
    private Integer gravidadeIA;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    @NotNull(message = "Status é obrigatório")
    @Builder.Default
    private StatusOcorrencia status = StatusOcorrencia.PENDENTE;

    @Column(name = "secretaria_origem", length = 50)
    private String secretariaOrigem;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    /* Informações adicionais da ocorrência */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        dataCriacao = LocalDateTime.now();
        dataAtualizacao = LocalDateTime.now();
        if (metadata == null) {
            metadata = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }

    /**
     * Verifica se a ocorrência está ativa (não resolvida ou cancelada).
     * 
     * @return true se a ocorrência está ativa
     */
    public boolean isAtiva() {
        return status != StatusOcorrencia.RESOLVIDO && status != StatusOcorrencia.CANCELADO;
    }

    /**
     * Verifica se a ocorrência é crítica (gravidade >= 8).
     * 
     * @return true se a ocorrência é crítica
     */
    public boolean isCritica() {
        return gravidade != null && gravidade >= 8;
    }

    /**
     * Adiciona um valor ao metadata.
     * 
     * @param key chave do metadata
     * @param value valor do metadata
     */
    public void addMetadata(String key, Object value) {
        if (metadata == null) {
            metadata = new HashMap<>();
        }
        metadata.put(key, value);
    }

    /**
     * Obtém um valor do metadata.
     * 
     * @param key chave do metadata
     * @return valor do metadata ou null se não existir
     */
    public Object getMetadata(String key) {
        return metadata != null ? metadata.get(key) : null;
    }
}

