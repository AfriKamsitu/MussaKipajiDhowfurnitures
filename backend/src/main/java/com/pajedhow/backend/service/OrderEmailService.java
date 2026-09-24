package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SystemSettingsService settingsService;

    public void sendOrderCreated(Order order) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) return;

        SettingsResponse settings = settingsService.get();
        send(
                sender,
                settings.senderEmail(),
                settings.orderNotificationEmail(),
                "New order " + order.getOrderNumber(),
                """
                        A new order has been placed.

                        Order: %s
                        Customer: %s
                        Phone: %s
                        Total: %s %s
                        Payment: %s
                        """.formatted(
                        order.getOrderNumber(),
                        order.getCustomerName(),
                        order.getPhone(),
                        settings.currency(),
                        order.getTotal(),
                        order.getPayment())
        );

        if (settings.orderConfirmationEnabled()
                && order.getCustomer() != null
                && order.getCustomer().getEmail() != null) {
            send(
                    sender,
                    settings.senderEmail(),
                    order.getCustomer().getEmail(),
                    "We received order " + order.getOrderNumber(),
                    """
                            Hello %s,

                            We received your order %s with a total of %s %s.
                            Our team will confirm the order and delivery details with you.

                            Thank you,
                            %s
                            """.formatted(
                            order.getCustomerName(),
                            order.getOrderNumber(),
                            settings.currency(),
                            order.getTotal(),
                            settings.senderName())
            );
        }
    }

    private void send(
            JavaMailSender sender,
            String from,
            String to,
            String subject,
            String body) {
        if (to == null || to.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(message);
        } catch (MailException ex) {
            // An email transport problem must not roll back a successfully
            // committed inventory/order transaction.
            log.warn("Could not send order email to {}", to, ex);
        }
    }
}
