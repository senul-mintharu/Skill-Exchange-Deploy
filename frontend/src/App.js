import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';
import NotFound from './pages/public/NotFound';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';

import PublicWorkerProfilePage from './pages/public/PublicWorkerProfilePage';

import SeekerDashboard from './pages/seeker/SeekerDashboard';
import CreateRequestPage from './pages/seeker/CreateRequestPage';
import MyRequestsPage from './pages/seeker/MyRequestsPage';
import RequestDetailsPage from './pages/seeker/RequestDetailsPage';
import BrowseWorkersPage from './pages/seeker/BrowseWorkersPage';
import CompareQuotesPage from './pages/seeker/CompareQuotesPage';
import MyReviewsPage from './pages/seeker/MyReviewsPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import BrowseRequestsPage from './pages/worker/BrowseRequestsPage';
import WorkerRequestDetailsPage from './pages/worker/WorkerRequestDetailsPage';
import SubmitQuotePage from './pages/worker/SubmitQuotePage';
import MyQuotationsPage from './pages/worker/MyQuotationsPage';
import MyJobsPage from './pages/worker/MyJobsPage';
import VerificationPage from './pages/worker/VerificationPage';


import EditWorkerProfilePage from './pages/worker/EditWorkerProfilePage';
import WorkerProfilePage from './pages/worker/WorkerProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import VerificationReviewPage from './pages/admin/VerificationReviewPage';
import AccountProfilePage from './pages/account/AccountProfilePage';
import RequireWorkerProfile from './components/common/RequireWorkerProfile';

/**
 * App.js — Main Application Component with RBAC route guards
 */
function App() {
  return (
    <BrowserRouter>
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
            <Route path="/admin/verification" element={<VerificationReviewPage />} />
          </Route>

          {/* Any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account/profile" element={<AccountProfilePage />} />
            <Route path="/account/profile/edit" element={<AccountProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
