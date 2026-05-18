package com.carbon.carbontracker.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceItemDTO {

    private Long id;
    private String itemName;
    private String itemType;
    private BigDecimal price;
    private String description;
    private BigDecimal carbonOffsetValue;
    private String badge;
    private Integer impactProgressPercent;
    private String priceUnit;
    private String headerIcon;
    private String bannerKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private String ipAddress;
}