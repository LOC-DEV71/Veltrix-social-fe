import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sparkles, Loader2, ArrowRight, KeyRound, CheckCircle2, Send } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
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
  
  // 6-digit OTP PIN State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  // OTP Request State
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Loading & Notification State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const otpCode = otpDigits.join('');

  const handleOtpDigitChange = (val, idx) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[idx] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleSendOTP = async () => {
    if (!email) {
      setError('Vui lòng nhập Email trước khi lấy mã OTP!');
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);
      setSuccess(null);

      const res = await authService.sendOTP(email);
      if (res.success) {
        setOtpSent(true);
        setSuccess(res.message);
        setCountdown(60);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(res.message || 'Gửi mã OTP thất bại!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi mã OTP tới Email này!');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || otpCode.length !== 6) {
      setError('Vui lòng điền đầy đủ thông tin và đủ 6 chữ số mã OTP!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await authService.register(username, email, password, otpCode);

      if (result.success) {
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
        localStorage.setItem('isBanned', 'true');
        localStorage.setItem('banReason', err.response.data.message || err.response.data.reason || 'Vi phạm chính sách hệ thống');
        localStorage.setItem('banType', err.response.data.banType || 'both');
        navigate('/banned');
        return;
      }
      setError(err.response?.data?.message || 'Đăng ký tài khoản không thành công!');
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

          {/* Email Input Field with Styled Send OTP Button */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider flex justify-between items-center">
              <span>Email <span className="text-rose-500">*</span></span>
              {otpSent && (
                <span className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã gửi mã vào Mail
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhap-email-cua-ban@gmail.com"
                className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading || countdown > 0}
                className="px-3.5 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 min-w-[105px]"
              >
                {otpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : countdown > 0 ? (
                  <span className="font-mono text-pink-400">{countdown}s</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{otpSent ? 'Gửi lại' : 'Gửi OTP'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* High-tech 6-Digit OTP PIN Section */}
          <div className="space-y-2 bg-[#23252b]/60 border border-[#1f2023] rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                Mã xác thực OTP (6 chữ số) <span className="text-rose-500">*</span>
              </label>
              {otpCode.length === 6 && (
                <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3 h-3" /> Đã đủ 6 số
                </span>
              )}
            </div>

            {/* 6 PIN Input Boxes */}
            <div className="flex justify-between items-center gap-1.5 pt-1" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className={`w-11 h-12 rounded-lg bg-[#1e1f22] text-center text-lg font-bold font-mono border-2 transition-all outline-none ${
                    digit
                      ? 'border-indigo-500 text-pink-400 bg-[#262830] shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                      : 'border-[#1f2023] text-white focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.4)] focus:bg-[#202228]'
                  }`}
                  placeholder="•"
                />
              ))}
            </div>
            
            <p className="text-[10px] text-[#949ba4] text-center pt-0.5">
              Mã OTP gồm 6 chữ số được gửi tới email của bạn. Có hiệu lực trong 5 phút.
            </p>
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
            text="signup_with"
            locale="vi"
          />
        </div>

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
