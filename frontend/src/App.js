import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/ToastContext';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RequireWorkerProfile from './components/common/RequireWorkerProfile';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PublicWorkerProfilePage = lazy(() => import('./pages/public/PublicWorkerProfilePage'));
const SeekerDashboard = lazy(() => import('./pages/seeker/SeekerDashboard'));
const CreateRequestPage = lazy(() => import('./pages/seeker/CreateRequestPage'));
const MyRequestsPage = lazy(() => import('./pages/seeker/MyRequestsPage'));
const RequestDetailsPage = lazy(() => import('./pages/seeker/RequestDetailsPage'));
const BrowseWorkersPage = lazy(() => import('./pages/seeker/BrowseWorkersPage'));
const CompareQuotesPage = lazy(() => import('./pages/seeker/CompareQuotesPage'));
const MyReviewsPage = lazy(() => import('./pages/seeker/MyReviewsPage'));
const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'));
const BrowseRequestsPage = lazy(() => import('./pages/worker/BrowseRequestsPage'));
const WorkerRequestDetailsPage = lazy(() => import('./pages/worker/WorkerRequestDetailsPage'));
const SubmitQuotePage = lazy(() => import('./pages/worker/SubmitQuotePage'));
const MyQuotationsPage = lazy(() => import('./pages/worker/MyQuotationsPage'));
const MyJobsPage = lazy(() => import('./pages/worker/MyJobsPage'));
const VerificationPage = lazy(() => import('./pages/worker/VerificationPage'));
const EditWorkerProfilePage = lazy(() => import('./pages/worker/EditWorkerProfilePage'));
const WorkerProfilePage = lazy(() => import('./pages/worker/WorkerProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DisputeDetailsPage = lazy(() => import('./pages/admin/DisputeDetailsPage'));
const VerificationReviewPage = lazy(() => import('./pages/admin/VerificationReviewPage'));
const DisputeReviewPage = lazy(() => import('./pages/admin/DisputeReviewPage'));
const AdminJobDetailsPage = lazy(() => import('./pages/admin/AdminJobDetailsPage'));
const AdminPaymentSlipsPage = lazy(() => import('./pages/admin/AdminPaymentSlipsPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const TrustWorkflowPage = lazy(() => import('./pages/admin/TrustWorkflowPage'));
const AccountProfilePage = lazy(() => import('./pages/account/AccountProfilePage'));

const RouteFallback = (
  <div className="page-wrapper">
    <main className="ui-shell">
      <div className="rounded-panel border border-line bg-white p-6 text-sm text-ink-muted shadow-card">
        Loading page...
      </div>
    </main>
  </div>
);

/**
 * App.js — Main Application Component with RBAC route guards
 */
function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={RouteFallback}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/workers/:id" element={<PublicWorkerProfilePage />} />

              <Route element={<ProtectedRoute allowedRoles={['SEEKER']} />}>
                <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                <Route path="/create-request" element={<CreateRequestPage />} />
                <Route path="/my-requests" element={<MyRequestsPage />} />
                <Route path="/my-requests/:requestId" element={<RequestDetailsPage />} />
                <Route
                  path="/my-requests/:requestId/quotations"
                  element={<CompareQuotesPage />}
                />
                <Route path="/browse-workers" element={<BrowseWorkersPage />} />
                <Route path="/my-reviews" element={<MyReviewsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
                <Route path="/worker/dashboard" element={<WorkerDashboard />} />
                <Route path="/browse-requests" element={<BrowseRequestsPage />} />
                <Route path="/requests/:requestId" element={<WorkerRequestDetailsPage />} />
                <Route path="/create-profile" element={<EditWorkerProfilePage />} />
                <Route path="/edit-profile/:id" element={<EditWorkerProfilePage />} />
                <Route path="/profile/:id" element={<WorkerProfilePage />} />
                <Route path="/worker/verification" element={<VerificationPage />} />

                <Route element={<RequireWorkerProfile />}>
                  <Route path="/requests/:requestId/quote" element={<SubmitQuotePage />} />
                  <Route path="/my-quotations" element={<MyQuotationsPage />} />
                  <Route path="/my-jobs" element={<MyJobsPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/trust-workflow" element={<TrustWorkflowPage />} />
                <Route path="/admin/disputes" element={<DisputeReviewPage />} />
                <Route path="/admin/disputes/:disputeId" element={<DisputeDetailsPage />} />
                <Route path="/admin/verification" element={<VerificationReviewPage />} />

                <Route path="/admin/jobs/:requestId" element={<AdminJobDetailsPage />} />
                <Route path="/admin/payment-slips" element={<AdminPaymentSlipsPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>

              {/* Any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/account/profile" element={<AccountProfilePage />} />
                <Route path="/account/profile/edit" element={<AccountProfilePage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
