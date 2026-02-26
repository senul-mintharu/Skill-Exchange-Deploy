package lk.wedalk.profiles.model;

/**
 * PortfolioImage.java — Portfolio Image Entity (Optional)
 *
 * <p>This file should contain: - @Entity, @Table(name = "portfolio_images") annotations - Fields: -
 * Long id — @Id, @GeneratedValue - WorkerProfile workerProfile — @ManyToOne, the profile this image
 * belongs to - String imageUrl — URL or file path of the uploaded image - String caption — optional
 * description of the work shown - LocalDateTime uploadedAt -
 * Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Allows workers to showcase their past work through portfolio images.
 */
