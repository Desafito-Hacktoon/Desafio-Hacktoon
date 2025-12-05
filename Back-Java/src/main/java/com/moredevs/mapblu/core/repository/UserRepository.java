package com.moredevs.mapblu.core.repository;

import com.moredevs.mapblu.core.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositório para operações de persistência da entidade User.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Busca um usuário por email.
     * 
     * @param email email do usuário
     * @return Optional contendo o usuário se encontrado
     */
    Optional<User> findByEmail(String email);

    /**
     * Busca um usuário por username.
     * 
     * @param username username do usuário
     * @return Optional contendo o usuário se encontrado
     */
    Optional<User> findByUsername(String username);

    /**
     * Verifica se existe um usuário com o email informado.
     * 
     * @param email email a ser verificado
     * @return true se existe um usuário com o email
     */
    boolean existsByEmail(String email);

    /**
     * Verifica se existe um usuário com o username informado.
     * 
     * @param username username a ser verificado
     * @return true se existe um usuário com o username
     */
    boolean existsByUsername(String username);

    /**
     * Busca um usuário por email ou username.
     * 
     * @param email email do usuário
     * @param username username do usuário
     * @return Optional contendo o usuário se encontrado
     */
    @Query("SELECT u FROM User u WHERE u.email = :email OR u.username = :username")
    Optional<User> findByEmailOrUsername(@Param("email") String email, @Param("username") String username);
}

