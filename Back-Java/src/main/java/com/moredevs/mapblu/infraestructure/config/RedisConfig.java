package com.moredevs.mapblu.infraestructure.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

import static com.moredevs.mapblu.shared.constant.Constants.Cache.*;

/**
 * Configuração do Redis para cache.
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Configura o CacheManager do Redis com diferentes TTLs por cache.
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(TTL_OCORRENCIAS))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration(CACHE_OCORRENCIAS, defaultConfig.entryTtl(Duration.ofSeconds(TTL_OCORRENCIAS)))
                .withCacheConfiguration(CACHE_STATS, defaultConfig.entryTtl(Duration.ofSeconds(TTL_STATS)))
                .withCacheConfiguration(CACHE_HEATMAP, defaultConfig.entryTtl(Duration.ofSeconds(TTL_HEATMAP)))
                .withCacheConfiguration(CACHE_BAIRROS_CRITICOS, defaultConfig.entryTtl(Duration.ofSeconds(TTL_BAIRROS_CRITICOS)))
                .transactionAware()
                .build();
    }
}

