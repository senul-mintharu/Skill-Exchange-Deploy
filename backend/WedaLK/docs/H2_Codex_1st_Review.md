• Findings                                                                                                                                                             
                                                                                                                                                                       
  1. Blocker: Seeker create-request UI is not implemented                                                                                                              
                                                                                                                                                                       
  - frontend/src/pages/seeker/CreateRequestPage.jsx:1 is only a comment stub, no React component.                                                                      
  - frontend/src/services/requestService.js:1 is only a comment stub, no API call implementation.                                                                      
  - Without these, a seeker cannot post requests from the web app, so the user story is not complete end-to-end.                                                       
                                                                                                                                                                       
  2. Blocker: Backend is configured to disable DB/JPA, which breaks request persistence flow                                                                           
                                                                                                                                                                       
  - backend/WedaLK/demo/src/main/java/lk/wedalk/WedaLkApplication.java:16 excludes DataSourceAutoConfiguration and HibernateJpaAutoConfiguration.                      
  - Your request feature relies on JPA repositories/services (ServiceRequestRepository), so this configuration prevents normal runtime behavior for create/list        
    operations.                                                                                                                                                        
                                                                                                                                                                       
  3. Blocker: DB schema and entity are inconsistent (insert failure risk)                                                                                              
                                                                                                                                                                       
  - Migration requires title as NOT NULL: backend/WedaLK/demo/src/main/resources/db/migration/V1__init.sql:42.                                                         
  - Entity has no title field: backend/WedaLK/demo/src/main/java/lk/wedalk/requests/model/ServiceRequest.java:33.                                                      
  - Creating requests via JPA can fail against this schema because title is required by DB but never provided.                                                         
                                                                                                                                                                       
  4. High: Authentication principal handling is fragile and likely wrong
                                                                                                                                                                       
  - Long.parseLong(authentication.getName()) in backend/WedaLK/demo/src/main/java/lk/wedalk/requests/controller/ServiceRequestController.java:35 and :44.              
  - In typical Spring Security, authentication.getName() is username/email, not numeric user ID. This can throw NumberFormatException and break endpoints.             
                                                                                                                                                                       
  5. High: Role protection may not actually be enforced                                                                                                                
                                                                                                                                                                       
  - @PreAuthorize(...) is used in backend/WedaLK/demo/src/main/java/lk/wedalk/requests/controller/ServiceRequestController.java:31, but security config is still a     
    stub: backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java:1.                                                                                    
  - If method security is not enabled/configured, role checks can be bypassed unintentionally.                                                                         
                                                                                                                                                                       
  6. Medium: “so that skilled workers can respond” part is incomplete                                                                                                  
                                                                                                                                                                       
  - Quotation API/controller is still a stub: backend/WedaLK/demo/src/main/java/lk/wedalk/quotes/controller/QuotationController.java:1.                                
  - Worker response flow is not implemented yet, so posted requests cannot be responded to through your system.                                                        
                                                                                                                                                                       
  7. Medium: Missing tests for the implemented request feature                                                                                                         
                                                                                                                                                                       
  - Only default context-load test exists: backend/WedaLK/demo/src/test/java/com/example/demo/WedaLkApplicationTests.java:6.                                           
  - No tests for create request validation, role access, or open-request retrieval.                                                                                    
                                                                                                                                                                       
  Open question                                                                                                                                                        
                                                                                                                                                                       
  1. Are you intentionally using user ID as security principal name? If yes, that needs to be explicit in your auth setup; otherwise this controller logic should be   
     changed.                                                                                                                                                          
                                                                                                                                                                       
  Verification note                                                                                                                                                    
                                                                                                                                                                       
  - I could not run Maven compile/tests in this sandbox because Maven local repository access is blocked (C:\Users\CodexSandboxOffline\.m2\repository). So this review 
    is based on static code inspection. 