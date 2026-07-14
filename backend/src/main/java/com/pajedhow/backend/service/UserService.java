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
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
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
                && !req.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(req.email())) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(req.email().toLowerCase());
        }
        if (req.phone() != null) user.setPhone(req.phone());
        if (req.avatar() != null) user.setAvatar(req.avatar());
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
        if (req.password() == null || req.password().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        Role role = parseRole(req.role());
        if (role != Role.ADMIN) {
            throw new BadRequestException("Staff accounts must use role ADMIN");
        }
        User user = User.builder()
                .name(req.name())
                .email(req.email().toLowerCase())
                .password(passwordEncoder.encode(req.password()))
                .role(role)
                .status(parseStatus(req.status()))
                .build();
        User saved = userRepository.save(user);
        activityLog.record("Admin", "created staff account", saved.getEmail());
        return Mappers.toUser(saved);
    }

    @Transactional
    public UserResponse updateStaff(String id, StaffRequest req) {
        User user = get(id);
        user.setName(req.name());
        if (!req.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(req.email())) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(req.email().toLowerCase());
        }
        Role role = parseRole(req.role());
        if (role != Role.ADMIN) {
            throw new BadRequestException("Staff accounts must use role ADMIN");
        }
        user.setRole(role);
        user.setStatus(parseStatus(req.status()));
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        return Mappers.toUser(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(String id) {
        User user = get(id);
        userRepository.delete(user);
        activityLog.record("Admin", "deleted account", user.getEmail());
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
                    orders.size(), spent, c.getStatus().name(), c.getCreatedAt());
        }).toList();
    }

    @Transactional
    public UserResponse setStatus(String id, String status) {
        User user = get(id);
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
}
