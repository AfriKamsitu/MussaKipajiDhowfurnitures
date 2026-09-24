package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Banner;
import com.pajedhow.backend.entity.enums.Enums.BannerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findAllByOrderBySortOrderAscIdAsc();

    List<Banner> findByStatusOrderBySortOrderAscIdAsc(BannerStatus status);
}
