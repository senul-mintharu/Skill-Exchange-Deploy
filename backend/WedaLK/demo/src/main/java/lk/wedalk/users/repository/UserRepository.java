package lk.wedalk.users.repository;

import java.util.List;
import java.util.Optional;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
