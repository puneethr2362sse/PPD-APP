import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar for authenticated desktop/tablet users */}
      {isAuthenticated && <Navbar />}

      {/* Main Page Content */}
      <main className={`flex-1 w-full ${isAuthenticated ? 'pb-20 md:pb-8' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Nav on mobile viewports only */}
      {isAuthenticated && (
        <div className="block md:hidden">
          <MobileNav />
        </div>
      )}
    </div>
  );
};
