package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.MarketplaceItemDTO;
import com.carbon.carbontracker.model.MarketplaceItem;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.MarketplaceRepository;
import com.carbon.carbontracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private final MarketplaceRepository marketplaceRepository;
    private final UserRepository userRepository;

    private String getCurrentActor() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailNormalized(email).orElse(null);
            if (user == null) {
                return email;
            }
            return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();
        } catch (Exception ex) {
            return "System";
        }
    }

    // ============================
    // 👤 USER: Get all items
    // ============================
    public List<MarketplaceItemDTO> getAllItems() {
        return marketplaceRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ============================
    // 👤 USER: Get single item
    // ============================
    public MarketplaceItemDTO getItemById(Long id) {
        MarketplaceItem item = marketplaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        return mapToDTO(item);
    }

    // ============================
    // 👨‍💼 ADMIN: Create item
    // ============================
    public MarketplaceItemDTO createItem(MarketplaceItemDTO dto, String clientIp) {
        MarketplaceItem item = mapToEntity(dto);
        String actor = getCurrentActor();
        item.setCreatedBy(actor);
        item.setUpdatedBy(actor);
        item.setIpAddress(clientIp != null ? clientIp : "N/A");
        return mapToDTO(marketplaceRepository.save(item));
    }

    // ============================
    // 👨‍💼 ADMIN: Update item
    // ============================
    public MarketplaceItemDTO updateItem(Long id, MarketplaceItemDTO dto, String clientIp) {
        MarketplaceItem item = marketplaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        String normalizedType = normalizeMarketplaceType(dto.getItemType());
        item.setItemName(dto.getItemName());
        item.setItemType(normalizedType);
        item.setPrice(dto.getPrice());
        item.setDescription(dto.getDescription());
        item.setCarbonOffsetValue(dto.getCarbonOffsetValue());
        item.setBadge(emptyToNull(dto.getBadge()));
        item.setImpactProgressPercent(dto.getImpactProgressPercent());
        item.setPriceUnit(dto.getPriceUnit() != null && !dto.getPriceUnit().isBlank() ? dto.getPriceUnit() : "unit");
        item.setHeaderIcon(emptyToNull(dto.getHeaderIcon()));
        item.setBannerKey(bannerFromType(normalizedType));
        item.setUpdatedBy(getCurrentActor());
        item.setIpAddress(clientIp != null ? clientIp : "N/A");

        return mapToDTO(marketplaceRepository.save(item));
    }

    // ============================
    // 👨‍💼 ADMIN: Delete item
    // ============================
    public void deleteItem(Long id) {
        if (!marketplaceRepository.existsById(id)) {
            throw new RuntimeException("Item not found with id: " + id);
        }
        marketplaceRepository.deleteById(id);
    }

    // ============================
    // 🔁 MAPPING METHODS
    // ============================

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static String normalizeMarketplaceType(String rawType) {
        if (rawType == null) return "Carbon Offset";
        String compact = rawType.trim().toLowerCase().replace('_', ' ').replace('-', ' ');
        compact = compact.replaceAll("\\s+", " ").trim();
        return switch (compact) {
            case "carbon offset", "carbonoffset" -> "Carbon Offset";
            case "renewable energy", "renewableenergy" -> "Renewable Energy";
            case "environmental", "environment" -> "Environmental";
            case "sustainable living", "sustainableliving" -> "Sustainable Living";
            default -> "Carbon Offset";
        };
    }

    private static String bannerFromType(String itemType) {
        return switch (itemType) {
            case "Renewable Energy" -> "renewable-energy";
            case "Environmental" -> "environmental";
            case "Sustainable Living" -> "sustainable-living";
            default -> "carbon-offset";
        };
    }

    private MarketplaceItem mapToEntity(MarketplaceItemDTO dto) {
        String unit = dto.getPriceUnit() != null && !dto.getPriceUnit().isBlank() ? dto.getPriceUnit().trim() : "unit";
        String normalizedType = normalizeMarketplaceType(dto.getItemType());
        return MarketplaceItem.builder()
                .itemName(dto.getItemName())
                .itemType(normalizedType)
                .price(dto.getPrice())
                .description(dto.getDescription())
                .carbonOffsetValue(dto.getCarbonOffsetValue())
                .badge(emptyToNull(dto.getBadge()))
                .impactProgressPercent(dto.getImpactProgressPercent())
                .priceUnit(unit)
                .headerIcon(emptyToNull(dto.getHeaderIcon()))
                .bannerKey(bannerFromType(normalizedType))
                .build();
    }

    private MarketplaceItemDTO mapToDTO(MarketplaceItem item) {
        return MarketplaceItemDTO.builder()
                .id(item.getId())
                .itemName(item.getItemName())
                .itemType(item.getItemType())
                .price(item.getPrice())
                .description(item.getDescription())
                .carbonOffsetValue(item.getCarbonOffsetValue())
                .badge(item.getBadge())
                .impactProgressPercent(item.getImpactProgressPercent())
                .priceUnit(item.getPriceUnit() != null ? item.getPriceUnit() : "unit")
                .headerIcon(item.getHeaderIcon())
                .bannerKey(item.getBannerKey())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .createdBy(item.getCreatedBy())
                .updatedBy(item.getUpdatedBy())
                .ipAddress(item.getIpAddress())
                .build();
    }
}