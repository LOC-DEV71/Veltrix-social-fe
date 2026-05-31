import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { Sparkles, Coins, ShoppingBag, Check, ShieldAlert, Award, Plus, Loader2 } from 'lucide-react';

const fallbackMockFrames = [
  {
    id: 'f1',
    name: 'Khung Lửa Địa Ngục (Hellfire)',
    price: 120,
    isPremium: false,
    description: 'Bao bọc avatar của bạn bằng ngọn lửa rực cháy mãnh liệt từ địa ngục.',
    colorClass: 'from-orange-600 via-red-500 to-yellow-500',
    staticUrl: 'https://images.unsplash.com/photo-1608976478521-2a1e05a8f278?auto=format&fit=crop&w=150&q=80',
    animatedUrl: 'https://media.giphy.com/media/3y0oCOkdKKRi0/giphy.gif',
  },
  {
    id: 'f2',
    name: 'Khung Cực Quang (Aura Neon)',
    price: 200,
    isPremium: false,
    description: 'Dải màu xanh - tím cực quang chuyển động xoay vần huyền ảo.',
    colorClass: 'from-cyan-400 via-blue-500 to-indigo-600',
    staticUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=150&q=80',
    animatedUrl: 'https://media.giphy.com/media/26n6WZ7M6EaiOQAAU/giphy.gif',
  },
  {
    id: 'f3',
    name: 'Khung Laser Cyberpunk',
    price: 250,
    isPremium: false,
    description: 'Các hạt năng lượng laser nhấp nháy mang phong cách tương lai.',
    colorClass: 'from-fuchsia-500 via-purple-600 to-pink-500',
    staticUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80',
    animatedUrl: 'https://media.giphy.com/media/xT0xezQGU5xCDSK316/giphy.gif',
  },
  {
    id: 'f4',
    name: 'Khung Hoàng Gia (Royal Gold)',
    price: 0,
    isPremium: true,
    description: 'Dành riêng cho hội viên Premium. Khung vàng ròng lấp lánh kim cương.',
    colorClass: 'from-amber-400 via-yellow-300 to-amber-600',
    staticUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    animatedUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMml3Y3V4ejVjOTI5bHF4dGFqM29pdDBwZmltNGtxNXZpZnkydXh2dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0ExdFnS16yd1458A/giphy.gif',
  }
];

