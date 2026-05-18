package com.carbon.carbontracker.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id:optional}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-id:optional}")
    private String githubClientId;

    /**
     * Comma-separated browser origins, e.g.
     * http://localhost:3000,https://personal-carbon-footprinting.netlify.app
     */
    @Value("${app.cors.allowed-origins:http://localhost:3000,https://personal-carbon-footprinting.netlify.app}")
    private String corsAllowedOrigins;

    private static boolean isOAuthConfigured(String clientId) {
        return clientId != null && !clientId.isBlank() && !"optional".equals(clientId.trim());
    }

    /**
     * Password login / register must not go through oauth2Login (which redirects POST to /login → redirect loop).
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicAuthFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/auth/**")
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"error\":\"Unauthorized\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/health", "/info").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/contact/messages").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/marketplace", "/api/marketplace/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/badge-templates", "/api/badge-templates/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/leaderboard", "/api/leaderboard/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                );

        if (isOAuthConfigured(googleClientId) || isOAuthConfigured(githubClientId)) {
            http.oauth2Login(oauth2 -> oauth2
                    .authorizationEndpoint(auth -> auth
                            .authorizationRequestResolver(
                                    new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository)))
                    .successHandler(oAuth2AuthenticationSuccessHandler)
            );
        }

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = new ArrayList<>();
        for (String origin : corsAllowedOrigins.split(",")) {
            String o = origin.trim();
            if (!o.isEmpty()) {
                origins.add(o);
            }
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With",
                        "X-Public-IP"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
