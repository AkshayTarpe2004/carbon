package com.carbon.carbontracker.model;

/**
 * Marketplace payment / settlement lifecycle (demo-friendly; map to a real PSP later).
 */
public enum TransactionStatus {
    /** Checkout started; awaiting payment confirmation. */
    PENDING,
    /** Payment captured; purchase counts toward offsets. */
    SUCCESS,
    /** Payment declined or error; row kept for history. */
    FAILED
}
