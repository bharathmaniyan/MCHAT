package com.museum.ticketbooking.dto;

import com.museum.ticketbooking.model.MuseumBusinessHours;
import com.museum.ticketbooking.model.MuseumImage;
import lombok.Data;
import java.util.List;

@Data
public class OwnerMuseumProfileDTO {
    private Long id;
    private String email; // Owner login email
    private String museumName;
    private String slug;
    
    private String category;
    private String tagline;
    private String description;
    
    private String coverImageUrl;
    private String displayImageUrl;
    
    private String publicPhone;
    private String publicEmail;
    private String websiteUrl;
    private String instagramUrl;
    private String facebookUrl;
    private String youtubeUrl;
    
    private String location;
    private String address;
    private String landmark;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
    
    private String accessibilityNotes;
    private String visitorGuidelines;
    private Integer recommendedDurationMinutes;
    private Integer establishedYear;
    
    private Double adultPrice;
    private Double childPrice;
    private Integer seatLimit;
    private String openingTime;
    private String closingTime;
    
    private String staffPin; // Private to owner
    private String verificationCode; // Private to owner
    
    private Boolean bookingStatus;
    private Boolean profilePublished;
    
    private List<String> amenities;
    private List<MuseumBusinessHours> businessHours;
    private List<MuseumImage> images;
}
