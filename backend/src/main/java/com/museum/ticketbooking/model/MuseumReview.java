package com.museum.ticketbooking.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "museum_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MuseumReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "museum_id", nullable = false)
    private Long museumId;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "visitor_email", nullable = false)
    private String visitorEmail;

    @Column(name = "visitor_name")
    private String visitorName;

    @Column(nullable = false)
    private Integer rating; // 1-5

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String status = "PUBLISHED"; // PUBLISHED, FLAGGED, HIDDEN

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
