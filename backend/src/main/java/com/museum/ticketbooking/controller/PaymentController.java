package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.dto.ApiResponse;
import com.museum.ticketbooking.dto.CreateOrderRequest;
import com.museum.ticketbooking.dto.PaymentVerificationRequest;
import com.museum.ticketbooking.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService paymentService;
    
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            Map<String, Object> response = paymentService.createOrder(request);
            return ResponseEntity.ok(ApiResponse.success("Order created successfully", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        try {
            Map<String, Object> response = paymentService.verifyPayment(request);
            return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentDetails(@PathVariable String paymentId) {
        try {
            Map<String, Object> response = paymentService.getPaymentDetails(paymentId);
            return ResponseEntity.ok(ApiResponse.success("Payment details fetched successfully", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
