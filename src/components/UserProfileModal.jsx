import React, { useRef, useEffect, useState } from 'react';
import { Pencil, User, ShoppingBag, Sparkles, PlusCircle, X, ChevronRight, Gamepad2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as reduxLogout } from '../redux/slices/authSlice';
import axiosClient from '../services/axiosClient';

export default function UserProfileModal({ isOpen, onClose, onOpenSettings, onOpenCustomStatus }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const diff = currentTime - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'vài giây trước';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return 'hôm qua';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicking inside the profile toggle to prevent double-toggle issues
      if (event.target.closest('#profile-toggle-btn')) {
        return;
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setTimeout(() => onClose(), 0);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    try {
      await axiosClient.post('/client/logout');
      dispatch(reduxLogout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch(reduxLogout());
      navigate('/login');
    }
  };

  const getFrameInfo = (userObj) => {
    if (!userObj) return null;
    if (userObj.activeFrameAnimatedUrl) {
      return {
        animatedUrl: userObj.activeFrameAnimatedUrl,
        staticUrl: userObj.activeFrameStaticUrl || userObj.activeFrameAnimatedUrl
      };
    }
    if (userObj.activeFrame && typeof userObj.activeFrame === 'object' && userObj.activeFrame.animatedUrl) {
      return {
        animatedUrl: userObj.activeFrame.animatedUrl,
        staticUrl: userObj.activeFrame.staticUrl || userObj.activeFrame.animatedUrl
      };
    }
    return null;
  };

  const activeFrameInfo = getFrameInfo(user);
  const isPremium = user?.isPremium;
  const bannerImage = isPremium ? user?.bannerImage : null;
  const bannerColor = user?.bannerColor || '#85c2d1';
  const themePrimary = user?.themeColors?.primary || bannerColor;
  const themeAccent = user?.themeColors?.accent || '#111214';
  const bgImagePlaceholder = user?.bannerImage; // Only use bannerImage as requested

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        ref={modalRef}
        className="absolute bottom-[64px] left-[80px] w-[340px] rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto border border-[#1f2023] p-1"
        style={{
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          background: `linear-gradient(to bottom, ${themePrimary} 0%, ${themeAccent} 100%)` 
        }}
      >
        <div 
          className="w-full h-full relative overflow-hidden rounded-[6px]"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, ${themePrimary} 25%, #111214) 0%, color-mix(in srgb, ${themeAccent} 25%, #111214) 100%)`
          }}
        >
        {/* Blurred Background Image Overlay */}
        {bgImagePlaceholder && (
          <div 
            className="absolute top-0 left-0 w-full h-[50%] z-0 pointer-events-none"
            style={{
              backgroundImage: `url("${bgImagePlaceholder}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(6px)',
              opacity: 1,
              WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
              transform: 'scale(1.15)', 
            }}
          />
        )}

        <div className="w-full flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden no-scrollbar relative z-10">
          {/* Banner */}
          <div 
            className={`h-[120px] w-full shrink-0 ${bannerImage ? 'bg-cover bg-center' : ''}`} 
            style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : { backgroundColor: bannerColor }} 
          />

          {/* Profile Info */}
          <div className="px-4 pb-4 relative">
            {/* Avatar & Status Bubble */}
            <div className="absolute -top-[52px] flex items-end gap-3 w-full">
              <div className={`relative shrink-0 w-[92px] h-[92px] rounded-full p-[6px] bg-[#232428] ${activeFrameInfo ? activeFrameInfo.colorClass : ''}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22]">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Frame overlay - Profile popup is always animated according to user request */}
                {activeFrameInfo && (
                  <div className="absolute -inset-[13%] pointer-events-none z-20">
                    <img
                      src={activeFrameInfo.animatedUrl}
                      alt="frame"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#23a55a] border-[4px] border-[#232428]" />
              </div>

              {/* Custom Status Bubble */}
              <div 
                onClick={() => {
                  onClose();
                  if (onOpenCustomStatus) onOpenCustomStatus();
                }}
                className="bg-black/40 backdrop-blur-md border border-[#1f2023] rounded-xl px-3 py-2 text-sm text-[#dbdee1] font-medium shadow-md mb-2 cursor-pointer hover:bg-black/60 transition-colors max-w-[170px] -ml-2 z-10 flex-1 flex flex-col justify-center"
              >
                {user?.customStatus?.text || user?.customStatus?.emoji ? (
                  <>
                    <div className="flex items-center gap-2">
                      {user.customStatus.emoji && <span className="text-base leading-none shrink-0">{user.customStatus.emoji}</span>}
                      {user.customStatus.text && <span className="truncate text-[13px]">{user.customStatus.text}</span>}
                    </div>
                    {user.customStatus.updatedAt && (
                      <span className="text-[10px] text-[#949ba4] font-normal mt-0.5">
                        {getRelativeTime(user.customStatus.updatedAt)}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-[#949ba4] shrink-0" />
                    <span className="truncate italic text-xs">Thêm trạng thái...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-[50px]">
              <div className="relative inline-flex items-center overflow-visible rounded px-2 py-0.5 -ml-2 mb-1 group min-w-[140px]">
                {(user?.activeNameplateAnimatedUrl || user?.activeNameplateStaticUrl) && (
                  <>
                    <img 
                      src={user?.activeNameplateAnimatedUrl || user?.activeNameplateStaticUrl} 
                      className="absolute -inset-y-2 -inset-x-4 w-[calc(100%+32px)] h-[calc(100%+16px)] max-w-none object-cover opacity-90 pointer-events-none rounded-md" 
                      alt="Nameplate" 
                    />
                  </>
                )}
                <h2 className="text-[20px] font-bold text-[#f2f3f5] leading-tight relative z-10 drop-shadow-md">
                  {user.displayName || user.username}
                </h2>
              </div>
              <p className="text-[13px] text-[#dbdee1] mb-3">{user.username}</p>

              <div className="h-[1px] w-full bg-[#3f4147] mb-3" />

              {/* Premium / Cải thiện hồ sơ block - Only show if not premium */}
              {!user.isPremium && (
                <div className="rounded-lg p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-3 relative group">
                  <div className="bg-[#111214] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white uppercase">
                        Cải thiện hồ sơ của bạn
                      </span>
                      <X className="w-4 h-4 text-[#949ba4] cursor-pointer hover:text-white transition-colors" />
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                        <Sparkles className="w-4 h-4" /> Nhận Premium
                      </button>
                      <button
                        onClick={() => { onClose(); navigate('/shop'); }}
                        className="flex-1 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" /> Cửa hàng
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Collection */}
              <div className="bg-black/40 rounded-lg p-3 mb-3 flex justify-between items-center cursor-pointer hover:bg-black/60 transition-colors border border-transparent hover:border-[#1f2023]">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-[#dbdee1]" />
                  <span className="text-sm font-semibold text-[#f2f3f5]">Bộ Sưu Tập Trò Chơi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#949ba4]" />
              </div>

              {/* Actions List */}
              <div className="bg-black/40 rounded-lg py-1 border border-[#1f2023]">
                {user.isPremium && (
                  <>
                    <button className="flex items-center justify-between p-3 hover:bg-[#2b2d31] transition-colors group text-left">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#949ba4] group-hover:text-white" />
                        <span className="text-[13px] font-medium text-[#dbdee1] group-hover:text-white">Xem Đặc Quyền Premium</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#949ba4]" />
                    </button>

                    <div className="h-[1px] bg-[#1f2023] mx-3" />

                    <button
                      onClick={() => { onClose(); navigate('/shop'); }}
                      className="flex items-center justify-between p-3 hover:bg-[#2b2d31] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-[#949ba4] group-hover:text-white" />
                        <span className="text-[13px] font-medium text-[#dbdee1] group-hover:text-white">Cửa hàng</span>
                      </div>
                    </button>

                    <div className="h-[1px] bg-[#1f2023] mx-3" />
                  </>
                )}

                <button
                  onClick={() => { onClose(); onOpenSettings && onOpenSettings('profile'); }}
                  className="flex items-center justify-between p-3 hover:bg-[#2b2d31] transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <Pencil className="w-4 h-4 text-[#949ba4] group-hover:text-[#dbdee1]" />
                    <span className="text-[13px] font-medium text-[#dbdee1] group-hover:text-white">Sửa Hồ Sơ</span>
                  </div>
                </button>

                <div className="h-[1px] bg-[#1f2023] mx-3" />

                <button className="flex items-center justify-between p-3 hover:bg-[#2b2d31] transition-colors group text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#23a55a]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#dbdee1] group-hover:text-white">Trực tuyến</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#949ba4]" />
                </button>

                <div className="h-[1px] bg-[#1f2023] mx-3" />

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between p-3 hover:bg-[#2b2d31] transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[#949ba4] group-hover:text-[#dbdee1]" />
                    <span className="text-[13px] font-medium text-[#dbdee1] group-hover:text-white">Đổi Tài Khoản</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#949ba4]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
