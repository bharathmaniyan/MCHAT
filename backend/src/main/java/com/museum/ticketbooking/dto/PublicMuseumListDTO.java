package com.museum.ticketbooking.dto;

import lombok.Data;
import java.util.List;

@Data
public class PublicMuseumListDTO {
    private Long id;
    private String slug;
    private String museumName;
    private String category;
    private String tagline;
    private String city;
    private String location;
    private String coverImageUrl;
    private String displayImageUrl;
    
    private Double adultPrice;
    private Double childPrice;
    
    private String openingTime;
    private String closingTime;
    
    private Boolean bookingStatus;
    
    private Double averageRating;
    private Long reviewCount;
    
    private List<String> amenities;
    
    private Double latitude;
    private Double longitude;
}
