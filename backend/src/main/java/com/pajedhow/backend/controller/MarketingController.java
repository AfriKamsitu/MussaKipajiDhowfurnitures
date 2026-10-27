package com.pajedhow.backend.controller;

import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.service.ProductAnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public endpoint behind the unsubscribe link in marketing emails. */
@RestController
@RequiredArgsConstructor
public class MarketingController {

    private final ProductAnnouncementService announcementService;

    public record UnsubscribeRequest(String userId, String token) {}

    @PostMapping("/api/marketing/unsubscribe")
    public ResponseEntity<Map<String, Object>> unsubscribe(@RequestBody UnsubscribeRequest request) {
        if (!announcementService.unsubscribe(request.userId(), request.token())) {
            throw new BadRequestException("This unsubscribe link is not valid.");
        }
        return ResponseEntity.ok(Map.of("unsubscribed", true));
    }
}
