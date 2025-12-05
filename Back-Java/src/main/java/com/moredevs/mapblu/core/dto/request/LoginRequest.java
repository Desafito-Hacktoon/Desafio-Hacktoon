package com.moredevs.mapblu.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email ou username é obrigatório")
    private String emailOrUsername;

    @NotBlank(message = "Senha é obrigatória")
    private String password;
}

