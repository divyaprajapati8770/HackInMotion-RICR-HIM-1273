package com.e_commerce.AI_Powered_Inventory_Backend.repository;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    boolean existsByEmail(String email);
}
