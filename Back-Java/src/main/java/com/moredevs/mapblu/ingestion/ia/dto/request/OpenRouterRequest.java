package com.moredevs.mapblu.ingestion.ia.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para requisição à API do OpenRouter.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenRouterRequest {
    
    @JsonProperty("model")
    private String model;
    
    @JsonProperty("messages")
    private List<Message> messages;
    
    @JsonProperty("temperature")
    private Double temperature;
    
    @JsonProperty("max_tokens")
    private Integer maxTokens;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        @JsonProperty("role")
        private String role;
        
        @JsonProperty("content")
        private String content;
    }
}


