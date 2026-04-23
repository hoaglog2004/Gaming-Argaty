package com.argaty.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LegacyApiDeprecationFilter extends OncePerRequestFilter {

    @Value("${app.api.legacy.deprecation-enabled:true}")
    private boolean deprecationEnabled;

    @Value("${app.api.legacy.sunset-date:2026-12-31}")
    private String sunsetDate;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (deprecationEnabled && uri.startsWith("/api/") && !uri.startsWith("/api/v1/")) {
            response.setHeader("Deprecation", "true");
            response.setHeader("Sunset", sunsetDate + "T23:59:59Z");
            response.setHeader("Link", "</api/v1>; rel=\"successor-version\"");
            response.setHeader("Warning", "299 - \"Legacy API path /api/** is deprecated. Migrate to /api/v1/**\"");
        }

        filterChain.doFilter(request, response);
    }
 }
