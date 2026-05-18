package com.carbon.carbontracker;

import com.carbon.carbontracker.model.BadgeTemplate;
import com.carbon.carbontracker.model.MarketplaceItem;
import com.carbon.carbontracker.repository.BadgeTemplateRepository;
import com.carbon.carbontracker.repository.MarketplaceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner badgeTemplateSeeder(BadgeTemplateRepository badgeTemplateRepository) {
        return args -> {
            if (badgeTemplateRepository.count() > 0) {
                return;
            }

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("First Log")
                    .code("FIRST_LOG")
                    .description("Logged your very first carbon entry.")
                    .conditionText("User creates at least one carbon log.")
                    .icon("🌱")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Week Warrior")
                    .code("WEEK_WARRIOR")
                    .description("Logged carbon data for 7 consecutive days.")
                    .conditionText("7 daily carbon logs in a row.")
                    .icon("📅")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Low Emitter")
                    .code("LOW_EMITTER")
                    .description("Kept daily emissions under 10 kg CO₂e.")
                    .conditionText("Daily total emission below 10 kg CO₂e for 5 days.")
                    .icon("🍃")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Eco Streak")
                    .code("ECO_STREAK")
                    .description("Maintained a 14-day low-emission streak.")
                    .conditionText("14 days in a row with emissions below your goal.")
                    .icon("🔥")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Survey Master")
                    .code("SURVEY_MASTER")
                    .description("Completed the full lifestyle survey.")
                    .conditionText("User submits the lifestyle survey at least once.")
                    .icon("📋")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Carbon Cutter")
                    .code("CARBON_CUTTER")
                    .description("Reduced emissions by 20% vs last month.")
                    .conditionText("Compare last 30 days vs previous 30 days and achieve ≥20% reduction.")
                    .icon("✂️")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Green Champion")
                    .code("GREEN_CHAMPION")
                    .description("Reached the top 10% of low emitters.")
                    .conditionText("User is in the top 10% on the leaderboard.")
                    .icon("🏆")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Tree Planter")
                    .code("TREE_PLANTER")
                    .description("Offset 100 kg CO₂e through logged actions.")
                    .conditionText("User logs actions that sum to at least 100 kg CO₂e offset.")
                    .icon("🌳")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Solar Hero")
                    .code("SOLAR_HERO")
                    .description("Logged zero energy emissions for a week.")
                    .conditionText("7 days with zero energy-related emissions.")
                    .icon("☀️")
                    .active(true)
                    .build());


            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Goal Setter")
                    .code("GOAL_SETTER")
                    .description("Created your first sustainability goal.")
                    .conditionText("User creates at least one goal.")
                    .icon("🎯")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Goal Achiever")
                    .code("GOAL_ACHIEVER")
                    .description("Completed at least one sustainability goal.")
                    .conditionText("User has at least one goal with status COMPLETED.")
                    .icon("✅")
                    .active(true)
                    .build());

            // Extra manual / admin-friendly badges
            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Eco Starter")
                    .code("ECO_STARTER")
                    .description("Completed your very first lifestyle survey.")
                    .conditionText("User completes the lifestyle survey at least once.")
                    .icon("🌱")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Green Achiever")
                    .code("GREEN_ACHIEVER")
                    .description("Completed your first sustainability goal.")
                    .conditionText("User has at least one goal marked as COMPLETED.")
                    .icon("🏆")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Carbon Saver")
                    .code("CARBON_SAVER")
                    .description("Reduced your emissions by at least 20% compared to before.")
                    .conditionText("Compare last 30 days vs previous 30 days and achieve ≥20% reduction.")
                    .icon("✂️")
                    .active(true)
                    .build());

            // Creative / advanced badges
            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Night Logger")
                    .code("NIGHT_LOGGER")
                    .description("Logs your carbon footprint late at night.")
                    .conditionText("User creates at least 5 logs between 10 PM and 5 AM.")
                    .icon("🌙")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Public Transport Pro")
                    .code("PUBLIC_TRANSPORT_PRO")
                    .description("Relies mainly on public transport instead of private vehicles.")
                    .conditionText("Over the last 30 days, more than 70% of transport logs are public transport.")
                    .icon("🚆")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Plant-Based Hero")
                    .code("PLANT_BASED_HERO")
                    .description("Keeps food emissions low with plant-based choices.")
                    .conditionText("Average daily food emissions under 5 kg CO₂e for 14 consecutive days.")
                    .icon("🥦")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Energy Saver")
                    .code("ENERGY_SAVER")
                    .description("Keeps household energy usage efficient.")
                    .conditionText("Average daily energy emissions under 8 kg CO₂e for 30 consecutive days.")
                    .icon("💡")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Weekly Check-in")
                    .code("WEEKLY_CHECKIN")
                    .description("Consistently tracks emissions once a week.")
                    .conditionText("User creates at least one carbon log per week for 8 consecutive weeks.")
                    .icon("📆")
                    .active(true)
                    .build());

            badgeTemplateRepository.save(BadgeTemplate.builder()
                    .name("Consistency King")
                    .code("CONSISTENCY_KING")
                    .description("Shows long-term commitment to tracking.")
                    .conditionText("User has at least 100 total carbon logs.")
                    .icon("👑")
                    .active(true)
                    .build());

        };
    }

    @Bean
    public CommandLineRunner marketplaceSeeder(MarketplaceRepository marketplaceRepository) {
        return args -> {
            // Normalize existing rows so only 4 category/banner types are used.
            normalizeMarketplaceRows(marketplaceRepository);

            // Ensure at least 2 items exist per category at startup.
            ensureMarketplaceCount(marketplaceRepository, "Carbon Offset", 2, new MarketplaceItem[]{
                    MarketplaceItem.builder()
                            .itemName("Tree Planting Pack")
                            .itemType("Carbon Offset")
                            .price(new BigDecimal("499.00"))
                            .description("Support verified tree plantation projects.")
                            .carbonOffsetValue(new BigDecimal("25.00"))
                            .badge("popular")
                            .priceUnit("unit")
                            .headerIcon("🌳")
                            .bannerKey("carbon-offset")
                            .createdBy("system-seed")
                            .build(),
                    MarketplaceItem.builder()
                            .itemName("Household Carbon Offset")
                            .itemType("Carbon Offset")
                            .price(new BigDecimal("899.00"))
                            .description("Offset your monthly household emissions.")
                            .carbonOffsetValue(new BigDecimal("48.00"))
                            .badge("new")
                            .priceUnit("unit")
                            .headerIcon("🍃")
                            .bannerKey("carbon-offset")
                            .createdBy("system-seed")
                            .build()
            });

            ensureMarketplaceCount(marketplaceRepository, "Renewable Energy", 2, new MarketplaceItem[]{
                    MarketplaceItem.builder()
                            .itemName("Solar Energy Credit")
                            .itemType("Renewable Energy")
                            .price(new BigDecimal("799.00"))
                            .description("Fund clean solar generation projects.")
                            .carbonOffsetValue(new BigDecimal("40.00"))
                            .badge("popular")
                            .priceUnit("unit")
                            .headerIcon("☀️")
                            .bannerKey("renewable-energy")
                            .createdBy("system-seed")
                            .build(),
                    MarketplaceItem.builder()
                            .itemName("Wind Farm Support")
                            .itemType("Renewable Energy")
                            .price(new BigDecimal("999.00"))
                            .description("Contribute to verified wind energy expansion.")
                            .carbonOffsetValue(new BigDecimal("52.00"))
                            .badge("new")
                            .priceUnit("unit")
                            .headerIcon("💨")
                            .bannerKey("renewable-energy")
                            .createdBy("system-seed")
                            .build()
            });

            ensureMarketplaceCount(marketplaceRepository, "Environmental", 2, new MarketplaceItem[]{
                    MarketplaceItem.builder()
                            .itemName("River Cleanup Drive")
                            .itemType("Environmental")
                            .price(new BigDecimal("399.00"))
                            .description("Support plastic removal and river restoration.")
                            .carbonOffsetValue(new BigDecimal("18.00"))
                            .badge("limited")
                            .priceUnit("unit")
                            .headerIcon("🌍")
                            .bannerKey("environmental")
                            .createdBy("system-seed")
                            .build(),
                    MarketplaceItem.builder()
                            .itemName("Mangrove Restoration")
                            .itemType("Environmental")
                            .price(new BigDecimal("749.00"))
                            .description("Restore coastal mangrove ecosystems.")
                            .carbonOffsetValue(new BigDecimal("36.00"))
                            .badge("popular")
                            .priceUnit("unit")
                            .headerIcon("🌱")
                            .bannerKey("environmental")
                            .createdBy("system-seed")
                            .build()
            });

            ensureMarketplaceCount(marketplaceRepository, "Sustainable Living", 2, new MarketplaceItem[]{
                    MarketplaceItem.builder()
                            .itemName("Reusable Living Kit")
                            .itemType("Sustainable Living")
                            .price(new BigDecimal("299.00"))
                            .description("Starter kit for reducing daily plastic waste.")
                            .carbonOffsetValue(new BigDecimal("10.00"))
                            .badge("new")
                            .priceUnit("unit")
                            .headerIcon("♻️")
                            .bannerKey("sustainable-living")
                            .createdBy("system-seed")
                            .build(),
                    MarketplaceItem.builder()
                            .itemName("Compost Home Set")
                            .itemType("Sustainable Living")
                            .price(new BigDecimal("549.00"))
                            .description("Home composting set for food waste reduction.")
                            .carbonOffsetValue(new BigDecimal("16.00"))
                            .badge("limited")
                            .priceUnit("unit")
                            .headerIcon("🪴")
                            .bannerKey("sustainable-living")
                            .createdBy("system-seed")
                            .build()
            });
        };
    }

    private void normalizeMarketplaceRows(MarketplaceRepository repo) {
        List<MarketplaceItem> items = repo.findAll();
        boolean changed = false;
        for (MarketplaceItem item : items) {
            String normalizedType = normalizeType(item.getItemType());
            String normalizedBanner = bannerFromType(normalizedType);
            String normalizedIcon = iconFromType(normalizedType);

            boolean itemChanged = false;
            if (!normalizedType.equals(item.getItemType())) {
                item.setItemType(normalizedType);
                itemChanged = true;
            }
            if (!normalizedBanner.equals(item.getBannerKey())) {
                item.setBannerKey(normalizedBanner);
                itemChanged = true;
            }
            if (!normalizedIcon.equals(item.getHeaderIcon())) {
                item.setHeaderIcon(normalizedIcon);
                itemChanged = true;
            }
            if (item.getCarbonOffsetValue() == null) {
                item.setCarbonOffsetValue(BigDecimal.ZERO);
                itemChanged = true;
            }
            if (itemChanged) {
                changed = true;
            }
        }
        if (changed) {
            repo.saveAll(items);
        }
    }

    private String normalizeType(String rawType) {
        if (rawType == null || rawType.isBlank()) return "Carbon Offset";
        String compact = rawType.trim().toLowerCase().replace('_', ' ').replace('-', ' ');
        compact = compact.replaceAll("\\s+", " ").trim();
        if (compact.contains("renewable")) return "Renewable Energy";
        if (compact.contains("sustainable")) return "Sustainable Living";
        if (compact.contains("environment")) return "Environmental";
        if (compact.contains("carbon")) return "Carbon Offset";
        return "Carbon Offset";
    }

    private String bannerFromType(String type) {
        return switch (type) {
            case "Renewable Energy" -> "renewable-energy";
            case "Environmental" -> "environmental";
            case "Sustainable Living" -> "sustainable-living";
            default -> "carbon-offset";
        };
    }

    private String iconFromType(String type) {
        return switch (type) {
            case "Renewable Energy" -> "☀️";
            case "Environmental" -> "🌍";
            case "Sustainable Living" -> "♻️";
            default -> "🌳";
        };
    }

    private void ensureMarketplaceCount(MarketplaceRepository repo, String category, int minimum, MarketplaceItem[] candidates) {
        long existing = repo.countByItemType(category);
        if (existing >= minimum) {
            return;
        }
        int needed = (int) (minimum - existing);
        for (int i = 0; i < candidates.length && needed > 0; i++) {
            repo.save(candidates[i]);
            needed--;
        }
    }
}

