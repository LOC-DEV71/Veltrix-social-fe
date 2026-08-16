import React, { useState, useEffect } from 'react';
import ImageCropperModal from './ImageCropperModal';
import { X, User, CreditCard, Activity, LogOut, Shield, Mail, Edit2, Camera, Bell, Monitor, Smartphone, Moon, Zap, Crown, PlusCircle, Pencil, Lock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { logout as reduxLogout } from '../redux/slices/authSlice';
import CustomStatusModal from './CustomStatusModal';
import LoopingAPNG from './LoopingAPNG';
import SequentialAPNGLayers from './SequentialAPNGLayers';

export default function UserSettingsModal({ isOpen, onClose, initialTab = 'account', myCommunities = [], selectedCommunity = null }) {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState(initialTab === 'server-profile' ? 'profile' : initialTab);
  const [profileTab, setProfileTab] = useState(initialTab === 'server-profile' ? 'server' : 'main');
  const [serverProfileCommunity, setServerProfileCommunity] = useState(selectedCommunity || (myCommunities.length > 0 ? (myCommunities[0].community || myCommunities[0]) : null));
  const [serverNickname, setServerNickname] = useState('');
  const [serverAvatarFile, setServerAvatarFile] = useState(null);
  const [serverAvatarPreview, setServerAvatarPreview] = useState(null);

  const [notification, setNotification] = useState(null);
  
  const [isCustomStatusOpen, setIsCustomStatusOpen] = useState(false);
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
  
  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const [hasChanges, setHasChanges] = useState(false);
  const [isDecorationModalOpen, setIsDecorationModalOpen] = useState(false);
  const [bannerColor, setBannerColor] = useState(user?.bannerColor || '#85744a');
  const [themePrimary, setThemePrimary] = useState(user?.themeColors?.primary || null);
  const [themeAccent, setThemeAccent] = useState(user?.themeColors?.accent || null);
  const [bannerFile, setBannerFile] = useState(null);
  const isPremium = user?.isPremium;
  const [bannerPreview, setBannerPreview] = useState(isPremium ? (user?.bannerImage || null) : null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropType, setCropType] = useState('banner'); // 'banner' or 'avatar'
  
  // Real-time Preview States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [activeFrame, setActiveFrame] = useState(user?.activeFrame || null);
  const [availableFrames, setAvailableFrames] = useState([]);
  const [activeNameplate, setActiveNameplate] = useState(user?.activeNameplate || null);
  const [availableNameplates, setAvailableNameplates] = useState(false);
  const [isNameplateModalOpen, setIsNameplateModalOpen] = useState(false);
  
  const [activeProfileEffect, setActiveProfileEffect] = useState(user?.activeProfileEffect || null);
  const [availableProfileEffects, setAvailableProfileEffects] = useState([]);
  const [isProfileEffectModalOpen, setIsProfileEffectModalOpen] = useState(false);

  // Edit Account States
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || '');
      setPronouns(user.pronouns || '');
      setBannerColor(user.bannerColor || '#85744a');
      setThemePrimary(user.themeColors?.primary || null);
      setThemeAccent(user.themeColors?.accent || null);
      setBannerPreview(isPremium ? (user.bannerImage || null) : null);
      setBannerFile(null);
      setActiveFrame(user.activeFrame || null);
      setActiveNameplate(user.activeNameplate || null);
      setActiveProfileEffect(user.activeProfileEffect || null);
      setAvatarPreview(user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`);
    }
  }, [user]);

  useEffect(() => {
    if (initialTab === 'server-profile') {
      setActiveTab('profile');
      setProfileTab('server');
    } else {
      setActiveTab(initialTab);
      setProfileTab('main');
    }
  }, [initialTab]);

  useEffect(() => {
    if (profileTab === 'server' && serverProfileCommunity && user) {
      // Find the member in this community to get existing server profile
      const comm = serverProfileCommunity.community || serverProfileCommunity;
      if (comm && comm.members) {
         const member = comm.members.find(m => String(m.user._id || m.user) === String(user._id || user.id));
         if (member) {
            setServerNickname(member.nickname || '');
            setServerAvatarPreview(member.avatar || null);
         } else {
            setServerNickname('');
            setServerAvatarPreview(null);
         }
      }
    }
  }, [profileTab, serverProfileCommunity, user]);

  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await axiosClient.get('/api/users/inventory');
        if (res.data?.status === 'success') {
          const frames = res.data.data
            .filter(item => item.categorySlug === 'khung-vien' || item.category?.slug === 'khung-vien')
            .map(item => ({ ...item.product, expiresAt: item.expiresAt, isPremiumPerk: item.isPremiumPerk }));
          setAvailableFrames(frames);

          const nameplates = res.data.data
            .filter(item => item.categorySlug === 'bang-ten' || item.category?.slug === 'bang-ten')
            .map(item => ({ ...item.product, expiresAt: item.expiresAt, isPremiumPerk: item.isPremiumPerk }));
          setAvailableNameplates(nameplates);

          const profileEffects = res.data.data
            .filter(item => item.categorySlug === 'hieu-ung-ho-so' || item.category?.slug === 'hieu-ung-ho-so')
            .map(item => ({ ...item.product, expiresAt: item.expiresAt, isPremiumPerk: item.isPremiumPerk }));
          setAvailableProfileEffects(profileEffects);
        }
      } catch (e) {
        console.error("Failed to fetch frames");
      }
    };
    fetchFrames();
  }, []);

  if (!isOpen || !user) return null;

  const getRemainingTime = (expiresAt, isPremiumPerk) => {
    if (!expiresAt) {
      if (isPremiumPerk) return 'Theo gói Premium';
      return null;
    }
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Đã hết hạn';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Còn ${days} ngày`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `Còn ${hours} giờ`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `Còn ${minutes} phút`;
  };

  const handleSaveProfile = async () => {
    if (activeTab === 'profile' && profileTab === 'server') {
      return handleSaveServerProfile();
    }
    
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('pronouns', pronouns);
      formData.append('bannerColor', bannerColor);
      if (themePrimary !== null) formData.append('themePrimary', themePrimary);
      if (themeAccent !== null) formData.append('themeAccent', themeAccent);
      if (bannerFile) formData.append('bannerFile', bannerFile);
      if (bannerPreview === null && user.bannerImage) formData.append('removeBanner', 'true');
      formData.append('activeFrame', activeFrame?._id || '');
      formData.append('activeNameplate', activeNameplate?._id || '');
      formData.append('activeProfileEffect', activeProfileEffect?._id || '');
      if (avatarFile) formData.append('avatarFile', avatarFile);

      await axiosClient.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHasChanges(false);
      // Let's force a reload or dispatch an action to update global user state if we had one.
      // But we can just rely on the next refresh for now, since this modal previews it live anyway.
    } catch (e) {
      console.error(e);
      showNotification('Có lỗi xảy ra khi lưu hồ sơ!', 'error');
    }
  };

  const handleSaveServerProfile = async () => {
    try {
      const comm = serverProfileCommunity.community || serverProfileCommunity;
      if (!comm || !comm._id) return;

      const formData = new FormData();
      formData.append('nickname', serverNickname);
      
      if (serverAvatarFile) {
        formData.append('avatar', serverAvatarFile);
      } else if (serverAvatarPreview === null) {
        formData.append('removeAvatar', 'true');
      }

      const res = await axiosClient.post(`/api/communities/${comm._id}/server-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHasChanges(false);
      showNotification('Đã cập nhật hồ sơ máy chủ thành công! Hãy tải lại trang nếu chưa thấy thay đổi.');
    } catch (e) {
      console.error(e);
      showNotification('Có lỗi xảy ra khi lưu hồ sơ máy chủ!', 'error');
    }
  };

  const handleSaveAccount = async () => {
    try {
      const formData = new FormData();
      formData.append('displayName', editDisplayName);
      formData.append('username', editUsername);

      const res = await axiosClient.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showNotification('Đã cập nhật thông tin tài khoản thành công!');
      setIsEditAccountModalOpen(false);
      // Cập nhật lại UI sau reload, hoặc dispatch Redux update
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản!';
      showNotification(msg, 'error');
    }
  };

  const handleBannerClick = () => {
    document.getElementById('banner-upload')?.click();
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isPremium) {
      showNotification('Hãy nâng cấp Premium để sử dụng biểu ngữ (Banner)!', 'error');
      e.target.value = '';
      return;
    }
    
    if (file.type !== 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setIsCropperOpen(true);
        e.target.value = '';
      };
      reader.onerror = () => {
        console.error('Lỗi khi đọc file ảnh');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setHasChanges(true);
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedFile, croppedUrl) => {
    if (cropType === 'banner') {
      setBannerFile(croppedFile);
      setBannerPreview(croppedUrl);
    } else if (cropType === 'serverAvatar') {
      setServerAvatarFile(croppedFile);
      setServerAvatarPreview(croppedUrl);
    } else {
      setAvatarFile(croppedFile);
      setAvatarPreview(croppedUrl);
    }
    setHasChanges(true);
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setHasChanges(true);
  };

  const handleAvatarClick = () => {
    document.getElementById('avatar-upload')?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'image/gif' && !user?.isPremium) {
      showNotification('Hãy nâng cấp Premium để sử dụng ảnh đại diện động (GIF)!', 'error');
      e.target.value = '';
      return;
    }
    if (file.type !== 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setCropType('avatar');
        setIsCropperOpen(true);
        e.target.value = '';
      };
      reader.onerror = () => { e.target.value = ''; };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setHasChanges(true);
      e.target.value = '';
    }
  };

  const handleServerAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setCropType('serverAvatar');
        setIsCropperOpen(true);
        e.target.value = '';
      };
      reader.onerror = () => { e.target.value = ''; };
      reader.readAsDataURL(file);
    } else {
      setServerAvatarFile(file);
      setServerAvatarPreview(URL.createObjectURL(file));
      setHasChanges(true);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      await axiosClient.post('/api/auth/logout');
    } catch (e) { /* ignore */ }
    dispatch(reduxLogout());
    navigate('/login');
    onClose();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[#f2f3f5] text-xl font-bold mb-6">Tài khoản của tôi</h2>
            
            {/* Banner & Avatar preview */}
            <div className="bg-[#1e1f22] rounded-xl overflow-hidden mb-6 relative border border-[#2b2d31]">
              {bannerPreview ? (
                <div className="h-24 w-full bg-cover bg-center" style={{ backgroundImage: `url(${bannerPreview})` }}></div>
              ) : (
                <div className={`h-24 w-full ${user.isPremium ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-[#5865F2]'}`} style={{ backgroundColor: bannerColor }}></div>
              )}
              <div className="px-4 pb-4 relative flex justify-between items-end">
                <div className="flex gap-4 items-end -mt-10">
                  <div className="w-20 h-20 rounded-full border-[6px] border-[#1e1f22] bg-[#2b2d31] relative overflow-hidden shrink-0">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={handleAvatarClick}>
                      <Camera className="text-white w-6 h-6" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-[#f2f3f5] text-xl font-bold flex items-center gap-2">
                      {user.username}
                      {user.isPremium && <Crown className="w-5 h-5 text-amber-400" />}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
              
              {/* Info details */}
              <div className="m-4 bg-[#2b2d31] rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-1">Tên hiển thị</h4>
                    <p className="text-[#f2f3f5]">{user.displayName || user.username}</p>
                  </div>
                  <button 
                    className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    onClick={() => {
                      setEditDisplayName(user.displayName || user.username || '');
                      setEditUsername(user.username || '');
                      setIsEditAccountModalOpen(true);
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-1">Tên người dùng</h4>
                    <p className="text-[#f2f3f5]">{user.username}</p>
                  </div>
                  <button 
                    className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    onClick={() => {
                      setEditDisplayName(user.displayName || user.username || '');
                      setEditUsername(user.username || '');
                      setIsEditAccountModalOpen(true);
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-1">Email</h4>
                    <p className="text-[#f2f3f5] flex items-center gap-2">
                      {user.email} <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">ĐÃ XÁC MINH</span>
                    </p>
                  </div>
                  <button className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">Chỉnh sửa</button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-1">Số điện thoại</h4>
                    <p className="text-[#f2f3f5]">Bạn chưa thêm số điện thoại.</p>
                  </div>
                  <button className="text-[#00a8fc] hover:underline text-sm font-medium transition-colors">Thêm</button>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#3f4147] my-8" />
            
            <h2 className="text-[#f2f3f5] text-xl font-bold mb-4">Bảo mật tài khoản</h2>
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold transition-colors mb-4">
              Bật xác thực 2 yếu tố (2FA)
            </button>
            <p className="text-[#b5bac1] text-sm">Bảo vệ tài khoản Vetrix của bạn bằng một lớp bảo mật bổ sung.</p>
          </div>
        );

      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <h2 className="text-[#f2f3f5] text-xl font-bold mb-4">Hồ sơ</h2>
            
            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#3f4147] mb-6">
              <button 
                onClick={() => setProfileTab('main')}
                className={`pb-4 font-semibold transition-colors ${profileTab === 'main' ? 'text-white border-b-2 border-indigo-400' : 'text-[#b5bac1] hover:text-[#dbdee1]'}`}
              >
                Hồ Sơ Chính
              </button>
              <button 
                onClick={() => setProfileTab('server')}
                className={`pb-4 font-semibold transition-colors ${profileTab === 'server' ? 'text-white border-b-2 border-indigo-400' : 'text-[#b5bac1] hover:text-[#dbdee1]'}`}
              >
                Hồ Sơ Theo Máy Chủ
              </button>
            </div>

            {profileTab === 'server' ? (
              <div className="flex flex-col h-full animate-in fade-in duration-200">
                <div className="mb-6 max-w-md">
                  <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Chọn máy chủ</h4>
                  <select
                    value={serverProfileCommunity?._id || ''}
                    onChange={(e) => {
                      const comm = myCommunities.find(c => (c.community?._id || c._id) === e.target.value);
                      if (comm) {
                        setServerProfileCommunity(comm.community || comm);
                      }
                    }}
                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 text-sm text-[#f2f3f5] focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {myCommunities.map(c => {
                      const comm = c.community || c;
                      return <option key={comm._id} value={comm._id}>{comm.name}</option>;
                    })}
                  </select>
                </div>
                
                <div className="flex flex-col-reverse md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Biệt danh máy chủ</h4>
                        <input 
                          type="text" 
                          value={serverNickname}
                          onChange={(e) => { setServerNickname(e.target.value); setHasChanges(true); }}
                          placeholder={user.displayName || user.username}
                          className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 text-sm text-[#f2f3f5] focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      
                      <div>
                        <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Ảnh Đại Diện Máy Chủ</h4>
                        <div className="flex gap-3">
                          <input 
                            type="file" 
                            id="server-avatar-upload" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setServerAvatarFile(file);
                              setServerAvatarPreview(URL.createObjectURL(file));
                              setHasChanges(true);
                            }} 
                          />
                          <button onClick={() => document.getElementById('server-avatar-upload')?.click()} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">
                            Đổi Ảnh Đại Diện
                          </button>
                          <button 
                            onClick={() => { setServerAvatarPreview(null); setServerAvatarFile(null); setHasChanges(true); }}
                            className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">
                            Xóa Ảnh Đại Diện
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Server Profile Preview */}
                  <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-6">
                    <div>
                      <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Xem trước trong máy chủ</h4>
                      <div className="bg-[#111214] rounded-lg border border-[#1f2023] p-0 overflow-hidden shadow-lg w-full">
                        <div className="bg-[#2b2d31] w-full">
                          {bannerPreview ? (
                        <div className="h-[100px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${bannerPreview})` }} />
                      ) : (
                        <div className="h-[100px] w-full" style={{ backgroundColor: bannerColor }} />
                      )}
                          <div className="px-4 pb-4 relative">
                            <div className="absolute -top-[45px] flex items-end gap-3 w-full">
                              <div className="relative shrink-0 w-[80px] h-[80px] rounded-full p-[5px] bg-[#2b2d31]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22] relative z-10">
                                  <img 
                                    src={serverAvatarPreview || avatarPreview} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#23a55a] border-[4px] border-[#2b2d31] z-30" />
                              </div>
                            </div>
                            <div className="pt-[45px]">
                              <h2 className="text-[18px] font-bold text-[#f2f3f5] leading-tight">
                                {serverNickname || displayName || user.username}
                              </h2>
                              <p className="text-[12px] text-[#dbdee1] mb-1">{user.username}</p>
                              {pronouns && <p className="text-[12px] text-[#b5bac1] mb-4">{pronouns}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
             {/* Banner Ad - only show for non-premium */}
             {!user.isPremium && (
             <div className="bg-gradient-to-r from-[#1D4ED8] to-[#0EA5E9] rounded-xl p-4 flex items-center justify-between mb-8 shadow-lg relative overflow-hidden">
               <div className="absolute -left-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-[100px] h-[60px] bg-black/20 rounded-lg flex items-center justify-center relative shadow-inner overflow-hidden border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 absolute -left-2 top-2 border border-white/20 overflow-hidden flex items-center justify-center">
                       <div className="w-5 h-5 bg-white/40 rounded-sm rotate-45"></div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 absolute right-1 z-10 border-2 border-sky-400 overflow-hidden">
                       <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-[15px] mb-1">Đem tới diện mạo tươi mới cho hồ sơ của bạn</h3>
                   <p className="text-white/90 text-[13px] max-w-[420px] leading-relaxed">Khám phá các trang trí ảnh đại diện, hiệu ứng hồ sơ và bảng tên mới nhất.</p>
                 </div>
               </div>
               <button onClick={() => { onClose(); navigate('/shop'); }} className="bg-white text-black font-bold text-[13px] px-4 py-2 rounded hover:bg-gray-100 transition-colors active:scale-95 shrink-0 z-10">
                 Tới cửa hàng
               </button>
             </div>
             )}

             {/* Premium Active Badge */}
             {user.isPremium && (
               <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between mb-8 shadow-lg relative overflow-hidden">
                 <div className="absolute -left-4 -top-4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
                 <div className="flex items-center gap-3 relative z-10">
                   <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                   <div>
                     <h3 className="text-[#f2f3f5] font-bold text-[15px]">Vetrix Premium đang hoạt động ✨</h3>
                     <p className="text-[#b5bac1] text-[13px]">Bạn đang tận hưởng toàn bộ đặc quyền Premium!</p>
                   </div>
                 </div>
                 <button onClick={() => setActiveTab('payment')} className="bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold text-[13px] px-4 py-2 rounded hover:from-amber-600 hover:to-pink-600 transition-all active:scale-95 shrink-0 z-10">
                   Quản lý đăng ký
                 </button>
               </div>
             )}

            {/* Content 2 Columns */}
            <div className="flex flex-col-reverse md:flex-row gap-8">
              {/* Left Column - Forms */}
              <div className="flex-1">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Tên hiển thị</h4>
                    <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setHasChanges(true); }} className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 text-sm text-[#f2f3f5] focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Đại từ nhân xưng</h4>
                    <input type="text" value={pronouns} onChange={(e) => { setPronouns(e.target.value); setHasChanges(true); }} placeholder="Thêm đại từ nhân xưng của bạn" className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 text-sm text-[#f2f3f5] focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-[#80848e]" />
                  </div>
                </div>

                <div className="h-[1px] bg-[#3f4147] w-full my-6" />

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Ảnh Đại Diện</h4>
                    <div className="flex gap-3">
                      <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      <button onClick={handleAvatarClick} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Đổi Ảnh Đại Diện</button>
                      <button className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">Xóa Ảnh Đại Diện</button>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#3f4147] w-full" />

                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Khung Ảnh Đại Diện</h4>
                    <button onClick={() => setIsDecorationModalOpen(true)} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Đổi Khung</button>
                  </div>

                  <div className="h-[1px] bg-[#3f4147] w-full" />

                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Bảng Tên</h4>
                    <button onClick={() => setIsNameplateModalOpen(true)} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Đổi Bảng Tên</button>
                  </div>

                  <div className="h-[1px] bg-[#3f4147] w-full" />

                  <div>
                    <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Màu Biểu ngữ</h4>
                    <div className="w-[85px] h-[55px] rounded cursor-pointer relative group border-2 border-transparent hover:border-white transition-all overflow-hidden" style={{ backgroundColor: bannerColor }}>
                      <input type="color" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" value={bannerColor} onChange={(e) => { setBannerColor(e.target.value); setHasChanges(true); }} />
                      <div className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-100 group-hover:bg-black/70 transition-colors pointer-events-none">
                        <Pencil className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Premium-only features - inline when premium */}
                  {user.isPremium && (
                    <>
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider">Biểu Ngữ Hồ Sơ</h4>
                          <span className="text-[9px] bg-gradient-to-r from-amber-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Premium</span>
                        </div>
                        <div className="flex gap-3">
                          <input type="file" id="banner-upload" accept="image/*" className="hidden" onChange={handleBannerChange} />
                          <button onClick={handleBannerClick} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Biểu Ngữ</button>
                          <button onClick={handleRemoveBanner} className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">Xóa Biểu Ngữ</button>
                        </div>
                      </div>
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider">Hình Đại Diện Hoạt Hình</h4>
                          <span className="text-[9px] bg-gradient-to-r from-amber-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Premium</span>
                        </div>
                        <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thêm Hình Đại Diện Hoạt Hình</button>
                      </div>
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider">Hiệu Ứng Hồ Sơ</h4>
                          <span className="text-[9px] bg-gradient-to-r from-amber-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Premium</span>
                        </div>
                        <button onClick={() => setIsProfileEffectModalOpen(true)} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay đổi hiệu ứng</button>
                      </div>
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider">Chủ Đề Hồ Sơ</h4>
                          <span className="text-[9px] bg-gradient-to-r from-amber-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Premium</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-[60px] h-[40px] rounded cursor-pointer relative border transition-all overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed border-[#1f2023]' : 'border-[#1f2023] hover:border-white'}`} style={{ backgroundColor: themePrimary || '#111214' }}>
                              <input 
                                type="color" 
                                className={`opacity-0 absolute inset-0 w-full h-full ${!isPremium ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                                value={themePrimary || '#111214'} 
                                onChange={(e) => { if (isPremium) { setThemePrimary(e.target.value); setHasChanges(true); } }} 
                                disabled={!isPremium}
                              />
                              <div className="absolute top-1 right-1 w-[14px] h-[14px] bg-black/60 rounded-full flex items-center justify-center"><Pencil className="w-[8px] h-[8px] text-white" /></div>
                            </div>
                            <span className="text-[11px] text-[#dbdee1] font-medium">Chính</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-[60px] h-[40px] rounded cursor-pointer relative border transition-all overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed border-[#1f2023]' : 'border-[#1f2023] hover:border-white'}`} style={{ backgroundColor: themeAccent || '#232428' }}>
                              <input 
                                type="color" 
                                className={`opacity-0 absolute inset-0 w-full h-full ${!isPremium ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                                value={themeAccent || '#232428'} 
                                onChange={(e) => { if (isPremium) { setThemeAccent(e.target.value); setHasChanges(true); } }} 
                                disabled={!isPremium}
                              />
                              <div className="absolute top-1 right-1 w-[14px] h-[14px] bg-black/60 rounded-full flex items-center justify-center"><Pencil className="w-[8px] h-[8px] text-white" /></div>
                            </div>
                            <span className="text-[11px] text-[#dbdee1] font-medium">Nổi bật</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[1px] bg-[#3f4147] w-full" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider">Kiểu Tên Hiển Thị</h4>
                          <span className="text-[9px] bg-gradient-to-r from-amber-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Premium</span>
                        </div>
                        <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Đổi Kiểu</button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-6">
                <div>
                  <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Xem trước</h4>
                  <div className="bg-[#111214] rounded-lg border border-[#1f2023] overflow-hidden shadow-lg w-full p-1"
                       style={{ background: `linear-gradient(135deg, ${themePrimary || bannerColor} 0%, ${bannerColor} 50%, ${themeAccent || '#111214'} 100%)` }}>
                    <div 
                      className="w-full relative overflow-hidden rounded-[6px]"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${themePrimary || bannerColor} 35%, #111214) 0%, color-mix(in srgb, ${bannerColor} 35%, #111214) 50%, color-mix(in srgb, ${themeAccent || '#111214'} 35%, #111214) 100%)`
                      }}
                    >
                      {isPremium && bannerPreview ? (
                        <div className="h-[100px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${bannerPreview})` }} />
                      ) : (
                        <div className="h-[100px] w-full" style={{ backgroundColor: bannerColor }} />
                      )}
                      {/* Blurred Banner Background */}
                      {isPremium && bannerPreview && (
                        <div 
                          className="absolute top-0 left-0 w-full h-[50%] z-0 pointer-events-none"
                          style={{
                            backgroundImage: `url("${bannerPreview}")`,
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
                      
                      {activeProfileEffect && (
                        activeProfileEffect.effectLayers?.length > 0 ? (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[6px] z-[100]">
                            <SequentialAPNGLayers layers={activeProfileEffect.effectLayers} durationPerLayer={3000} />
                          </div>
                        ) : (
                          <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden rounded-[6px]">
                             <LoopingAPNG src={activeProfileEffect.animatedUrl || activeProfileEffect.staticUrl} className="w-full h-full object-fill opacity-90" alt="Profile Effect" duration={3000} />
                          </div>
                        )
                      )}
                      
                      <div 
                        className={`h-[120px] w-full shrink-0 relative z-10 ${bannerPreview ? 'bg-cover bg-center' : ''}`} 
                        style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : { backgroundColor: bannerColor }} 
                      />
                      <div className="px-4 pb-4 relative flex-1 flex flex-col z-10">
                        <div className="absolute -top-[55px] flex items-end gap-3 w-full">
                          <div className="relative shrink-0 w-[96px] h-[96px] rounded-full p-[6px]" style={{ backgroundColor: bannerPreview ? '#111214' : 'transparent' }}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22]">
                              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            {activeFrame && (
                              <div className="absolute -inset-[13%] pointer-events-none z-20">
                                <img src={activeFrame.animatedUrl || activeFrame.staticUrl} alt="frame" className="w-full h-full object-contain pointer-events-none" />
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#23a55a] border-[4px] z-30" style={{ borderColor: bannerPreview ? '#111214' : bannerColor }} />
                          </div>
                          <div onClick={() => setIsCustomStatusOpen(true)} className="bg-black/40 backdrop-blur-md border border-[#1f2023] rounded-xl px-2.5 py-1.5 text-xs text-[#dbdee1] font-medium shadow-md mb-2 flex-1 flex flex-col justify-center gap-0.5 cursor-pointer max-w-[160px] transition-colors hover:bg-black/60 z-20">
                            {user?.customStatus?.text || user?.customStatus?.emoji ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  {user.customStatus.emoji && <span className="text-sm leading-none shrink-0">{user.customStatus.emoji}</span>}
                                  {user.customStatus.text && <span className="truncate text-[11px]">{user.customStatus.text}</span>}
                                </div>
                                {user.customStatus.updatedAt && (<span className="text-[9px] text-[#949ba4] font-normal">{getRelativeTime(user.customStatus.updatedAt)}</span>)}
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <PlusCircle className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                                <span className="truncate italic text-[11px]">Thêm trạng thái...</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pt-[45px]">
                          <h2 className="text-[18px] font-bold text-[#f2f3f5] leading-tight">{displayName}</h2>
                          <p className="text-[12px] text-[#dbdee1] mb-1">{user.username}</p>
                          {pronouns && <p className="text-[12px] text-[#b5bac1] mb-4">{pronouns}</p>}
                          <button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-2 rounded text-[13px] font-semibold transition-colors">Nút Ví dụ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Bảng Tên</h4>
                  <div className="bg-[#2b2d31] rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden">
                    {(activeNameplate?.animatedUrl || user?.activeNameplateAnimatedUrl) && (
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 opacity-80 mix-blend-screen">
                          <img src={activeNameplate?.animatedUrl || user?.activeNameplateAnimatedUrl} className="absolute inset-0 w-full h-full object-cover object-left opacity-90" alt="Nameplate" />
                        </div>
                        <div className="absolute inset-0 z-10 mix-blend-overlay" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220, 62, 151, 0.08) 20%, rgba(220, 62, 151, 0.08) 50%, rgba(220, 62, 151, 0.2) 100%)' }} />
                      </div>
                    )}
                    <img src={avatarPreview} className="w-8 h-8 rounded-full object-cover relative z-10" alt="Avatar" />
                    <span className="text-[#f2f3f5] font-semibold text-[15px] relative z-10 drop-shadow-md">{displayName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Try Premium Section - only show for non-premium */}
            {!user.isPremium && (
              <>
                <div className="h-[1px] bg-[#3f4147] w-full my-10" />
            {/* Try Premium Section */}
            <div className="border border-[#1f2023] rounded-xl p-6 bg-[#232428] shadow-lg mb-8">
              <div className="flex gap-8">
                {/* Premium Left Column */}
                <div className="flex-1">
                  <h2 className="text-[#f2f3f5] text-[24px] font-black mb-1">Dùng thử Premium ngay!</h2>
                  <p className="text-[#b5bac1] text-[13px] mb-8">Hãy xem hồ sơ của bạn sẽ trông thế nào với Premium.</p>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Chủ Đề Hồ Sơ</h4>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-[60px] h-[40px] rounded cursor-pointer relative border transition-all overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed border-[#1f2023]' : 'border-[#1f2023] hover:border-white'}`} style={{ backgroundColor: themePrimary || '#111214' }}>
                            <input 
                              type="color" 
                              className={`opacity-0 absolute inset-0 w-full h-full ${!isPremium ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                              value={themePrimary || '#111214'} 
                              onChange={(e) => { if (isPremium) { setThemePrimary(e.target.value); setHasChanges(true); } }} 
                              disabled={!isPremium}
                            />
                            <div className="absolute top-1 right-1 w-[14px] h-[14px] bg-black/60 rounded-full flex items-center justify-center">
                              <Pencil className="w-[8px] h-[8px] text-white" />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#dbdee1] font-medium">Chính</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-[60px] h-[40px] rounded cursor-pointer relative border transition-all overflow-hidden ${!isPremium ? 'opacity-50 cursor-not-allowed border-[#1f2023]' : 'border-[#1f2023] hover:border-white'}`} style={{ backgroundColor: themeAccent || '#232428' }}>
                            <input 
                              type="color" 
                              className={`opacity-0 absolute inset-0 w-full h-full ${!isPremium ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                              value={themeAccent || '#232428'} 
                              onChange={(e) => { if (isPremium) { setThemeAccent(e.target.value); setHasChanges(true); } }} 
                              disabled={!isPremium}
                            />
                            <div className="absolute top-1 right-1 w-[14px] h-[14px] bg-black/60 rounded-full flex items-center justify-center">
                              <Pencil className="w-[8px] h-[8px] text-white" />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#dbdee1] font-medium">Nổi bật</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-[#3f4147] w-full" />

                    <div>
                      <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Biểu Ngữ Hồ Sơ</h4>
                      <div className="flex gap-3">
                        <input type="file" id="banner-upload-preview" accept="image/*" className="hidden" onChange={handleBannerChange} />
                        <button onClick={() => document.getElementById('banner-upload-preview')?.click()} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">
                          Thay Biểu Ngữ
                        </button>
                        <button onClick={handleRemoveBanner} className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">
                          Xóa Biểu Ngữ
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-[#3f4147] w-full" />

                    <div>
                      <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Hình đại diện hoạt hình</h4>
                      <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">
                        Thêm Hình Đại Diện Hoạt Hình
                      </button>
                    </div>

                    <div className="h-[1px] bg-[#3f4147] w-full" />

                    <div>
                      <h4 className="text-[#b5bac1] text-[11px] font-bold uppercase tracking-wider mb-2">Kiểu Tên Hiển Thị</h4>
                      <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">
                        Thay Đổi Kiểu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Premium Right Column */}
                <div className="w-[340px] shrink-0 flex flex-col pt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Crown className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-[#f2f3f5] font-bold text-[13px]">Giới Thiệu Premium</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <button className="bg-[#1e1f22] border border-[#1f2023] hover:bg-[#2b2d31] w-8 h-8 rounded flex items-center justify-center transition-colors text-[#b5bac1]">
                      <Activity className="w-4 h-4" />
                    </button>
                    <div className="flex-1 bg-gradient-to-r from-purple-800 to-indigo-800 rounded flex items-center justify-center py-1.5 border border-purple-500/20 font-bold text-white uppercase text-[12px] tracking-wider relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300')] opacity-40 mix-blend-screen"></div>
                      <span className="relative z-10 drop-shadow-md">Giấc mơ đầy sao</span>
                    </div>
                  </div>

                  <div className="bg-[#111214] rounded-lg border border-[#1f2023] overflow-hidden shadow-2xl w-full relative">
                    <div className="bg-gradient-to-b from-[#2b1055] to-[#111214] w-full h-full absolute inset-0 z-0"></div>
                    
                    <div className="relative z-10">
                      <div className="h-[120px] w-full bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600')] bg-cover bg-center border-b border-indigo-500/30" />
                      
                      <div className="px-4 pb-4 relative">
                        <div className="absolute -top-[55px] flex items-end gap-3 w-full">
                          <div className="relative shrink-0 w-[90px] h-[90px]">
                            {/* The Premium Avatar Frame */}
                            {activeFrame && (
                              <img src={activeFrame.animatedUrl} className="absolute -inset-[18px] w-[126px] h-[126px] max-w-none z-20 pointer-events-none" alt="Frame" />
                            )}
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#1e1f22] border-[6px] border-[#2b1055] relative z-10">
                              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#23a55a] border-[4px] border-[#2b1055] z-30" />
                          </div>

                          <div className="bg-[#111214]/80 backdrop-blur-md border border-white/5 rounded-full px-3 py-1.5 text-xs text-[#dbdee1] font-medium mb-3 flex-1 flex items-center gap-1.5 z-20 max-w-[150px]">
                            <PlusCircle className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                            <span className="truncate italic text-[11px]">Thêm trạng thái</span>
                          </div>
                        </div>

                        <div className="pt-[45px]">
                          <h2 className="text-[22px] font-black text-[#f2f3f5] leading-tight drop-shadow-lg" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
                            {displayName}
                          </h2>
                          <p className="text-[13px] text-[#dbdee1] mb-1">{user.username}</p>
                          {pronouns && <p className="text-[13px] text-[#b5bac1] mb-2">{pronouns}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#3f4147] pt-6">
                <p className="text-[#dbdee1] text-[13px] mb-4">Gói Premium cũng bao gồm Huy Hiệu Premium Độc Nhất.</p>
                
                <div className="bg-[#2b2d31] rounded-lg p-3 px-4 flex items-center justify-between border border-[#1f2023] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/10 to-indigo-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="text-[#f2f3f5] font-medium text-[13px] z-10 relative">
                    Nâng tầm diện mạo của bạn, chỉ có khi đăng ký <span className="text-indigo-400 font-bold">Premium</span>
                  </span>
                  <button className="bg-white text-black px-4 py-2 rounded text-[13px] font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)] z-10 relative">
                    <Crown className="w-4 h-4" />
                    Nhận Premium
                  </button>
                </div>
              </div>
            </div>
              </>
            )}
              </>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[#f2f3f5] text-xl font-bold mb-6">Thanh toán & Đăng ký</h2>
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-6 text-center">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <h3 className="text-white text-lg font-bold mb-2">Nâng cấp trải nghiệm với Vetrix Premium</h3>
              <p className="text-[#dbdee1] text-sm mb-6">Sở hữu khung avatar động, huy hiệu hoàng gia và màu sắc tên đặc biệt.</p>
              <button className="bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white px-8 py-2.5 rounded font-bold shadow-lg transition-all active:scale-95">
                Đăng ký ngay
              </button>
            </div>

            <h3 className="text-[#f2f3f5] font-bold mt-8 mb-4">Phương thức thanh toán</h3>
            <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1f2023] flex flex-col items-center justify-center text-center">
              <CreditCard className="w-10 h-10 text-[#80848e] mb-3" />
              <p className="text-[#949ba4] text-sm mb-4">Bạn chưa thêm thẻ tín dụng hoặc phương thức thanh toán nào.</p>
              <button className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Thêm phương thức thanh toán
              </button>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[#f2f3f5] text-xl font-bold mb-6">Trải nghiệm hoạt động</h2>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[#f2f3f5] font-bold mb-1">Hiển thị hoạt động hiện tại</h3>
                  <p className="text-[#b5bac1] text-sm max-w-[400px]">Tự động cập nhật trạng thái của bạn khi tham gia một trò chơi, nghe nhạc trên Spotify hoặc dùng các ứng dụng liên kết.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[#80848e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a55a]"></div>
                </label>
              </div>

              <div className="h-[1px] bg-[#3f4147]" />

              <div>
                <h3 className="text-[#f2f3f5] font-bold mb-4">Trạng thái trực tuyến Real-time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center gap-3 bg-[#2b2d31] hover:bg-[#35373c] p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-all text-left">
                    <div className="w-4 h-4 bg-[#23a55a] rounded-full shrink-0"></div>
                    <div>
                      <div className="text-white font-bold text-sm">Trực tuyến</div>
                      <div className="text-[#949ba4] text-xs">Mọi người sẽ thấy bạn đang online.</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-[#2b2d31] hover:bg-[#35373c] p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-all text-left">
                    <Moon className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold text-sm">Nhàn rỗi</div>
                      <div className="text-[#949ba4] text-xs">Bạn đang treo máy hoặc không ở đó.</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-[#2b2d31] hover:bg-[#35373c] p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-all text-left">
                    <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
                      <div className="w-2.5 h-1 bg-[#313338] absolute"></div>
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Không làm phiền</div>
                      <div className="text-[#949ba4] text-xs">Tắt mọi thông báo âm thanh.</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-[#2b2d31] hover:bg-[#35373c] p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-all text-left">
                    <div className="w-4 h-4 rounded-full border-[3px] border-[#80848e] shrink-0"></div>
                    <div>
                      <div className="text-white font-bold text-sm">Tàng hình</div>
                      <div className="text-[#949ba4] text-xs">Bạn sẽ hiển thị là ngoại tuyến.</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-[#313338] animate-in slide-in-from-bottom-8 duration-300 overflow-hidden">
      
      {/* Sidebar Left */}
      <div className="w-full md:w-[280px] bg-[#2b2d31] flex-shrink-0 border-b md:border-b-0 border-[#1f2023] z-10">
        <div className="w-full h-auto md:h-full overflow-x-auto md:overflow-y-auto md:overflow-x-hidden no-scrollbar px-2 py-3 md:px-8 md:py-16 flex flex-row md:flex-col gap-2 md:gap-0.5 items-center md:items-stretch">
          <div className="hidden md:block px-2 pb-1.5 pt-4 text-[11px] font-black text-[#949ba4] uppercase tracking-wider">
            Cài đặt người dùng
          </div>
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'account' ? 'bg-[#404249] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
          >
            Tài khoản của tôi
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'profile' ? 'bg-[#404249] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
          >
            Hồ sơ người dùng
          </button>

          <div className="hidden md:block my-2 mx-2 h-[1px] bg-[#3f4147] shrink-0" />

          <div className="hidden md:block px-2 pb-1.5 pt-4 text-[11px] font-black text-[#949ba4] uppercase tracking-wider">
            Cài đặt thanh toán
          </div>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'payment' ? 'bg-[#404249] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
          >
            Đăng ký & Thanh toán
          </button>

          <div className="hidden md:block my-2 mx-2 h-[1px] bg-[#3f4147] shrink-0" />

          <div className="hidden md:block px-2 pb-1.5 pt-4 text-[11px] font-black text-[#949ba4] uppercase tracking-wider">
            Cài đặt ứng dụng
          </div>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'activity' ? 'bg-[#404249] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
          >
            Trải nghiệm hoạt động
          </button>
          
          <div className="hidden md:block my-2 mx-2 h-[1px] bg-[#3f4147] shrink-0" />

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all md:mt-2 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Đổi tài khoản (Đăng xuất)</span>
            <span className="inline md:hidden">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content Area Right */}
      <div className="flex-1 h-full bg-[#313338] relative flex justify-center w-full">
        <div className="w-full max-w-[740px] px-4 md:px-12 py-8 md:py-16 overflow-y-auto overflow-x-hidden no-scrollbar h-full pb-24 md:pb-16">
          {renderContent()}
        </div>

        {/* Close Button Area */}
        <div className="absolute top-4 right-4 md:top-16 md:right-16 flex flex-col items-center z-50 bg-[#313338]/80 md:bg-transparent rounded-full p-1 backdrop-blur-sm">
          <div 
            onClick={onClose}
            className="group flex flex-col items-center cursor-pointer"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-[#b5bac1] group-hover:border-white flex items-center justify-center text-[#b5bac1] group-hover:text-white transition-all bg-transparent group-hover:bg-[#35373c]">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="hidden md:block text-[#b5bac1] group-hover:text-white text-xs font-bold mt-1.5 uppercase transition-colors">ESC</span>
          </div>
        </div>
        {/* Floating Action Bar */}
        {hasChanges && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-[300] pointer-events-none">
            <div className="bg-[#111214] rounded-lg px-5 py-3 flex items-center justify-between w-[90%] max-w-[660px] shadow-2xl border border-[#1f2023] animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto">
              <span className="text-white text-sm font-medium">Cẩn thận đấy — bạn có những thay đổi chưa lưu!</span>
              <div className="flex gap-3">
                <button onClick={() => setHasChanges(false)} className="text-white hover:underline text-sm font-medium">
                  Cài đặt lại
                </button>
                <button onClick={handleSaveProfile} className="bg-[#23a55a] hover:bg-[#1a7c43] text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-[#23a55a] text-white'
          }`}>
            <span className="font-medium text-sm">{notification.text}</span>
          </div>
        )}

        {/* Avatar Decoration Modal */}
        {isDecorationModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-[#1f2023]">
                <h2 className="text-[#f2f3f5] text-xl font-bold">Trang Trí Ảnh Đại Diện</h2>
                <button onClick={() => setIsDecorationModalOpen(false)} className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="flex flex-wrap gap-4">
                  {/* Default no frame */}
                  <div className="relative w-[100px] h-[100px] rounded-lg bg-[#2b2d31] border border-[#1f2023] flex flex-col items-center justify-center cursor-pointer hover:bg-[#35373c] transition-colors group" onClick={() => { setActiveFrame(null); setHasChanges(true); setIsDecorationModalOpen(false); }}>
                    <div className="w-12 h-12 rounded-full border border-dashed border-[#80848e] flex items-center justify-center mb-2">
                      <X className="w-5 h-5 text-[#80848e]" />
                    </div>
                    <span className="text-[#dbdee1] text-xs font-medium">Bỏ trang trí</span>
                  </div>
                  
                  {/* Dynamic Frames from Backend API */}
                  {availableFrames.map(frame => {
                    return (
                      <div key={frame._id} className="relative w-[100px] h-[100px] rounded-lg bg-[#2b2d31] border border-[#1f2023] flex items-center justify-center cursor-pointer hover:bg-[#35373c] transition-colors group" 
                        onClick={() => { 
                          setActiveFrame(frame);
                          setHasChanges(true); 
                          setIsDecorationModalOpen(false); 
                        }}>
                        <img src={frame.animatedUrl} className="w-[120px] h-[120px] absolute max-w-none pointer-events-none" alt={frame.name} />
                        {(frame.expiresAt || frame.isPremiumPerk) && (
                          <div className="absolute -bottom-2 px-2 py-0.5 bg-pink-500/90 text-white text-[9px] font-bold rounded-full shadow-lg whitespace-nowrap z-10 border border-pink-400">
                            {getRemainingTime(frame.expiresAt, frame.isPremiumPerk)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nameplate Modal */}
        {isNameplateModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-[#1f2023]">
                <h2 className="text-[#f2f3f5] text-xl font-bold">Thay Đổi Bảng Tên</h2>
                <button onClick={() => setIsNameplateModalOpen(false)} className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="flex flex-col gap-4">
                  {/* Default no nameplate */}
                  <div className="relative w-full h-[60px] rounded-lg bg-[#2b2d31] border border-[#1f2023] flex items-center px-4 cursor-pointer hover:bg-[#35373c] transition-colors group" onClick={() => { setActiveNameplate(null); setHasChanges(true); setIsNameplateModalOpen(false); }}>
                    <div className="w-8 h-8 rounded-full border border-dashed border-[#80848e] flex items-center justify-center mr-3">
                      <X className="w-4 h-4 text-[#80848e]" />
                    </div>
                    <span className="text-[#dbdee1] text-sm font-medium">Bỏ bảng tên</span>
                  </div>
                  
                  {/* Dynamic Nameplates from Backend */}
                  {availableNameplates.map(nameplate => {
                    return (
                      <div key={nameplate._id} className="relative w-full h-[60px] rounded-lg bg-[#2b2d31] border border-[#1f2023] flex items-center px-4 cursor-pointer hover:bg-[#35373c] transition-colors group overflow-hidden" 
                        onClick={() => { 
                          setActiveNameplate(nameplate);
                          setHasChanges(true); 
                          setIsNameplateModalOpen(false); 
                        }}>
                        <div className="absolute inset-0 z-0 pointer-events-none">
                          <div className="absolute inset-0 opacity-80 mix-blend-screen">
                            <img src={nameplate.animatedUrl} className="absolute inset-0 w-full h-full object-cover object-left opacity-70 hidden group-hover:block" alt={nameplate.name} />
                          </div>
                          <div 
                            className="absolute inset-0 z-10 mix-blend-overlay"
                            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220, 62, 151, 0.08) 20%, rgba(220, 62, 151, 0.08) 50%, rgba(220, 62, 151, 0.2) 100%)' }}
                          />
                        </div>
                        <img src={avatarPreview} className="w-8 h-8 rounded-full object-cover relative z-10 mr-3 shadow-md" alt="Avatar" />
                        <span className="text-[#f2f3f5] font-semibold text-[15px] relative z-10 drop-shadow-md flex-1">{displayName}</span>
                        {(nameplate.expiresAt || nameplate.isPremiumPerk) && (
                          <div className="relative z-10 px-2 py-0.5 bg-pink-500/90 text-white text-[9px] font-bold rounded-full shadow-lg whitespace-nowrap border border-pink-400 ml-auto">
                            {getRemainingTime(nameplate.expiresAt, nameplate.isPremiumPerk)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Effect Modal */}
        {isProfileEffectModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-[#1f2023]">
                <h2 className="text-[#f2f3f5] text-xl font-bold">Thay Đổi Hiệu Ứng Hồ Sơ</h2>
                <button onClick={() => setIsProfileEffectModalOpen(false)} className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="grid grid-cols-3 gap-4">
                  {/* Default no effect */}
                  <div className="relative w-full h-[150px] rounded-lg bg-[#2b2d31] border-2 border-transparent flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group" onClick={() => { setActiveProfileEffect(null); setHasChanges(true); setIsProfileEffectModalOpen(false); }}>
                    <div className="w-16 h-16 rounded-full border border-dashed border-[#80848e] flex items-center justify-center mb-2">
                      <X className="w-8 h-8 text-[#80848e]" />
                    </div>
                    <span className="text-[#dbdee1] text-sm font-medium">Bỏ hiệu ứng</span>
                  </div>
                  
                  {/* Dynamic Effects from Backend */}
                  {availableProfileEffects.map(effect => {
                    return (
                      <div key={effect._id} className="relative w-full h-[150px] rounded-lg bg-[#2b2d31] border-2 border-[#1f2023] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group overflow-hidden" 
                        onClick={() => { 
                          setActiveProfileEffect(effect);
                          setHasChanges(true); 
                          setIsProfileEffectModalOpen(false); 
                        }}>
                        <div className="absolute inset-0 z-10 pointer-events-none">
                          <img src={effect.animatedUrl || effect.staticUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={effect.name} />
                        </div>
                        
                        <div className="absolute inset-0 bg-black/40 z-20" />
                        <span className="text-[#f2f3f5] font-semibold text-[13px] relative z-30 drop-shadow-md px-2 text-center">{effect.name}</span>
                        {(effect.expiresAt || effect.isPremiumPerk) && (
                          <div className="relative z-30 px-2 py-0.5 mt-2 bg-pink-500/90 text-white text-[9px] font-bold rounded-full shadow-lg whitespace-nowrap border border-pink-400">
                            {getRemainingTime(effect.expiresAt, effect.isPremiumPerk)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {isEditAccountModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-[450px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 pb-2 text-center">
                <h2 className="text-[#f2f3f5] text-2xl font-bold mb-2">Thay Đổi Tài Khoản</h2>
                <p className="text-[#b5bac1] text-sm">Cập nhật Tên hiển thị và Tên người dùng của bạn</p>
              </div>
              
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className="block text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-2">
                    Tên hiển thị
                  </label>
                  <input 
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] rounded p-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nhập tên hiển thị mới"
                  />
                  <p className="text-[#949ba4] text-xs mt-1">Bạn có thể dùng ký tự đặc biệt, dấu cách và có thể trùng lặp.</p>
                </div>

                <div>
                  <label className="block text-[#b5bac1] text-xs font-bold uppercase tracking-wider mb-2">
                    Tên người dùng
                  </label>
                  <input 
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] rounded p-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nhập tên người dùng mới"
                  />
                  <div className="mt-2 bg-[#2b2d31] p-2 rounded flex items-start gap-2 border border-[#f0b232]/30">
                    <span className="text-[#f0b232] text-[18px] shrink-0 mt-[-2px]">⚠️</span>
                    <p className="text-[#949ba4] text-xs leading-relaxed">
                      Tên người dùng là duy nhất và <strong className="text-[#dbdee1]">chỉ được đổi 1 lần mỗi 30 ngày</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#2b2d31] flex justify-end gap-3 border-t border-[#1f2023]">
                <button 
                  onClick={() => setIsEditAccountModalOpen(false)}
                  className="px-5 py-2 rounded font-medium text-[#dbdee1] hover:underline"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveAccount}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Modals */}
      <CustomStatusModal 
        isOpen={isCustomStatusOpen} 
        onClose={() => setIsCustomStatusOpen(false)}
        currentStatus={user?.customStatus}
      />

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={imageToCrop}
        onClose={() => { setIsCropperOpen(false); setImageToCrop(null); }}
        onCropComplete={handleCropComplete}
        aspectRatio={cropType === 'banner' ? 17 / 6 : 1}
        cropShape={cropType === 'banner' ? 'rect' : 'round'}
        title={cropType === 'banner' ? "Điều Chỉnh Kích Thước Biểu Ngữ" : "Chỉnh Sửa Hình Ảnh"}
      />
    </div>
  );
}
