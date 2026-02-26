import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';
import CreateRequestPage from './pages/seeker/CreateRequestPage';
import MyRequestsPage from './pages/seeker/MyRequestsPage';
import RequestDetailsPage from './pages/seeker/RequestDetailsPage';
import BrowseRequestsPage from './pages/worker/BrowseRequestsPage';
import WorkerRequestDetailsPage from './pages/worker/WorkerRequestDetailsPage';

import WorkerProfileForm from './components/WorkerProfileForm';

import WorkerProfileView from './components/WorkerProfileView';

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
          <Route path="/create-profile" element={<WorkerProfileForm />} />
          <Route path="/edit-profile/:id" element={<WorkerProfileForm />} />
          <Route path="/profile/:id" element={<WorkerProfileView />} />
        </Route>
        <Route path="/create-request" element={<CreateRequestPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/my-requests/:requestId" element={<RequestDetailsPage />} />
        <Route path="/requests/:requestId" element={<WorkerRequestDetailsPage />} />
        <Route path="/browse-requests" element={<BrowseRequestsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
