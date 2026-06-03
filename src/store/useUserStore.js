import { create } from 'zustand';
import axiosClient from '../services/axiosClient';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export const useUserStore = create((set, get) => ({
  user: {
    _id: null,
    username: 'Minh Khang (Local)',
    coins: 450,
    isPremium: true,
    ownedFrames: ['default'],
    activeFrame: 'default',
    ownedNameplates: [],
    activeNameplate: null,
  },
  products: [],
  premiumProducts: [],
  categories: [],
  loading: false,

  // Fetch user profile from backend
  fetchProfile: async () => {
    try {
      const res = await axiosClient.get(`/api/users/profile`);
      const result = res.data;
      
      if (result.status === 'success' && result.data) {
        const u = result.data;
        set({ 
          user: {
            ...u,
            ownedFrames: u.ownedFrames?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeFrame: typeof u.activeFrame === 'object' && u.activeFrame ? u.activeFrame._id : u.activeFrame || 'default',
            ownedNameplates: u.ownedNameplates?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeNameplate: typeof u.activeNameplate === 'object' && u.activeNameplate ? u.activeNameplate._id : u.activeNameplate || null,
            ownedProfileEffects: u.ownedProfileEffects?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeProfileEffect: typeof u.activeProfileEffect === 'object' && u.activeProfileEffect ? u.activeProfileEffect._id : u.activeProfileEffect || null,
            activeProfileEffectLayers: u.activeProfileEffectLayers || []
          }
        });
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch user profile from backend, using local state.', err.message);
    }
  },

  // Auth: Login
  login: async (email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();

      if (result.status === 'success') {
        localStorage.setItem('token', result.token);
        localStorage.setItem('admin_token', result.token); // sync with admin pages
        
        const u = result.data;
        set({
          user: {
            ...u,
            ownedFrames: u.ownedFrames?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeFrame: typeof u.activeFrame === 'object' && u.activeFrame ? u.activeFrame._id : u.activeFrame || 'default',
            ownedNameplates: u.ownedNameplates?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeNameplate: typeof u.activeNameplate === 'object' && u.activeNameplate ? u.activeNameplate._id : u.activeNameplate || null
          }
        });
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Đăng nhập không thành công!' };
      }
    } catch (err) {
      return { success: false, message: 'Không thể kết nối đến máy chủ Backend!' };
    }
  },

  // Auth: Register
  register: async (username, email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const result = await res.json();

      if (result.status === 'success') {
        localStorage.setItem('token', result.token);
        localStorage.setItem('admin_token', result.token); // sync with admin pages
        
        const u = result.data;
        set({
          user: {
            ...u,
            ownedFrames: u.ownedFrames?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeFrame: typeof u.activeFrame === 'object' && u.activeFrame ? u.activeFrame._id : u.activeFrame || 'default',
            ownedNameplates: u.ownedNameplates?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeNameplate: typeof u.activeNameplate === 'object' && u.activeNameplate ? u.activeNameplate._id : u.activeNameplate || null
          }
        });
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Đăng ký không thành công!' };
      }
    } catch (err) {
      return { success: false, message: 'Không thể kết nối đến máy chủ Backend!' };
    }
  },

  // Auth: Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    set({
      user: {
        _id: null,
        username: 'Minh Khang (Local)',
        coins: 450,
        isPremium: true,
        ownedFrames: ['default'],
        activeFrame: 'default',
        ownedNameplates: [],
        activeNameplate: null,
      }
    });
  },


  // Fetch avatar frames (products) from backend DB
  fetchProducts: async () => {
    try {
      set({ loading: true });
      const res = await fetch(`${BACKEND_URL}/products`);
      const result = await res.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        // Map backend products to layout requirements (colorClass, descriptions)
        const mappedProducts = result.data.map((prod, idx) => ({
          id: prod._id,
          name: prod.name,
          price: prod.price,
          isPremium: prod.isPremium || false,
          premiumEndDate: prod.premiumEndDate || null,
          description: prod.description || (prod.isPremium ? (prod.premiumEndDate ? `Đặc quyền Premium đến ${new Date(prod.premiumEndDate).toLocaleDateString('vi-VN')}.` : 'Đặc quyền Premium (theo thời hạn gói).') : ''),
          category: prod.category ? prod.category._id : null,
          categorySlug: prod.category ? prod.category.slug : null,
          staticUrl: prod.staticUrl,
          animatedUrl: prod.animatedUrl,
          isCombo: prod.isCombo,
          comboItems: prod.comboItems
        }));
        
        set({ products: mappedProducts, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm', error);
      set({ loading: false });
    }
  },

  // Fetch premium perks
  fetchPremiumProducts: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/premium`);
      const result = await res.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        const mappedProducts = result.data.map(prod => ({
          id: prod._id,
          name: prod.name,
          price: prod.price,
          isPremium: prod.isPremium || true,
          premiumStartDate: prod.premiumStartDate || null,
          premiumEndDate: prod.premiumEndDate || null,
          description: `Phần thưởng Premium (đến ${new Date(prod.premiumEndDate).toLocaleDateString('vi-VN')}).`,
          category: prod.category ? prod.category._id : null,
          categorySlug: prod.category ? prod.category.slug : null,
          staticUrl: prod.staticUrl,
          animatedUrl: prod.animatedUrl,
          isCombo: prod.isCombo,
          comboItems: prod.comboItems
        }));
        set({ premiumProducts: mappedProducts });
      }
    } catch (error) {
      console.error('Lỗi khi tải phần thưởng Premium', error);
    }
  },

  // Fetch categories from backend DB
  fetchCategories: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/categories`);
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        set({ categories: result.data });
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch categories', err.message);
    }
  },

  // Equip a frame
  equipFrame: (frameId) => 
    set((state) => ({
      user: {
        ...state.user,
        activeFrame: frameId
      }
    })),

  // Buy a frame (Support both Backend API and offline mock fallback)
  buyFrame: async (productId, price) => {
    const { user } = get();

    // Offline / Fallback mode if backend did not return database ID
    if (!user._id) {
      if (user.ownedFrames.includes(productId)) {
        return { success: false, message: 'Bạn đã sở hữu khung avatar này rồi!' };
      }
      if (user.coins < price) {
        return { success: false, message: 'Bạn không đủ Coin để mua khung này!' };
      }

      // Execute locally
      set((state) => ({
        user: {
          ...state.user,
          coins: state.user.coins - price,
          ownedFrames: [...state.user.ownedFrames, productId],
          activeFrame: productId
        }
      }));
      return { success: true, message: 'Mua khung avatar thành công! (Chế độ offline)' };
    }

    // Online integration mode with Mongoose backend
    try {
      const res = await fetch(`${BACKEND_URL}/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, productId })
      });
      const result = await res.json();

      if (result.status === 'success' && result.data) {
        const u = result.data;
        set({
          user: {
            ...u,
            ownedFrames: u.ownedFrames?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeFrame: typeof u.activeFrame === 'object' && u.activeFrame ? u.activeFrame._id : u.activeFrame || 'default',
            ownedNameplates: u.ownedNameplates?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeNameplate: typeof u.activeNameplate === 'object' && u.activeNameplate ? u.activeNameplate._id : u.activeNameplate || null,
            ownedProfileEffects: u.ownedProfileEffects?.map(f => typeof f === 'object' ? f._id : f) || [],
            activeProfileEffect: typeof u.activeProfileEffect === 'object' && u.activeProfileEffect ? u.activeProfileEffect._id : u.activeProfileEffect || null,
            activeProfileEffectLayers: u.activeProfileEffectLayers || []
          }
        });
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || 'Giao dịch thất bại!' };
      }
    } catch (err) {
      return { success: false, message: 'Không thể kết nối tới máy chủ Backend!' };
    }
  },

  // Claim a premium product
  claimPremiumProduct: async (productId) => {
    const { user } = get();

    if (!user._id) {
      return { success: false, message: 'Vui lòng đăng nhập để nhận quà!' };
    }

    try {
      const res = await fetch(`${BACKEND_URL}/shop/claim-premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          productId: productId
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        get().fetchProfile();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Lỗi nhận quà' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Đã xảy ra lỗi kết nối!' };
    }
  },

  // Add coins
  addCoins: (amount) => 
    set((state) => ({
      user: {
        ...state.user,
        coins: state.user.coins + amount
      }
    }))
}));
export default useUserStore;
