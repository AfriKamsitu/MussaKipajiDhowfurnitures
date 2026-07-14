package com.pajedhow.backend.entity;

/**
 * System roles for the backend. Only ADMIN is used for admin users, and BUYER
 * is used for storefront customers.
 */
public enum Role {
    ADMIN,
    BUYER;

    /** Spring Security authority name, e.g. ROLE_ADMIN. */
    public String authority() {
        return "ROLE_" + name();
    }

    /** True for admin users only. */
    public boolean isAdmin() {
        return this == ADMIN;
    }
}
