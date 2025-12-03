package com.moredevs.mapblu.ingestion.ia;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.ingestion.ia.dto.request.OpenRouterRequest;
import com.moredevs.mapblu.ingestion.ia.exception.IAClassificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OpenRouterClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final int maxRetries;
    private final long retryDelayMs;

    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\b([1-9]|10)\\b");
    private static final int MAX_RETRIES_DEFAULT = 2;
    private static final long RETRY_DELAY_MS_DEFAULT = 1000;

    public OpenRouterClient(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${openrouter.api.key:}") String apiKey,
            @Value("${openrouter.api.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${openrouter.api.model:meta-llama/llama-3.2-3b-instruct:free}") String model,
            @Value("${openrouter.api.max-retries:" + MAX_RETRIES_DEFAULT + "}") int maxRetries,
            @Value("${openrouter.api.retry-delay-ms:" + RETRY_DELAY_MS_DEFAULT + "}") long retryDelayMs) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }

    public Integer classificarGravidade(String descricao, TipoProblema tipoProblema, String bairro) {
        if (!isConfigurado()) {
            throw new IAClassificationException("OpenRouter API key não configurada");
        }

        validarParametros(descricao, tipoProblema, bairro);
        String prompt = construirPrompt(descricao, tipoProblema, bairro);
        String responseContent = chamarAPIComRetry(prompt);
        return extrairGravidade(responseContent);
    }

    public boolean isConfigurado() {
        return apiKey != null && !apiKey.isBlank();
    }

    private void validarParametros(String descricao, TipoProblema tipoProblema, String bairro) {
        if (tipoProblema == null) {
            throw new IllegalArgumentException("Tipo de problema não pode ser nulo");
        }
        if (bairro == null || bairro.isBlank()) {
            throw new IllegalArgumentException("Bairro não pode ser nulo ou vazio");
        }
    }

    private String construirPrompt(String descricao, TipoProblema tipoProblema, String bairro) {
        String descricaoFormatada = (descricao != null && !descricao.isBlank()) 
                ? descricao.trim() 
                : "Sem descrição";
        
        return String.format(
            "Classifique a gravidade de 1 a 10:\n" +
            "Tipo: %s\n" +
            "Bairro: %s\n" +
            "Descrição: %s\n\n" +
            "Responda apenas com um número de 1 a 10.",
            tipoProblema.getDescricao(),
            bairro,
            descricaoFormatada
        );
    }

    private String chamarAPIComRetry(String prompt) {
        Exception lastException = null;
        
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    long delay = retryDelayMs * (1L << (attempt - 1));
                    Thread.sleep(delay);
                }
                
                return chamarAPI(prompt);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS && attempt < maxRetries) {
                    lastException = e;
                    continue;
                }
                
                String errorBody = e.getResponseBodyAsString();
                String errorMessage = "Erro do cliente na API OpenRouter: " + e.getStatusCode();
                if (errorBody != null && !errorBody.isBlank()) {
                    errorMessage += " - " + errorBody;
                }
                throw new IAClassificationException(errorMessage, e);
            } catch (HttpServerErrorException e) {
                lastException = e;
                if (attempt == maxRetries) {
                    throw new IAClassificationException(
                        "Erro do servidor na API OpenRouter após " + (maxRetries + 1) + " tentativas", e);
                }
            } catch (ResourceAccessException e) {
                lastException = e;
                if (attempt == maxRetries) {
                    throw new IAClassificationException(
                        "Falha de conexão com OpenRouter após " + (maxRetries + 1) + " tentativas", e);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IAClassificationException("Thread interrompida durante retry", e);
            } catch (RestClientException e) {
                throw new IAClassificationException("Erro ao comunicar com OpenRouter", e);
            }
        }
        
        throw new IAClassificationException(
            "Falha ao classificar após " + (maxRetries + 1) + " tentativas", lastException);
    }

    private String chamarAPI(String prompt) {
        HttpHeaders headers = criarHeaders();
        OpenRouterRequest request = criarRequest(prompt);
        HttpEntity<OpenRouterRequest> entity = new HttpEntity<>(request, headers);

        String url = baseUrl + "/chat/completions";

        try {
            ResponseEntity<String> rawResponse = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            
            String responseBody = rawResponse.getBody();
            
            if (responseBody == null || responseBody.isBlank()) {
                throw new IAClassificationException("Resposta vazia da API OpenRouter");
            }
            
            String content = extrairContentDaResposta(responseBody);
            
            if (content == null || content.isBlank()) {
                throw new IAClassificationException("Conteúdo vazio na resposta da API OpenRouter");
            }
            
            return content;
            
        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            String errorMessage = "Erro " + e.getStatusCode() + " da API OpenRouter";
            if (errorBody != null && !errorBody.isBlank()) {
                errorMessage += ": " + errorBody;
            }
            throw new IAClassificationException(errorMessage, e);
        } catch (IAClassificationException e) {
            throw e;
        } catch (Exception e) {
            throw new IAClassificationException("Erro ao processar resposta da API OpenRouter", e);
        }
    }
    
    @SuppressWarnings("unchecked")
    private String extrairContentDaResposta(String responseBody) {
        try {
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
            
            if (responseMap.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) responseMap.get("error");
                String errorMsg = error != null && error.containsKey("message") 
                        ? (String) error.get("message") 
                        : "Erro desconhecido";
                throw new IAClassificationException("Erro da API OpenRouter: " + errorMsg);
            }
            
            Object choicesObj = responseMap.get("choices");
            if (choicesObj == null || !(choicesObj instanceof java.util.List)) {
                throw new IAClassificationException("Resposta sem campo 'choices' válido");
            }
            
            java.util.List<Object> choices = (java.util.List<Object>) choicesObj;
            if (choices.isEmpty()) {
                throw new IAClassificationException("Lista de choices vazia");
            }
            
            Object firstChoiceObj = choices.get(0);
            if (!(firstChoiceObj instanceof Map)) {
                throw new IAClassificationException("Choice não é um objeto válido");
            }
            
            Map<String, Object> firstChoice = (Map<String, Object>) firstChoiceObj;
            
            Object messageObj = firstChoice.get("message");
            if (messageObj == null || !(messageObj instanceof Map)) {
                throw new IAClassificationException("Message não encontrado ou inválido");
            }
            
            Map<String, Object> message = (Map<String, Object>) messageObj;
            
            Object contentObj = message.get("content");
            if (contentObj == null) {
                throw new IAClassificationException("Campo 'content' não encontrado na resposta");
            }
            
            String content = contentObj.toString().trim();
            
            if (content.isBlank()) {
                throw new IAClassificationException("Conteúdo vazio na resposta");
            }
            
            return content;
            
        } catch (IAClassificationException e) {
            throw e;
        } catch (JsonProcessingException e) {
            throw new IAClassificationException("Erro ao processar resposta JSON", e);
        } catch (Exception e) {
            throw new IAClassificationException("Erro ao extrair conteúdo da resposta", e);
        }
    }

    private HttpHeaders criarHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set("HTTP-Referer", "https://mapblu.com");
        headers.set("X-Title", "Mapblu - Sistema de Ocorrências Municipais");
        return headers;
    }

    private OpenRouterRequest criarRequest(String prompt) {
        OpenRouterRequest.Message message = OpenRouterRequest.Message.builder()
                .role("user")
                .content(prompt)
                .build();

        return OpenRouterRequest.builder()
                .model(model)
                .messages(Collections.singletonList(message))
                .temperature(0.2)
                .maxTokens(50)
                .build();
    }

    private Integer extrairGravidade(String responseContent) {
        if (responseContent == null || responseContent.isBlank()) {
            throw new IAClassificationException("Resposta vazia da IA");
        }

        String content = responseContent.trim();
        
        Matcher matcher = NUMBER_PATTERN.matcher(content);
        if (matcher.find()) {
            try {
                int gravidade = Integer.parseInt(matcher.group(1));
                if (gravidade >= 1 && gravidade <= 10) {
                    return gravidade;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        
        try {
            int gravidade = Integer.parseInt(content);
            if (gravidade >= 1 && gravidade <= 10) {
                return gravidade;
            }
        } catch (NumberFormatException ignored) {
        }
        
        String apenasNumeros = content.replaceAll("[^0-9]", "");
        if (!apenasNumeros.isBlank()) {
            try {
                int gravidade = Integer.parseInt(apenasNumeros);
                if (gravidade >= 1 && gravidade <= 10) {
                    return gravidade;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        throw new IAClassificationException(
            String.format("Não foi possível extrair gravidade válida da resposta: '%s'", content));
    }
}
