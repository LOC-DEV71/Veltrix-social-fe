import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, setLoading, logout } from '../redux/slices/authSlice';
import axiosClient from '../services/axiosClient';
import { Loader2 } from 'lucide-react';

export default function AdminProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        dispatch(setLoading(true));
        
        // Fetch current staff account from administrative session cookie
        const res = await axiosClient.get('/api/admin/auth/me');
        if (res.data && res.data.success) {
          // Sync administrative details into Redux Toolkit store
          dispatch(loginSuccess(res.data.data));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        console.warn('🔒 Administrative unauthenticated or session expired.');
        dispatch(logout());
      } finally {
        dispatch(setLoading(false));
      }
    };

    // If not authenticated, fetch to see if cookie is present
    if (!isAuthenticated) {
      checkAdminAuth();
    } else {
      dispatch(setLoading(false));
    }
  }, [isAuthenticated, dispatch]);

  // Loading state with stunning dark administrative style
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-[#1e1f22] text-[#dbdee1]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs text-[#949ba4] font-medium tracking-wide">Đang xác thực thông tin quản trị viên...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Verify administrative role clearance
  const roleName = user && user.role && typeof user.role === 'object'
    ? user.role.name
    : user ? user.role : null;

  const validAdminRoles = ['admin', 'Super Admin', 'Product Manager'];
  if (roleName && !validAdminRoles.includes(roleName)) {
    console.warn(`🔒 Access Denied: Staff role is ${roleName}. Redirecting to administrative login...`);
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
