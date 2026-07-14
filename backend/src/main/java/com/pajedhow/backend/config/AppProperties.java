package com.pajedhow.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Seed seed = new Seed();
    private final WhatsApp whatsapp = new WhatsApp();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpirationMs = 86_400_000L;
        private long refreshTokenExpirationMs = 604_800_000L;
        private String issuer = "pajedhow-backend";
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000");
    }

    @Getter
    @Setter
    public static class Seed {
        private boolean enabled = true;
    }

    @Getter
    @Setter
    public static class WhatsApp {
        private String phone = "2557";
    }
}
