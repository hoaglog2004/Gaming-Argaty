package com.argaty.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toLowerCase();
        Object idAttribute = oauth2User.getAttributes().get("id");
        Object subAttribute = oauth2User.getAttributes().get("sub");
        String providerId = idAttribute != null
            ? idAttribute.toString()
            : (subAttribute != null ? subAttribute.toString() : "unknown");

        String email = oauth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            email = providerId + "@" + provider + ".local";
        }

        String fullName = oauth2User.getAttribute("name");
        if (fullName == null || fullName.isBlank()) {
            fullName = oauth2User.getAttribute("given_name");
        }
        if (fullName == null || fullName.isBlank()) {
            fullName = email;
        }

        final String resolvedEmail = email;
        final String resolvedFullName = fullName;

        Optional<User> existingUser = userRepository.findByEmail(resolvedEmail);
        User user;
        if (existingUser.isPresent()) {
            user = updateExistingUser(existingUser.get(), provider, providerId, resolvedFullName);
        } else {
            user = createNewSocialUser(resolvedEmail, resolvedFullName, provider, providerId);
        }

        userRepository.save(user);

        Map<String, Object> mappedAttributes = new HashMap<>(oauth2User.getAttributes());
        mappedAttributes.put("email", user.getEmail());
        mappedAttributes.put("name", user.getFullName());

        return new DefaultOAuth2User(
                java.util.Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                mappedAttributes,
                "email");
    }

    private User updateExistingUser(User user, String provider, String providerId, String fullName) {
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setFullName(fullName);
        user.setIsEnabled(true);
        user.setLastLoginAt(LocalDateTime.now());
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(LocalDateTime.now());
        }

        log.info("OAuth2 login update user: {} via {}", user.getEmail(), provider);
        return user;
    }

    private User createNewSocialUser(String email, String fullName, String provider, String providerId) {
        User user = User.builder()
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

        log.info("OAuth2 created new user: {} via {}", email, provider);
        return user;
    }
}
