import React, { useEffect, useState, useRef } from 'react';
import { X, UserPlus, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from '../services/axiosClient';
import LoopingAPNG from './LoopingAPNG';

export default function FullProfileModal({ isOpen, onClose, member, myCommunities = [], onSelectCommunity }) {
  const currentUser = useSelector(state => state.auth.user);
  const isSelf = member && String(currentUser?._id || currentUser?.id) === String(member?._id || member?.id);
  const [activeTab, setActiveTab] = useState('info');
  const [mutualFriends, setMutualFriends] = useState([]);
  const [loadingMutualFriends, setLoadingMutualFriends] = useState(false);

  useEffect(() => {
    if (isOpen && !isSelf && member) {
      const targetId = member._id || member.id;
      if (targetId) {
        setLoadingMutualFriends(true);
        axiosClient.get(`/api/friends/mutual/${targetId}`)
          .then(res => {
            if (res.data?.success) {
              setMutualFriends(res.data.mutualFriends || []);
            }
          })
          .catch(err => console.error('Lỗi lấy bạn chung:', err))
          .finally(() => setLoadingMutualFriends(false));
      }
    } else {
      setMutualFriends([]);
    }
  }, [isOpen, isSelf, member]);

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const isCurrentUser = member._id === currentUser?._id;
  const displayName = member.nickname || member.displayName || member.username;
  const avatar = member.avatar || member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username || 'U')}&background=2b2d31&color=fff`;
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
  const themeAccent = hasTheme ? formatColor(member.themeColors.accent || member.user?.themeColors?.accent) : bannerColor;

  // Reverting back to original white text
  const isLightTheme = false;
  const textPrimary = 'text-white';
  const textSecondary = 'text-[#dbdee1]';
  const textMuted = 'text-[#b5bac1]';
  const borderTab = 'border-[#dbdee1]';
  const borderTransparentHover = 'hover:border-white/30';
  const borderBottomClass = 'border-white/10';

  const bgImagePlaceholder = bannerImage || member.user?.bannerImage; // Strictly bannerImage
  const profileEffectUrl = member.activeProfileEffectAnimatedUrl || member.user?.activeProfileEffectAnimatedUrl;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-[1000px] h-[720px] rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200"
        style={{ 
          padding: '6px',
          background: `linear-gradient(135deg, ${themePrimary} 0%, ${bannerColor} 50%, ${themeAccent} 100%)`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="w-full h-full relative flex overflow-hidden rounded-[14px]"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${themePrimary} 35%, #111214) 0%, color-mix(in srgb, ${bannerColor} 35%, #111214) 50%, color-mix(in srgb, ${themeAccent} 35%, #111214) 100%)`
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
              transform: 'scale(1.15)', // Prevent edges from showing blur artifact
            }}
          />
        )}
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-1 bg-[#1f2023]/80 hover:bg-[#35373c] text-[#b5bac1] hover:text-white rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Inner layout wrapper with padding */}
        <div className="flex w-full h-full p-4 gap-6 relative z-10">
          
          {/* Left Column (Profile Card) */}
          <div className="w-[390px] shrink-0 flex flex-col relative rounded-2xl bg-black/20 overflow-hidden border border-white/5 shadow-md">
            {/* Profile Effect Overlay */}
            {profileEffectUrl && (
               <div className="absolute inset-0 z-[100] pointer-events-none">
                  <LoopingAPNG src={profileEffectUrl} alt="Profile Effect" className="w-full h-full object-fill opacity-90" duration={3000} />
               </div>
            )}
            
            <div 
              className={`h-[150px] w-full shrink-0 ${bannerImage ? 'bg-cover bg-center' : ''}`} 
              style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : {}} 
            />
            <div className="px-6 pb-6 relative flex-1 flex flex-col">
              <div className="absolute -top-[70px] flex items-end gap-3 w-full">
              <div className="relative shrink-0 w-[124px] h-[124px] rounded-full p-[6px]" style={{ backgroundColor: bannerImage ? '#111214' : 'transparent' }}>
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22]">
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {member.activeFrameAnimatedUrl && (
                  <div className="absolute -inset-[13%] pointer-events-none z-20">
                    <img src={member.activeFrameAnimatedUrl} alt="frame" className="w-full h-full object-contain pointer-events-none" />
                  </div>
                )}
                <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full ${member.isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'} border-[5px]`} style={{ borderColor: bannerImage ? '#111214' : bannerColor }} />
              </div>
            </div>

            <div className="mt-[65px] flex-1">
              <div className="relative inline-flex items-center overflow-visible rounded px-1 -ml-1 min-w-[140px] mb-2">
                {member.activeNameplateAnimatedUrl && (
                  <img 
                    src={member.activeNameplateAnimatedUrl} 
                    className="absolute -inset-y-2 -inset-x-4 w-[calc(100%+32px)] h-[calc(100%+16px)] max-w-none object-cover opacity-90 pointer-events-none rounded-md" 
                    alt="Nameplate" 
                  />
                )}
                <h2 className="text-[20px] font-bold text-[#f2f3f5] leading-tight relative z-10 drop-shadow-md">
                  {displayName}
                </h2>
              </div>
              <p className="text-[13px] text-[#dbdee1] mb-4">{member.realUsername || member.username}</p>

              {member.customStatus && (member.customStatus.text || member.customStatus.emoji) && (
                <div className="mb-4 bg-black/20 border border-[#1f2023]/40 rounded-lg px-3 py-2 shadow-sm inline-block max-w-full backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[14px] text-[#dbdee1]">
                    {member.customStatus.emoji && <span className="shrink-0">{member.customStatus.emoji}</span>}
                    {member.customStatus.text && <span className="truncate">{member.customStatus.text}</span>}
                  </div>
                </div>
              )}

              <div className="h-[1px] w-full bg-[#3f4147] mb-4" />

              {!isCurrentUser && (
                <div className="flex items-center gap-2 mb-4">
                  <button className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-[13px] font-medium py-1.5 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                    <UserPlus className="w-4 h-4" /> Thêm Bạn
                  </button>
                  <button className="bg-[#2b2d31] hover:bg-[#35373c] text-white p-1.5 rounded transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button className="bg-[#2b2d31] hover:bg-[#35373c] text-white p-1.5 rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-black/30 rounded-lg p-3 flex-1 flex flex-col backdrop-blur-sm">
                <h3 className="text-[11px] font-bold text-[#f2f3f5] uppercase mb-2">Vai trò</h3>
                {member.role ? (
                  <div className="flex flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 bg-[#2b2d31]/80 border border-[#1f2023]/50 px-2 py-1 rounded text-xs font-medium text-[#dbdee1]">
                      <div className={`w-2.5 h-2.5 rounded-full ${member.role === 'owner' ? 'bg-amber-500' : member.role === 'admin' ? 'bg-rose-400' : 'bg-[#949ba4]'}`} />
                      {member.role === 'owner' ? 'Chủ sở hữu' : member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-[#949ba4]">Không có vai trò</span>
                )}
                
                <h3 className="text-[11px] font-bold text-[#f2f3f5] uppercase mt-4 mb-2">Ghi chú</h3>
                <textarea 
                  className="w-full bg-transparent text-[12px] text-[#dbdee1] placeholder-[#949ba4]/70 resize-none outline-none flex-1"
                  placeholder="Nhấp để thêm ghi chú"
                  defaultValue=""
                />
              </div>
            </div>
          </div>
          </div>
          
          {/* Right Column (Tabs) */}
          <div className="flex-1 flex flex-col pt-4 pr-2">
            <div className={`flex gap-6 border-b ${borderBottomClass} mb-2`}>
            <button 
              className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'info' ? `${textPrimary} ${borderTab}` : `${textMuted} border-transparent hover:${textSecondary} ${borderTransparentHover}`}`}
              onClick={() => setActiveTab('info')}
            >
              Bảng
            </button>
            {/* Only show mutual tabs if not self */}
            {!isSelf && (
              <>
                <button 
                  className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'mutual_servers' ? `${textPrimary} ${borderTab}` : `${textMuted} border-transparent hover:${textSecondary} ${borderTransparentHover}`}`}
                  onClick={() => setActiveTab('mutual_servers')}
                >
                  Máy chủ chung
                </button>
                <button 
                  className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'mutual_friends' ? `${textPrimary} ${borderTab}` : `${textMuted} border-transparent hover:${textSecondary} ${borderTransparentHover}`}`}
                  onClick={() => setActiveTab('mutual_friends')}
                >
                  Bạn chung
                </button>
              </>
            )}
          </div>

            <div className="flex-1 overflow-y-auto no-scrollbar text-[#dbdee1] pr-2 pb-2">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1f2023]/50">
                  <h3 className="text-[12px] font-bold text-[#f2f3f5] uppercase mb-4">Thông tin thành viên</h3>
                  <div className="text-[13px] text-[#dbdee1] space-y-2">
                    <p>Tham gia Vetrix vào: <span className="font-semibold text-white">12 thg 5, 2026</span></p>
                    <p>Tình trạng: <span className={`font-semibold ${member.isOnline ? 'text-[#23a55a]' : 'text-[#80848e]'}`}>{member.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span></p>
                  </div>
                </div>

                <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1f2023]/50">
                  <h3 className="text-[12px] font-bold text-[#f2f3f5] uppercase mb-4">Vai trò</h3>
                  {member.roles && member.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.roles.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 rounded px-2 py-1 cursor-pointer transition-colors border border-black/10">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="text-[12px] font-medium text-[#dbdee1]">{r.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#949ba4]">Không có vai trò nào</p>
                  )}
                </div>

                <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1f2023]/50">
                  <h3 className="text-[12px] font-bold text-[#f2f3f5] uppercase mb-4">Ghi chú</h3>
                  <input
                    type="text"
                    placeholder="Nhấp để thêm ghi chú"
                    className="w-full bg-transparent outline-none text-[13px] text-[#dbdee1] placeholder:text-[#949ba4]"
                    defaultValue=""
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'mutual_servers' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {(() => {
                  const targetId = String(member._id || member.id);
                  const mutuals = myCommunities.filter(c => c.members?.some(m => String(m.user?._id || m.user) === targetId));
                  if (mutuals.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                        <img src="https://discord.com/assets/4011cbdb863c0cdbdff4.svg" alt="No mutuals" className="w-48 mb-4 opacity-50 grayscale" />
                        <p className={textMuted}>Không có máy chủ chung nào.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {mutuals.map(c => (
                        <div 
                          key={c._id} 
                          className="flex items-center gap-3 p-2 rounded hover:bg-[#35373c]/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (onSelectCommunity) {
                              onSelectCommunity(c);
                            }
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#2b2d31] flex items-center justify-center overflow-hidden shrink-0">
                            {c.icon ? (
                              <img src={c.icon.startsWith('http') || c.icon.startsWith('data:') ? c.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${c.icon.startsWith('/') ? '' : '/'}${c.icon}`} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-[#dbdee1]">{c.name?.charAt(0)}</span>
                            )}
                          </div>
                          <span className={`font-semibold ${textPrimary}`}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {activeTab === 'mutual_friends' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {loadingMutualFriends ? (
                  <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                    <div className="w-8 h-8 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className={textMuted}>Đang tải...</p>
                  </div>
                ) : mutualFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                    <img src="https://discord.com/assets/212e30e47232be03033a.svg" alt="No friends" className="w-48 mb-4 opacity-50 grayscale" />
                    <p className={textMuted}>Không có bạn chung nào.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mutualFriends.map(f => (
                      <div key={f._id} className="relative flex items-center p-2 rounded hover:bg-[#35373c]/80 transition-all cursor-pointer group overflow-hidden mb-1">
                        {/* Nameplate background */}
                        {(f.activeNameplateStaticUrl || f.activeNameplateAnimatedUrl) && (
                          <div className="absolute inset-0 z-0 pointer-events-none">
                            <div className="absolute inset-0 opacity-80 mix-blend-screen">
                              {f.activeNameplateStaticUrl && (
                                <img src={f.activeNameplateStaticUrl} className="absolute inset-0 w-full h-full object-cover object-left group-hover:opacity-0 transition-opacity" alt="" />
                              )}
                              {f.activeNameplateAnimatedUrl && (
                                <img src={f.activeNameplateAnimatedUrl} className="absolute inset-0 w-full h-full object-cover object-left opacity-0 group-hover:opacity-100 transition-opacity" alt="" />
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="relative z-10 flex items-center gap-3 w-full">
                          <div className={`relative shrink-0 w-10 h-10 rounded-full p-[2px] transition-all duration-300 ${(f.activeFrameAnimatedUrl || f.activeFrameStaticUrl) ? '' : 'bg-transparent'}`}>
                            <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
                              <img 
                                src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.username || 'U')}&background=2b2d31&color=fff`} 
                                alt={f.username} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            {(f.activeFrameAnimatedUrl || f.activeFrameStaticUrl) && (
                              <div className="absolute -inset-[13%] pointer-events-none z-20">
                                {f.activeFrameStaticUrl && (
                                  <img src={f.activeFrameStaticUrl} alt="frame" className="w-full h-full object-contain pointer-events-none group-hover:opacity-0 transition-opacity" />
                                )}
                                {f.activeFrameAnimatedUrl && (
                                  <img src={f.activeFrameAnimatedUrl} alt="frame" className="w-full h-full object-contain pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`text-[15px] font-semibold truncate transition-all flex items-center gap-1 drop-shadow-md ${textPrimary} group-hover:text-black`}>
                            {f.displayName || f.username}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
