package com.moredevs.mapblu.core.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Serviço responsável por parsear e validar respostas da IA.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResponseParser {

    private final ObjectMapper objectMapper;

    /**
     * Parseia a resposta da IA e extrai o JSON estruturado.
     */
    public Map<String, Object> parsearRespostaRelatorio(String respostaIA) {
        try {
            String jsonStr = extrairJSON(respostaIA);
            
            // Log da resposta para debug (apenas primeiros 500 caracteres)
            if (log.isDebugEnabled()) {
                String preview = jsonStr.length() > 500 ? jsonStr.substring(0, 500) + "..." : jsonStr;
                log.debug("Tentando parsear JSON (preview): {}", preview);
            }
            
            // Tenta parsear o JSON
            JsonNode jsonNode = objectMapper.readTree(jsonStr);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> resultado = objectMapper.convertValue(jsonNode, Map.class);
            
            validarEstruturaBasica(resultado);
            
            return resultado;
            
        } catch (JsonProcessingException e) {
            log.error("Erro ao parsear resposta da IA: {}", e.getMessage());
            log.error("Resposta recebida (primeiros 1000 chars): {}", 
                respostaIA != null && respostaIA.length() > 1000 
                    ? respostaIA.substring(0, 1000) + "..." 
                    : respostaIA);
            
            // Tenta criar uma resposta padrão em caso de erro
            try {
                return criarRespostaPadrao(respostaIA);
            } catch (Exception fallbackError) {
                log.error("Erro ao criar resposta padrão: {}", fallbackError.getMessage());
                throw new IllegalArgumentException("Resposta da IA não é um JSON válido: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("Erro inesperado ao parsear resposta: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar resposta da IA", e);
        }
    }
    
    /**
     * Cria uma resposta padrão quando o JSON não pode ser parseado.
     */
    private Map<String, Object> criarRespostaPadrao(String respostaIA) {
        Map<String, Object> respostaPadrao = new HashMap<>();
        
        // Tenta extrair informações básicas mesmo sem JSON válido
        String textoLimpo = sanitizarTexto(respostaIA);
        
        respostaPadrao.put("resumoExecutivo", 
            textoLimpo.length() > 500 ? textoLimpo.substring(0, 500) + "..." : textoLimpo);
        respostaPadrao.put("principaisAchados", new ArrayList<>());
        respostaPadrao.put("areasCriticas", new HashMap<>());
        respostaPadrao.put("recomendacoes", new ArrayList<>());
        respostaPadrao.put("insights", new ArrayList<>());
        respostaPadrao.put("observacao", "Resposta da IA parseada como texto devido a erro de formatação JSON");
        
        log.warn("Criada resposta padrão devido a erro de parsing");
        
        return respostaPadrao;
    }

    /**
     * Extrai JSON de uma string que pode conter markdown ou texto adicional.
     * Melhorado para lidar com respostas que contêm texto antes/depois do JSON.
     */
    private String extrairJSON(String resposta) {
        if (resposta == null || resposta.trim().isEmpty()) {
            throw new IllegalArgumentException("Resposta da IA está vazia");
        }
        
        String limpa = resposta.trim();
        
        // Remove markdown code blocks
        if (limpa.startsWith("```json")) {
            limpa = limpa.substring(7).trim();
        } else if (limpa.startsWith("```")) {
            limpa = limpa.substring(3).trim();
        }
        
        if (limpa.endsWith("```")) {
            limpa = limpa.substring(0, limpa.length() - 3).trim();
        }
        
        // Procura pelo primeiro { e tenta encontrar o JSON válido completo
        int primeiroBrace = limpa.indexOf('{');
        
        if (primeiroBrace < 0) {
            log.warn("Nenhum caractere '{' encontrado na resposta");
            throw new IllegalArgumentException("Nenhum JSON encontrado na resposta da IA");
        }
        
        // Encontra o JSON completo contando chaves balanceadas
        int nivelAninhamento = 0;
        int ultimoBrace = -1;
        boolean dentroString = false;
        boolean escapeProximo = false;
        
        for (int i = primeiroBrace; i < limpa.length(); i++) {
            char c = limpa.charAt(i);
            
            if (escapeProximo) {
                escapeProximo = false;
                continue;
            }
            
            if (c == '\\') {
                escapeProximo = true;
                continue;
            }
            
            if (c == '"' && !escapeProximo) {
                dentroString = !dentroString;
                continue;
            }
            
            if (!dentroString) {
                if (c == '{') {
                    nivelAninhamento++;
                } else if (c == '}') {
                    nivelAninhamento--;
                    if (nivelAninhamento == 0) {
                        ultimoBrace = i;
                        break;
                    }
                }
            }
        }
        
        if (ultimoBrace < 0 || ultimoBrace <= primeiroBrace) {
            log.warn("Não foi possível encontrar JSON completo balanceado");
            // Tenta usar o último } encontrado mesmo assim
            ultimoBrace = limpa.lastIndexOf('}');
            if (ultimoBrace <= primeiroBrace) {
                throw new IllegalArgumentException("JSON incompleto ou malformado na resposta da IA");
            }
        }
        
        String jsonExtraido = limpa.substring(primeiroBrace, ultimoBrace + 1);
        
        // Validação: tenta parsear para garantir que é JSON válido
        try {
            objectMapper.readTree(jsonExtraido);
            return jsonExtraido;
        } catch (JsonProcessingException e) {
            log.warn("JSON extraído não é válido, tentando limpar: {}", e.getMessage());
            // Tenta limpar caracteres problemáticos
            jsonExtraido = limparJSON(jsonExtraido);
            try {
                objectMapper.readTree(jsonExtraido);
                return jsonExtraido;
            } catch (JsonProcessingException e2) {
                log.error("JSON ainda inválido após limpeza: {}", e2.getMessage());
                throw new IllegalArgumentException("Não foi possível extrair JSON válido da resposta da IA", e2);
            }
        }
    }
    
    /**
     * Tenta limpar JSON removendo caracteres problemáticos comuns.
     */
    private String limparJSON(String json) {
        // Remove caracteres de controle
        String limpo = json.replaceAll("[\\x00-\\x1F\\x7F]", "");
        
        // Remove espaços em branco problemáticos entre chaves e valores
        limpo = limpo.replaceAll("\\s*:\\s*", ":");
        limpo = limpo.replaceAll(",\\s*", ",");
        
        // Garante que strings estejam entre aspas
        // Esta é uma limpeza básica - pode não resolver todos os casos
        return limpo;
    }

    /**
     * Valida estrutura básica do JSON parseado.
     */
    private void validarEstruturaBasica(Map<String, Object> resultado) {
        if (!resultado.containsKey("resumoExecutivo")) {
            log.warn("Resposta da IA não contém 'resumoExecutivo'");
        }
        
        if (!resultado.containsKey("recomendacoes")) {
            log.warn("Resposta da IA não contém 'recomendacoes'");
        }
        
        // Garante que arrays existam mesmo se vazios
        if (!resultado.containsKey("principaisAchados")) {
            resultado.put("principaisAchados", new ArrayList<>());
        }
        if (!resultado.containsKey("areasCriticas")) {
            resultado.put("areasCriticas", new ArrayList<>());
        }
        if (!resultado.containsKey("recomendacoes")) {
            resultado.put("recomendacoes", new ArrayList<>());
        }
        if (!resultado.containsKey("insights")) {
            resultado.put("insights", new ArrayList<>());
        }
    }

    /**
     * Sanitiza texto removendo caracteres problemáticos.
     */
    public String sanitizarTexto(String texto) {
        if (texto == null) {
            return "";
        }
        
        return texto.replaceAll("[\\x00-\\x1F\\x7F]", "")
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\r", "\n")
                .trim();
    }

    /**
     * Trunca texto se exceder limite.
     */
    public String truncarTexto(String texto, int limite) {
        if (texto == null) {
            return "";
        }
        if (texto.length() <= limite) {
            return texto;
        }
        return texto.substring(0, limite - 3) + "...";
    }
}

