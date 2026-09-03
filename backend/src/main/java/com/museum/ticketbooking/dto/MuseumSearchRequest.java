package com.museum.ticketbooking.dto;

import lombok.Data;
import java.util.List;

@Data
public class MuseumSearchRequest {
    private String query;
    private String city;
    private String category;
    private Double minRating;
    private Double maxPrice;
    private Boolean openNow;
    private Boolean hasAccessibility;
    private List<String> amenities;
    private String sortBy; // "rating", "price_asc", "price_desc", "name", "views"
    
    private int page = 0;
    private int size = 12;
}
