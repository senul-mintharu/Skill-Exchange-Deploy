import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';

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

/**
 * App.js — Main Application Component (Simplified)
 * 
 * No authentication - all routes are public
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />

          {/* SCRUM-13: Seeker - Create & Manage Requests */}
          <Route path="/create-request" element={<CreateRequestPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/my-requests/:requestId" element={<RequestDetailsPage />} />
          <Route path="/my-requests/:requestId/quotations" element={<CompareQuotesPage />} />

          {/* SCRUM-14 & 15: Worker - Browse & View Request Details */}
          <Route path="/browse-requests" element={<BrowseRequestsPage />} />
          <Route path="/requests/:requestId" element={<WorkerRequestDetailsPage />} />

          {/* SCRUM-71: Seeker - Browse Workers / Explore Service Providers */}
          <Route path="/browse-workers" element={<BrowseWorkersPage />} />
          {/* Sprint 2: Worker - Submit Quotation */}
          <Route path="/requests/:requestId/quote" element={<SubmitQuotePage />} />

          {/* SCRUM-64: Worker - View & Withdraw Quotations */}
          <Route path="/my-quotations" element={<MyQuotationsPage />} />

          {/* SCRUM-19, 20, 21: Worker Profile */}
          <Route path="/create-profile" element={<EditWorkerProfilePage />} />
          <Route path="/edit-profile/:id" element={<EditWorkerProfilePage />} />
          <Route path="/profile/:id" element={<WorkerProfilePage />} />
          <Route path="/workers/:id" element={<PublicWorkerProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
