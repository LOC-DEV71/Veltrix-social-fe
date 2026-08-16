import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Server, ShieldCheck, Settings, UserCheck, Key, 
  Activity, BarChart2, Bell, Search, Database, LogOut, Radio, LayoutDashboard, Globe
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user) || {};

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Users', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { name: 'Products', path: '/admin/products', icon: <Server className="w-4 h-4" /> },
        { name: 'Analytics', path: '/admin/premium-products', icon: <BarChart2 className="w-4 h-4" /> },
        { name: 'Categories', path: '/admin/categories', icon: <Database className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Security',
      items: [
        { name: 'Accounts', path: '/admin/accounts', icon: <ShieldCheck className="w-4 h-4" /> },
        { name: 'Roles', path: '/admin/roles', icon: <UserCheck className="w-4 h-4" /> },
        { name: 'Permissions', path: '/admin/permissions', icon: <Key className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'System Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0f1c] text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar (240px) */}
      <aside className="w-[240px] shrink-0 border-r border-[#1e293b] flex flex-col bg-[#0a0f1c]">
        {/* Sidebar Header */}
        <div className="h-14 px-5 flex items-center gap-3 border-b border-[#1e293b]">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Radio className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-100 text-sm tracking-wide">Mission Control</span>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-2 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] ${
                          isActive 
                            ? 'bg-[#1e293b] text-white font-medium' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2c]'
                        }`}
                      >
                        <div className={`${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                          {item.icon}
                        </div>
                        {item.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-300 font-medium text-xs">
              {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-medium text-slate-200 truncate">{user.username || 'Admin'}</h4>
              <p className="text-[11px] text-slate-500 truncate">{user.role?.name || 'Production'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-14 border-b border-[#1e293b] bg-[#0a0f1c] flex items-center justify-between px-6 shrink-0">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-[#131b2c] px-3 py-1.5 rounded-full border border-[#1e293b]">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Production Env</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status Indicators */}
            <div className="hidden md:flex items-center gap-4 mr-4 pr-4 border-r border-[#1e293b]">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                API
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                WSS
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                DB
              </div>
            </div>

            <button className="text-slate-400 hover:text-slate-200 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="text-slate-400 hover:text-slate-200 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0f1c] scrollbar-hide">
          <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;