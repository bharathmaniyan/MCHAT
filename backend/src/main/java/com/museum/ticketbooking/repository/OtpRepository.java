package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    
    Optional<Otp> findByEmailAndVerifiedFalse(String email);
    
    List<Otp> findByEmailAndVerified(String email, Boolean verified);
    
    @Modifying
    @Query("DELETE FROM Otp o WHERE o.otpExpiry < :now")
    int deleteExpiredOtps(@Param("now") LocalDateTime now);
    
    @Modifying
    @Query("UPDATE Otp o SET o.verified = true WHERE o.email = :email AND o.otp = :otp AND o.otpExpiry > :now")
    int verifyOtp(@Param("email") String email, @Param("otp") String otp, @Param("now") LocalDateTime now);
}