import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.includes(path);
  
  // Determine if current page should use full width
  const isFullWidthPage = location.pathname.includes('studio') || location.pathname.includes('discover') || location.pathname.includes('garage');

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="fixed top-0 left-0 h-full w-64 bg-background-light dark:bg-background-dark border-r border-white/10 p-6 flex-col justify-between hidden lg:flex">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">directions_car</span>
            <h1 className="text-white text-xl font-bold leading-normal">AutoGen</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <Link to="/feed" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg ${isActive('feed') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 transition-colors duration-200'}`}>
              <span className="material-symbols-outlined">home</span>
              <p className="text-sm font-medium leading-normal">Home</p>
            </Link>
            <Link to="/discover" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg ${isActive('discover') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 transition-colors duration-200'}`}>
              <span className="material-symbols-outlined">explore</span>
              <p className="text-sm font-medium leading-normal">Discover</p>
            </Link>
            <Link to="/studio" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg ${isActive('studio') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 transition-colors duration-200'}`}>
              <span className="material-symbols-outlined">settings_motion_mode</span>
              <p className="text-sm font-medium leading-normal">Configurator</p>
            </Link>
            <Link to="/garage" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg ${isActive('garage') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 transition-colors duration-200'}`}>
              <span className="material-symbols-outlined">garage</span>
              <p className="text-sm font-medium leading-normal">Garage</p>
            </Link>
            <Link to="/profile" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg ${isActive('profile') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 transition-colors duration-200'}`}>
              <span className="material-symbols-outlined">person</span>
              <p className="text-sm font-medium leading-normal">Profile</p>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left">
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium leading-normal">Sign Out</p>
            </button>
          </nav>
        </div>
        <div />
      </aside>

      <main className="w-full lg:pl-64 flex justify-center py-8">
        <div className={`w-full px-4 lg:px-8 ${isFullWidthPage ? 'max-w-7xl' : 'max-w-2xl lg:px-0'}`}>
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-black/50 backdrop-blur-lg border-t border-white/10 lg:hidden">
        <div className="flex justify-around items-center h-16">
          <Link to="/feed" className={`${isActive('feed') ? 'text-primary' : 'text-white hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined text-3xl">home</span>
          </Link>
          <Link to="/discover" className={`${isActive('discover') ? 'text-primary' : 'text-white hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined text-3xl">explore</span>
          </Link>
          <Link to="/studio" className={`${isActive('studio') ? 'text-primary' : 'text-white hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined text-3xl">settings_motion_mode</span>
          </Link>
          <Link to="/garage" className={`${isActive('garage') ? 'text-primary' : 'text-white hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined text-3xl">garage</span>
          </Link>
          <Link to="/profile" className={`${isActive('profile') ? 'text-primary' : 'text-white hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined text-3xl">person</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
