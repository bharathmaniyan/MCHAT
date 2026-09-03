package com.museum.ticketbooking.service;

import com.museum.ticketbooking.dto.LoginRequest;
import com.museum.ticketbooking.model.User;
import com.museum.ticketbooking.repository.UserRepository;
import com.museum.ticketbooking.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
    
    @Transactional
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        user.setOtpVerified(false);
        return userRepository.save(user);
    }
    
    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        if (user.getPassword() != null && !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        String token = jwtUtil.generateToken(user.getId().toString(), user.getEmail(), "USER");
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        
        return response;
    }
    
    @Transactional
    public String sendOtp(String email) {
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                return userRepository.save(newUser);
            });
        
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        // In production, send OTP via email/SMS
        System.out.println("OTP for " + email + ": " + otp);
        
        return otp; // Remove in production
    }
    
    @Transactional
    public boolean verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }
        
        user.setOtpVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
        
        return true;
    }
    
    @Transactional
    public String initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        String resetToken = jwtUtil.generateToken(user.getId().toString(), user.getEmail(), "RESET");
        
        // In production, send reset email
        System.out.println("Reset token for " + email + ": " + resetToken);
        
        return resetToken; // Remove in production
    }
    
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Verify token and get email
        String email = jwtUtil.extractEmail(token);
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    public void logout(String token) {
        // In a real implementation, you would invalidate the token
        // For now, just log
        System.out.println("User logged out with token: " + token);
    }
}
