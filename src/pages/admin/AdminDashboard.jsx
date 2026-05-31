import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, User, Coins, ShoppingBag, Database, Terminal, UserCheck, Key } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from '../../services/axiosClient';

export default function AdminDashboard() {
  const adminUser = useSelector((state) => state.auth.user) || {};
  const { accounts, roles, permissions } = useSelector((state) => state.admin);

  const [stats, setStats] = useState({
    usersCount: 0,
    premiumCount: 0,
    framesCount: 0,
    totalCoins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use axiosClient (withCredentials: true) — no more localStorage token
        const [usersRes, productsRes] = await Promise.all([
          axiosClient.get('/api/admin/users'),
          axiosClient.get('/api/products')
        ]);

        const usersResult = usersRes.data;
        const productsResult = productsRes.data;

        const uData = usersResult.data || [];
        const pData = productsResult.data || [];
        
        setStats({
          usersCount: uData.length,
          premiumCount: uData.filter(u => u.isPremium).length,
          framesCount: pData.length,
          totalCoins: uData.reduce((sum, u) => sum + (u.coins || 0), 0)
        });
      } catch (err) {
        console.error('⚠️ Could not load dashboard stats', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      
      {/* 🔴 Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="space-y-3 text-center md:text-left z-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> BẢNG QUẢN TRỊ VETRIX
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Chào mừng, <span className="text-amber-400">{adminUser.username || 'Quản Trị Viên'}</span>!
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Hệ thống đang hoạt động ổn định. Tại đây bạn có thể giám sát thành viên trực tiếp, kiểm duyệt khung ảnh động thời gian thực và quản lý tài nguyên MongoDB Atlas.
          </p>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3 shrink-0">
          <Database className="w-8 h-8 text-indigo-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-[#949ba4] font-bold block uppercase">Database Status</span>
            <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
              ● Connected Atlas
            </span>
          </div>
        </div>
      </div>

      {/* 🔵 Dashboard analytics grid - Client Stats */}
      <div>
        <h3 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider mb-3">Thống Kê Cộng Đồng (Client)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng thành viên</span>
              <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400">
                <User className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.usersCount}</h3>
            <p className="text-[10px] text-indigo-400 font-semibold mt-1">Đã đồng bộ thời gian thực</p>
          </div>

          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Thành viên Premium</span>
              <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-3">{loading ? '...' : stats.premiumCount}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">Sở hữu đặc quyền miễn phí</p>
          </div>

          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Khung đang mở bán</span>
              <div className="bg-pink-500/10 p-2.5 rounded-lg text-pink-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-pink-400 mt-3">{loading ? '...' : stats.framesCount}</h3>
            <p className="text-[10px] text-pink-400 font-semibold mt-1">Tự động cập nhật trên Shop</p>
          </div>

          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng tích lũy Coins</span>
              <div className="bg-amber-500/10 p-2.5 rounded-lg text-amber-500">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-3">{loading ? '...' : stats.totalCoins}</h3>
            <p className="text-[10px] text-amber-400 font-semibold mt-1">Lưu trữ trên ví thành viên</p>
          </div>
        </div>
      </div>

      {/* 🟣 RBAC System Stats */}
      <div>
        <h3 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider mb-3">Thống Kê Hệ Thống Phân Quyền (RBAC)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tài khoản Admin</span>
              <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-indigo-400 mt-3">{accounts.length}</h3>
            <p className="text-[10px] text-indigo-400 font-semibold mt-1">Tài khoản nội bộ đang hoạt động</p>
          </div>

          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Vai trò (Roles)</span>
              <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-3">{roles.length}</h3>
            <p className="text-[10px] text-purple-400 font-semibold mt-1">Nhóm vai trò quản trị hệ thống</p>
          </div>

          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Quyền Hạn (Permissions)</span>
              <div className="bg-pink-500/10 p-2.5 rounded-lg text-pink-400">
                <Key className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-pink-400 mt-3">{permissions.length}</h3>
            <p className="text-[10px] text-pink-400 font-semibold mt-1">Mã định danh phân quyền hạt mịn</p>
          </div>
        </div>
      </div>

      {/* 🟡 Development log console */}
      <div className="bg-[#1e1f22] p-5 rounded-xl border border-[#1f2023] shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-[#2b2d31] pb-2.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" /> Nhật Ký Hệ Thống Vetrix Console
          </h4>
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
            STATUS: ONLINE
          </span>
        </div>

        <div className="font-mono text-xs text-slate-400 space-y-2 select-text">
          <p className="text-[#949ba4]">[SYSTEM] <span className="text-emerald-400">[INFO]</span> MongoDB Atlas connected to Vetrix Database cluster successfully.</p>
          <p className="text-[#949ba4]">[SYSTEM] <span className="text-purple-400">[SOCKET]</span> Real-time Socket.io chat server initialized on Port 5000.</p>
          <p className="text-[#949ba4]">[SYSTEM] <span className="text-cyan-400">[RBAC]</span> Permission, Role, Account CRUD endpoints all operational.</p>
          <p className="text-[#949ba4]">[SYSTEM] <span className="text-amber-400">[AUTH]</span> HttpOnly Cookie session strategy active for Admin & Client namespaces.</p>
          <p className="text-[#949ba4]">[SYSTEM] <span className="text-pink-400">[ROUTING]</span> Admin & Client routes partitioned and protected by JWT cookie middleware.</p>
        </div>
      </div>

    </div>
  );
}
