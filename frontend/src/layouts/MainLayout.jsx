import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const MainLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen">
      {!hideNavbar ? <Navbar variant={isLanding ? 'landing' : 'portal'} /> : null}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
