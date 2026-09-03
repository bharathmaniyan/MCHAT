package com.museum.ticketbooking.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ShowBookingRequest {
    @NotNull(message = "Show ID is required")
    private Long showId;
    
    @NotNull(message = "Museum ID is required")
    private Long museumId;
    
    @Email(message = "Invalid email format")
    @NotBlank(message = "User email is required")
    private String userEmail;
    
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
