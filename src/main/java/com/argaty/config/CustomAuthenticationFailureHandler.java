package com.argaty.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.argaty.entity.User;
import com.argaty.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final UserRepository userRepository;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String target = "/auth/login?error=true";

        if (exception instanceof LockedException) {
            String email = request.getParameter("email");
            String reason = null;
            if (StringUtils.hasText(email)) {
                reason = userRepository.findByEmail(email.trim())
                        .map(User::getBanReason)
                        .filter(StringUtils::hasText)
                        .orElse(null);
            }

            if (StringUtils.hasText(reason)) {
                target = "/auth/login?banned=true&reason=" + URLEncoder.encode(reason, StandardCharsets.UTF_8);
            } else {
                target = "/auth/login?banned=true";
            }
        } else if (exception instanceof DisabledException) {
            target = "/auth/login?disabled=true";
        }

        log.warn("Authentication failed: {} -> {}", exception.getClass().getSimpleName(), target);
        response.sendRedirect(request.getContextPath() + target);
    }
}
