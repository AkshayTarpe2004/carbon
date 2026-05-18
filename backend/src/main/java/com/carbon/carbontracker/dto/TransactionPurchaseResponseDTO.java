package com.carbon.carbontracker.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Safe JSON for {@code POST /api/transactions} — built from loaded primitives inside the
 * transactional service method (avoids returning a detached {@code Transaction} entity).
 */
public record TransactionPurchaseResponseDTO(
        Long id,
        Long userId,
        Long marketplaceItemId,
        BigDecimal amount,
        BigDecimal carbonOffset,
        String status,
        LocalDateTime createdAt
) {}
