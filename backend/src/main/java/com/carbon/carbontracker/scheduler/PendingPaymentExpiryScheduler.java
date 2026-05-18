package com.carbon.carbontracker.scheduler;

import com.carbon.carbontracker.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fails marketplace checkouts that stay {@code PENDING} longer than the configured TTL (default 24 hours).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PendingPaymentExpiryScheduler {

    private final TransactionService transactionService;

    @Value("${app.pending-payment.ttl-hours:24}")
    private int ttlHours;

    @Scheduled(cron = "${app.pending-payment.expiry-cron:0 0 * * * *}")
    public void expireStalePendingPayments() {
        try {
            transactionService.expireStalePendingPayments(ttlHours);
        } catch (Exception e) {
            log.warn("Pending payment expiry job failed: {}", e.getMessage());
        }
    }
}
