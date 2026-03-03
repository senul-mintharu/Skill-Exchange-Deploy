import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';

import PublicWorkerProfilePage from './pages/public/PublicWorkerProfilePage'; // Added proper import

import CreateRequestPage from './pages/seeker/CreateRequestPage';
import MyRequestsPage from './pages/seeker/MyRequestsPage';
import RequestDetailsPage from './pages/seeker/RequestDetailsPage';
import BrowseRequestsPage from './pages/worker/BrowseRequestsPage';
import WorkerRequestDetailsPage from './pages/worker/WorkerRequestDetailsPage';


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
