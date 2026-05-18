package com.carbon.carbontracker.service;

import com.carbon.carbontracker.model.BadgeTemplate;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.BadgeTemplateRepository;
import com.carbon.carbontracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BadgeTemplateService {

    @Autowired
    private BadgeTemplateRepository badgeTemplateRepository;
    @Autowired
    private UserRepository userRepository;

    private String getCurrentActor() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return email;
            }
            return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();
        } catch (Exception ex) {
            return "System";
        }
    }

    private String generateCodeFromName(String name) {
        if (name == null) {
            return null;
        }
        String base = name
                .trim()
                .replaceAll("[^a-zA-Z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toUpperCase();
        return base.isEmpty() ? null : base;
    }

    public List<BadgeTemplate> getAll() {
        return badgeTemplateRepository.findAll();
    }

    public BadgeTemplate getById(Long id) {
        return badgeTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Badge template not found: " + id));
    }

    public BadgeTemplate create(BadgeTemplate template, String clientIp) {
        template.setId(null);
        if (template.getCode() == null || template.getCode().trim().isEmpty()) {
            template.setCode(generateCodeFromName(template.getName()));
        }
        String actor = getCurrentActor();
        template.setCreatedBy(actor);
        template.setUpdatedBy(actor);
        template.setIpAddress(clientIp != null ? clientIp : "N/A");
        return badgeTemplateRepository.save(template);
    }

    public BadgeTemplate update(Long id, BadgeTemplate updated, String clientIp) {
        BadgeTemplate existing = getById(id);
        existing.setName(updated.getName());
        String code = updated.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateCodeFromName(updated.getName());
        }
        existing.setCode(code);
        existing.setDescription(updated.getDescription());
        existing.setConditionText(updated.getConditionText());
        existing.setIcon(updated.getIcon());
        existing.setActive(updated.isActive());
        existing.setUpdatedBy(getCurrentActor());
        existing.setIpAddress(clientIp != null ? clientIp : "N/A");
        return badgeTemplateRepository.save(existing);
    }
}

