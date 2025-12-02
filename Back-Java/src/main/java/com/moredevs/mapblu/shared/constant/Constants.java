package com.moredevs.mapblu.shared.constant;

/**
 * Constantes do sistema.
 */
public final class Constants {

    private Constants() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }

    /**
     * Constantes de validação.
     */
    public static final class Validation {
        public static final int GRAVIDADE_MIN = 1;
        public static final int GRAVIDADE_MAX = 10;
        public static final int GRAVIDADE_CRITICA = 8;
        public static final int BAIRRO_MAX_LENGTH = 100;
        public static final int TIPO_PROBLEMA_MAX_LENGTH = 50;
        public static final int SECRETARIA_MAX_LENGTH = 50;
        
        private Validation() {}
    }

    /**
     * Constantes de cache.
     */
    public static final class Cache {
        public static final String CACHE_OCORRENCIAS = "ocorrencias";
        public static final String CACHE_STATS = "stats";
        public static final String CACHE_HEATMAP = "heatmap";
        public static final String CACHE_BAIRROS_CRITICOS = "bairros-criticos";
        
        // TTLs em segundos
        public static final long TTL_OCORRENCIAS = 300; // 5 minutos
        public static final long TTL_STATS = 60; // 1 minuto
        public static final long TTL_HEATMAP = 300; // 5 minutos
        public static final long TTL_BAIRROS_CRITICOS = 600; // 10 minutos
        
        private Cache() {}
    }

    /**
     * Constantes geoespaciais.
     */
    public static final class Geo {
        public static final int SRID_WGS84 = 4326;
        public static final double EARTH_RADIUS_METERS = 6371000.0;
        
        // Coordenadas de Blumenau, SC
        public static final double BLUMENAU_LATITUDE = -26.5510;
        public static final double BLUMENAU_LONGITUDE = -49.0258;
        
        // Raio padrão para buscas próximas (em metros)
        public static final double DEFAULT_SEARCH_RADIUS = 5000.0; // 5km
        
        private Geo() {}
    }

    /**
     * Constantes de paginação.
     */
    public static final class Pagination {
        public static final int DEFAULT_PAGE = 0;
        public static final int DEFAULT_SIZE = 20;
        public static final int MAX_SIZE = 100;
        public static final String DEFAULT_SORT = "dataCriacao";
        public static final String DEFAULT_DIRECTION = "DESC";
        
        private Pagination() {}
    }
}

