import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import adminAuthService from '../../services/admin/adminAuthService';
import { loginSuccess } from '../../redux/slices/authSlice';

export default function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu quản trị!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Authenticate with admin login backend endpoint using Cookie authentication
      const result = await adminAuthService.login(email, password);

      if (result.success) {
        if (result.token) {
          localStorage.setItem('admin_token', result.token);
        }
        // Sync administrative details into Redux Toolkit store
        dispatch(loginSuccess(result.data));
        navigate('/admin');
      } else {
        setError(result.message || 'Đăng nhập quản trị thất bại!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ quản trị Backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-[#1e1f22] text-[#dbdee1] font-sans antialiased relative overflow-hidden select-none p-4">
      {/* Background radial glowing effects */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-amber-500/5 blur-[130px] top-1/4 left-1/3 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[120px] bottom-1/4 right-1/3 pointer-events-none" />

      <div className="w-full max-w-[440px] bg-[#2b2d31] rounded-lg border border-[#1f2023]/60 shadow-2xl p-8 space-y-6 z-1">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mb-1 border border-amber-500/20">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Vetrix Admin Console</h2>
          <p className="text-xs text-[#949ba4] font-medium">Bảng đăng nhập dành riêng cho Ban Quản Trị hệ thống</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Email Quản Trị Viên <span className="text-rose-500">*</span>
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vetrix.com"
              className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Mật khẩu truy cập <span className="text-rose-500">*</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 text-slate-950 font-extrabold text-sm rounded shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer mt-5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <>
                Đăng nhập quản trị
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
