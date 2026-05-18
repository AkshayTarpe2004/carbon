package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.MarketplaceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketplaceRepository extends JpaRepository<MarketplaceItem, Long> {
    long countByItemType(String itemType);
}