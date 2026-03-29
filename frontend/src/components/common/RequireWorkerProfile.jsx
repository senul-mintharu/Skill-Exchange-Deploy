import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { getProfileByUserId } from '../../services/profileService';

const RequireWorkerProfile = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      if (!user?.id || user?.role !== 'WORKER') {
        setLoading(false);
        return;
      }

      try {
        await getProfileByUserId(user.id);
        setHasProfile(true);
      } catch (err) {
        if (err?.response?.status === 404) {
          setHasProfile(false);
        } else {
          setCheckError('Unable to verify your worker profile right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user?.id, user?.role]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking your worker profile...</div>;
  }

  if (checkError) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{checkError}</div>;
  }

  if (!hasProfile) {
    return (
      <Navigate
        to="/create-profile"
        replace
        state={{ from: location.pathname, reason: 'profile-required' }}
      />
    );
  }

  return <Outlet />;
};

export default RequireWorkerProfile;
