package com.museum.ticketbooking.service;

import com.museum.ticketbooking.dto.OwnerMuseumProfileDTO;
import com.museum.ticketbooking.model.Museum;
import com.museum.ticketbooking.model.MuseumAmenity;
import com.museum.ticketbooking.model.MuseumBusinessHours;
import com.museum.ticketbooking.repository.MuseumAmenityRepository;
import com.museum.ticketbooking.repository.MuseumBusinessHoursRepository;
import com.museum.ticketbooking.repository.MuseumImageRepository;
import com.museum.ticketbooking.repository.MuseumRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OwnerProfileService {
    
    private final MuseumRepository museumRepository;
    private final MuseumImageRepository imageRepository;
    private final MuseumAmenityRepository amenityRepository;
    private final MuseumBusinessHoursRepository hoursRepository;

    public OwnerProfileService(MuseumRepository museumRepository,
                               MuseumImageRepository imageRepository,
                               MuseumAmenityRepository amenityRepository,
                               MuseumBusinessHoursRepository hoursRepository) {
        this.museumRepository = museumRepository;
        this.imageRepository = imageRepository;
        this.amenityRepository = amenityRepository;
        this.hoursRepository = hoursRepository;
    }
    
    @Transactional
    public OwnerMuseumProfileDTO getOwnerProfile(Long museumId) {
        Museum m = museumRepository.findById(museumId)
            .orElseThrow(() -> new RuntimeException("Museum not found"));
            
        OwnerMuseumProfileDTO dto = new OwnerMuseumProfileDTO();
        dto.setId(m.getId());
        dto.setEmail(m.getEmail());
        dto.setMuseumName(m.getMuseumName());
        dto.setSlug(m.getSlug());
        dto.setCategory(m.getCategory());
        dto.setTagline(m.getTagline());
        dto.setDescription(m.getDescription());
        dto.setCoverImageUrl(m.getCoverImageUrl());
        dto.setDisplayImageUrl(m.getDisplayImageUrl());
        dto.setPublicPhone(m.getPublicPhone());
        dto.setPublicEmail(m.getPublicEmail());
        dto.setWebsiteUrl(m.getWebsiteUrl());
        dto.setInstagramUrl(m.getInstagramUrl());
        dto.setFacebookUrl(m.getFacebookUrl());
        dto.setYoutubeUrl(m.getYoutubeUrl());
        dto.setLocation(m.getLocation());
        dto.setAddress(m.getAddress());
        dto.setLandmark(m.getLandmark());
        dto.setCity(m.getCity());
        dto.setState(m.getState());
        dto.setPincode(m.getPincode());
        dto.setLatitude(m.getLatitude());
        dto.setLongitude(m.getLongitude());
        dto.setAccessibilityNotes(m.getAccessibilityNotes());
        dto.setVisitorGuidelines(m.getVisitorGuidelines());
        dto.setRecommendedDurationMinutes(m.getRecommendedDurationMinutes());
        dto.setEstablishedYear(m.getEstablishedYear());
        dto.setAdultPrice(m.getAdultPrice());
        dto.setChildPrice(m.getChildPrice());
        dto.setSeatLimit(m.getSeatLimit());
        dto.setOpeningTime(m.getOpeningTime());
        dto.setClosingTime(m.getClosingTime());
        dto.setStaffPin(m.getStaffPin());
        dto.setVerificationCode(m.getVerificationCode());
        dto.setBookingStatus(m.getBookingStatus());
        dto.setProfilePublished(m.getProfilePublished());
        
        List<String> amenities = amenityRepository.findByMuseumId(m.getId())
            .stream().map(MuseumAmenity::getAmenityType).collect(Collectors.toList());
        dto.setAmenities(amenities);
        
        dto.setBusinessHours(hoursRepository.findByMuseumIdOrderByDayOfWeekAsc(m.getId()));
        dto.setImages(imageRepository.findByMuseumIdOrderBySortOrderAsc(m.getId()));
        
        return dto;
    }
    
    @Transactional
    public OwnerMuseumProfileDTO updateOwnerProfile(Long museumId, OwnerMuseumProfileDTO updateDTO) {
        Museum m = museumRepository.findById(museumId)
            .orElseThrow(() -> new RuntimeException("Museum not found"));
            
        // Basic fields
        if(updateDTO.getMuseumName() != null) m.setMuseumName(updateDTO.getMuseumName());
        if(updateDTO.getSlug() != null) m.setSlug(updateDTO.getSlug().toLowerCase().replaceAll("[^a-z0-9-]", "-"));
        if(updateDTO.getCategory() != null) m.setCategory(updateDTO.getCategory());
        if(updateDTO.getTagline() != null) m.setTagline(updateDTO.getTagline());
        if(updateDTO.getDescription() != null) m.setDescription(updateDTO.getDescription());
        
        if(updateDTO.getPublicPhone() != null) m.setPublicPhone(updateDTO.getPublicPhone());
        if(updateDTO.getPublicEmail() != null) m.setPublicEmail(updateDTO.getPublicEmail());
        if(updateDTO.getWebsiteUrl() != null) m.setWebsiteUrl(updateDTO.getWebsiteUrl());
        if(updateDTO.getInstagramUrl() != null) m.setInstagramUrl(updateDTO.getInstagramUrl());
        if(updateDTO.getFacebookUrl() != null) m.setFacebookUrl(updateDTO.getFacebookUrl());
        if(updateDTO.getYoutubeUrl() != null) m.setYoutubeUrl(updateDTO.getYoutubeUrl());
        
        if(updateDTO.getLocation() != null) m.setLocation(updateDTO.getLocation());
        if(updateDTO.getAddress() != null) m.setAddress(updateDTO.getAddress());
        if(updateDTO.getLandmark() != null) m.setLandmark(updateDTO.getLandmark());
        if(updateDTO.getCity() != null) m.setCity(updateDTO.getCity());
        if(updateDTO.getState() != null) m.setState(updateDTO.getState());
        if(updateDTO.getPincode() != null) m.setPincode(updateDTO.getPincode());
        if(updateDTO.getLatitude() != null) m.setLatitude(updateDTO.getLatitude());
        if(updateDTO.getLongitude() != null) m.setLongitude(updateDTO.getLongitude());
        
        if(updateDTO.getAccessibilityNotes() != null) m.setAccessibilityNotes(updateDTO.getAccessibilityNotes());
        if(updateDTO.getVisitorGuidelines() != null) m.setVisitorGuidelines(updateDTO.getVisitorGuidelines());
        if(updateDTO.getRecommendedDurationMinutes() != null) m.setRecommendedDurationMinutes(updateDTO.getRecommendedDurationMinutes());
        if(updateDTO.getEstablishedYear() != null) m.setEstablishedYear(updateDTO.getEstablishedYear());
        
        if(updateDTO.getAdultPrice() != null) m.setAdultPrice(updateDTO.getAdultPrice());
        if(updateDTO.getChildPrice() != null) m.setChildPrice(updateDTO.getChildPrice());
        if(updateDTO.getSeatLimit() != null) m.setSeatLimit(updateDTO.getSeatLimit());
        if(updateDTO.getOpeningTime() != null) m.setOpeningTime(updateDTO.getOpeningTime());
        if(updateDTO.getClosingTime() != null) m.setClosingTime(updateDTO.getClosingTime());
        
        if(updateDTO.getProfilePublished() != null) m.setProfilePublished(updateDTO.getProfilePublished());
        
        museumRepository.save(m);
        
        // Update Amenities
        if(updateDTO.getAmenities() != null) {
            amenityRepository.deleteByMuseumId(museumId);
            for(String am : updateDTO.getAmenities()) {
                MuseumAmenity a = new MuseumAmenity();
                a.setMuseumId(museumId);
                a.setAmenityType(am);
                amenityRepository.save(a);
            }
        }
        
        // Update Business Hours
        if(updateDTO.getBusinessHours() != null) {
            hoursRepository.deleteByMuseumId(museumId);
            for(MuseumBusinessHours h : updateDTO.getBusinessHours()) {
                MuseumBusinessHours newH = new MuseumBusinessHours();
                newH.setMuseumId(museumId);
                newH.setDayOfWeek(h.getDayOfWeek());
                newH.setOpenTime(h.getOpenTime());
                newH.setCloseTime(h.getCloseTime());
                newH.setIsClosed(h.getIsClosed());
                hoursRepository.save(newH);
            }
        }
        
        return getOwnerProfile(museumId);
    }
}
