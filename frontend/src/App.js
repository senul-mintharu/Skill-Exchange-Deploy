import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';
import NotFound from './pages/public/NotFound';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';

import PublicWorkerProfilePage from './pages/public/PublicWorkerProfilePage'; // Added proper import

import CreateRequestPage from './pages/seeker/CreateRequestPage';
import MyRequestsPage from './pages/seeker/MyRequestsPage';
import RequestDetailsPage from './pages/seeker/RequestDetailsPage';
import BrowseWorkersPage from './pages/seeker/BrowseWorkersPage';
import CompareQuotesPage from './pages/seeker/CompareQuotesPage';
import BrowseRequestsPage from './pages/worker/BrowseRequestsPage';
import WorkerRequestDetailsPage from './pages/worker/WorkerRequestDetailsPage';
import SubmitQuotePage from './pages/worker/SubmitQuotePage';
import MyQuotationsPage from './pages/worker/MyQuotationsPage';


import EditWorkerProfilePage from './pages/worker/EditWorkerProfilePage';

import WorkerProfilePage from './pages/worker/WorkerProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AccountProfilePage from './pages/account/AccountProfilePage';

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

          {/* SEEKER routes */}
          <Route element={<ProtectedRoute allowedRoles={['SEEKER']} />}>
            <Route path="/seeker/dashboard" element={<MyRequestsPage />} />
            <Route path="/seeker/create-request" element={<CreateRequestPage />} />
            <Route path="/seeker/my-requests" element={<MyRequestsPage />} />
            <Route path="/seeker/requests/:requestId" element={<RequestDetailsPage />} />
            <Route path="/seeker/compare-quotes/:requestId" element={<CompareQuotesPage />} />
            <Route path="/seeker/browse-workers" element={<BrowseWorkersPage />} />
          </Route>

          {/* WORKER routes */}
          <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
            <Route path="/worker/dashboard" element={<BrowseRequestsPage />} />
            <Route path="/worker/browse" element={<BrowseRequestsPage />} />
            <Route path="/worker/requests/:requestId" element={<WorkerRequestDetailsPage />} />
            <Route path="/worker/submit-quote/:requestId" element={<SubmitQuotePage />} />
            <Route path="/worker/my-quotations" element={<MyQuotationsPage />} />
            <Route path="/worker/create-profile" element={<EditWorkerProfilePage />} />
            <Route path="/worker/edit-profile/:id" element={<EditWorkerProfilePage />} />
            <Route path="/worker/profile/:id" element={<WorkerProfilePage />} />
          </Route>

          {/* ADMIN routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
