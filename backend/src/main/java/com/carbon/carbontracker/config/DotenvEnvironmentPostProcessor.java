package com.carbon.carbontracker.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads {@code .env} from the current working directory, then {@code backend/.env} when
 * running from the repo root, so local secrets stay out of {@code application.properties}.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "dotenv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (environment.getPropertySources().contains(SOURCE_NAME)) {
            return;
        }
        Map<String, Object> map = new LinkedHashMap<>();
        // Repo root: .env; monorepo: try backend/.env second (overrides)
        loadInto(Path.of(".env"), map);
        loadInto(Path.of("backend", ".env"), map);
        if (!map.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, map));
        }
    }

    private static void loadInto(Path path, Map<String, Object> target) {
        if (!Files.isRegularFile(path)) {
            return;
        }
        Path parent = path.getParent();
        String dir = parent == null ? "." : parent.toString();
        String fileName = path.getFileName().toString();
        try {
            Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .directory(dir)
                .filename(fileName)
                .load();
            dotenv.entries().forEach(e -> {
                String key = e.getKey() != null ? e.getKey().trim() : "";
                if (key.isEmpty()) {
                    return;
                }
                String v = e.getValue();
                if (v == null) {
                    v = "";
                }
                v = v.trim();
                if (!v.isEmpty()) {
                    target.put(key, v);
                }
            });
        } catch (DotenvException | IllegalArgumentException ignored) {
            // keep defaults from application.properties
        }
    }
}
