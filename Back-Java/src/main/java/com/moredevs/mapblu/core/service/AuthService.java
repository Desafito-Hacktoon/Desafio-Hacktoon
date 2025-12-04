package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.User;
import com.moredevs.mapblu.core.dto.request.LoginRequest;
import com.moredevs.mapblu.core.dto.request.RegisterRequest;
import com.moredevs.mapblu.core.dto.response.AuthResponse;
import com.moredevs.mapblu.core.exception.ValidationException;
import com.moredevs.mapblu.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * Serviço para operações de autenticação e autorização.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @org.springframework.beans.factory.annotation.Value("${jwt.expiration:86400000}")
    private Long jwtExpiration;

    /**
     * Registra um novo usuário no sistema.
     * 
     * @param request dados de registro
     * @return resposta de autenticação com token
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email já está em uso");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ValidationException("Username já está em uso");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nomeCompleto(request.getNomeCompleto())
                .ativo(true)
                .role(User.RoleName.ROLE_USER) // Role padrão
                .build();

        user = userRepository.save(user);

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String accessToken = jwtService.generateToken(userPrincipal);

        return buildAuthResponse(user, accessToken);
    }

    /**
     * Autentica um usuário e retorna token.
     * 
     * @param request dados de login
     * @return resposta de autenticação com token
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmailOrUsername(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            log.warn("Credenciais inválidas para: {}", request.getEmailOrUsername());
            throw new ValidationException("Credenciais inválidas");
        }

        User user = userRepository.findByEmailOrUsername(
                request.getEmailOrUsername(),
                request.getEmailOrUsername()
        ).orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String accessToken = jwtService.generateToken(userPrincipal);

        return buildAuthResponse(user, accessToken);
    }

    /**
     * Constrói a resposta de autenticação.
     * 
     * @param user usuário autenticado
     * @param accessToken token de acesso
     * @return resposta de autenticação
     */
    private AuthResponse buildAuthResponse(User user, String accessToken) {
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nomeCompleto(user.getNomeCompleto())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .build();

        long expirationSeconds = (jwtExpiration != null ? jwtExpiration : 86400000L) / 1000;
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expirationSeconds) // Converte para segundos
                .user(userInfo)
                .build();
    }
}

