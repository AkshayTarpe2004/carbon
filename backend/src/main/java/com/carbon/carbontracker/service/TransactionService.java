package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.TransactionRequestDTO;
import com.carbon.carbontracker.dto.TransactionResponseDTO;
import com.carbon.carbontracker.model.Transaction;
import com.carbon.carbontracker.model.TransactionStatus;
import com.carbon.carbontracker.repository.TransactionRepository;
import com.carbon.carbontracker.repository.MarketplaceRepository;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.dto.TransactionAdminResponseDTO;
import com.carbon.carbontracker.dto.TransactionPurchaseResponseDTO;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.model.MarketplaceItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final MarketplaceRepository marketplaceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BadgeRuleService badgeRuleService;

    // USER: Purchase item
    @Transactional
    public TransactionPurchaseResponseDTO purchaseItem(TransactionRequestDTO dto) {
        if (dto.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (dto.getMarketplaceItemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "marketplaceItemId is required");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        MarketplaceItem item = marketplaceRepository.findById(dto.getMarketplaceItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (item.getPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item has no price");
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setMarketplaceItem(item);

        transaction.setAmount(item.getPrice());
        transaction.setCarbonOffset(
                Optional.ofNullable(item.getCarbonOffsetValue()).orElse(BigDecimal.ZERO));

        TransactionStatus initial = parseInitialPaymentStatus(dto.getPaymentStatus());
        transaction.setStatus(initial);

        final Transaction saved;
        try {
            saved = transactionRepository.save(transaction);
        } catch (DataAccessException e) {
            Throwable root = e.getMostSpecificCause() != null ? e.getMostSpecificCause() : e;
            log.error("Purchase save failed", e);
            String hint = root.getMessage() != null && root.getMessage().contains("carbon_offset")
                    ? " Run db_scripts/fix_transactions_carbon_offset.sql on your database, then retry."
                    : "";
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not save purchase: " + root.getMessage() + hint,
                    e);
        }

        if (initial == TransactionStatus.SUCCESS) {
            try {
                notificationService.createPurchaseNotification(user, item);
            } catch (Exception e) {
                log.warn("Purchase saved (id={}) but purchase notification failed: {}", saved.getId(), e.getMessage());
            }
            try {
                badgeRuleService.afterCarbonOffsetTotalMayHaveChanged(user.getId());
            } catch (Exception e) {
                log.warn("Badge check after purchase failed: {}", e.getMessage());
            }
        } else if (initial == TransactionStatus.PENDING) {
            try {
                notificationService.createPendingPaymentNotification(user, item, saved.getId());
            } catch (Exception e) {
                log.warn("Pending purchase saved (id={}) but notification failed: {}", saved.getId(), e.getMessage());
            }
        }

        return toPurchaseResponse(saved, user.getId(), item.getId());
    }

    /**
     * Complete or cancel a {@link TransactionStatus#PENDING} checkout (simulates PSP callback).
     */
    @Transactional
    public TransactionPurchaseResponseDTO settlePendingPayment(Long transactionId, String actorEmail, String outcomeRaw) {
        if (outcomeRaw == null || outcomeRaw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "outcome is required (SUCCESS or FAILED)");
        }
        TransactionStatus next;
        try {
            next = TransactionStatus.valueOf(outcomeRaw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "outcome must be SUCCESS or FAILED");
        }
        if (next != TransactionStatus.SUCCESS && next != TransactionStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "outcome must be SUCCESS or FAILED");
        }

        User actor = userRepository.findByEmailNormalized(actorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated"));

        Transaction t = transactionRepository.findByIdAndUser_Id(transactionId, actor.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (t.getStatus() != TransactionStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING transactions can be updated");
        }

        t.setStatus(next);
        final Transaction saved;
        try {
            saved = transactionRepository.save(t);
        } catch (DataAccessException e) {
            Throwable root = e.getMostSpecificCause() != null ? e.getMostSpecificCause() : e;
            log.error("Settlement save failed", e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not update transaction: " + root.getMessage(),
                    e);
        }

        if (next == TransactionStatus.SUCCESS) {
            try {
                notificationService.createPurchaseNotification(actor, t.getMarketplaceItem());
            } catch (Exception e) {
                log.warn("Settlement saved (id={}) but purchase notification failed: {}", saved.getId(), e.getMessage());
            }
            try {
                badgeRuleService.afterCarbonOffsetTotalMayHaveChanged(actor.getId());
            } catch (Exception e) {
                log.warn("Badge check after settlement failed: {}", e.getMessage());
            }
        }

        return toPurchaseResponse(
                saved,
                actor.getId(),
                t.getMarketplaceItem().getId());
    }

    /**
     * Marks {@link TransactionStatus#PENDING} transactions as {@link TransactionStatus#FAILED} when they are
     * older than {@code ttlHours} (checkout not completed in time).
     *
     * @return number of rows updated
     */
    @Transactional
    public int expireStalePendingPayments(int ttlHours) {
        int hours = ttlHours < 1 ? 24 : ttlHours;
        LocalDateTime cutoff = LocalDateTime.now().minusHours(hours);
        List<Transaction> stale = transactionRepository.findByStatusAndCreatedAtLessThanEqual(
                TransactionStatus.PENDING, cutoff);
        if (stale.isEmpty()) {
            return 0;
        }
        for (Transaction t : stale) {
            t.setStatus(TransactionStatus.FAILED);
        }
        transactionRepository.saveAll(stale);
        log.info("Expired {} pending transaction(s) as FAILED (older than {}h, cutoff={})",
                stale.size(), hours, cutoff);
        return stale.size();
    }

    private static TransactionStatus parseInitialPaymentStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return TransactionStatus.SUCCESS;
        }
        try {
            return TransactionStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "paymentStatus must be one of: PENDING, SUCCESS, FAILED");
        }
    }

    private static TransactionPurchaseResponseDTO toPurchaseResponse(Transaction saved, Long userId, Long itemId) {
        return new TransactionPurchaseResponseDTO(
                saved.getId(),
                userId,
                itemId,
                saved.getAmount(),
                saved.getCarbonOffset(),
                saved.getStatus().name(),
                saved.getCreatedAt());
    }

    // USER: Get transaction history
    public List<TransactionResponseDTO> getUserTransactions(Long userId) {
        return transactionRepository.findByUserId(userId).stream()
            .map(t -> new TransactionResponseDTO(
                t.getId(),
                t.getMarketplaceItem().getItemName(),
                t.getMarketplaceItem().getItemType(),
                1,
                t.getAmount(),
                t.getCarbonOffset(),
                t.getStatus() != null ? t.getStatus().name() : TransactionStatus.SUCCESS.name(),
                t.getCreatedAt()
            )).collect(Collectors.toList());
    }

    // USER: Get single transaction
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    // ADMIN: All transactions with buyer and item labels for dashboard (JSON-safe DTO).
    public List<TransactionAdminResponseDTO> getAllTransactionsForAdmin() {
        return transactionRepository.findAllWithUserAndItemOrderByCreatedAtDesc().stream()
                .map(this::toAdminDto)
                .collect(Collectors.toList());
    }

    private TransactionAdminResponseDTO toAdminDto(Transaction t) {
        User u = t.getUser();
        MarketplaceItem item = t.getMarketplaceItem();
        Long userId = null;
        String userEmail = "";
        String userName = "";
        if (u != null) {
            userId = u.getId();
            userEmail = u.getEmail() != null ? u.getEmail() : "";
            userName = u.getName() != null && !u.getName().isBlank() ? u.getName() : userEmail;
        }
        String itemName = "";
        String itemType = "";
        if (item != null) {
            itemName = item.getItemName() != null ? item.getItemName() : "";
            itemType = item.getItemType() != null ? item.getItemType() : "";
        }
        return new TransactionAdminResponseDTO(
                t.getId(),
                userId,
                userName,
                userEmail,
                itemName,
                itemType,
                t.getAmount(),
                t.getCarbonOffset(),
                t.getStatus() != null ? t.getStatus().name() : TransactionStatus.SUCCESS.name(),
                t.getCreatedAt());
    }

    // ADMIN: Filter/search transactions
    public List<Transaction> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId);
    }
}