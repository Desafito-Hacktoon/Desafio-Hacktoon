package com.moredevs.mapblu.core.domain;

import lombok.Getter;

/**
 * Enum que representa os tipos de problemas/solicitações municipais.
 */
@Getter
public enum TipoProblema {
    BURACO("Buraco na via"),
    PAVIMENTACAO("Pavimentação danificada"),
    SINALIZACAO("Sinalização de trânsito"),
    GUIA_SARJETA("Guia ou sarjeta danificada"),
    PONTE_VIADUTO("Ponte ou viaduto com problemas"),
    
    ILUMINACAO("Iluminação pública"),
    POSTE_CAIDO("Poste de iluminação caído"),
    LAMPADA_QUEIMADA("Lâmpada queimada"),
    
    LIMPEZA("Limpeza urbana"),
    LIXO_ACUMULADO("Lixo acumulado"),
    COLETA_LIXO("Problema na coleta de lixo"),
    PODA_ARVORE("Necessidade de poda de árvore"),
    ARVORE_CAIDA("Árvore caída ou em risco"),
    EROSÃO("Erosão ou deslizamento"),
    DENGUE("Foco de dengue/mosquito"),
    
    DRENAGEM("Problema de drenagem"),
    ALAGAMENTO("Alagamento"),
    VAZAMENTO_AGUA("Vazamento de água"),
    ESGOTO("Problema com esgoto"),
    BOCA_LOBO("Boca de lobo entupida"),
    
    SAUDE("Saúde"),
    ANIMAIS_ABANDONADOS("Animais abandonados"),
    ANIMAIS_SOLTOS("Animais soltos na via"),
    
    TRANSPORTE("Transporte"),
    PARADA_ONIBUS("Parada de ônibus danificada"),
    CICLOVIA("Ciclovia com problemas"),
    CALCADA("Calçada danificada"),
    ACESSIBILIDADE("Problema de acessibilidade"),
    
    SEGURANCA("Segurança pública"),
    AREA_USO_DROGAS("Área de uso de drogas"),
    VANDALISMO("Vandalismo"),
    
    PARQUE("Parque ou praça com problemas"),
    PLAYGROUND("Playground danificado"),
    ACADEMIA_AR_LIVRE("Academia ao ar livre danificada"),
    MOBILIARIO_URBANO("Mobiliário urbano danificado"),
    
    OUTROS("Outros");

    private final String descricao;

    TipoProblema(String descricao) {
        this.descricao = descricao;
    }

    @Override
    public String toString() {
        return descricao;
    }
}

