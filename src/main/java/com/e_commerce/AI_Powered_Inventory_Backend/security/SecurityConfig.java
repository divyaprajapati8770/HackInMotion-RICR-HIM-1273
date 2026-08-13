package com.e_commerce.AI_Powered_Inventory_Backend.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {

    /**
     * Password encoder used for storing and verifying user passwords.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Creates the secret key used for signing and verifying JWTs.
     */
    @Bean
    public SecretKey jwtSecretKey(
            @Value("${jwt.secret}") String secret) {

        return new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );
    }

    /**
     * JWT Encoder.
     *
     * Spring Security 6.x does not provide
     * NimbusJwtEncoder.withSecretKey(...).
     *
     * ImmutableSecret is used instead.
     */
    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(
                new ImmutableSecret<>(jwtSecretKey)
        );
    }

    /**
     * JWT Decoder used by Spring Security to validate
     * incoming Bearer tokens.
     */
    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {

        return NimbusJwtDecoder
                .withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    /**
     * Security configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                /*
                 * JWT-based REST API does not require CSRF protection.
                 */
                .csrf(AbstractHttpConfigurer::disable)

                /*
                 * Do not create HTTP sessions.
                 * Authentication is handled through JWT.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                /*
                 * Endpoint authorization.
                 */
                .authorizeHttpRequests(auth -> auth

                        /*
                         * Public authentication endpoints.
                         */
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/signup",
                                "/api/auth/login"
                        ).permitAll()

                        /*
                         * Swagger / OpenAPI endpoints.
                         */
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        /*
                         * Protected product APIs.
                         */
                        .requestMatchers("/api/products/**")
                        .authenticated()

                        /*
                         * Protected sales APIs.
                         */
                        .requestMatchers("/api/sales/**")
                        .authenticated()

                        /*
                         * Everything else requires authentication.
                         */
                        .anyRequest()
                        .authenticated()
                )

                /*
                 * Tell Spring Security to validate JWT Bearer tokens.
                 */
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> {})
                );

        return http.build();
    }
}