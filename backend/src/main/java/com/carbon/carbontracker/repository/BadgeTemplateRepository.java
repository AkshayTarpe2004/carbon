package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.BadgeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BadgeTemplateRepository extends JpaRepository<BadgeTemplate, Long> {

    Optional<BadgeTemplate> findByName(String name);

    Optional<BadgeTemplate> findByCode(String code);
}

