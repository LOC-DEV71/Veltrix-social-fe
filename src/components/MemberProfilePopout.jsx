import React, { useRef, useEffect, useState } from 'react';
import { Smile, UserPlus, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import friendService from '../services/client/friendService';

export default function MemberProfilePopout({ isOpen, onClose, member, position, currentCommunity, onOpenFullProfile, myCommunities = [], onSelectCommunity }) {
  const popoutRef = useRef(null);
  const currentUser = useSelector((state) => state.auth.user);
  const isSelf = String(currentUser?._id || currentUser?.id) === String(member?._id || member?.id);
  const isFriend = (currentUser?.friends || []).some(f => String(f?._id || f) === String(member?._id || member?.id));
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

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
      if (popoutRef.current && !popoutRef.current.contains(event.target)) {
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

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddFriend = async () => {
    try {
      if (!member.realUsername) return;
      const res = await friendService.sendFriendRequest(member.realUsername);
      if (res.data?.success) {
        showToast('Đã gửi yêu cầu kết bạn!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu kết bạn!', 'error');
    }
  };

  if (!isOpen || !member) return null;

  // Map roles appropriately
  const roleName = member.role === 'owner' ? 'chủ sở hữu' : member.role === 'admin' ? 'admin' : 'member';
  const roleColor = member.role === 'owner' ? '#f59e0b' : member.role === 'admin' ? '#ff3366' : '#33cc66';
  const roles = [{ name: roleName, color: roleColor }];

  const isPremium = member.isPremium || member.user?.isPremium;
  const bannerImage = isPremium ? (member.bannerImage || member.user?.bannerImage) : null;
  
  const formatColor = (c) => {
    if (!c) return null;
    if (typeof c === 'number' || (typeof c === 'string' && /^\d+$/.test(c))) return '#' + Number(c).toString(16).padStart(6, '0');
    if (typeof c === 'string' && /^[0-9A-Fa-f]{3,6}$/.test(c)) return '#' + c;
    return c;
  };

  const rawBannerColor = member.bannerColor || member.user?.bannerColor || '#85c2d1';
  const bannerColor = formatColor(rawBannerColor);
  
  // Check if they explicitly have a theme
  const hasTheme = !!(member.themeColors?.primary || member.user?.themeColors?.primary);

  const themePrimary = formatColor(member.themeColors?.primary || member.user?.themeColors?.primary) || bannerColor;
  const themeAccent = formatColor(member.themeColors?.accent || member.user?.themeColors?.accent) || '#111214';
  
  // Calculate style based on position
  const popoutStyle = position || { top: '50px', right: '256px' };

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none">
      <div
        ref={popoutRef}
        className="absolute w-[340px] rounded-lg shadow-2xl pointer-events-auto border border-[#1f2023]"
        style={{ 
          ...popoutStyle,
          padding: hasTheme ? '4px' : '0px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          background: hasTheme
            ? `linear-gradient(to bottom, ${themePrimary} 0%, ${themeAccent} 100%)`
            : `linear-gradient(135deg, ${bannerColor} 0%, color-mix(in srgb, ${bannerColor} 30%, #111214) 100%)`
        }}
      >
        <div 
          className={`w-full flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden no-scrollbar backdrop-blur-md rounded-[6px] ${hasTheme ? 'bg-[#232428]' : ''}`}
          style={hasTheme ? {
            background: `linear-gradient(to bottom, color-mix(in srgb, ${themePrimary} 25%, #111214) 0%, color-mix(in srgb, ${themeAccent} 25%, #111214) 100%)`
          } : {}}
        >
          {/* Banner */}
          <div 
            className={`h-[120px] w-full shrink-0 relative ${bannerImage ? 'bg-cover bg-center' : ''}`} 
            style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : { backgroundColor: bannerColor }}
          >
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {!isSelf && !isFriend && (
                <button 
                  onClick={handleAddFriend}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
                  title="Thêm bạn bè"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                </button>
              )}
              <button className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-4 pb-4 relative">
            {/* Avatar */}
            <div className="absolute -top-[52px] left-4 flex items-end gap-3 w-full">
              <div 
                className="relative shrink-0 w-[92px] h-[92px] rounded-full p-[6px] group cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity"
                style={{ backgroundColor: bannerColor }}
                onClick={() => {
                  if (onOpenFullProfile) {
                    onOpenFullProfile(member);
                    onClose();
                  }
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22]">
                  <img
                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username || 'User')}&background=2b2d31&color=fff`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Frame overlay */}
                {(member.activeFrameAnimatedUrl || member.activeFrameStaticUrl) && (
                  <div className="absolute -inset-[13%] pointer-events-none z-20">
                    <img
                      src={member.activeFrameAnimatedUrl || member.activeFrameStaticUrl}
                      alt="frame"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                )}
                {/* Online indicator */}
                <div 
                  className={`absolute bottom-1 right-1 w-6 h-6 rounded-full ${member.isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'} border-[4px]`} 
                  style={{ borderColor: bannerColor }}
                />
              </div>
              
              {/* Custom Status Bubble */}
              {member.customStatus && (member.customStatus.text || member.customStatus.emoji) && (
                <div className="bg-[#111214] border border-[#1f2023] rounded-xl px-3 py-2 text-sm text-[#dbdee1] font-medium shadow-md mb-2 max-w-[170px] -ml-2 z-10 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    {member.customStatus.emoji && <span className="text-base leading-none shrink-0">{member.customStatus.emoji}</span>}
                    {member.customStatus.text && <span className="truncate text-[13px]">{member.customStatus.text}</span>}
                  </div>
                  {member.customStatus.updatedAt && (
                    <span className="text-[10px] text-[#949ba4] font-normal mt-0.5">
                      {getRelativeTime(member.customStatus.updatedAt)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-[50px] mb-3">
              <div className="relative inline-flex items-center overflow-visible rounded px-1 -ml-1 min-w-[140px]">
                {(member.activeNameplateAnimatedUrl || member.activeNameplateStaticUrl) && (
                  <>
                    <img 
                      src={member.activeNameplateAnimatedUrl || member.activeNameplateStaticUrl} 
                      className="absolute -inset-y-2 -inset-x-4 w-[calc(100%+32px)] h-[calc(100%+16px)] max-w-none object-cover opacity-90 pointer-events-none rounded-md" 
                      alt="Nameplate" 
                    />
                  </>
                )}
                <h2 className="text-[20px] font-bold text-[#f2f3f5] leading-tight relative z-10 drop-shadow-md">
                  {member.displayName || member.username}
                </h2>
              </div>
              <p className="text-[13px] text-[#dbdee1]">{member.realUsername ? member.realUsername.toLowerCase() : member.username.toLowerCase()} • 🐾</p>
            </div>

            <div className="h-[1px] w-full bg-[#3f4147] mb-3" />

            {/* Mutual servers */}
            {!isSelf && (() => {
              const targetId = String(member._id || member.id);
              const mutualCommunities = myCommunities.filter(c => c.members?.some(m => String(m.user?._id || m.user) === targetId));
              if (mutualCommunities.length === 0 && !currentCommunity) return null;
              
              const displayComm = mutualCommunities.length > 0 ? mutualCommunities[0] : currentCommunity;
              
              return (
                <div 
                  className="flex items-center gap-2 mb-4 p-1 -ml-1 rounded hover:bg-[#35373c]/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSelectCommunity && displayComm) {
                      onSelectCommunity(displayComm);
                    }
                  }}
                >
                  <div className="w-6 h-6 rounded bg-[#2b2d31] flex items-center justify-center shrink-0 overflow-hidden">
                    {displayComm?.icon ? (
                      <img src={displayComm.icon.startsWith('http') || displayComm.icon.startsWith('data:') ? displayComm.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${displayComm.icon.startsWith('/') ? '' : '/'}${displayComm.icon}`} alt={displayComm.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#dbdee1]">{displayComm?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#dbdee1]">{mutualCommunities.length > 0 ? mutualCommunities.length : 1} Máy chủ chung</span>
                </div>
              );
            })()}

            {/* Roles */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {roles.map((r, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 rounded px-2 py-1 cursor-pointer transition-colors border border-black/10">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-[11px] font-medium text-[#dbdee1]">{r.name}</span>
                </div>
              ))}
            </div>

            {/* Message Input (Hide if self) */}
            {!isSelf && (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={`Tin nhắn @${member.username}`}
                  className="w-full bg-black/30 border border-transparent hover:border-black/40 focus:border-black/50 focus:bg-black/40 rounded-lg px-3 py-3 text-[13px] text-[#dbdee1] placeholder-[#dbdee1]/60 outline-none transition-colors pr-10"
                />
                <Smile className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer transition-colors" />
              </div>
            )}

            {/* Toast Notification */}
            {toastMessage && (
              <div className={`absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50 ${toastType === 'success' ? 'bg-[#23a559] text-white' : 'bg-red-500 text-white'}`}>
                {toastType === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{toastMessage}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
