package com.museum.ticketbooking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotNull(message = "Ticket ID is required")
    private Long ticketId;
}
