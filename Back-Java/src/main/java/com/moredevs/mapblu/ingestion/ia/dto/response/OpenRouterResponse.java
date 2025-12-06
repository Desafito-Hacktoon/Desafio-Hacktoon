package com.moredevs.mapblu.ingestion.ia.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para resposta da API do OpenRouter.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenRouterResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("model")
    private String model;
    
    @JsonProperty("choices")
    private List<Choice> choices;
    
    @JsonProperty("error")
    private Error error;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Choice {
        @JsonProperty("message")
        private Message message;
        
        @JsonProperty("finish_reason")
        private String finishReason;
    }
    
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
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Error {
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("code")
        private String code;
    }
}