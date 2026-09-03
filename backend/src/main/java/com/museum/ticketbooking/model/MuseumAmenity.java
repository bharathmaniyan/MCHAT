package com.museum.ticketbooking.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "museum_amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MuseumAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "museum_id", nullable = false)
    private Long museumId;

    @Column(name = "amenity_type", nullable = false)
    private String amenityType; // PARKING, WHEELCHAIR, WASHROOMS, CAFE, GIFT_SHOP, LOCKERS, PHOTOGRAPHY_ALLOWED, GUIDED_TOURS, AUDIO_GUIDE, WIFI, BABY_CHANGING, RESTAURANT, LIBRARY, THEATRE
}
