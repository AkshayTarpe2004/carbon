package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Admin marketplace transaction row with buyer and product labels
 * (entity relations are {@code @JsonIgnore} on {@link com.carbon.carbontracker.model.Transaction}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionAdminResponseDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String itemName;
    private String itemType;
    private BigDecimal amount;
    private BigDecimal carbonOffset;
    private String status;
    private LocalDateTime createdAt;
}
