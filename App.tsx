import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import Garage from './pages/Garage';
import Studio from './pages/Studio';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AuthGuard from './components/AuthGuard';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (supabase) {
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
      });

      // Listen for changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });

      return () => subscription.unsubscribe();
    } else {
      // Fallback for demo without supabase keys
      setIsAuthenticated(false); 
    }
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-carbon-950 flex items-center justify-center text-neon-cyan">Loading Engine...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/garage" replace />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="discover" element={<Discover />} />
          <Route 
            path="garage" 
            element={
              <AuthGuard isAuthenticated={isAuthenticated}>
                <Garage />
              </AuthGuard>
            } 
          />
          <Route 
            path="studio" 
            element={
              <AuthGuard isAuthenticated={isAuthenticated}>
                <Studio />
              </AuthGuard>
            } 
          />
          <Route 
            path="profile" 
            element={
              <AuthGuard isAuthenticated={isAuthenticated}>
                <Profile />
              </AuthGuard>
            } 
          />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
