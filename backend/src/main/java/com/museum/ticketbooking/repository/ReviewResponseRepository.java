package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.ReviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ReviewResponseRepository extends JpaRepository<ReviewResponse, Long> {
    Optional<ReviewResponse> findByReviewId(Long reviewId);
    List<ReviewResponse> findByMuseumId(Long museumId);
}
