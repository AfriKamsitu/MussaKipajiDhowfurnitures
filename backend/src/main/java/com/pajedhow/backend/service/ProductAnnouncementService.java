package com.pajedhow.backend.service;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.UserRepository;
import com.pajedhow.backend.service.ProductService.ProductPublishedEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.text.NumberFormat;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

/**
 * Emails customers who opted in to marketing when a product first appears in the shop.
 * Sending only happens when SMTP is configured (spring.mail.host); otherwise it is skipped.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductAnnouncementService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SystemSettingsService settingsService;
    private final AppProperties appProperties;
    private final JdbcTemplate jdbcTemplate;

    /** Products that were already published before announcements existed are never emailed. */
    @EventListener(ApplicationReadyEvent.class)
    public void markExistingProductsAnnounced() {
        int updated = jdbcTemplate.update(
                "UPDATE products SET announced_at = created_at WHERE announced_at IS NULL AND status = 'PUBLISHED'");
        if (updated > 0) log.info("Marked {} existing products as already announced", updated);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProductPublished(ProductPublishedEvent event) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("Mail is not configured; skipping the new-product email for product {}", event.productId());
            return;
        }
        Product product = productRepository.findById(event.productId()).orElse(null);
        if (product == null) return;

        List<User> subscribers = userRepository.findByRoleAndStatusAndMarketingOptInTrue(Role.BUYER, AccountStatus.ACTIVE);
        if (subscribers.isEmpty()) return;

        SettingsResponse settings = settingsService.get();
        String site = appProperties.getPublicUrl().replaceAll("/+$", "");
        int sent = 0;
        for (User user : subscribers) {
            try {
                sender.send(buildMessage(sender, settings, site, product, user));
                sent++;
            } catch (MailException | MessagingException ex) {
                log.warn("Could not send the new-product email to {}", user.getEmail(), ex);
            }
        }
        log.info("Sent the new-product email for '{}' to {} of {} subscribers", product.getName(), sent, subscribers.size());
    }

    /** One-click unsubscribe from the link in the email; the token proves the link came from us. */
    public boolean unsubscribe(String userId, String token) {
        if (userId == null || token == null || !MessageDigest.isEqual(
                unsubscribeToken(userId).getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8))) {
            return false;
        }
        return userRepository.findById(userId).map(user -> {
            if (user.isMarketingOptIn()) {
                user.setMarketingOptIn(false);
                userRepository.save(user);
            }
            return true;
        }).orElse(false);
    }

    private MimeMessage buildMessage(JavaMailSender sender, SettingsResponse settings, String site,
                                     Product product, User user) throws MessagingException {
        String productUrl = site + "/product/" + URLEncoder.encode(product.getSlug(), StandardCharsets.UTF_8);
        String unsubscribeUrl = site + "/unsubscribe?u=" + URLEncoder.encode(user.getId(), StandardCharsets.UTF_8)
                + "&t=" + unsubscribeToken(user.getId());
        String image = absolute(site, product.getImage());
        String price = money(settings.currency(), product.getPrice());
        String store = settings.storeName();
        String firstName = user.getName() == null ? "" : user.getName().trim().split("\\s+")[0];
        String summary = product.getShortDescription() != null && !product.getShortDescription().isBlank()
                ? product.getShortDescription() : "Handmade in our workshop and ready to order now.";

        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        try {
            helper.setFrom(settings.senderEmail(), settings.senderName());
        } catch (java.io.UnsupportedEncodingException ex) {
            helper.setFrom(settings.senderEmail());
        }
        helper.setTo(user.getEmail());
        helper.setSubject("New at " + store + ": " + product.getName());
        message.setHeader("List-Unsubscribe", "<" + unsubscribeUrl + ">");
        helper.setText(plainText(store, firstName, product.getName(), summary, price, productUrl, unsubscribeUrl),
                html(store, firstName, product.getName(), summary, price, image, productUrl, unsubscribeUrl));
        return message;
    }

    private static String plainText(String store, String firstName, String name, String summary,
                                    String price, String productUrl, String unsubscribeUrl) {
        return """
                Hello %s,

                Something new has just arrived at %s:

                %s
                %s
                %s

                See it here: %s

                You get this email because you asked to hear about new furniture.
                Unsubscribe: %s
                """.formatted(firstName.isEmpty() ? "there" : firstName, store, name, summary, price, productUrl, unsubscribeUrl);
    }

    private static String html(String store, String firstName, String name, String summary, String price,
                               String image, String productUrl, String unsubscribeUrl) {
        String greeting = HtmlUtils.htmlEscape(firstName.isEmpty() ? "Hello," : "Hello " + firstName + ",");
        String img = image == null ? "" : """
                <tr><td><a href="%s"><img src="%s" alt="%s" width="560" style="display:block;width:100%%;max-width:560px;height:auto;border:0"></a></td></tr>
                """.formatted(HtmlUtils.htmlEscape(productUrl), HtmlUtils.htmlEscape(image), HtmlUtils.htmlEscape(name));
        return """
                <!doctype html>
                <html><body style="margin:0;padding:0;background:#f6f0e6;font-family:Arial,Helvetica,sans-serif;color:#2a211b">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f6f0e6;padding:24px 12px">
                <tr><td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;background:#ffffff">
                <tr><td style="background:#6b2b2b;color:#f6f0e6;padding:16px 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold">%s</td></tr>
                %s
                <tr><td style="padding:24px">
                <p style="margin:0 0 6px;font-size:13px;color:#6f6358">%s</p>
                <p style="margin:0 0 18px;font-size:13px;color:#6f6358">Something new has just arrived in our shop.</p>
                <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#2a211b">%s</h1>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a3f36">%s</p>
                <p style="margin:0 0 22px;font-size:20px;font-weight:bold;color:#6b2b2b">%s</p>
                <a href="%s" style="display:inline-block;background:#6b2b2b;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">View the product</a>
                </td></tr>
                <tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:11px;line-height:1.6;color:#8a7d72">
                You get this email because you asked to hear about new furniture from %s.
                <a href="%s" style="color:#8a7d72">Unsubscribe</a>
                </td></tr>
                </table>
                </td></tr></table>
                </body></html>
                """.formatted(
                HtmlUtils.htmlEscape(store), img, greeting, HtmlUtils.htmlEscape(name),
                HtmlUtils.htmlEscape(summary), HtmlUtils.htmlEscape(price), HtmlUtils.htmlEscape(productUrl),
                HtmlUtils.htmlEscape(store), HtmlUtils.htmlEscape(unsubscribeUrl));
    }

    private static String absolute(String site, String path) {
        if (path == null || path.isBlank()) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return site + (path.startsWith("/") ? path : "/" + path);
    }

    private static String money(String currency, BigDecimal amount) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMaximumFractionDigits("USD".equals(currency) ? 2 : 0);
        return currency + " " + format.format(amount == null ? BigDecimal.ZERO : amount);
    }

    private String unsubscribeToken(String userId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(("unsubscribe:" + userId).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unsubscribe tokens are unavailable", ex);
        }
    }
}
