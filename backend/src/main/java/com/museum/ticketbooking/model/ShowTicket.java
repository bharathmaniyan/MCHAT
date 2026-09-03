package com.museum.ticketbooking.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "show_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;
    
    @ManyToOne
    @JoinColumn(name = "show_id")
    private Show show;
    
    @ManyToOne
    @JoinColumn(name = "museum_id")
    private Museum museum;
    
    @Column(name = "user_email")
    private String userEmail;
    
    private Integer quantity;
    
    @Column(name = "total_price")
    private Double totalPrice;
    
    @Column(name = "payment_id")
    private String paymentId;
    
    @Column(name = "order_id")
    private String orderId;
    
    private String status;
    
    @Column(name = "email_sent")
    private Boolean emailSent = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = "ACTIVE";
        ticketNumber = "SHT" + System.currentTimeMillis();
    }
}
