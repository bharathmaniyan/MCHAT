package com.museum.ticketbooking.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO for verifying/marking a ticket as USED at museum entry.
 *
 * The visitor shows their ticket on phone.
 * Staff enters the permanent 4-digit museum staffPin.
 * Ticket status → USED.
 *
 * Frontend may send the code as either "staffPin" or "verificationCode" — both are handled.
 */
@Getter
@Setter
public class VerificationRequest {

    @NotNull(message = "Ticket ID is required")
    private Long ticketId;

    /**
     * The 4-digit permanent museum staff PIN.
     * Frontend may send this field as "verificationCode" — use the alias setter below.
     */
    @Pattern(regexp = "^[0-9]{4}$", message = "Staff PIN must be exactly 4 digits")
    private String staffPin;

    /** Alias: frontend sends verificationCode → mapped to staffPin */
    public void setVerificationCode(String code) {
        this.staffPin = code;
    }

    @NotNull(message = "Museum ID is required")
    private Long museumId;

    private String type; // optional: ENTRY / SHOW

    /**
     * Alias: frontend may send getVerificationCode() to read the staffPin value
     */
    public String getVerificationCode() { 
        return staffPin; 
    }

    // Manual getters/setters for Lombok compatibility
    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public String getStaffPin() { return staffPin; }
    public void setStaffPin(String staffPin) { this.staffPin = staffPin; }

    public Long getMuseumId() { return museumId; }
    public void setMuseumId(Long museumId) { this.museumId = museumId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
