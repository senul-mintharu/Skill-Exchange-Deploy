import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/public/LandingPage';
import CreateRequestPage from './pages/seeker/CreateRequestPage';
import MyRequestsPage from './pages/seeker/MyRequestsPage';
import RequestDetailsPage from './pages/seeker/RequestDetailsPage';

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
        </Route>
        <Route path="/create-request" element={<CreateRequestPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/my-requests/:requestId" element={<RequestDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
