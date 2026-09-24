package com.pajedhow.backend.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "app")
@Validated
@Getter
@Setter
public class AppProperties {

    @Valid
    private final Jwt jwt = new Jwt();
    @Valid
    private final Admin admin = new Admin();
    private final OAuth oauth = new OAuth();
    @Valid
    private final Cors cors = new Cors();
    @Valid
    private final WhatsApp whatsapp = new WhatsApp();

    @NotBlank
    @Pattern(regexp = "^https?://.+", message = "must be an absolute HTTP(S) URL")
    private String publicUrl = "http://localhost:3000";

    @Getter
    @Setter
    public static class Jwt {
        @NotBlank
        private String secret;

        @Min(60_000)
        private long accessTokenExpirationMs = 86_400_000L;

        @Min(300_000)
        private long refreshTokenExpirationMs = 604_800_000L;

        @NotBlank
        private String issuer = "pajedhow-backend";
    }

    @Getter
    @Setter
    public static class Admin {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 8, max = 128)
        private String password;
        /**
         * Emergency/bootstrap option only. Keeping this false prevents a
         * password changed in Admin from being silently replaced on restart.
         */
        private boolean syncPassword = false;
    }

    @Getter
    @Setter
    public static class OAuth {
        private String googleClientId;
        private String facebookAppId;
        private String facebookAppSecret;
    }

    @Getter
    @Setter
    public static class Cors {
        @NotEmpty
        private List<String> allowedOrigins = List.of("http://localhost:3000");
    }

    @Getter
    @Setter
    public static class WhatsApp {
        @NotBlank
        @Pattern(regexp = "^\\d{7,15}$")
        private String phone = "2557";
    }
}
