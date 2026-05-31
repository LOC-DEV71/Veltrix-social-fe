import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import authService from '../../services/client/authService';
import logoVeltrix from '../../assets/logo-veltrix.png';
import { loginSuccess } from '../../redux/slices/authSlice';
import { useTitle } from '../../hooks/useTitle';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useTitle('Đăng ký');

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & Notification State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Vui lòng điền đầy đủ tất cả các trường!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call API using our authService (automatic Cookie setting on success)
      const result = await authService.register(username, email, password);

      if (result.success) {
        // Sync administrative details into Redux Toolkit store
        dispatch(loginSuccess(result.data));
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(result.message || 'Đăng ký thất bại!');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isBanned) {
        navigate('/banned');
        return;
      }
      setError(err.response?.data?.message || 'Đăng ký tài khoản không thành công!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-[#1e1f22] text-[#dbdee1] font-sans antialiased relative overflow-hidden select-none p-4">
      {/* Deep colorful background glowing blur */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[120px] top-1/4 left-1/4 animate-pulse pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] bottom-1/4 right-1/4 animate-pulse pointer-events-none" />

      {/* Form Card Container */}
      <div className="w-full max-w-[480px] bg-[#2b2d31] rounded-lg border border-[#1f2023]/60 shadow-2xl p-8 space-y-6 z-1">
        
        {/* Header Header Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={logoVeltrix} alt="Veltrix Logo" className="w-16 h-auto drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Tạo một tài khoản mới</h2>
          <p className="text-xs text-[#949ba4] font-medium">Bắt đầu những cuộc trò chuyện thời gian thực tại Vetrix!</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-bounce" /> {success}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Tên đăng nhập (Username) <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nhap-username-cua-ban"
              className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Email <span className="text-rose-500">*</span>
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap-email-cua-ban@gmail.com"
              className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-850 text-white font-bold text-sm rounded shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer mt-5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                Đăng ký tài khoản
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Redirect link */}
        <div className="text-left text-xs text-[#949ba4] pt-2">
          Đã có tài khoản rồi?{' '}
          <Link to="/login" className="text-[#00a8fc] hover:underline font-semibold">
            Đăng nhập ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
