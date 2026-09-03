package com.museum.ticketbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowCreationDTO {
    @NotBlank(message = "Show name is required")
    private String showName;
    
    @NotNull(message = "Show time is required")
    private LocalDateTime showTime;
    
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;
    
    @NotNull(message = "Seat limit is required")
    @Positive(message = "Seat limit must be positive")
    private Integer seatLimit;
    
    private String description;
}
