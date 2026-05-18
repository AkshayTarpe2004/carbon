package com.carbon.carbontracker.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;

import java.util.HashMap;
import java.util.Map;

/**
 * Adds prompt=select_account so both Google and GitHub show their account/authorize screen
 * (same behavior as Google – no instant redirect; user sees provider page first).
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private static final String DEFAULT_AUTHORIZATION_REQUEST_BASE_URI = "/oauth2/authorization";
    private final OAuth2AuthorizationRequestResolver defaultResolver;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                DEFAULT_AUTHORIZATION_REQUEST_BASE_URI
        );
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        String registrationId = extractRegistrationId(request);
        return customize(req, registrationId);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customize(req, clientRegistrationId);
    }

    private String extractRegistrationId(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith(DEFAULT_AUTHORIZATION_REQUEST_BASE_URI + "/")) {
            String afterBase = uri.substring((DEFAULT_AUTHORIZATION_REQUEST_BASE_URI + "/").length());
            int slash = afterBase.indexOf('/');
            return slash > 0 ? afterBase.substring(0, slash) : afterBase;
        }
        return null;
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest req, String clientRegistrationId) {
        if (req == null) return null;
        Map<String, Object> extra = new HashMap<>(req.getAdditionalParameters());
        
        if ("google".equalsIgnoreCase(clientRegistrationId)) {
            // Google: force account chooser
            extra.put("prompt", "select_account");
        } else if ("github".equalsIgnoreCase(clientRegistrationId)) {
            // GitHub: GitHub doesn't support prompt parameter reliably
            // Ensure redirect URI is correct - GitHub will show authorize screen if app not authorized
            // If user is logged in and app is authorized, GitHub redirects immediately (normal OAuth behavior)
        } else {
            // Default: try select_account for other providers
            extra.put("prompt", "select_account");
        }
        
        return OAuth2AuthorizationRequest.from(req)
                .additionalParameters(extra)
                .build();
    }
}
