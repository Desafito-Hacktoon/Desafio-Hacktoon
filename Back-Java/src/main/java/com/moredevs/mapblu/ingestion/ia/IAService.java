package com.moredevs.mapblu.ingestion.ia;

import com.moredevs.mapblu.core.domain.Ocorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.ingestion.ia.exception.IAClassificationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IAService {

    private final OpenRouterClient openRouterClient;
    private static final int GRAVIDADE_PADRAO = 5;

    public Integer classificarGravidade(Ocorrencia ocorrencia) {
        if (ocorrencia == null) {
            return GRAVIDADE_PADRAO;
        }

        if (!openRouterClient.isConfigurado()) {
            return calcularGravidadeFallback(ocorrencia.getDescricao(), ocorrencia.getTipoProblema());
        }

        String descricao = ocorrencia.getDescricao();
        TipoProblema tipoProblema = ocorrencia.getTipoProblema();
        String bairro = ocorrencia.getBairro();

        try {
            return openRouterClient.classificarGravidade(descricao, tipoProblema, bairro);
        } catch (IAClassificationException e) {
            return calcularGravidadeFallback(descricao, tipoProblema);
        } catch (Exception e) {
            return calcularGravidadeFallback(descricao, tipoProblema);
        }
    }

    private Integer calcularGravidadeFallback(String descricao, TipoProblema tipoProblema) {
        return switch (tipoProblema) {
            case POSTE_CAIDO, EROSÃO, ALAGAMENTO, VAZAMENTO_AGUA, ESGOTO -> 8;
            case BURACO, PAVIMENTACAO, ARVORE_CAIDA, DENGUE -> 6;
            case ILUMINACAO, SINALIZACAO, LIXO_ACUMULADO, DRENAGEM -> 5;
            case CALCADA, BOCA_LOBO, LAMPADA_QUEIMADA, LIMPEZA -> 4;
            case PARQUE, MOBILIARIO_URBANO, PODA_ARVORE -> 3;
            default -> 5;
        };
    }

    public boolean isDisponivel() {
        return openRouterClient.isConfigurado();
    }
}
