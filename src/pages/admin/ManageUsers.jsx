import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, User, Coins, Calendar, Loader, Gift, Ban, Unlock, ShieldAlert, X } from 'lucide-react';
import axiosClient from '../../services/axiosClient';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showBanListModal, setShowBanListModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState('both');
  const [banList, setBanList] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get('/api/admin/users');
      const result = response.data;
      
      if (result.status === 'success' || result.success) {
        setUsers(result.data);
      } else {
        setError(result.message || 'Lỗi tải danh sách người dùng!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCoinModal = (user) => {
    setSelectedUser(user);
    setCoinAmount('');
    setShowCoinModal(true);
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setBanType('both');
    setShowBanModal(true);
  };

  const handleAddCoins = async (e) => {
    e.preventDefault();
    const amount = Number(coinAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const res = await axiosClient.post(`/api/admin/users/${selectedUser._id}/coins`, { amount });
      if (res.data.success) {
        setShowCoinModal(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tặng Coin!');
    }
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post(`/api/admin/users/${selectedUser._id}/ban`, { 
        reason: banReason,
        banType: banType 
      });
      if (res.data.success) {
        setShowBanModal(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cấm người dùng!');
    }
  };

  const loadBanList = async () => {
    try {
      const res = await axiosClient.get('/api/admin/users/bans/list');
      setBanList(res.data.data);
      setShowBanListModal(true);
    } catch (err) {
      alert('Không thể tải danh sách cấm!');
    }
  };

  const handleUnban = async (banId) => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ cấm cho người này?')) return;
    try {
      const res = await axiosClient.delete(`/api/admin/users/bans/${banId}`);
      if (res.data.success) {
        setBanList(banList.filter(b => b._id !== banId));
        fetchUsers(); // Update user status in background
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gỡ cấm!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-indigo-400 space-y-2">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-xs font-semibold text-[#949ba4]">Đang tải danh sách người dùng từ MongoDB...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng số Users</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{users.length}</h3>
          </div>
          <div className="bg-[#35373c] p-3 rounded-lg text-indigo-400">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng số Premium</span>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
              {users.filter(u => u.isPremium).length}
            </h3>
          </div>
          <div className="bg-[#35373c] p-3 rounded-lg text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023]/40 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng số Admin</span>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-1">
              {users.filter(u => u.role === 'admin').length}
            </h3>
          </div>
          <div className="bg-[#35373c] p-3 rounded-lg text-amber-500">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

        {/* Users Table List */}
      <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023]/40 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#1f2023] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Danh sách thành viên</h3>
          <div className="flex items-center gap-4">
            {error && <span className="text-xs text-rose-400 font-semibold">{error}</span>}
            <button
              onClick={loadBanList}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" /> Danh sách cấm
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f2023] bg-[#232428] text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                <th className="px-6 py-3.5">Thành viên</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Ví Coin</th>
                <th className="px-6 py-3.5 text-center">Số khung sở hữu</th>
                <th className="px-6 py-3.5">Vai trò</th>
                <th className="px-6 py-3.5">Ngày tham gia</th>
                <th className="px-6 py-3.5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2023] text-sm text-[#dbdee1]">
              {users.map((item) => (
                <tr key={item._id} className="hover:bg-[#35373c]/30 transition-all">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className={`relative w-8 h-8 rounded-full p-[1.5px] shrink-0 ${
                      item.activeFrame ? 'bg-gradient-to-r from-pink-500 to-indigo-500' : 'bg-transparent'
                    }`}>
                      <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
                        <img 
                          src={item.avatar || "https://ui-avatars.com/api/?name=" + (item.username || 'V') + "&background=2b2d31&color=fff"} 
                          alt="Avatar" 
                          className={`w-full h-full object-cover ${item.isBanned ? 'grayscale opacity-50' : ''}`}
                        />
                      </div>
                    </div>
                    <div>
                      <span className={`font-semibold block ${item.isBanned ? 'text-rose-400 line-through' : 'text-white'}`}>{item.username}</span>
                      <span className="text-[10px] text-purple-400 font-bold">
                        {item.isBanned ? (
                          <span className="text-rose-500">Đã bị cấm</span>
                        ) : item.isPremium ? (
                          '★ Premium Member'
                        ) : (
                          'Standard Member'
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#949ba4]">{item.email}</td>
                  <td className="px-6 py-4 font-bold text-amber-400">
                    <span className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {item.coins}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#949ba4] font-semibold text-center">
                    {item.ownedFrames ? item.ownedFrames.length : 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                      item.role === 'admin' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#949ba4] text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openCoinModal(item)}
                        disabled={item.isBanned}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:border-amber-500/50 rounded flex items-center gap-1.5 transition-all text-xs font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Tặng Coin cho ${item.username}`}
                      >
                        <Gift className="w-3.5 h-3.5" /> Tặng
                      </button>
                      
                      {!item.isBanned && item.role !== 'admin' && (
                        <button
                          onClick={() => openBanModal(item)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:border-rose-500/50 rounded flex items-center gap-1.5 transition-all text-xs font-bold active:scale-95"
                          title={`Cấm ${item.username}`}
                        >
                          <Ban className="w-3.5 h-3.5" /> Cấm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Coin Modal */}
      {showCoinModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#2b2d31] border border-[#1f2023] rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCoinModal(false)} className="absolute top-4 right-4 text-[#949ba4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-500/10 p-3 rounded-full text-amber-500">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tặng Coin</h3>
                <p className="text-xs text-[#949ba4]">Tặng cho người dùng <span className="font-bold text-white">{selectedUser.username}</span></p>
              </div>
            </div>
            <form onSubmit={handleAddCoins} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Số lượng (Coin)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Nhập số Coin muốn tặng..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCoinModal(false)} className="flex-1 py-2.5 rounded bg-[#35373c] hover:bg-[#404249] text-white text-sm font-bold transition-colors">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 transition-all">
                  Xác nhận tặng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#2b2d31] border border-[#1f2023] rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowBanModal(false)} className="absolute top-4 right-4 text-[#949ba4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-500/10 p-3 rounded-full text-rose-500">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cấm người dùng</h3>
                <p className="text-xs text-[#949ba4]">Thao tác này sẽ cấm IP và Email của <span className="font-bold text-white">{selectedUser.username}</span></p>
              </div>
            </div>
            <form onSubmit={handleBanUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Hình thức cấm</label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-white focus:outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="both">Cấm cả Email & IP</option>
                  <option value="email">Chỉ cấm Email</option>
                  <option value="ip">Chỉ cấm IP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Lý do cấm</label>
                <textarea
                  required
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-white focus:outline-none focus:border-rose-500 transition-colors h-24 resize-none"
                  placeholder="Ví dụ: Spam, lừa đảo, vi phạm cộng đồng..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBanModal(false)} className="flex-1 py-2.5 rounded bg-[#35373c] hover:bg-[#404249] text-white text-sm font-bold transition-colors">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all">
                  Xác nhận cấm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban List Modal */}
      {showBanListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#2b2d31] border border-[#1f2023] rounded-xl shadow-2xl w-full max-w-3xl p-6 relative flex flex-col max-h-[85vh]">
            <button onClick={() => setShowBanListModal(false)} className="absolute top-4 right-4 text-[#949ba4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-500/10 p-3 rounded-full text-rose-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Danh sách đen (Bans)</h3>
                <p className="text-xs text-[#949ba4]">Quản lý danh sách IP và Email bị cấm khỏi hệ thống</p>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 rounded-lg border border-[#1f2023] bg-[#1e1f22]">
              <table className="w-full text-left text-sm text-[#dbdee1]">
                <thead className="sticky top-0 bg-[#232428] shadow">
                  <tr className="text-xs font-bold text-[#949ba4] uppercase tracking-wider border-b border-[#1f2023]">
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Email bị cấm</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Lý do</th>
                    <th className="px-4 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2023]">
                  {banList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-[#949ba4]">Chưa có người dùng nào bị cấm.</td>
                    </tr>
                  ) : (
                    banList.map(ban => (
                      <tr key={ban._id} className="hover:bg-[#2b2d31]">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ban.banType === 'both' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            ban.banType === 'ip' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {ban.banType === 'both' ? 'Email & IP' : ban.banType === 'ip' ? 'Chỉ IP' : 'Chỉ Email'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-rose-400">{ban.email || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#949ba4]">{ban.ipAddress || '-'}</td>
                        <td className="px-4 py-3 text-xs">{ban.reason}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleUnban(ban._id)}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center justify-center gap-1.5 transition-all text-xs font-bold mx-auto active:scale-95"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Gỡ cấm
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
