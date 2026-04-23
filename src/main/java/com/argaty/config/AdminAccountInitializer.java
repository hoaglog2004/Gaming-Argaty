package com.argaty.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.argaty.entity.User;
import com.argaty.enums.Role;
import com.argaty.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.admin.bootstrap.email:admin@argaty.com}")
    private String adminEmail;

    @Value("${app.admin.bootstrap.password:123123}")
    private String adminPassword;

    @Value("${app.admin.bootstrap.full-name:Argaty Admin}")
    private String adminFullName;

    @Override
    @Transactional
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseGet(() -> User.builder()
                        .email(adminEmail)
                        .fullName(adminFullName)
                        .role(Role.ADMIN)
                        .isEnabled(true)
                        .isBanned(false)
                        .build());

        admin.setRole(Role.ADMIN);
        admin.setIsEnabled(true);
        admin.setIsBanned(false);
        admin.setPassword(passwordEncoder.encode(adminPassword));

        userRepository.save(admin);
        log.info("Admin account ready: {}", adminEmail);
    }
}
