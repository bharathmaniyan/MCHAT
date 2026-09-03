package com.museum.ticketbooking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private static final Logger logger = LoggerFactory.getLogger(LocationService.class);

    @Value("${mapbox.api-key:}")
    private String mapboxApiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LocationService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Search for places using a multi-source strategy for maximum coverage:
     *   1. Photon (free, no key, best fuzzy search on OSM data — finds Indian museums/businesses)
     *   2. Nominatim (free, no key, exact-match search on OSM data)
     *   3. Mapbox (if API key is configured — commercial-grade POI data)
     *
     * Results are merged and deduplicated.
     */
    public List<Map<String, Object>> searchPlaces(String query) {
        List<Map<String, Object>> allResults = new ArrayList<>();

        // Source 1: Photon (primary — best fuzzy search, free, no key)
        try {
            List<Map<String, Object>> photonResults = searchWithPhoton(query);
            allResults.addAll(photonResults);
        } catch (Exception e) {
            logger.warn("Photon search failed: {}", e.getMessage());
        }

        // Source 2: Nominatim (secondary — exact match, free, no key)
        try {
            List<Map<String, Object>> nominatimResults = searchWithNominatim(query);
            allResults.addAll(nominatimResults);
        } catch (Exception e) {
            logger.warn("Nominatim search failed: {}", e.getMessage());
        }

        // Source 3: Mapbox (if API key is available — best commercial data)
        if (mapboxApiKey != null && !mapboxApiKey.isBlank()) {
            try {
                List<Map<String, Object>> mapboxResults = searchWithMapbox(query);
                allResults.addAll(mapboxResults);
            } catch (Exception e) {
                logger.warn("Mapbox search failed: {}", e.getMessage());
            }
        }

        // Deduplicate by proximity (within ~100m = 0.001 degrees)
        return deduplicateResults(allResults, 5);
    }

    /**
     * Reverse-geocode coordinates.
     * ALWAYS uses Nominatim (OpenStreetMap) because its data is open and may be
     * permanently stored. Mapbox TOS prohibits permanent storage of their
     * geocoding results, so Mapbox is only used for the search/selection step.
     */
    public Map<String, Object> reverseGeocode(double lat, double lon) {
        return reverseGeocodeWithNominatim(lat, lon);
    }

    // ──────────────────────── Photon (komoot.io) ────────────────────────

    private List<Map<String, Object>> searchWithPhoton(String query) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = String.format(
            "https://photon.komoot.io/api/?q=%s&limit=5&lang=en",
            encoded
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "MuseumTicketBookingApp/1.0")
                .GET()
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Photon API returned status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode features = root.get("features");
        List<Map<String, Object>> results = new ArrayList<>();

        if (features != null && features.isArray()) {
            for (JsonNode feature : features) {
                JsonNode props = feature.get("properties");
                JsonNode geometry = feature.get("geometry");

                if (props == null || geometry == null) continue;

                Map<String, Object> place = new HashMap<>();
                place.put("name", props.has("name") ? props.get("name").asText() : "");

                // Build displayName from components
                String name = props.has("name") ? props.get("name").asText() : "";
                String street = props.has("street") ? props.get("street").asText() : "";
                String city = props.has("city") ? props.get("city").asText() : "";
                String state = props.has("state") ? props.get("state").asText() : "";
                String country = props.has("country") ? props.get("country").asText() : "";
                String pincode = props.has("postcode") ? props.get("postcode").asText() : "";

                String displayName = Arrays.asList(name, street, city, state, country)
                        .stream().filter(s -> s != null && !s.isEmpty())
                        .collect(Collectors.joining(", "));
                place.put("displayName", displayName);

                // Coordinates: Photon uses GeoJSON [lon, lat]
                JsonNode coords = geometry.get("coordinates");
                if (coords != null && coords.isArray() && coords.size() >= 2) {
                    place.put("longitude", coords.get(0).asDouble());
                    place.put("latitude", coords.get(1).asDouble());
                }

                place.put("city", city);
                place.put("state", state);
                place.put("pincode", pincode);
                place.put("source", "photon");

                results.add(place);
            }
        }

        return results;
    }

    // ──────────────────────── Mapbox (API key required) ────────────────────────

    private List<Map<String, Object>> searchWithMapbox(String query) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = String.format(
            "https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json?access_token=%s&country=in&limit=5&types=poi,address,place,locality&language=en",
            encoded, mapboxApiKey
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Mapbox API returned status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode features = root.get("features");
        List<Map<String, Object>> results = new ArrayList<>();

        if (features != null && features.isArray()) {
            for (JsonNode feature : features) {
                Map<String, Object> place = new HashMap<>();
                place.put("name", feature.has("text") ? feature.get("text").asText() : "");
                place.put("displayName", feature.has("place_name") ? feature.get("place_name").asText() : "");

                JsonNode center = feature.get("center");
                if (center != null && center.isArray() && center.size() >= 2) {
                    place.put("longitude", center.get(0).asDouble());
                    place.put("latitude", center.get(1).asDouble());
                }

                String city = "";
                String state = "";
                String pincode = "";
                JsonNode context = feature.get("context");
                if (context != null && context.isArray()) {
                    for (JsonNode ctx : context) {
                        String id = ctx.has("id") ? ctx.get("id").asText() : "";
                        String text = ctx.has("text") ? ctx.get("text").asText() : "";
                        if (id.startsWith("place")) city = text;
                        else if (id.startsWith("district")) { if (city.isEmpty()) city = text; }
                        else if (id.startsWith("region")) state = text;
                        else if (id.startsWith("postcode")) pincode = text;
                    }
                }

                place.put("city", city);
                place.put("state", state);
                place.put("pincode", pincode);
                place.put("source", "mapbox");

                results.add(place);
            }
        }

        return results;
    }

    // ──────────────────────── Nominatim ────────────────────────

    private List<Map<String, Object>> searchWithNominatim(String query) {
        List<Map<String, Object>> results = new ArrayList<>();
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = String.format(
                "https://nominatim.openstreetmap.org/search?format=json&q=%s&addressdetails=1&limit=5",
                encoded
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "MuseumTicketBookingApp/1.0")
                    .GET()
                    .timeout(Duration.ofSeconds(8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode items = objectMapper.readTree(response.body());

            if (items.isArray()) {
                for (JsonNode item : items) {
                    Map<String, Object> place = new HashMap<>();
                    place.put("name", item.has("name") ? item.get("name").asText() :
                            (item.has("display_name") ? item.get("display_name").asText().split(",")[0] : ""));
                    place.put("displayName", item.has("display_name") ? item.get("display_name").asText() : "");
                    place.put("latitude", item.has("lat") ? item.get("lat").asDouble() : 0);
                    place.put("longitude", item.has("lon") ? item.get("lon").asDouble() : 0);

                    JsonNode addr = item.get("address");
                    if (addr != null) {
                        place.put("city", getFirstNonNull(addr, "city", "town", "village", "county"));
                        place.put("state", addr.has("state") ? addr.get("state").asText() : "");
                        place.put("pincode", addr.has("postcode") ? addr.get("postcode").asText() : "");
                    } else {
                        place.put("city", "");
                        place.put("state", "");
                        place.put("pincode", "");
                    }

                    place.put("source", "nominatim");
                    results.add(place);
                }
            }
        } catch (Exception e) {
            logger.error("Nominatim search failed: {}", e.getMessage());
        }
        return results;
    }

    // ──────────────────────── Nominatim Reverse Geocode ────────────────────────

    private Map<String, Object> reverseGeocodeWithNominatim(double lat, double lon) {
        Map<String, Object> result = new HashMap<>();
        result.put("latitude", lat);
        result.put("longitude", lon);

        try {
            String url = String.format(
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&addressdetails=1",
                lat, lon
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "MuseumTicketBookingApp/1.0")
                    .GET()
                    .timeout(Duration.ofSeconds(8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode data = objectMapper.readTree(response.body());

            result.put("name", data.has("name") ? data.get("name").asText() : "");
            result.put("displayName", data.has("display_name") ? data.get("display_name").asText() : "");

            JsonNode addr = data.get("address");
            if (addr != null) {
                result.put("city", getFirstNonNull(addr, "city", "town", "village", "county"));
                result.put("state", addr.has("state") ? addr.get("state").asText() : "");
                result.put("pincode", addr.has("postcode") ? addr.get("postcode").asText() : "");
            }
        } catch (Exception e) {
            logger.error("Nominatim reverse geocode failed: {}", e.getMessage());
        }

        return result;
    }

    // ──────────────────────── Helpers ────────────────────────

    /**
     * Deduplicate results from multiple sources by proximity.
     * Two results within ~100m (0.001 degrees) are considered duplicates;
     * the first occurrence wins.
     */
    private List<Map<String, Object>> deduplicateResults(List<Map<String, Object>> results, int maxResults) {
        List<Map<String, Object>> unique = new ArrayList<>();

        for (Map<String, Object> candidate : results) {
            double cLat = candidate.containsKey("latitude") ? ((Number) candidate.get("latitude")).doubleValue() : 0;
            double cLon = candidate.containsKey("longitude") ? ((Number) candidate.get("longitude")).doubleValue() : 0;
            if (cLat == 0 && cLon == 0) continue;

            boolean isDuplicate = false;
            for (Map<String, Object> existing : unique) {
                double eLat = ((Number) existing.get("latitude")).doubleValue();
                double eLon = ((Number) existing.get("longitude")).doubleValue();
                if (Math.abs(cLat - eLat) < 0.001 && Math.abs(cLon - eLon) < 0.001) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                unique.add(candidate);
                if (unique.size() >= maxResults) break;
            }
        }

        return unique;
    }

    private String getFirstNonNull(JsonNode node, String... fields) {
        for (String field : fields) {
            if (node.has(field) && !node.get(field).isNull()) {
                return node.get(field).asText();
            }
        }
        return "";
    }
}
