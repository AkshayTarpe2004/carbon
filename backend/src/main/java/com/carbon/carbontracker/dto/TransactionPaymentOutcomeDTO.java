package com.carbon.carbontracker.dto;

import lombok.Data;

/** Settle a {@link com.carbon.carbontracker.model.TransactionStatus#PENDING} checkout. */
@Data
public class TransactionPaymentOutcomeDTO {
    /** Must be {@code SUCCESS} or {@code FAILED}. */
    private String outcome;
}
