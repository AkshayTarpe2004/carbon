package com.carbon.carbontracker.dto;

import lombok.*;

@Data
public class TransactionRequestDTO {
    private Long userId;
    private Long marketplaceItemId;

    /**
     * Initial payment state: {@code PENDING}, {@code SUCCESS}, or {@code FAILED} (case-insensitive).
     * Omit or null for {@code SUCCESS} (immediate completed purchase).
     */
    private String paymentStatus;
}