package com.museum.ticketbooking.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RazorpayWebhookResult {
    private boolean processed;
    private String event;
    private String message;
    
    public RazorpayWebhookResult(boolean processed, String event, String message) {
        this.processed = processed;
        this.event = event;
        this.message = message;
    }
}
