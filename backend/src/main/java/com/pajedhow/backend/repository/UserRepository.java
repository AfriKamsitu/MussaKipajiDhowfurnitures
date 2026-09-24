package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(Role role);

    @Query("select u from User u where u.role = com.pajedhow.backend.entity.Role.ADMIN")
    List<User> findAllStaff();

    @Query("select u from User u where u.role = com.pajedhow.backend.entity.Role.BUYER")
    List<User> findAllCustomers();

    long countByRole(Role role);

    long countByRoleAndStatus(Role role, AccountStatus status);
}
