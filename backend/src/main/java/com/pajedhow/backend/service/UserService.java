package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.AddressDtos.AddressRequest;
import com.pajedhow.backend.dto.AddressDtos.AddressResponse;
import com.pajedhow.backend.dto.UserDtos.*;
import com.pajedhow.backend.entity.Address;
import com.pajedhow.backend.entity.Order;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ReviewRepository;
import com.pajedhow.backend.repository.UserRepository;
import com.pajedhow.backend.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLog;

    // ---------- Profile (self) ----------

    @Transactional(readOnly = true)
    public UserResponse getProfile(String userId) {
        return Mappers.toUser(get(userId));
    }

    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest req) {
        User user = get(userId);
        if (req.name() != null && !req.name().isBlank()) user.setName(req.name());
        if (req.email() != null && !req.email().isBlank()
                && !normalizeEmail(req.email()).equalsIgnoreCase(user.getEmail())) {
            String email = normalizeEmail(req.email());
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(email);
        }
        if (req.phone() != null) user.setPhone(req.phone());
        if (req.avatar() != null) user.setAvatar(req.avatar());
        if (req.marketingOptIn() != null) {
            user.setMarketingOptIn(req.marketingOptIn());
            user.setMarketingOptInAt(req.marketingOptIn() ? Instant.now() : null);
        }
        return Mappers.toUser(userRepository.save(user));
    }

    // ---------- Addresses (self) ----------

    @Transactional(readOnly = true)
    public List<AddressResponse> listAddresses(String userId) {
        return get(userId).getAddresses().stream().map(Mappers::toAddress).toList();
    }

    @Transactional
    public AddressResponse addAddress(String userId, AddressRequest req) {
        User user = get(userId);
        Address address = Address.builder()
                .label(req.label())
                .fullName(req.fullName())
                .phone(req.phone())
                .street(req.street())
                .city(req.city())
                .region(req.region())
                .isDefault(req.isDefault())
                .build();
        if (req.isDefault()) {
            user.getAddresses().forEach(a -> a.setDefault(false));
        }
        user.addAddress(address);
        userRepository.save(user);
        return Mappers.toAddress(address);
    }

    @Transactional
    public AddressResponse updateAddress(String userId, Long addressId, AddressRequest req) {
        User user = get(userId);
        Address address = user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));
        address.setLabel(req.label());
        address.setFullName(req.fullName());
        address.setPhone(req.phone());
        address.setStreet(req.street());
        address.setCity(req.city());
        address.setRegion(req.region());
        if (req.isDefault()) {
            user.getAddresses().forEach(a -> a.setDefault(false));
            address.setDefault(true);
        }
        userRepository.save(user);
        return Mappers.toAddress(address);
    }

    @Transactional
    public void deleteAddress(String userId, Long addressId) {
        User user = get(userId);
        boolean removed = user.getAddresses().removeIf(a -> a.getId().equals(addressId));
        if (!removed) throw new ResourceNotFoundException("Address not found: " + addressId);
        userRepository.save(user);
    }

    // ---------- Staff management (admin) ----------

    @Transactional(readOnly = true)
    public List<UserResponse> listStaff() {
        return userRepository.findAllStaff().stream().map(Mappers::toUser).toList();
    }

    @Transactional
    public UserResponse createStaff(StaffRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BadRequestException("Email already in use");
        }
        if (req.password() == null || req.password().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }
        Role role = parseRole(req.role());
        if (role != Role.ADMIN) {
            throw new BadRequestException("Staff accounts must use role ADMIN");
        }
        User user = User.builder()
                .name(req.name())
                .email(normalizeEmail(req.email()))
                .password(passwordEncoder.encode(req.password()))
                .role(role)
                .status(parseStatus(req.status()))
                .build();
        User saved = userRepository.save(user);
        activityLog.record(SecurityUtils.actorName(), "created staff account", saved.getEmail());
        return Mappers.toUser(saved);
    }

    @Transactional
    public UserResponse updateStaff(String id, StaffRequest req, String actorId) {
        User user = get(id);
        user.setName(req.name());
        String customerEmail = normalizeEmail(req.email());
        if (!customerEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(customerEmail)) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(customerEmail);
        }
        Role role = parseRole(req.role());
        if (role != Role.ADMIN) {
            throw new BadRequestException("Staff accounts must use role ADMIN");
        }
        user.setRole(role);
        AccountStatus nextStatus = parseStatus(req.status());
        guardAdministratorContinuity(user, actorId, nextStatus, false);
        user.setStatus(nextStatus);
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 8) {
                throw new BadRequestException("Password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
            user.setTokenVersion(user.getTokenVersion() + 1);
        }
        return Mappers.toUser(userRepository.save(user));
    }

    @Transactional
    public void deleteStaff(String id, String actorId) {
        User user = get(id);
        if (user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only administrator accounts can be deleted here");
        }
        guardAdministratorContinuity(user, actorId, AccountStatus.INACTIVE, true);
        userRepository.delete(user);
        activityLog.record(SecurityUtils.actorName(), "deleted account", user.getEmail());
    }

    // ---------- Customers (admin) ----------

    @Transactional(readOnly = true)
    public List<CustomerSummary> listCustomers() {
        return userRepository.findAllCustomers().stream().map(c -> {
            List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
            BigDecimal spent = orders.stream()
                    .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return new CustomerSummary(
                    c.getId(), c.getName(), c.getEmail(), c.getPhone(),
                    orders.size(), spent, c.getStatus().name(), c.getCreatedAt(),
                    c.isMarketingOptIn(), c.getMarketingOptInAt());
        }).toList();
    }

    @Transactional
    public UserResponse createCustomer(CustomerRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BadRequestException("Email already in use");
        }
        if (req.password() == null || req.password().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }
        User user = User.builder()
                .name(req.name())
                .email(normalizeEmail(req.email()))
                .phone(req.phone())
                .password(passwordEncoder.encode(req.password()))
                .role(Role.BUYER)
                .status(parseStatus(req.status()))
                .build();
        User saved = userRepository.save(user);
        activityLog.record(SecurityUtils.actorName(), "created customer account", saved.getEmail());
        return Mappers.toUser(saved);
    }

    @Transactional
    public UserResponse updateCustomer(String id, CustomerRequest req) {
        User user = get(id);
        if (user.getRole() != Role.BUYER) {
            throw new BadRequestException("Only customer accounts can be updated here");
        }
        user.setName(req.name());
        String staffEmail = normalizeEmail(req.email());
        if (!staffEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(staffEmail)) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(staffEmail);
        }
        user.setPhone(req.phone());
        user.setStatus(parseStatus(req.status()));
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 8) {
                throw new BadRequestException("Password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
            user.setTokenVersion(user.getTokenVersion() + 1);
        }
        return Mappers.toUser(userRepository.save(user));
    }

    @Transactional
    public void deleteCustomer(String id) {
        User user = get(id);
        if (user.getRole() != Role.BUYER) {
            throw new BadRequestException("Only customer accounts can be deleted here");
        }
        if (orderRepository.existsByCustomerId(id)) {
            throw new BadRequestException(
                    "Customers with order history cannot be deleted. Set the account to inactive instead.");
        }
        if (reviewRepository.existsByUserId(id)) {
            throw new BadRequestException(
                    "Customers with review history cannot be deleted. Set the account to inactive instead.");
        }
        userRepository.delete(user);
        activityLog.record(SecurityUtils.actorName(), "deleted customer account", user.getEmail());
    }

    @Transactional
    public UserResponse setStatus(String id, String status) {
        User user = get(id);
        if (user.getRole() != Role.BUYER) {
            throw new BadRequestException("Only customer accounts can be updated here");
        }
        user.setStatus(parseStatus(status));
        return Mappers.toUser(userRepository.save(user));
    }

    private User get(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid role: " + value);
        }
    }

    private AccountStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return AccountStatus.ACTIVE;
        try {
            return AccountStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status: " + value);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private void guardAdministratorContinuity(
            User user,
            String actorId,
            AccountStatus nextStatus,
            boolean deleting) {
        if (user.getId().equals(actorId) && (deleting || nextStatus != AccountStatus.ACTIVE)) {
            throw new BadRequestException("You cannot delete or deactivate your own administrator account.");
        }
        if ((deleting || nextStatus != AccountStatus.ACTIVE)
                && user.getStatus() == AccountStatus.ACTIVE
                && userRepository.countByRoleAndStatus(Role.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException("At least one active administrator account is required.");
        }
    }
}
