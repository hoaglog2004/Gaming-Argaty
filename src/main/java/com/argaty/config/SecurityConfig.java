package com.argaty.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.argaty.entity.User;
import com.argaty.service.CustomOAuth2UserService;
import com.argaty.service.CustomOidcUserService;
import com.argaty.service.JwtTokenService;
import com.argaty.service.UserService;

/**
 * Cấu hình Spring Security
 * Tạm thời cho phép tất cả - sẽ hoàn thiện ở bước sau
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Password Encoder sử dụng BCrypt
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cấu hình Security Filter Chain
     * TẠM THỜI: Cho phép tất cả để test
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtAuthenticationFilter,
                                           CustomOAuth2UserService customOAuth2UserService,
                                           CustomOidcUserService customOidcUserService,
                                           JwtTokenService jwtTokenService,
                                           UserService userService) throws Exception {
        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            
            // Cấu hình authorize requests (cho phép khách xem toàn bộ site)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/home",
                    "/products/**",
                    "/about",
                    "/contact",
                    "/faq",
                    "/policy/**",
                    "/cart",
                    "/wishlist",
                    "/static/**",
                    "/uploads/**",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    // Legacy API (deprecated compatibility mode)
                    "/api/auth/**",
                    "/api/public/**",
                    "/api/cart/**",
                    "/api/products/**",
                    "/api/reviews/**",
                    "/api/shipping/**",
                    "/api/files/**",
                    "/api/payments/callback/**",
                    // Primary API v1
                    "/api/v1/auth/**",
                    "/api/v1/public/**",
                    "/api/v1/cart/**",
                    "/api/v1/products/**",
                    "/api/v1/reviews/**",
                    "/api/v1/shipping/**",
                    "/api/v1/files/**",
                    "/api/v1/payments/callback/**"
                ).permitAll()

                // Chat routes (allow guest chat widget)
                .requestMatchers("/api/v1/chat/**", "/api/chat/**").permitAll()

                // API admin routes - allow any authenticated user for chat endpoints
                .requestMatchers("/api/v1/admin/chat/**", "/api/admin/chat/**").authenticated()
                .requestMatchers("/api/v1/admin/**", "/api/admin/**").hasAnyRole("STAFF", "ADMIN")

                // Admin routes - yêu cầu role ADMIN
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // Staff routes - yêu cầu role STAFF hoặc ADMIN
                .requestMatchers("/staff/**").hasAnyRole("STAFF", "ADMIN")

                // User routes - yêu cầu đăng nhập
                .requestMatchers("/profile/**", "/checkout/**").authenticated()

                // Các request khác: cho phép tất cả (khách không cần đăng nhập)
                .anyRequest().permitAll()
            )

            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                    .oidcUserService(customOidcUserService::loadUser)
                )
                .successHandler((request, response, authentication) -> {
                    String email = authentication.getName();
                    User user = userService.findByEmail(email).orElse(null);
                    if (user == null) {
                        response.sendRedirect(frontendUrl + "/auth/social/callback?message=Khong+tim+thay+nguoi+dung");
                        return;
                    }

                    String accessToken = jwtTokenService.generateAccessToken(user);
                    String refreshToken = jwtTokenService.generateRefreshToken(user);

                    response.sendRedirect(frontendUrl + "/auth/social/callback?accessToken=" + accessToken + "&refreshToken=" + refreshToken);
                })
                .failureHandler((request, response, exception) ->
                    response.sendRedirect(frontendUrl + "/auth/social/callback?message=" + java.net.URLEncoder.encode(exception.getMessage(), java.nio.charset.StandardCharsets.UTF_8))
                )
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
 }