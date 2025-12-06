package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Implementação de UserDetails para integração com Spring Security.
 */
public class UserPrincipal implements UserDetails {

    private final User user;
    private final UserDetails userDetails;

    private UserPrincipal(User user) {
        this.user = user;
        this.userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole() != null 
                        ? Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
                        : Collections.emptyList())
                .build();
    }

    /**
     * Cria uma instância de UserPrincipal a partir de um User.
     * 
     * @param user entidade User
     * @return UserPrincipal
     */
    public static UserPrincipal create(User user) {
        return new UserPrincipal(user);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return userDetails.getAuthorities();
    }

    @Override
    public String getPassword() {
        return userDetails.getPassword();
    }

    @Override
    public String getUsername() {
        return userDetails.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return userDetails.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return userDetails.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return userDetails.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return userDetails.isEnabled();
    }

    /**
     * Obtém a entidade User.
     * 
     * @return entidade User
     */
    public User getUser() {
        return user;
    }
}

