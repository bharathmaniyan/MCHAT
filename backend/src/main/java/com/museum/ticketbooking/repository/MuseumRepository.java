package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.Museum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface MuseumRepository extends JpaRepository<Museum, Long> {
    Optional<Museum> findByEmail(String email);
    boolean existsByEmail(String email);
    
    @Query("SELECT m FROM Museum m WHERE m.bookingStatus = true ORDER BY m.museumName ASC")
    List<Museum> findAllActiveMuseums();
    
    @Query("SELECT m FROM Museum m ORDER BY m.museumName ASC")
    List<Museum> findAllMuseumsOrdered();
}
