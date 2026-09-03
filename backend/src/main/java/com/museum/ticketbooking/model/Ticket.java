package com.museum.ticketbooking.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;

    // Use JsonIgnoreProperties to avoid infinite recursion; only expose needed museum fields
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "museum_id")
    @JsonIgnoreProperties({"password", "staffPin", "verificationCode", "tickets", "createdAt", "updatedAt"})
    private Museum museum;

    @Column(name = "user_email")
    private String userEmail;

    private String phone;

    private Integer adults;

    private Integer children;

    @Column(name = "total_price")
    private Double totalPrice;

    @Column(name = "payment_id")
    private String paymentId;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "secret_code")
    private String secretCode;

    private String status;

    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    /* ── Convenience getters used by frontend ── */

    /** Returns the museum's ID, or null if no museum attached */
    public Long getMuseumId() {
        return museum != null ? museum.getId() : null;
    }

    /** Returns the museum's name for display in history panel */
    public String getMuseumName() {
        return museum != null ? museum.getMuseumName() : null;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null || status.isBlank()) status = "PENDING";
        if (ticketNumber == null || ticketNumber.isBlank()) {
            ticketNumber = "TKT" + System.currentTimeMillis();
        }
    }
}
