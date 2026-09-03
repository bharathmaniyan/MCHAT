package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.dto.ApiResponse;
import com.museum.ticketbooking.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = "http://localhost:5173")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /**
     * Search places by query string.
     * Proxies the request to Mapbox (or Nominatim fallback) so API keys stay server-side.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchPlaces(@RequestParam String q) {
        try {
            List<Map<String, Object>> results = locationService.searchPlaces(q);
            return ResponseEntity.ok(ApiResponse.success("Location search results", results));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Location search failed: " + e.getMessage()));
        }
    }

    /**
     * Reverse-geocode lat/lon into a readable address.
     */
    @GetMapping("/reverse")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reverseGeocode(
            @RequestParam double lat,
            @RequestParam double lon) {
        try {
            Map<String, Object> result = locationService.reverseGeocode(lat, lon);
            return ResponseEntity.ok(ApiResponse.success("Reverse geocode result", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Reverse geocode failed: " + e.getMessage()));
        }
    }
}
