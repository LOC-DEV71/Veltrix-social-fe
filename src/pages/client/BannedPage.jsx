import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';

export default function BannedPage() {
  useTitle('Tài khoản bị cấm');
  const navigate = useNavigate();
  const [banReason, setBanReason] = useState('Vi phạm chính sách cộng đồng');
  const [banType, setBanType] = useState('both');

  useEffect(() => {
    const isBanned = localStorage.getItem('isBanned');
    
    // If not actually banned (no localStorage flag), send them home
    if (isBanned !== 'true') {
      navigate('/');
      return;
    }

    const reason = localStorage.getItem('banReason');
    const type = localStorage.getItem('banType');

    if (reason) setBanReason(reason);
    if (type) setBanType(type);
  }, [navigate]);

  const handleReturnToLogin = () => {
    // Clear localStorage so they can attempt to login again
    localStorage.removeItem('isBanned');
    localStorage.removeItem('banReason');
    localStorage.removeItem('banType');
    
    // Also clear cookies just in case they were set by the backend directly
    document.cookie = "isBanned=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "banReason=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "banType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center p-4 selection:bg-rose-500/30">
      <div className="max-w-md w-full bg-[#2b2d31] rounded-2xl p-8 shadow-2xl border border-rose-500/20 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        
        <div className="relative">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-wide">
            Truy Cập Bị Từ Chối
          </h1>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e1f22] rounded-full border border-[#1f2023] mb-6">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              {banType === 'both' ? 'Cấm Cả Email & IP' : banType === 'ip' ? 'Chỉ Cấm Địa Chỉ IP' : 'Chỉ Cấm Tài Khoản'}
            </span>
          </div>

          <p className="text-[#949ba4] text-sm mb-6 leading-relaxed">
            Rất tiếc, bạn không thể truy cập vào hệ thống Vetrix vì bạn đã bị vi phạm quy định.
          </p>

          <div className="bg-[#1e1f22] rounded-xl p-4 mb-8 border border-[#1f2023] text-left">
            <span className="block text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">Lý do cấm cụ thể:</span>
            <p className="text-rose-400 font-medium text-sm">"{banReason}"</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.href = 'mailto:support@vetrix.com'}
              className="w-full bg-[#35373c] hover:bg-[#404249] text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Liên hệ bộ phận hỗ trợ
            </button>
            
            <button 
              onClick={handleReturnToLogin}
              className="w-full bg-transparent border border-[#35373c] hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#949ba4] hover:text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
            >
              Tôi đã được gỡ cấm, thử đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
