import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, setLoading, logout } from '../redux/slices/authSlice';
import axiosClient from '../services/axiosClient';
import { Loader2 } from 'lucide-react';

export default function ClientProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch(setLoading(true));
        
        // Call GET /api/auth/me to fetch fresh authenticated user profile
        const res = await axiosClient.get('/api/auth/me');
        if (res.data && res.data.status === 'success') {
          // Sync profile to Redux Toolkit store
          dispatch(loginSuccess(res.data.data));
        } else {
          localStorage.removeItem('token');
          dispatch(logout());
        }
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.isBanned) {
          window.location.href = '/banned';
          return;
        }
        console.warn('🔒 Client unauthenticated or session expired.');
        localStorage.removeItem('token');
        dispatch(logout());
      } finally {
        dispatch(setLoading(false));
      }
    };

    // Only verify auth if not already authenticated
    if (!isAuthenticated) {
      checkAuth();
    } else {
      dispatch(setLoading(false));
    }
  }, [isAuthenticated, dispatch]);

  // Render a clean, dark styled loading spinner while resolving session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-[#313338] text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-[#949ba4] font-medium tracking-wide">Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, kick to login view
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
