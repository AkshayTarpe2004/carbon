package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.MarketplaceItemDTO;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.MarketplaceService;
import com.carbon.carbontracker.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;
    private final AdminAuditLogService adminAuditLogService;

    // ============================
    // 👤 USER: Get all items
    // ============================
    @GetMapping
    public ResponseEntity<List<MarketplaceItemDTO>> getAllItems() {
        return ResponseEntity.ok(marketplaceService.getAllItems());
    }

    /** Alias for frontend that calls /api/marketplace/items */
    @GetMapping("/items")
    public ResponseEntity<List<MarketplaceItemDTO>> getAllItemsAlias() {
        return ResponseEntity.ok(marketplaceService.getAllItems());
    }

    // ============================
    // 👤 USER: Get single item
    // ============================
    @GetMapping("/{id}")
    public ResponseEntity<MarketplaceItemDTO> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(marketplaceService.getItemById(id));
    }

    // ============================
    // 👨‍💼 ADMIN: Create item
    // ============================
    @PostMapping
    public ResponseEntity<MarketplaceItemDTO> createItem(@RequestBody MarketplaceItemDTO dto,
                                                        HttpServletRequest request) {
        MarketplaceItemDTO created = marketplaceService.createItem(dto, ClientIpUtil.resolve(request));
        adminAuditLogService.log(
                "Marketplace Item Created",
                created.getItemName() != null ? created.getItemName() : "",
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ============================
    // 👨‍💼 ADMIN: Edit item
    // ============================
    @PutMapping("/{id}")
    public ResponseEntity<MarketplaceItemDTO> updateItem(@PathVariable Long id,
                                                         @RequestBody MarketplaceItemDTO dto,
                                                         HttpServletRequest request) {
        MarketplaceItemDTO updated = marketplaceService.updateItem(id, dto, ClientIpUtil.resolve(request));
        adminAuditLogService.log(
                "Marketplace Item Updated",
                updated.getItemName() != null ? updated.getItemName() : ("id " + id),
                request);
        return ResponseEntity.ok(updated);
    }

    // ============================
    // 👨‍💼 ADMIN: Delete item
    // ============================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id, HttpServletRequest request) {
        MarketplaceItemDTO existing = marketplaceService.getItemById(id);
        marketplaceService.deleteItem(id);
        adminAuditLogService.log(
                "Marketplace Item Deleted",
                existing.getItemName() != null ? existing.getItemName() : ("id " + id),
                request);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // 👨‍💼 ADMIN: Get all items
    // ============================
    @GetMapping("/admin/all")
    public ResponseEntity<List<MarketplaceItemDTO>> getAllItemsForAdmin() {
        return ResponseEntity.ok(marketplaceService.getAllItems());
    }
}