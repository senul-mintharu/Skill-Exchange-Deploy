package lk.wedalk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import lk.wedalk.disputes.repository.DisputeRepository;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.quotes.repository.QuotationRepository;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.reviews.repository.ReviewRepository;
import lk.wedalk.users.repository.UserRepository;
import lk.wedalk.verification.repository.VerificationRepository;

@SpringBootTest(
    classes = WedaLkApplication.class,
    properties = {
      "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
          + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
    })
class WedaLkApplicationTests {

  @MockBean private UserRepository userRepository;
  @MockBean private ServiceRequestRepository serviceRequestRepository;
  @MockBean private QuotationRepository quotationRepository;
  @MockBean private ReviewRepository reviewRepository;
  @MockBean private DisputeRepository disputeRepository;
  @MockBean private WorkerProfileRepository workerProfileRepository;
  @MockBean private VerificationRepository verificationRepository;

  @Test
  void contextLoads() {}
}
