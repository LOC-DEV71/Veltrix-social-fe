import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import adminAuthService from '../services/admin/adminAuthService';
import { 
  Users, 
  ShoppingBag, 
  ShieldAlert, 
  LogOut, 
  LayoutDashboard, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Key,
  FolderTree
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Select authenticated staff profile dynamically from Redux
  const user = useSelector((state) => state.auth.user) || {};

  const menuItems = [
    { name: 'Bảng Thống Kê', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Quản lý Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Quản lý Products', path: '/admin/products', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Sản Phẩm Premium', path: '/admin/premium-products', icon: <Sparkles className="w-5 h-5" /> },
    { name: 'Danh Mục Sản Phẩm', path: '/admin/categories', icon: <FolderTree className="w-5 h-5" /> },
    { name: 'Tài Khoản Nội Bộ', path: '/admin/accounts', icon: <ShieldCheck className="w-5 h-5" /> },
    { name: 'Quản Lý Vai Trò', path: '/admin/roles', icon: <UserCheck className="w-5 h-5" /> },
    { name: 'Quản Lý Quyền Hạn', path: '/admin/permissions', icon: <Key className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      dispatch(logout());
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(logout());
      navigate('/admin/login');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#1e1f22] text-[#dbdee1] overflow-hidden select-none font-sans">
      
      {/* 🔴 Sidebar Panel */}
      <div className="w-64 bg-[#2b2d31] flex flex-col shrink-0 border-r border-[#1f2023]/40">
        
        {/* Panel Header */}
        <div className="h-14 border-b border-[#1f2023] flex items-center justify-between px-4 font-bold text-white shadow-sm gap-2">
          <span className="flex items-center gap-1.5 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            VETRIX ADMIN
          </span>
          <button 
            onClick={handleLogout} 
            className="text-xs bg-[#35373c] hover:bg-[#4e5058] text-[#dbdee1] hover:text-white px-2 py-1 rounded transition-all flex items-center gap-1.5 font-semibold cursor-pointer border border-[#1f2023]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng Xuất
          </button>
        </div>

        {/* Sidebar Nav Lists */}
        <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 font-bold border-l-4 border-amber-500'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom Current Profile Summary */}
        <div className="p-3 bg-[#232428] border-t border-[#1f2023]/30 flex items-center gap-2.5">
          <div className="relative shrink-0 w-8 h-8 rounded-full p-[2px] bg-gradient-to-r from-amber-400 to-yellow-500 animate-pulse">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border border-slate-950">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`} 
                alt="Admin" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`;
                }}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
              {user.username || 'Admin Khang'}
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            </h4>
            <span className="text-[9px] text-[#949ba4] uppercase font-bold tracking-wider">
              {user.role && typeof user.role === 'object' ? user.role.name : 'Quản Trị Viên'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔵 Main Content Container */}
      <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden">
        
        {/* Sub Header */}
        <div className="h-14 border-b border-[#1f2023] flex items-center px-6 shrink-0 bg-[#313338] shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
            {location.pathname === '/admin' ? 'Bảng thống kê số liệu hệ thống' : 
             location.pathname === '/admin/users' ? 'Quản lý người dùng trong hệ thống' : 
             location.pathname === '/admin/products' ? 'Quản lý đăng tải sản phẩm' : 
             location.pathname === '/admin/accounts' ? 'Quản lý tài khoản cán bộ nội bộ staff' : 
             location.pathname === '/admin/roles' ? 'Quản lý vai trò & quyền hạn (Roles)' : 'Quản lý danh sách quyền hạn chi tiết (Permissions)'}
          </h2>
        </div>
        
        {/* Render Child Components dynamically */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

    </div>
  );
}
