package lk.wedalk.users.repository;

import java.util.List;
import java.util.Optional;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * UserRepository.java — User Data Access Layer
 *
 * <p>
 * Provides CRUD operations and custom queries for the User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  List<User> findByRole(Role role);

  List<User> findByIsSuspendedTrue();

  @Query("""
      SELECT u
      FROM User u
      WHERE (:role IS NULL OR u.role = :role)
        AND (
          :status IS NULL OR :status = ''
          OR (:status = 'active' AND (u.isSuspended = false OR u.isSuspended IS NULL))
          OR (:status = 'suspended' AND u.isSuspended = true)
        )
        AND (
          :search IS NULL OR :search = ''
          OR LOWER(COALESCE(u.fullName, '')) LIKE CONCAT('%', :search, '%')
          OR LOWER(COALESCE(u.email, '')) LIKE CONCAT('%', :search, '%')
          OR LOWER(COALESCE(u.district, '')) LIKE CONCAT('%', :search, '%')
          OR LOWER(COALESCE(u.phoneNumber, '')) LIKE CONCAT('%', :search, '%')
        )
      ORDER BY u.createdAt DESC
      """)
  List<User> findAdminUsers(@Param("search") String search,
                            @Param("role") Role role,
                            @Param("status") String status);
}
