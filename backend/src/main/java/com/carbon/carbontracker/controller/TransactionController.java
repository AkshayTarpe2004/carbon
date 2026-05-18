package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.TransactionPaymentOutcomeDTO;
import com.carbon.carbontracker.dto.TransactionPurchaseResponseDTO;
import com.carbon.carbontracker.dto.TransactionRequestDTO;
import com.carbon.carbontracker.dto.TransactionAdminResponseDTO;
import com.carbon.carbontracker.dto.TransactionResponseDTO;
import com.carbon.carbontracker.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.carbon.carbontracker.model.Transaction;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // USER: Purchase item
    @PostMapping
    public ResponseEntity<TransactionPurchaseResponseDTO> purchase(@RequestBody TransactionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.purchaseItem(dto));
    }

    /**
     * Turn a {@code PENDING} checkout into {@code SUCCESS} or {@code FAILED} (simulates payment gateway result).
     */
    @PatchMapping("/{id}/payment-outcome")
    public ResponseEntity<TransactionPurchaseResponseDTO> settlePaymentOutcome(
            @PathVariable Long id,
            @RequestBody TransactionPaymentOutcomeDTO body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(transactionService.settlePendingPayment(id, email, body.getOutcome()));
    }

    // USER: Get transaction history
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponseDTO>> getUserTransactions(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }

    // USER: Get transaction details
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    // ADMIN: Get all transactions (includes user and item names)
    @GetMapping("/admin/all")
    public ResponseEntity<List<TransactionAdminResponseDTO>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactionsForAdmin());
    }

    // ADMIN: Track purchases by user
    @GetMapping("/admin/user/{userId}")
    public ResponseEntity<List<Transaction>> getTransactionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUser(userId));
    }
}