import React, { useEffect, useState } from 'react';
import { X, UserPlus, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function FullProfileModal({ isOpen, onClose, member }) {
  const currentUser = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState('info');

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
  const themeAccent = formatColor(member.themeColors?.accent || member.user?.themeColors?.accent) || '#111214';

  const bgImagePlaceholder = member.bannerImage || member.user?.bannerImage; // Strictly bannerImage

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-[860px] h-[640px] rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#1f2023]"
        style={{ 
          padding: hasTheme ? '6px' : '0px',
          background: hasTheme 
            ? `linear-gradient(to bottom, ${themePrimary} 0%, ${themeAccent} 100%)` 
            : `linear-gradient(135deg, ${bannerColor} 0%, color-mix(in srgb, ${bannerColor} 20%, #111214) 100%)`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="w-full h-full relative flex overflow-hidden rounded-[14px]"
          style={hasTheme ? {
            background: `linear-gradient(to bottom, color-mix(in srgb, ${themePrimary} 25%, #111214) 0%, color-mix(in srgb, ${themeAccent} 25%, #111214) 100%)`
          } : {}}
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
          <div className="w-[340px] shrink-0 flex flex-col relative rounded-2xl bg-black/20 overflow-hidden border border-white/5 shadow-md">
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
            <div className="flex gap-6 border-b border-white/10 mb-2">
            <button 
              className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'text-white border-[#dbdee1]' : 'text-[#b5bac1] border-transparent hover:text-[#dbdee1] hover:border-white/30'}`}
              onClick={() => setActiveTab('info')}
            >
              Bảng
            </button>
            <button 
              className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'mutual_servers' ? 'text-white border-[#dbdee1]' : 'text-[#b5bac1] border-transparent hover:text-[#dbdee1] hover:border-white/30'}`}
              onClick={() => setActiveTab('mutual_servers')}
            >
              Máy chủ chung
            </button>
            <button 
              className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'mutual_friends' ? 'text-white border-[#dbdee1]' : 'text-[#b5bac1] border-transparent hover:text-[#dbdee1] hover:border-white/30'}`}
              onClick={() => setActiveTab('mutual_friends')}
            >
              Bạn chung
            </button>
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
                
                {/* Dummy section to match discord screenshot */}
                <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1f2023]/50">
                  <h3 className="text-[12px] font-bold text-[#f2f3f5] uppercase mb-4">Hoạt động gần đây</h3>
                  <div className="text-[13px] text-[#949ba4] italic text-center py-4">
                    Không có hoạt động nào trong 30 ngày qua.
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'mutual_servers' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center h-full text-center">
                <img src="https://discord.com/assets/57fc7fb75d8624003d09.svg" alt="No servers" className="w-48 mb-4 opacity-50 grayscale" />
                <p className="text-[#949ba4]">Không có máy chủ chung nào.</p>
              </div>
            )}
            
            {activeTab === 'mutual_friends' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center h-full text-center">
                <img src="https://discord.com/assets/212e30e47232be03033a.svg" alt="No friends" className="w-48 mb-4 opacity-50 grayscale" />
                <p className="text-[#949ba4]">Không có bạn chung nào.</p>
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
