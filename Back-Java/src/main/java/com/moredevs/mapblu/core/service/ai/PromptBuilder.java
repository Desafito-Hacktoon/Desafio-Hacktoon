package com.moredevs.mapblu.core.service.ai;

import com.moredevs.mapblu.core.dto.response.MetricasAgregadasResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Serviço responsável por construir prompts estruturados para a IA.
 */
@Slf4j
@Component
public class PromptBuilder {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Constrói o prompt para geração de relatório executivo.
     */
    public String construirPromptRelatorio(
            MetricasAgregadasResponse metricas,
            java.time.LocalDateTime periodoInicio,
            java.time.LocalDateTime periodoFim) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("Você é um analista especializado em gestão pública municipal. ");
        prompt.append("Analise os dados de ocorrências de Blumenau e gere um relatório executivo completo e acionável.\n\n");

        prompt.append("DADOS DO PERÍODO ");
        prompt.append(periodoInicio.format(DATE_FORMATTER));
        prompt.append(" até ");
        prompt.append(periodoFim.format(DATE_FORMATTER));
        prompt.append(":\n\n");

        prompt.append("- Total de ocorrências: ").append(metricas.getTotalOcorrencias()).append("\n");
        prompt.append("- Período anterior: ").append(metricas.getTotalOcorrenciasPeriodoAnterior());
        if (metricas.getVariacaoPercentual() != null) {
            prompt.append(" (variação: ");
            if (metricas.getVariacaoPercentual() > 0) {
                prompt.append("+");
            }
            prompt.append(String.format("%.1f%%", metricas.getVariacaoPercentual()));
            prompt.append(")");
        }
        prompt.append("\n");

        prompt.append("- Gravidade média: ").append(String.format("%.1f", metricas.getGravidadeMedia())).append("\n");
        prompt.append("- Gravidade máxima: ").append(metricas.getGravidadeMaxima()).append("\n");
        prompt.append("- Gravidade mínima: ").append(metricas.getGravidadeMinima()).append("\n\n");

        if (metricas.getTopBairrosCriticos() != null && !metricas.getTopBairrosCriticos().isEmpty()) {
            prompt.append("TOP 5 BAIRROS CRÍTICOS:\n");
            metricas.getTopBairrosCriticos().stream()
                    .limit(5)
                    .forEach(bairro -> {
                        prompt.append("- ").append(bairro.get("bairro"))
                                .append(": ").append(bairro.get("total"))
                                .append(" ocorrências, gravidade média ")
                                .append(bairro.get("gravidadeMedia"))
                                .append(", máxima ").append(bairro.get("gravidadeMaxima"))
                                .append("\n");
                    });
            prompt.append("\n");
        }

        if (metricas.getDistribuicaoPorTipo() != null && !metricas.getDistribuicaoPorTipo().isEmpty()) {
            prompt.append("TIPOS DE PROBLEMAS MAIS FREQUENTES:\n");
            metricas.getDistribuicaoPorTipo().stream()
                    .limit(5)
                    .forEach(tipo -> {
                        prompt.append("- ").append(tipo.get("tipoProblema"))
                                .append(": ").append(tipo.get("total"))
                                .append(" (").append(tipo.get("percentual")).append("%)\n");
                    });
            prompt.append("\n");
        }

        if (metricas.getPadroesTemporais() != null) {
            prompt.append("PADRÕES TEMPORAIS:\n");
            Map<String, Object> padroes = metricas.getPadroesTemporais();
            if (padroes.containsKey("diaMaisCritico")) {
                prompt.append("- Dia da semana mais crítico: ").append(padroes.get("diaMaisCritico")).append("\n");
            }
            if (padroes.containsKey("horaMaisCritica")) {
                prompt.append("- Hora mais crítica: ").append(padroes.get("horaMaisCritica")).append("h\n");
            }
            prompt.append("\n");
        }

        if (metricas.getAreasCriticas() != null && !metricas.getAreasCriticas().isEmpty()) {
            prompt.append("ÁREAS CRÍTICAS IDENTIFICADAS:\n");
            metricas.getAreasCriticas().stream()
                    .limit(5)
                    .forEach(area -> {
                        prompt.append("- ").append(area.get("bairro"))
                                .append(": ").append(area.get("totalCriticas"))
                                .append(" ocorrências críticas\n");
                    });
            prompt.append("\n");
        }

        prompt.append("INSTRUÇÕES:\n");
        prompt.append("1. Identifique os principais padrões e tendências nos dados\n");
        prompt.append("2. Explique o que os dados indicam sobre a situação da cidade\n");
        prompt.append("3. Identifique áreas críticas que requerem atenção imediata\n");
        prompt.append("4. Forneça 5-10 recomendações acionáveis priorizadas\n");
        prompt.append("5. Destaque insights não óbvios que possam ser úteis para gestão\n\n");

        prompt.append("FORMATO DE RESPOSTA (JSON estruturado):\n");
        prompt.append("{\n");
        prompt.append("  \"resumoExecutivo\": \"texto de 2-3 parágrafos resumindo a situação\",\n");
        prompt.append("  \"principaisAchados\": [\"lista de strings com principais descobertas\"],\n");
        prompt.append("  \"areasCriticas\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"bairro\": \"nome do bairro\",\n");
        prompt.append("      \"tipoProblema\": \"tipo principal\",\n");
        prompt.append("      \"gravidadeMedia\": 8.5,\n");
        prompt.append("      \"totalOcorrencias\": 45,\n");
        prompt.append("      \"razao\": \"explicação do porquê é crítica\"\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"tendencias\": {\n");
        prompt.append("    \"crescimento\": \"descrição da tendência de crescimento/redução\",\n");
        prompt.append("    \"padroesTemporais\": \"descrição de padrões temporais identificados\",\n");
        prompt.append("    \"correlacoes\": \"descrição de correlações interessantes\"\n");
        prompt.append("  },\n");
        prompt.append("  \"recomendacoes\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"prioridade\": \"alta|media|baixa\",\n");
        prompt.append("      \"acao\": \"descrição clara da ação recomendada\",\n");
        prompt.append("      \"justificativa\": \"por que esta ação é importante\",\n");
        prompt.append("      \"impactoEsperado\": \"descrição do impacto esperado\"\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"insights\": [\"lista de insights não óbvios que podem ser úteis\"]\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional antes ou depois.");

        return prompt.toString();
    }

    /**
     * Constrói o prompt do sistema (contexto adicional).
     */
    public String construirPromptSistema() {
        return "Você é um assistente especializado em análise de dados municipais. " +
                "Sua função é analisar dados de ocorrências urbanas e gerar relatórios executivos " +
                "clara, objetiva e acionável para gestores públicos. " +
                "Sempre responda em português brasileiro e forneça análises baseadas em dados concretos.";
    }
}

