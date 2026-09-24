package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
    Optional<SystemSettings> findFirstByOrderByIdAsc();
}
