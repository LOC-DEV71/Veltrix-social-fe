import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { Sparkles, Coins, ShoppingBag, Check, ShieldAlert, Award, Plus, Loader2 } from 'lucide-react';
import { useTitle } from '../../hooks/useTitle';

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

function FrameCard({ frame, inventoryItems, onShowPremiumModal }) {
  const { user, buyFrame, equipFrame, claimPremiumProduct } = useUserStore();
  const [isHovered, setIsHovered] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState({ show: false, success: false, message: '' });

  const isNameplate = frame.category?.slug === 'bang-ten' || frame.categorySlug === 'bang-ten';
  const isCombo = frame.category?.slug === 'combo' || frame.categorySlug === 'combo' || frame.isCombo;
  
  const frameItem = isCombo && frame.comboItems ? frame.comboItems.find(item => item.category?.slug === 'khung-vien') : null;
  const nameplateItem = isCombo && frame.comboItems ? frame.comboItems.find(item => item.category?.slug === 'bang-ten') : null;
  
  let effectivePrice = frame.price;
  let isFullyOwnedCombo = false;
  let originalPrice = frame.price;

  if (isCombo && frame.comboItems && frame.comboItems.length > 0) {
    let discount = 0;
    let ownedCount = 0;
    frame.comboItems.forEach(item => {
      const catSlug = item.category?.slug;
      const isItemFrame = catSlug === 'khung-vien';
      const isItemNameplate = catSlug === 'bang-ten';
      let alreadyOwned = false;
      if (isItemFrame && user.ownedFrames?.includes(item._id)) alreadyOwned = true;
      if (isItemNameplate && user.ownedNameplates?.includes(item._id)) alreadyOwned = true;
      
      if (alreadyOwned) {
        discount += item.price || 0;
        ownedCount++;
      }
    });
    effectivePrice = Math.max(0, effectivePrice - discount);
    if (ownedCount === frame.comboItems.length) {
      isFullyOwnedCombo = true;
    }
  }

  const isOwned = isCombo ? isFullyOwnedCombo : (isNameplate 
    ? (user.ownedNameplates?.includes(frame.id) || user.ownedFrames?.includes(frame.id)) 
    : user.ownedFrames?.includes(frame.id));
    
  const isActive = isCombo ? false : (isNameplate 
    ? (user.activeNameplate === frame.id || user.activeFrame === frame.id) 
    : user.activeFrame === frame.id);

  const handleAction = async () => {
    if (isOwned) {
      equipFrame(frame.id);
    } else {
      let result;
      // Nếu là sản phẩm premium (miễn phí)
      if (frame.isPremium) {
        if (!user.isPremium) {
          onShowPremiumModal();
          return;
        }
        result = await claimPremiumProduct(frame.id);
      } else {
        // Mua bằng coin
        result = await buyFrame(frame.id, effectivePrice, false, false);
      }

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
      className={`bg-[#2b2d31] rounded-xl border border-[#1f2023] p-5 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 relative group ${isCombo ? 'sm:col-span-2 lg:col-span-2 xl:col-span-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Simulation Preview Area */}
      {isCombo ? (
        <div className="w-full relative mb-6 flex flex-col items-center">
          <span className="text-[10px] text-[#949ba4] uppercase font-bold tracking-wider mb-3">Xem trước gói combo</span>
          
          <div className={`w-full h-[96px] rounded-lg overflow-hidden relative flex items-center p-4 shadow-md border border-[#3f4147] transition-all duration-300 ${isHovered ? 'shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/50' : ''}`}>
            {/* Background Nameplate */}
            {nameplateItem && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-80 mix-blend-screen">
                  <img src={nameplateItem.staticUrl} className={`w-full h-full object-cover object-left absolute inset-0 ${isHovered ? 'hidden' : 'block'}`} alt="Static Nameplate" />
                  <img src={nameplateItem.animatedUrl} className={`w-full h-full object-cover object-left absolute inset-0 ${isHovered ? 'block' : 'hidden'}`} alt="Animated Nameplate" />
                </div>
                <div 
                  className="absolute inset-0 z-10 mix-blend-overlay"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220, 62, 151, 0.05) 20%, rgba(220, 62, 151, 0.1) 50%, rgba(220, 62, 151, 0.2) 100%)' }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              </div>
            )}
            
            <div className="relative z-10 flex items-center gap-4 w-full">
              {/* Avatar + Frame */}
              <div className={`relative shrink-0 w-16 h-16 rounded-full p-[2px] ${
                frameItem ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg' : 'bg-[#1e1f22]'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
                  <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`} alt={user?.username} className="w-full h-full rounded-full object-cover" />
                </div>
                
                {frameItem && (
                  <div className="absolute -inset-[15%] pointer-events-none z-20">
                    <img 
                      src={frameItem.staticUrl} 
                      className={`w-full h-full object-contain pointer-events-none absolute inset-0 ${isHovered ? 'hidden' : 'block'}`} 
                      alt="static frame" 
                    />
                    <img 
                      src={frameItem.animatedUrl} 
                      className={`w-full h-full object-contain pointer-events-none absolute inset-0 ${isHovered ? 'block' : 'hidden'}`} 
                      alt="animated frame" 
                    />
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#313338] bg-[#23a55a] z-30 shadow-sm" />
              </div>
              
              {/* User Info */}
              <div className="flex flex-col drop-shadow-md truncate">
                <span className="text-white font-bold text-lg truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">{user?.displayName || user?.username}</span>
                <span className="text-[#e3e5e8] text-sm truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-0.5">({user?.username})</span>
              </div>
            </div>
          </div>
          
          <span className="text-[9px] text-[#80848e] mt-3 italic">
            {isHovered ? '⚡ Đang chạy hiệu ứng động' : '👋 Di chuột vào để xem hiệu ứng'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 relative bg-[#1e1f22] rounded-lg border border-[#232428] mb-4">
          <span className="text-[10px] text-[#949ba4] uppercase font-bold tracking-wider mb-3">Xem trước {isNameplate ? 'bảng tên' : 'khung'}</span>
          
          {/* Frame Wrapper */}
          <div className={`relative ${isNameplate ? 'w-32 h-8 rounded' : 'w-24 h-24 rounded-full'} ${isHovered ? 'shadow-lg shadow-indigo-500/20' : ''} flex items-center justify-center overflow-hidden`}>
            {isNameplate && (
              <div className="absolute inset-0 z-0">
                <img src={frame.staticUrl} className={`w-full h-full object-cover absolute inset-0 opacity-50 ${isHovered ? 'hidden' : 'block'}`} alt="Static" />
                <img src={frame.animatedUrl} className={`w-full h-full object-cover absolute inset-0 opacity-50 ${isHovered ? 'block' : 'hidden'}`} alt="Animated" />
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

            {/* Actual Frame Overlay (Swapped on Hover without unmounting) */}
            {!isNameplate && (
              <div className="absolute inset-0 pointer-events-none">
                <img 
                  src={frame.staticUrl} 
                  alt="Static frame preview" 
                  className={`w-full h-full object-cover rounded-full drop-shadow-md absolute inset-0 ${isHovered ? 'hidden' : 'block'}`}
                />
                <img 
                  src={frame.animatedUrl} 
                  alt="Animated frame" 
                  className={`w-full h-full object-cover rounded-full drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] absolute inset-0 ${isHovered ? 'block' : 'hidden'}`}
                />
              </div>
            )}
          </div>

          <span className="text-[9px] text-[#80848e] mt-3 italic">
            {isHovered ? '⚡ Đang chạy hiệu ứng động' : '👋 Di chuột vào để xem hiệu ứng'}
          </span>
        </div>
      )}

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
            {frame.isPremium && user?.isPremium ? (
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Miễn phí
              </span>
            ) : (
              <div className="flex flex-col items-end">
                {isCombo && effectivePrice < originalPrice && !isOwned && (
                  <span className="text-[10px] text-emerald-400 line-through opacity-70 mb-0.5">
                    {originalPrice} Coin
                  </span>
                )}
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {effectivePrice} Coin
                </span>
              </div>
            )}
          </div>

          {/* Thời hạn sử dụng */}
          {frame.premiumEndDate ? (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#949ba4]">Đặc quyền đến</span>
              <span className="text-xs font-bold text-pink-400">
                {new Date(frame.premiumEndDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          ) : frame.isPremium ? (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#949ba4]">Đặc quyền Premium</span>
              <span className="text-xs font-bold text-pink-400">
                Theo thời hạn gói
              </span>
            </div>
          ) : null}

          {/* Action Button */}
          {isOwned ? (
            <div className={`flex flex-col gap-2`}>
              {isCombo ? (
                <button 
                  disabled 
                  className="w-full py-2 bg-emerald-600/20 text-emerald-400 font-bold text-xs rounded-md border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> Đã sở hữu trọn bộ
                </button>
              ) : isActive ? (
                <button 
                  disabled 
                  className="w-full py-2 bg-emerald-600/20 text-emerald-400 font-bold text-xs rounded-md border border-emerald-500/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Đang trang bị
                </button>
              ) : (
                <button 
                  onClick={() => handleAction()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-md transition-all cursor-pointer shadow-md"
                >
                  Trang bị {isNameplate ? 'bảng tên' : 'khung'}
                </button>
              )}
            </div>
          ) : (
            <div className={`flex gap-2`}>
              <button 
                onClick={() => handleAction()}
                className={`w-full py-2 font-bold text-xs rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-md active:scale-[0.98]`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> {frame.isPremium ? 'Nhận miễn phí' : (isCombo ? 'Mua trọn bộ' : 'Mua ngay')}
              </button>
            </div>
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
  useTitle('Cửa hàng');
  const { user, products, premiumProducts, categories, loading, fetchProducts, fetchPremiumProducts, fetchCategories, fetchProfile, addCoins } = useUserStore();
  const [filter, setFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Load backend data on component mount
  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchProducts();
    fetchPremiumProducts();
    
    // Fetch inventory
    const fetchInv = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/shop/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.status === 'success') {
          setInventoryItems(result.data || []);
        }
      } catch (e) {}
    };
    fetchInv();
  }, [fetchProfile, fetchProducts, fetchCategories]);

  // Set default category to 'khung-vien' once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      const khungVienCat = categories.find(c => c.slug === 'khung-vien');
      if (khungVienCat) {
        setActiveCategory(khungVienCat._id);
      } else {
        setActiveCategory(categories[0]._id);
      }
    }
  }, [categories, activeCategory]);

  // Fallback to static mock products if backend returns empty or is offline
  const activeProducts = filter === 'premium' ? premiumProducts : (products.length > 0 ? products : fallbackMockFrames);

  const filteredFrames = activeProducts.filter(frame => {
    // Check category filter
    if (activeCategory && frame.category !== activeCategory) return false;
    
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
                {type === 'all' && 'Tất cả (Coin)'}
                {type === 'premium' && 'Phần thưởng Premium'}
                {type === 'coin' && 'Bán Chạy'}
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
            <FrameCard 
              key={frame.id} 
              frame={frame} 
              inventoryItems={inventoryItems} 
              onShowPremiumModal={() => setShowPremiumModal(true)}
            />
          ))}
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1f22] rounded-2xl border border-slate-700/50 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 flex flex-col items-center justify-center text-center">
              <Award className="w-16 h-16 text-white mb-3 drop-shadow-md" />
              <h3 className="text-2xl font-black text-white">Nâng cấp Premium!</h3>
              <p className="text-pink-100 mt-2 text-sm">
                Bạn cần trở thành hội viên Premium để nhận đặc quyền này.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm">Nhận miễn phí các Avatar Frame giới hạn.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm">Tên hiển thị độc quyền, màu sắc nổi bật.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm">Ưu tiên hỗ trợ từ Admin hệ thống.</span>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white font-semibold transition-colors"
                >
                  Đóng
                </button>
                <button 
                  onClick={() => {
                    setShowPremiumModal(false);
                    // Có thể navigate sang trang thanh toán nếu có
                    alert('Chuyển hướng đến trang thanh toán...');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold transition-all shadow-md shadow-pink-500/20"
                >
                  Nâng Cấp Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
