package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.dto.ApiResponse;
import com.museum.ticketbooking.dto.RazorpayWebhookResult;
import com.museum.ticketbooking.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/razorpay")
@CrossOrigin(origins = "*")
public class PaymentWebhookController {

    private final PaymentService paymentService;
    
    public PaymentWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String rawBody
    ) {
        try {
            RazorpayWebhookResult result = paymentService.processWebhook(rawBody, signature);

            Map<String, Object> response = new HashMap<>();
            response.put("processed", result.isProcessed());
            response.put("event", result.getEvent());
            response.put("message", result.getMessage());

            return ResponseEntity.ok(ApiResponse.success("Webhook processed", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Webhook processing failed"));
        }
    }
}
