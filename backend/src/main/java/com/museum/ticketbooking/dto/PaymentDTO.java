package com.museum.ticketbooking.dto;

import lombok.Data;

@Data
public class PaymentDTO {
    private Double amount;
    private String currency;
    private String receipt;
    private String orderId;
    private String paymentId;
    private String signature;
}
