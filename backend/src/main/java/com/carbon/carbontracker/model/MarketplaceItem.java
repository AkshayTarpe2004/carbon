package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketplace_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_type")
    private String itemType;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(length = 1000)
    private String description;

    @Column(name = "carbon_offset_value")
    private BigDecimal carbonOffsetValue;

    /** Card badge: popular | limited | new (null = none) */
    @Column(length = 32)
    private String badge;

    /** Progress bar fill 0–100; if null, client may derive from offset vs max */
    @Column(name = "impact_progress_percent")
    private Integer impactProgressPercent;

    /** Shown after price, e.g. "unit" → "₹… /unit" */
    @Column(name = "price_unit", length = 64)
    private String priceUnit;

    /** Emoji in card header banner (optional; else category default) */
    @Column(name = "header_icon", length = 32)
    private String headerIcon;

    /** CSS banner class key: carbon-offset, renewable-energy, environmental, sustainable-living */
    @Column(name = "banner_key", length = 64)
    private String bannerKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "ip_address")
    private String ipAddress;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}