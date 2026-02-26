import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const MainLayout = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';

    return (
        <div className="main-layout">
            <Navbar variant={isLanding ? 'landing' : 'portal'} />
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
