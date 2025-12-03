package com.moredevs.mapblu.infraestructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Configuração do RestTemplate para chamadas HTTP externas.
 */
@Configuration
public class RestTemplateConfig {

    @Value("${openrouter.api.timeout:30000}")
    private Long timeout;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(clientHttpRequestFactory());
        return restTemplate;
    }

    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Math.toIntExact(timeout));
        factory.setReadTimeout(Math.toIntExact(timeout));
        return factory;
    }
}


