import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { MobileFrameWrapper } from './MobileFrameWrapper';
import { useAuth } from '../../context/AuthContext';
import { useViewMode } from '../../context/ViewModeContext';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { mode } = useViewMode();

  const isSimulatingMobile = mode === 'mobile-sim';

  const content = (
    <div className={`min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 ${isSimulatingMobile ? 'min-h-full' : ''}`}>
      {/* Top Navbar for authenticated desktop users (hidden when in mobile simulation mode) */}
      {isAuthenticated && !isSimulatingMobile && <Navbar />}

      {/* Main Container */}
      <main className={`flex-1 w-full ${isAuthenticated ? (isSimulatingMobile ? 'pb-20' : 'pb-20 md:pb-8') : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Nav for mobile users (or mobile simulation mode) */}
      {isAuthenticated && (
        <div className={isSimulatingMobile ? 'block' : 'block md:hidden'}>
          <MobileNav />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* If simulating mobile mode on large desktop screens, wrap inside MobileFrameWrapper */}
      {isSimulatingMobile ? (
        <>
          <div className="hidden lg:block">
            <MobileFrameWrapper>
              {content}
            </MobileFrameWrapper>
          </div>
          {/* For real mobile viewports, render standard full-screen */}
          <div className="block lg:hidden">
            {content}
          </div>
        </>
      ) : (
        content
      )}
    </>
  );
};
