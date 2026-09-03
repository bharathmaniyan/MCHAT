package com.museum.ticketbooking.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO for booking a museum entry ticket from the chatbot.
 * No OTP required — email is captured in the chatbot flow.
 */
@Getter
@Setter
public class TicketBookingRequest {

    @NotNull(message = "Museum ID is required")
    private Long museumId;

    @Email(message = "Invalid email format")
    @NotBlank(message = "User email is required")
    private String email;

    // alias getter so service code using getUserEmail() still works
    public String getUserEmail() { return email; }

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Min(value = 0, message = "Adults count cannot be negative")
    private Integer adults = 0;

    @Min(value = 0, message = "Children count cannot be negative")
    private Integer children = 0;

    // Manual getters/setters for Lombok compatibility
    public Long getMuseumId() { return museumId; }
    public void setMuseumId(Long museumId) { this.museumId = museumId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Integer getAdults() { return adults; }
    public void setAdults(Integer adults) { this.adults = adults; }

    public Integer getChildren() { return children; }
    public void setChildren(Integer children) { this.children = children; }
}
