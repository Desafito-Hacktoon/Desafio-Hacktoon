package com.moredevs.mapblu.core.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Serviço para geração e validação de tokens JWT.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    /**
     * Extrai o username do token.
     * 
     * @param token token JWT
     * @return username extraído do token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrai uma claim específica do token.
     * 
     * @param token token JWT
     * @param claimsResolver função para extrair a claim
     * @return valor da claim
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Gera um token para o usuário.
     * 
     * @param userDetails detalhes do usuário
     * @return token JWT
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Gera um token com claims extras.
     * 
     * @param extraClaims claims extras a serem incluídas
     * @param userDetails detalhes do usuário
     * @return token JWT
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        long expirationTime = expiration != null ? expiration : 86400000L;
        return buildToken(extraClaims, userDetails, expirationTime);
    }

    /**
     * Constrói um token JWT.
     * 
     * @param extraClaims claims extras
     * @param userDetails detalhes do usuário
     * @param expiration tempo de expiração em milissegundos
     * @return token JWT
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Valida se o token é válido para o usuário.
     * 
     * @param token token JWT
     * @param userDetails detalhes do usuário
     * @return true se o token é válido
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Verifica se o token está expirado.
     * 
     * @param token token JWT
     * @return true se o token está expirado
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extrai a data de expiração do token.
     * 
     * @param token token JWT
     * @return data de expiração
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrai todas as claims do token.
     * 
     * @param token token JWT
     * @return todas as claims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Obtém a chave de assinatura para o JWT.
     * 
     * @return chave secreta
     */
    private SecretKey getSigningKey() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret não configurado. Configure a propriedade jwt.secret");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret deve ter no mínimo 32 caracteres para segurança adequada");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

