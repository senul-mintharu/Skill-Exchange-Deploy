package lk.wedalk.reviews.model;

/**
 * Review.java — Review JPA Entity
 *
 * <p>This file should contain: - @Entity, @Table(name = "reviews") annotations - Fields: - Long id
 * — @Id, @GeneratedValue - ServiceRequest request — @ManyToOne, the completed request being
 * reviewed - User reviewer — @ManyToOne, the user leaving the review (seeker) - User reviewee
 * — @ManyToOne, the user being reviewed (worker) - int rating — 1 to 5 star rating - String comment
 * — review text - LocalDateTime createdAt -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Constraints: - Review can only be created for COMPLETED requests - One review per request per
 * reviewer - Unique constraint on (request_id, reviewer_id)
 */