function FrameCard({ frame }) {
  const { user, buyFrame, equipFrame } = useUserStore();
  const [isHovered, setIsHovered] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState({ show: false, success: false, message: '' });

  const isNameplate = frame.category?.slug === 'bang-ten' || frame.categorySlug === 'bang-ten';
  const isOwned = isNameplate 
    ? (user.ownedNameplates?.includes(frame.id) || user.ownedFrames?.includes(frame.id)) 
    : user.ownedFrames?.includes(frame.id);
  const isActive = isNameplate 
    ? (user.activeNameplate === frame.id || user.activeFrame === frame.id) 
    : user.activeFrame === frame.id;

  const handleAction = async () => {
    if (isOwned) {
      equipFrame(frame.id);
    } else {
      const result = await buyFrame(frame.id, frame.price, frame.isPremium);
      setPurchaseStatus({
        show: true,
        success: result.success,
        message: result.message
      });
      setTimeout(() => {
        setPurchaseStatus({ show: false, success: false, message: '' });
      }, 3000);
    }
  };

  return (
    <div 
      className="bg-[#2b2d31] rounded-xl border border-[#1f2023] p-5 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 transition-all duration-300 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Badge */}
      {frame.isPremium && (
        <span className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 z-1 shadow-md">
          <Sparkles className="w-2.5 h-2.5" />
          Premium
        </span>
      )}

      {/* Avatar Simulation Preview Area */}
      <div className="flex flex-col items-center py-4 relative bg-[#1e1f22] rounded-lg border border-[#232428] mb-4">
        <span className="text-[10px] text-[#949ba4] uppercase font-bold tracking-wider mb-3">Xem trước {isNameplate ? 'bảng tên' : 'khung'}</span>
        
        {/* Frame Wrapper */}
        <div className={`relative ${isNameplate ? 'w-32 h-8 rounded' : 'w-24 h-24 rounded-full'} transition-all duration-300 ${isHovered ? 'scale-105 shadow-lg shadow-indigo-500/20' : ''} flex items-center justify-center overflow-hidden`}>
          {isNameplate && (
            <div className="absolute inset-0 z-0">
              {isHovered ? (
                <img src={frame.animatedUrl} className="w-full h-full object-cover opacity-50" alt="Animated" />
              ) : (
                <img src={frame.staticUrl} className="w-full h-full object-cover opacity-50" alt="Static" />
              )}
            </div>
          )}

          {/* Main Avatar inside frame */}
          <div className={`${isNameplate ? 'w-6 h-6 z-10 mr-2 relative' : 'absolute inset-[13%]'} rounded-full overflow-hidden bg-[#313338]`}>
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`} 
              alt="Preview Avatar" 
              className="w-full h-full object-cover"
            />
          </div>

          {isNameplate && (
            <span className="text-white text-xs font-bold relative z-10 drop-shadow-md">{user.username}</span>
          )}

          {/* Actual Frame Overlay (Swapped on Hover) */}
          {!isNameplate && (
            <div className="absolute inset-0 pointer-events-none">
              {isHovered ? (
                <img 
                  src={frame.animatedUrl} 
                  alt="Animated frame" 
                  className="w-full h-full object-cover rounded-full drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                />
              ) : (
                <img 
                  src={frame.staticUrl} 
                  alt="Static frame preview" 
                  className="w-full h-full object-cover rounded-full drop-shadow-md"
                />
              )}
            </div>
          )}
        </div>

        <span className="text-[9px] text-[#80848e] mt-3 italic">
          {isHovered ? '⚡ Đang chạy hiệu ứng động' : '👋 Di chuột vào để xem hiệu ứng'}
        </span>
      </div>

      {/* Frame Information */}
      <div className="space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
            {frame.name}
          </h3>
          <p className="text-xs text-[#949ba4] mt-1 leading-relaxed">
            {frame.description}
          </p>
        </div>

        {/* Cost & Action Panel */}
        <div className="pt-4 border-t border-[#232428] mt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#949ba4]">Giá bán</span>
            {frame.isPremium ? (
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Miễn phí
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {frame.price} Coin
              </span>
            )}
          </div>

          {/* Action Button */}
          {isOwned ? (
            isActive ? (
              <button 
                disabled 
                className="w-full py-2 bg-emerald-600/20 text-emerald-400 font-bold text-xs rounded-md border border-emerald-500/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Đang trang bị
              </button>
            ) : (
              <button 
                onClick={handleAction}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-md transition-all cursor-pointer shadow-md"
              >
                Trang bị {isNameplate ? 'bảng tên' : 'khung'}
              </button>
            )
          ) : (
            <button 
              onClick={handleAction}
              disabled={frame.isPremium && !user.isPremium}
              className={`w-full py-2 font-bold text-xs rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                frame.isPremium && !user.isPremium
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-md active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Mua ngay
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification for purchases */}
      {purchaseStatus.show && (
        <div className={`absolute inset-x-4 bottom-4 p-3 rounded-lg border text-xs text-center shadow-lg transition-all duration-300 z-10 flex items-center justify-center gap-1.5 ${
          purchaseStatus.success 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/95 border-rose-500/50 text-rose-300'
        }`}>
          {purchaseStatus.success ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          {purchaseStatus.message}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { user, products, categories, loading, fetchProducts, fetchCategories, fetchProfile, addCoins } = useUserStore();
  const [filter, setFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  // Load backend data on component mount
  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchProducts();
  }, [fetchProfile, fetchProducts, fetchCategories]);

  // Fallback to static mock products if backend returns empty or is offline
  const activeProducts = products.length > 0 ? products : fallbackMockFrames;

  const filteredFrames = activeProducts.filter(frame => {
    // Check type filter
    if (filter === 'premium' && !frame.isPremium) return false;
    if (filter === 'coin' && frame.isPremium) return false;
    
    // Check category filter
    if (activeCategory !== 'all') {
      if (frame.category !== activeCategory) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-full bg-[#313338] text-[#dbdee1] p-6 space-y-6 flex flex-col overflow-y-auto no-scrollbar h-[calc(100vh-48px)]">
      
      {/* Shop Premium Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Cửa hàng đặc biệt
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Khung Avatar Động Premium
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Nâng tầm hồ sơ cá nhân của bạn với những hiệu ứng động rực rỡ và lôi cuốn nhất. Mua ngay bằng Coin hoặc nâng cấp Premium để nhận miễn phí!
          </p>
        </div>

        {/* User Balance Card */}
        <div className="bg-[#1e1f22]/80 backdrop-blur-md rounded-xl p-5 border border-slate-700/40 w-full sm:w-auto shrink-0 flex flex-col justify-center space-y-3 shadow-inner">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <span className="text-xs text-[#949ba4]">Tài khoản:</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {user.username} {user._id ? '🔗' : '🔌'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-6">
            <div className="flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-xl font-black text-amber-400">{user.coins}</span>
              <span className="text-xs text-amber-500/80">Coin</span>
            </div>
            
            <button 
              onClick={() => addCoins(100)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-0.5 active:scale-95 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Nạp Coin
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {user.isPremium ? 'HỘI VIÊN PREMIUM ✨' : 'NÂNG CẤP PREMIUM'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#232428] pb-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Pricing Filters */}
          <div className="flex space-x-2">
            {['all', 'premium', 'coin'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  filter === type
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#2b2d31] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                {type === 'all' && 'Tất cả loại'}
                {type === 'premium' && 'Premium Chỉ Định'}
                {type === 'coin' && 'Mua Bằng Coin'}
              </button>
            ))}
          </div>

          <p className="text-xs text-[#949ba4] flex items-center gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            Hiển thị <span className="text-white font-bold">{filteredFrames.length}</span> khung avatar
            {user._id && <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">DB Connected</span>}
          </p>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-bold text-[#949ba4] mr-1 shrink-0">Danh mục:</span>
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-[#1e1f22] text-[#80848e] border border-[#2b2d31] hover:text-[#dbdee1] hover:border-[#35373c]'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                  activeCategory === cat._id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-[#1e1f22] text-[#80848e] border border-[#2b2d31] hover:text-[#dbdee1] hover:border-[#35373c]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frame Grid Container */}
      <div className="flex-grow pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredFrames.map((frame) => (
            <FrameCard key={frame.id} frame={frame} />
          ))}
        </div>
      </div>

    </div>
  );
}
