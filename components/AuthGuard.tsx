import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }
  return <>{children}</>;
};

export default AuthGuard;