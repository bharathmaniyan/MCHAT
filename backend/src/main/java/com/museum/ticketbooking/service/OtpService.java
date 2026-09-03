package com.museum.ticketbooking.service;

import com.museum.ticketbooking.model.Otp;
import com.museum.ticketbooking.repository.OtpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;

    
    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    @Transactional
    public void sendOtp(String email) {
        // Clean up expired OTPs
        otpRepository.deleteExpiredOtps(LocalDateTime.now());

        // Generate new OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP
        Otp otpEntity = new Otp();
        otpEntity.setEmail(email.toLowerCase().trim());
        otpEntity.setOtp(otp);
        otpEntity.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 minutes expiry
        otpEntity.setVerified(false);

        otpRepository.save(otpEntity);

        // System.out.println("Generated OTP for " + email + ": " + otp);
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        int updatedRows = otpRepository.verifyOtp(
            email.toLowerCase().trim(),
            otp.trim(),
            LocalDateTime.now()
        );

        return updatedRows > 0;
    }

    public boolean isEmailVerified(String email) {
        List<Otp> verified = otpRepository.findByEmailAndVerified(email.toLowerCase().trim(), true);
        return !verified.isEmpty();
    }
}