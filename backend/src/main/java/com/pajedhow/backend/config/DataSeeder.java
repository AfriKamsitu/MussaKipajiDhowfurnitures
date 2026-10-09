package com.pajedhow.backend.config;

import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures the store ADMIN account exists. No catalog, product, coupon, banner,
 * supplier, or other business records are created here.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void run(String... args) {
        ensureAdminUser();
    }

    private void ensureAdminUser() {
        String adminEmail = requireSecret("ADMIN_EMAIL", appProperties.getAdmin().getEmail()).trim().toLowerCase();
        String adminPassword = requireSecret("ADMIN_PASSWORD", appProperties.getAdmin().getPassword());

        userRepository.findByEmailIgnoreCase(adminEmail).ifPresentOrElse(admin -> {
            boolean changed = false;
            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
                changed = true;
            }
            if (admin.getStatus() != AccountStatus.ACTIVE) {
                admin.setStatus(AccountStatus.ACTIVE);
                changed = true;
            }
            boolean bootstrapPasswordMatches = passwordEncoder.matches(adminPassword, admin.getPassword());
            if ((appProperties.getAdmin().isSyncPassword() && !bootstrapPasswordMatches)
                    || (bootstrapPasswordMatches && passwordEncoder.upgradeEncoding(admin.getPassword()))) {
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setTokenVersion(admin.getTokenVersion() + 1);
                changed = true;
            }
            if (changed) {
                userRepository.save(admin);
                log.info("Updated ADMIN account configuration for {}", adminEmail);
            } else {
                log.info("ADMIN account already up to date: {}", adminEmail);
            }
        }, () -> {
            userRepository.save(User.builder()
                    .name("Kipaji Dhow Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .status(AccountStatus.ACTIVE)
                    .build());
            log.info("Created ADMIN account: {}", adminEmail);
        });
    }

    private String requireSecret(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " must be configured in the environment.");
        }
        return value;
    }
}
