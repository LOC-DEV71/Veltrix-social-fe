import { create } from 'zustand';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export const useUserStore = create((set, get) => ({
  user: {
    _id: null,
    username: 'Minh Khang (Local)',
    coins: 450,
    isPremium: true,
    ownedFrames: ['default'], // IDs of frames owned
    activeFrame: 'default', // ID of currently active frame
    ownedNameplates: [], // IDs of nameplates owned
    activeNameplate: null, // ID of currently active nameplate
  },
  products: [],
  categories: [],
  loading: false,

  // Fetch user profile from backend (supports real login token or transparent dev helper fallback)
  fetchProfile: async () => {
    try {
      let token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      
      // Dev helper: If no token exists at all, seed the transparent dev login token
      if (!token) {
        const loginRes = await fetch(`${BACKEND_URL}/users/login`, { method: 'POST' });
        const loginResult = await loginRes.json();
        if (loginResult.status === 'success' && loginResult.token) {
          token = loginResult.token;
          localStorage.setItem('admin_token', token);
          localStorage.setItem('token', token);
          console.log('🔑 Transparently seeded dev JWT Authentication Token!');
        }
      }

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/users/profile`, { headers });
      const result = await res.json();
      
      if (result.status === 'success' && result.data) {
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
        const colorClasses = [
          'from-orange-600 via-red-500 to-yellow-500',
          'from-cyan-400 via-blue-500 to-indigo-600',
          'from-fuchsia-500 via-purple-600 to-pink-500',
          'from-amber-400 via-yellow-300 to-amber-600'
        ];
        
        const mappedProducts = result.data.map((prod, idx) => ({
          id: prod._id,
          name: prod.name,
          price: prod.price,
          isPremium: prod.price === 0,
          description: prod.name.includes('Hellfire') ? 'Bao bọc avatar của bạn bằng ngọn lửa rực cháy mãnh liệt từ địa ngục.' :
                       prod.name.includes('Aura') ? 'Dải màu xanh - tím cực quang chuyển động xoay vần huyền ảo.' :
                       prod.name.includes('Cyber') ? 'Các hạt năng lượng laser nhấp nháy mang phong cách tương lai.' :
                       'Dành riêng cho hội viên Premium. Khung vàng ròng lấp lánh kim cương.',
          category: prod.category ? prod.category._id : null,
          categorySlug: prod.category ? prod.category.slug : null,
          staticUrl: prod.staticUrl,
          animatedUrl: prod.animatedUrl
        }));
        
        set({ products: mappedProducts, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch products from backend, using fallback mock frames.', err.message);
      set({ loading: false });
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
  buyFrame: async (productId, price, isPremiumOnly) => {
    const { user } = get();

    // Offline / Fallback mode if backend did not return database ID
    if (!user._id) {
      if (user.ownedFrames.includes(productId)) {
        return { success: false, message: 'Bạn đã sở hữu khung avatar này rồi!' };
      }
      if (isPremiumOnly && !user.isPremium) {
        return { success: false, message: 'Khung avatar này chỉ dành cho tài khoản Premium!' };
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
            activeNameplate: typeof u.activeNameplate === 'object' && u.activeNameplate ? u.activeNameplate._id : u.activeNameplate || null
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
