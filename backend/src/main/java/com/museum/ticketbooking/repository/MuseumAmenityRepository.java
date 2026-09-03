package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.MuseumAmenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MuseumAmenityRepository extends JpaRepository<MuseumAmenity, Long> {
    List<MuseumAmenity> findByMuseumId(Long museumId);
    void deleteByMuseumId(Long museumId);
}
