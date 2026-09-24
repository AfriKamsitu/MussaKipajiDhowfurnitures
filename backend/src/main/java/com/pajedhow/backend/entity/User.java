package com.pajedhow.backend.entity;

import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Column(length = 1024)
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20)")
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant lastActiveAt;

    /**
     * Included in access and refresh tokens. Incrementing it revokes every
     * previously issued session after a password or security-sensitive change.
     */
    @Column(nullable = false, columnDefinition = "bigint default 0")
    @Builder.Default
    private long tokenVersion = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean marketingOptIn = false;

    private Instant marketingOptInAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (lastActiveAt == null) lastActiveAt = createdAt;
    }

    public boolean isAdmin() {
        return role != null && role.isAdmin();
    }

    public void addAddress(Address address) {
        address.setUser(this);
        this.addresses.add(address);
    }
}
