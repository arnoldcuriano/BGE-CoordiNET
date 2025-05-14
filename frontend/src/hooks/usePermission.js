import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const usePermission = (requiredPermission) => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (authState.isAuthenticated && !authState.accessPermissions?.[requiredPermission]) {
      navigate('/no-access');
    }
  }, [authState, navigate, requiredPermission]);

  return authState.accessPermissions?.[requiredPermission] || false;
};

export default usePermission;