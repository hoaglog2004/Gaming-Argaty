package com.argaty.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.argaty.entity.User;
import com.argaty.enums.Role;
import com.argaty.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOidcUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = new OidcUserService().loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toLowerCase();
        String providerId = oidcUser.getSubject();

        String email = oidcUser.getEmail();
        if (email == null || email.isBlank()) {
            email = providerId + "@" + provider + ".local";
        }

        String fullName = oidcUser.getFullName();
        if (fullName == null || fullName.isBlank()) {
            fullName = oidcUser.getGivenName();
        }
        if (fullName == null || fullName.isBlank()) {
            fullName = email;
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setFullName(fullName);
            user.setIsEnabled(true);
            user.setLastLoginAt(LocalDateTime.now());
            if (user.getEmailVerifiedAt() == null) {
                user.setEmailVerifiedAt(LocalDateTime.now());
            }
            log.info("OIDC login update user: {} via {}", user.getEmail(), provider);
        } else {
            user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .isEnabled(true)
                    .isBanned(false)
                    .provider(provider)
                    .providerId(providerId)
                    .emailVerifiedAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            log.info("OIDC created new user: {} via {}", email, provider);
        }

        userRepository.save(user);

        Map<String, Object> mergedClaims = new HashMap<>(oidcUser.getClaims());
        mergedClaims.put("email", user.getEmail());
        mergedClaims.put("name", user.getFullName());

        OidcUserInfo userInfo = new OidcUserInfo(mergedClaims);

        return new DefaultOidcUser(
                java.util.Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                oidcUser.getIdToken(),
                userInfo,
                "email");
    }
}
