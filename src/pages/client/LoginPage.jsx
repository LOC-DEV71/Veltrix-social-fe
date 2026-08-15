import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Shield, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../../services/client/authService';
import logoVeltrix from '../../assets/logo-veltrix.png';
import { loginSuccess } from '../../redux/slices/authSlice';
import { useTitle } from '../../hooks/useTitle';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useTitle('Đăng nhập');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & Notification State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ tất cả các trường!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Authenticate with user login endpoint (automatic Cookie setting)
      const result = await authService.login(email, password);

      if (result.success) {
        // Sync administrative details into Redux Toolkit store
        dispatch(loginSuccess(result.data));
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(result.message || 'Đăng nhập thất bại!');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isBanned) {
        localStorage.setItem('isBanned', 'true');
        localStorage.setItem('banReason', err.response.data.message || err.response.data.reason || 'Vi phạm chính sách hệ thống');
        localStorage.setItem('banType', err.response.data.banType || 'both');
        navigate('/banned');
        return;
      }
      const apiMsg = err.response?.data?.message;
      const networkMsg = err.message ? `Lỗi kết nối API: ${err.message}` : 'Không thể kết nối đến máy chủ!';
      setError(apiMsg || networkMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const result = await authService.googleLogin(credentialResponse.credential);
      if (result.success) {
        dispatch(loginSuccess(result.data));
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(result.message || 'Đăng nhập Google thất bại!');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isBanned) {
        localStorage.setItem('isBanned', 'true');
        localStorage.setItem('banReason', err.response.data.message || err.response.data.reason || 'Vi phạm chính sách hệ thống');
        localStorage.setItem('banType', err.response.data.banType || 'both');
        navigate('/banned');
        return;
      }
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập bằng Google!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập Google không thành công. Vui lòng thử lại!');
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-[#1e1f22] text-[#dbdee1] font-sans antialiased relative overflow-hidden select-none p-4">
      {/* Deep colorful background glowing blur */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] top-1/4 left-1/4 animate-pulse pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-pink-500/10 blur-[100px] bottom-1/4 right-1/4 animate-pulse pointer-events-none" />

      {/* Form Card Container */}
      <div className="w-full max-w-[480px] bg-[#2b2d31] rounded-lg border border-[#1f2023]/60 shadow-2xl p-8 space-y-6 z-1">
        
        {/* Header Header Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={logoVeltrix} alt="Veltrix Logo" className="w-16 h-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Chào mừng quay trở lại!</h2>
          <p className="text-xs text-[#949ba4] font-medium">Chúng tôi rất vui mừng được gặp lại bạn!</p>
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

          <div className="text-left">
            <a href="#" className="text-xs text-[#00a8fc] hover:underline font-semibold">Bạn quên mật khẩu?</a>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold text-sm rounded shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer mt-5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#3f4147]" />
          <span className="px-3 text-xs text-[#949ba4] font-semibold uppercase">Hoặc</span>
          <div className="flex-1 border-t border-[#3f4147]" />
        </div>

        {/* Google Login Button */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="pill"
            width="100%"
            text="continue_with"
            locale="vi"
          />
        </div>

        {/* Footer Redirect link */}
        <div className="text-left text-xs text-[#949ba4] pt-2">
          Cần một tài khoản?{' '}
          <Link to="/register" className="text-[#00a8fc] hover:underline font-semibold">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
