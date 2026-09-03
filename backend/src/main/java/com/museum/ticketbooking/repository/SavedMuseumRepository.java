package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.SavedMuseum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedMuseumRepository extends JpaRepository<SavedMuseum, Long> {
    List<SavedMuseum> findByVisitorEmailOrderBySavedAtDesc(String visitorEmail);
    Optional<SavedMuseum> findByVisitorEmailAndMuseumId(String visitorEmail, Long museumId);
    boolean existsByVisitorEmailAndMuseumId(String visitorEmail, Long museumId);
    void deleteByVisitorEmailAndMuseumId(String visitorEmail, Long museumId);
}
