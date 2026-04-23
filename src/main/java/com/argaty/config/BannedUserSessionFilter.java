package com.argaty.config;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.argaty.entity.User;
import com.argaty.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class BannedUserSessionFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authentication.getName();
        if (!StringUtils.hasText(email)) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || (!Boolean.TRUE.equals(user.getIsBanned()) && Boolean.TRUE.equals(user.getIsEnabled()))) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        String uri = request.getRequestURI();
        log.warn("Force logout banned/disabled user: {} at {}", email, uri);

        if (uri != null && uri.startsWith("/api/")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"success\":false,\"message\":\"Tài khoản đã bị khóa hoặc bị ban\"}");
            return;
        }

        response.sendRedirect(request.getContextPath() + "/auth/login?banned=true");
    }
}
