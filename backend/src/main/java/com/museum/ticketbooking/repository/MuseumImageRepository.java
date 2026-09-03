package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.MuseumImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MuseumImageRepository extends JpaRepository<MuseumImage, Long> {
    List<MuseumImage> findByMuseumIdOrderBySortOrderAsc(Long museumId);
    List<MuseumImage> findByMuseumIdAndImageTypeOrderBySortOrderAsc(Long museumId, String imageType);
    Optional<MuseumImage> findByMuseumIdAndImageType(Long museumId, String imageType);
}
