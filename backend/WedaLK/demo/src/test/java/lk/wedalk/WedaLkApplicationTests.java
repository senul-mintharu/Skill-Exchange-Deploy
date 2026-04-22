package lk.wedalk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
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
