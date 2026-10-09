package com.pajedhow.backend.util;

import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadRequestException("No authenticated user in context.");
        }
        return principal.getUser();
    }

    /** Name to record in the activity log: the signed-in person, or "System" for background work. */
    public static String actorName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            String name = principal.getUser().getName();
            return name == null || name.isBlank() ? principal.getUser().getEmail() : name;
        }
        return "System";
    }

    public static String currentUserId() {
        return currentUser().getId();
    }
}
