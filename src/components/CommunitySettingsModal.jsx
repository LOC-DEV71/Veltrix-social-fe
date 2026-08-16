import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Gem, Loader2, Image as ImageIcon, Sparkles, Hash, Crown, MoreVertical, MessageSquare, Link, Hammer, Ban, Clock, User, UserMinus, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import axiosClient from '../services/axiosClient';
import { useSelector } from 'react-redux';

const getMenuGroups = (communityName) => [
  {
    title: (communityName || '').toUpperCase(),
    items: [
      { id: 'profile', label: 'Hồ Sơ Máy Chủ' },
      { id: 'id', label: 'Số Nhận Diện Máy Chủ' },
      { id: 'interact', label: 'Tương Tác' },
      { id: 'boost', label: 'Đặc Quyền Nâng Cấp' },
    ]
  },
  {
    title: 'BIỂU CẢM',
    items: [
      { id: 'emoji', label: 'Emoji' },
      { id: 'animated_emoji', label: 'Emoji Động' },
      { id: 'sticker', label: 'Sticker' }
    ]
  },
  {
    title: 'MỌI NGƯỜI',
    items: [
      { id: 'members', label: 'Thành viên' },
      { id: 'invites', label: 'Lời mời' },
      { id: 'access', label: 'Truy cập' },
    ]
  },
  {
    title: 'ĐIỀU CHỈNH',
    items: [
      { id: 'safety', label: 'Thiết lập An toàn' },
      { id: 'logs', label: 'Nhật Ký Chỉnh Sửa' },
      { id: 'bans', label: 'Chặn' },
    ]
  }
];

const gradients = [
  'from-gray-700 to-gray-900',
  'from-pink-500 to-rose-500',
  'from-red-500 to-orange-500',
  'from-orange-400 to-yellow-500',
  'from-yellow-400 to-yellow-600',
  'from-purple-500 to-indigo-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-lime-400 to-green-500'
];

export default function CommunitySettingsModal({ isOpen, onClose, community, onUpdate }) {
  const currentUser = useSelector((state) => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(community?.name || '');
  const [icon, setIcon] = useState(community?.icon || '');
  const [iconFile, setIconFile] = useState(null);
  const [banner, setBanner] = useState(community?.banner || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [serverTag, setServerTag] = useState(community?.serverTag || '');
  const [serverBadge, setServerBadge] = useState(community?.serverBadge || '');
  const [badgeFile, setBadgeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('banner');
  const [onlineCount, setOnlineCount] = useState(1); // Default to 1 (current user)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [fullCommunity, setFullCommunity] = useState(community);
  const [selectedModMember, setSelectedModMember] = useState(null);
  const [kickTarget, setKickTarget] = useState(null); // stores member obj when confirming kick
  const [kickError, setKickError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [pendingUpload, setPendingUpload] = useState(null); // { file, type: 'emoji' | 'sticker', previewUrl }
  const [uploadName, setUploadName] = useState('');
  
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwner = String(fullCommunity?.owner?._id || fullCommunity?.owner) === String(currentUserId);
  const myRole = fullCommunity?.members?.find(m => {
    const uid = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
    const isSameId = String(uid) === String(currentUserId);
    const isSameUsername = typeof m.user === 'object' && m.user.username === currentUser?.username;
    return isSameId || isSameUsername;
  })?.role;
  
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const emojiInputRef = useRef(null);
  const stickerInputRef = useRef(null);

  const handleUploadEmoji = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn file dưới 5MB để tối ưu.');
      e.target.value = null;
      return;
    }
    if (activeTab === 'animated_emoji' && file.type !== 'image/gif') {
      alert('Vui lòng chọn file ảnh động (GIF) cho Emoji Động.');
      e.target.value = null;
      return;
    }
    if (activeTab === 'emoji' && file.type === 'image/gif') {
      alert('Vui lòng chọn file ảnh tĩnh cho Emoji thường. Hoặc qua mục Emoji Động để tải lên GIF.');
      e.target.value = null;
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    let defaultName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    if (defaultName.length < 2) defaultName = 'emoji_' + Math.floor(Math.random() * 100);
    
    setPendingUpload({ file, type: 'emoji', previewUrl });
    setUploadName(defaultName);
    e.target.value = null;
  }, []);

  const handleDeleteEmoji = useCallback(async (emojiId) => {
    if (!confirm('Bạn có chắc muốn xóa emoji này?')) return;
    try {
      setLoading(true);
      const res = await axiosClient.delete(`/api/communities/${community._id}/emojis/${emojiId}`);
      if (res.data.success) {
        setFullCommunity(prev => ({ ...prev, emojis: res.data.data }));
        onUpdate({ ...community, emojis: res.data.data });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa emoji');
    } finally {
      setLoading(false);
    }
  }, [community, onUpdate]);

  const handleUploadSticker = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn file dưới 5MB để tối ưu.');
      e.target.value = null;
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    let defaultName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    if (defaultName.length < 2) defaultName = 'sticker_' + Math.floor(Math.random() * 100);
    
    setPendingUpload({ file, type: 'sticker', previewUrl });
    setUploadName(defaultName);
    e.target.value = null;
  }, []);

  const confirmUpload = useCallback(async () => {
    if (!pendingUpload || uploadName.length < 2) return;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(pendingUpload.type, pendingUpload.file);
      formData.append('name', uploadName);

      const endpoint = pendingUpload.type === 'emoji' ? 'emojis' : 'stickers';
      const res = await axiosClient.post(`/api/communities/${community._id}/${endpoint}`, formData);
      if (res.data.success) {
        setFullCommunity(prev => ({ ...prev, [endpoint]: res.data.data }));
        onUpdate({ ...community, [endpoint]: res.data.data });
        URL.revokeObjectURL(pendingUpload.previewUrl);
        setPendingUpload(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || `Lỗi khi tải lên ${pendingUpload.type}`);
    } finally {
      setLoading(false);
    }
  }, [pendingUpload, uploadName, community, onUpdate]);

  const handleDeleteSticker = useCallback(async (stickerId) => {
    if (!confirm('Bạn có chắc muốn xóa nhãn dán này?')) return;
    try {
      setLoading(true);
      const res = await axiosClient.delete(`/api/communities/${community._id}/stickers/${stickerId}`);
      if (res.data.success) {
        setFullCommunity(prev => ({ ...prev, stickers: res.data.data }));
        onUpdate({ ...community, stickers: res.data.data });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa nhãn dán');
    } finally {
      setLoading(false);
    }
  }, [community, onUpdate]);


  useEffect(() => {
    if (isOpen && community) {
      setName(community.name || '');
      setIcon(community.icon || '');
      setBanner(community.banner || '');
      setServerTag(community.serverTag || '');
      setServerBadge(community.serverBadge || '');
      setIconFile(null);
      setBannerFile(null);
      setBadgeFile(null);
      setActiveTab('profile');
      setFullCommunity(community);

      // Fetch latest fully populated community data
      const fetchFullData = async () => {
        try {
          const res = await axiosClient.get(`/api/communities/${community._id}`);
          if (res.data.success) {
            setFullCommunity(res.data.data);
          }
        } catch (error) {
          console.error("Lỗi khi tải thông tin chi tiết cộng đồng:", error);
        }
      };
      fetchFullData();

      // Fetch online users to calculate online members
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true
      });

      socket.on('connect', () => {
        socket.emit('get_online_users', (userIdsArray) => {
          if (userIdsArray && community.members) {
            const onlineIds = new Set(userIdsArray);
            setOnlineUserIds(onlineIds);
            let count = 0;
            community.members.forEach(member => {
              // member.user could be an object or an ID string
              const uid = typeof member.user === 'object' ? member.user._id : member.user;
              if (onlineIds.has(uid)) count++;
            });
            // Ensure at least 1 (the current user) is counted if something goes wrong
            setOnlineCount(count > 0 ? count : 1);
          }
        });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, community]);

  useEffect(() => {
    if (isOpen) {
      if (myRole === 'admin') {
        setActiveTab('members');
      } else {
        setActiveTab('profile');
      }
    }
  }, [isOpen, myRole]);

  const targetCommunity = fullCommunity || community;
  const memberGroups = useMemo(() => {
    if (!targetCommunity?.members) return [];
    const owners = targetCommunity.members.filter(m => m.role === 'owner') || [];
    const admins = targetCommunity.members.filter(m => m.role === 'admin') || [];
    const regulars = targetCommunity.members.filter(m => m.role === 'member') || [];

    return [
      { label: 'CHỦ SỞ HỮU', members: owners },
      { label: 'QUẢN TRỊ VIÊN', members: admins },
      { label: 'THÀNH VIÊN', members: regulars }
    ].filter(g => g.members.length > 0);
  }, [targetCommunity]);


  const handleToggleAdmin = useCallback(async (memberId) => {
    try {
      setLoading(true);
      const res = await axiosClient.put(`/api/communities/${community._id}/member-role`, {
        memberId: memberId
      });
      if (res.data.success) {
        // Update local state
        const updatedMembers = fullCommunity.members.map(m => {
          const mId = typeof m.user === 'object' ? m.user._id : m.user;
          if (mId === memberId) {
            return { ...m, role: res.data.data.role };
          }
          return m;
        });
        setFullCommunity({ ...fullCommunity, members: updatedMembers });
        setSelectedModMember({ ...selectedModMember, role: res.data.data.role });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [community, fullCommunity, selectedModMember]);

  const confirmKickMember = useCallback(async (memberId) => {
    try {
      setLoading(true);
      setKickError('');
      const res = await axiosClient.delete(`/api/communities/${community._id}/members/${memberId}`);
      if (res.data && res.data.success) {
        // Remove from local state safely
        const updatedMembers = (fullCommunity?.members || []).filter(m => {
          if (!m || !m.user) return true; // keep others if malformed? actually, maybe return false to clean them up. Let's return false.
          const mId = (typeof m.user === 'object' && m.user !== null) ? (m.user._id || m.user.id) : m.user;
          return String(mId) !== String(memberId);
        });
        setFullCommunity(prev => ({ ...prev, members: updatedMembers }));
        setSelectedModMember(null); // Close the panel since member is gone
        setKickTarget(null); // Close modal
      }
    } catch (error) {
      console.error('Kick Error:', error);
      setKickError(error.response?.data?.message || 'Lỗi khi đuổi thành viên');
    } finally {
      setLoading(false);
    }
  }, [community, fullCommunity]);

  const handleDeleteCommunity = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.delete(`/api/communities/${community._id}`);
      if (res.data.success) {
        window.location.href = '/friends';
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xóa cộng đồng: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  }, [community]);

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      
      // Upload icon first if changed
      let finalIcon = icon;
      if (iconFile) {
        const formData = new FormData();
        formData.append('icon', iconFile);
        const iconRes = await axiosClient.post(`/api/communities/${community._id}/icon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (iconRes.data.success) {
          finalIcon = iconRes.data.data.icon;
        }
      }

      // Upload banner if changed
      let finalBanner = banner;
      if (bannerFile) {
        const formData = new FormData();
        formData.append('banner', bannerFile);
        const bannerRes = await axiosClient.post(`/api/communities/${community._id}/banner`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (bannerRes.data.success) {
          finalBanner = bannerRes.data.data.banner;
        }
      }

      // Upload badge if changed and it's a file
      let finalBadge = serverBadge;
      if (badgeFile) {
        const formData = new FormData();
        formData.append('badge', badgeFile);
        const badgeRes = await axiosClient.post(`/api/communities/${community._id}/badge`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (badgeRes.data.success) {
          finalBadge = badgeRes.data.data.serverBadge;
        }
      }

      const res = await axiosClient.put(`/api/communities/${community._id}`, { 
        name, 
        icon: finalIcon, 
        banner: finalBanner,
        serverTag,
        serverBadge: finalBadge
      });
      if (res.data.success) {
        onUpdate(res.data.data);
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setLoading(false);
    }
  }, [icon, iconFile, banner, bannerFile, serverBadge, badgeFile, name, serverTag, community, onUpdate]);

  const menuGroups = useMemo(() => getMenuGroups(community?.name), [community?.name]);

  // Restrict access for admins
  const visibleMenuGroups = menuGroups.filter(group => {
    if (isOwner) return true; // Owner sees everything
    if (myRole === 'admin') {
      // Admin only sees "MỌI NGƯỜI"
      return group.title === 'MỌI NGƯỜI';
    }
    // Fallback
    return false;
  });



  const handleBannerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/gif' && !community.isBoosted) {
        setUpgradeReason('icon');
        setShowUpgradeModal(true);
        // Clear input
        e.target.value = '';
        return;
      }
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/gif' && !community.isBoosted) {
        setUpgradeReason('banner');
        setShowUpgradeModal(true);
        e.target.value = '';
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !community) return null;

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <div className="flex flex-col-reverse md:flex-row gap-8">
          {/* Left Side: Form */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Hồ Sơ Máy Chủ</h2>
              <p className="text-sm text-[#b5bac1]">
                Tùy chỉnh cách máy chủ của bạn xuất hiện trong liên kết mời và, nếu được bật, trong Khám Phá Máy Chủ và tin nhắn Kênh Thông Báo
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                Tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded outline-none focus:ring-1 focus:ring-indigo-500 transition-all border border-[#1f2023]"
              />
            </div>

            <div className="border-b border-[#3f4147] pb-6">
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1">
                Biểu tượng
              </label>
              <p className="text-[13px] text-[#949ba4] mb-3">Chúng tôi khuyến nghị sử dụng hình ảnh có kích thước tối thiểu 512x512.</p>
              <button 
                onClick={() => iconInputRef.current?.click()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Thay Đổi Biểu Tượng Máy Chủ
              </button>
              <input 
                type="file" 
                ref={iconInputRef} 
                accept="image/*, image/gif" 
                className="hidden" 
                onChange={handleIconChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                Biểu Ngữ
              </label>
              <div className="grid grid-cols-5 gap-3">
                {gradients.map((grad, i) => (
                  <div key={i} onClick={() => setBanner('')} className={`h-16 rounded-md bg-gradient-to-br ${grad} cursor-pointer hover:ring-2 hover:ring-white transition-all`}></div>
                ))}
                {/* Image Upload Button */}
                <div 
                  onClick={handleBannerUploadClick}
                  className="h-16 rounded-md bg-[#2b2d31] border border-[#3f4147] flex items-center justify-center cursor-pointer hover:bg-[#35373c] hover:border-[#b5bac1] transition-all relative overflow-hidden group"
                >
                  <Plus className="w-6 h-6 text-[#80848e] group-hover:text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*, image/gif" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1">
                Đặc Điểm
              </label>
              <p className="text-[13px] text-[#949ba4]">Thêm tối đa 5 đặc điểm để thể hiện sở thích và tính cách của máy chủ.</p>
            </div>
            
          </div>

          {/* Right Side: Preview Card */}
          <div className="w-full md:w-[300px] shrink-0">
            <div className="bg-[#111214] rounded-lg overflow-hidden border border-[#1f2023]">
              <div className={`h-[120px] relative ${!banner ? 'bg-gradient-to-br from-gray-700 to-gray-900' : ''}`}>
                {banner && (
                  <img src={banner} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-2xl bg-[#313338] p-1.5">
                  <div className="w-full h-full rounded-xl bg-indigo-500 flex items-center justify-center overflow-hidden">
                    {icon ? (
                      <img src={icon} alt="icon" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">{name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-12 px-4 pb-4">
                <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
                <div className="flex items-center gap-3 text-xs text-[#949ba4] mb-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#23a55a]"></span>
                    <span>{onlineCount} Trực tuyến</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#80848e]"></span>
                    <span>{community.members?.length || 1} Thành viên</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#80848e]">Thành lập từ thg 5 2026</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'id') {
      const isLevel2Boosted = community.boost2;
      return (
        <div className="flex flex-col-reverse md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Số Nhận Diện Máy Chủ</h2>
              <p className="text-sm text-[#b5bac1]">
                Tạo một số nhận diện mà các thành viên máy chủ của bạn có thể để hiện bên cạnh tên của họ! Bất kỳ ai bên ngoài máy chủ đều có thể xem Hồ Sơ Máy Chủ thông qua Số nhận diện máy chủ, và nếu đơn đăng ký được bật, họ có thể đăng ký để tham gia máy chủ.
              </p>
            </div>

            <div className="bg-[#1e1f22] p-4 rounded border border-[#1f2023] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-blue-400 font-bold">i</span>
              </div>
              <div className="text-sm">
                <p className="text-white font-medium mb-1">Hồ Sơ Máy Chủ của bạn được đặt ở trạng thái riêng tư.</p>
                <p className="text-[#b5bac1]">Người dùng sẽ không thể xem được máy chủ từ Số Nhận Diện Máy Chủ. <span className="text-blue-400 cursor-pointer hover:underline">Chỉnh sửa Cài Đặt</span></p>
              </div>
            </div>

            {!isLevel2Boosted && (
              <button 
                onClick={() => {
                  setUpgradeReason('id');
                  setShowUpgradeModal(true);
                }}
                className="bg-white text-black font-bold px-6 py-2.5 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.4)] w-max"
              >
                <Gem className="w-5 h-5 text-black" />
                Mở khóa với Nâng Cấp Cấp 2
              </button>
            )}

            <div className={`space-y-6 ${!isLevel2Boosted ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Chọn Tên</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-[#1e1f22] p-2.5 rounded border border-[#1f2023] flex items-center gap-2 max-w-[200px]">
                    {serverBadge ? (
                       serverBadge.length > 2 ? (
                         <img src={serverBadge} alt="badge" className="w-5 h-5 object-cover rounded-sm" />
                       ) : (
                         <div className="text-lg leading-none">{serverBadge}</div>
                       )
                    ) : (
                       <div className="text-lg leading-none">🛡️</div>
                    )}
                    <input
                      type="text"
                      maxLength={4}
                      value={serverTag}
                      onChange={(e) => setServerTag(e.target.value.toUpperCase())}
                      placeholder="WUMP"
                      className="bg-transparent text-[#dbdee1] outline-none font-medium w-full placeholder-[#4e5058]"
                    />
                  </div>
                  <span className="text-xs text-[#949ba4] flex-1">Bạn có thể dùng tối đa 4 ký tự, chữ cái và chữ số.</span>
                </div>
              </div>

              <div className="bg-[#1e1f22] p-4 rounded border border-[#1f2023] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 font-bold">i</span>
                </div>
                <div className="text-sm">
                  <p className="text-[#b5bac1]">Việc cập nhật số nhận diện máy chủ của bạn sẽ yêu cầu tất cả thành viên phải tự áp dụng lại số nhận diện vào hồ sơ của họ. Chúng tôi làm vậy để ngăn chặn các hành vi lạm dụng. <span className="text-blue-400 cursor-pointer hover:underline">Tìm hiểu thêm</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Chọn huy hiệu</label>
                <p className="text-sm text-[#949ba4] mb-4">Chỉ thay đổi huy hiệu sẽ không xóa Tag Máy Chủ khỏi các thành viên.</p>
                <div className="flex flex-wrap gap-3 max-w-[260px]">
                  {/* Upload logic */}
                  <div 
                    onClick={() => {
                      if (isLevel2Boosted) document.getElementById('badgeUpload').click();
                    }}
                    className="w-10 h-10 rounded bg-[#1e1f22] border border-[#1f2023] flex items-center justify-center cursor-pointer hover:bg-[#35373c] transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#949ba4]" />
                  </div>
                  {['🌿', '🗡️', '💖', '🔥', '💧', '💀', '🌙', '⚡', '✨', '🍄'].map((emoji, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setServerBadge(emoji);
                        setBadgeFile(null);
                      }} 
                      className={`w-10 h-10 rounded bg-[#1e1f22] border ${serverBadge === emoji ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#1f2023] hover:bg-[#35373c]'} flex items-center justify-center cursor-pointer transition-colors text-lg`}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <input 
                  type="file" 
                  id="badgeUpload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setBadgeFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setServerBadge(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-[300px] shrink-0">
            {/* Right side preview */}
            <div className="bg-[#313338] rounded-lg p-4 border border-[#1f2023]">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e1f22]" />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-[#7289da]">Roka</span>
                    </div>
                    <p className="text-[#dbdee1] text-[15px]">có ai muốn chơi aram không</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e1f22]" />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-[#43b581]">hongo</span>
                    </div>
                    <p className="text-[#dbdee1] text-[15px]">tính cả mình nữa</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#faa61a] flex items-center justify-center shrink-0">
                    <span className="text-xs text-white font-bold">L</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-[#faa61a]">Lily</span>
                      {(serverTag || serverBadge) && (
                        <div className="flex items-center gap-1 bg-[#1e1f22] px-1.5 py-0.5 rounded text-xs text-[#b5bac1]">
                          {serverBadge && (
                            serverBadge.length > 2 ? (
                              <img src={serverBadge} alt="badge" className="w-3.5 h-3.5 object-cover rounded-sm" />
                            ) : (
                              <span>{serverBadge}</span>
                            )
                          )}
                          {serverTag && <span className="font-semibold text-[11px]">{serverTag}</span>}
                        </div>
                      )}
                    </div>
                    <p className="text-[#dbdee1] text-[15px]">xem số nhận diện của mình nè!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'boost') {
      const handleDirectBoost = async (level) => {
        try {
          const res = await axiosClient.post(`/api/communities/${community._id}/boost`, { level });
          if (res.data.success) {
            onUpdate(res.data.data);
            alert(`Nâng cấp thành công lên Cấp ${level}!`);
          }
        } catch (error) {
          console.error(error);
          alert('Lỗi khi nâng cấp máy chủ');
        }
      };

      return (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Đặc Quyền Nâng Cấp</h2>
            <p className="text-sm text-[#b5bac1]">Nâng cấp máy chủ của bạn để mở khóa các đặc quyền bổ sung và cá nhân hóa cộng đồng của bạn!</p>
          </div>

          <div className="space-y-6">
            {/* Cấp 1 */}
            <div className="bg-[#1e1f22] p-6 rounded-xl border border-[#1f2023] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Nâng Cấp Cấp 1</h3>
                  <p className="text-sm text-[#949ba4]">Cơ bản - Hồ sơ máy chủ</p>
                </div>
                {community.isBoosted ? (
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20">Đã mở khóa</span>
                ) : (
                  <button 
                    onClick={() => handleDirectBoost(1)}
                    className="bg-white text-black font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Gem className="w-4 h-4" /> Mở khóa với Nâng Cấp Cấp 1
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#3f4147]">
                  <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center mb-3">
                    <ImageIcon className="w-5 h-5 text-pink-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Ảnh Biểu Ngữ Tùy Chỉnh</h4>
                  <p className="text-xs text-[#949ba4]">Hiển thị ảnh nền đặc trưng trên đầu danh sách kênh.</p>
                </div>
                <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#3f4147]">
                  <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Biểu Tượng Động</h4>
                  <p className="text-xs text-[#949ba4]">Thay thế icon máy chủ bằng ảnh động GIF rực rỡ.</p>
                </div>
              </div>
            </div>

            {/* Cấp 2 */}
            <div className="bg-[#1e1f22] p-6 rounded-xl border border-[#1f2023] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Nâng Cấp Cấp 2</h3>
                  <p className="text-sm text-[#949ba4]">Nâng cao - Nhận diện</p>
                </div>
                {community.boost2 ? (
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20">Đã mở khóa</span>
                ) : (
                  <button 
                    onClick={() => handleDirectBoost(2)}
                    className="bg-white text-black font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-200 transition-colors text-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  >
                    <Gem className="w-4 h-4" /> Mở khóa với Nâng Cấp Cấp 2
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#3f4147]">
                  <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center mb-3">
                    <Hash className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Số Nhận Diện Máy Chủ</h4>
                  <p className="text-xs text-[#949ba4]">Thêm Tag máy chủ (vd: WUMP) kế bên tên tất cả thành viên trong chat.</p>
                </div>
                <div className="bg-[#2b2d31] p-4 rounded-lg border border-[#3f4147]">
                  <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center mb-3">
                    <Crown className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Huy Hiệu Tùy Chỉnh</h4>
                  <p className="text-xs text-[#949ba4]">Kèm theo 1 icon hoặc emoji riêng biệt đính kèm trên Tag.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      );
    }

    if (activeTab === 'members') {
      return (
        <div className="h-full relative overflow-hidden flex flex-col">
          <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Thành viên Máy Chủ</h2>
              <p className="text-sm text-[#b5bac1]">Quản lý tất cả thành viên trong cộng đồng của bạn.</p>
            </div>

            <div className="bg-[#1e1f22] rounded-md border border-[#1f2023] overflow-hidden p-2">
              <div className="pr-2">
                {memberGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-6 last:mb-2">
                    <div className="px-2 py-1 mb-1">
                      <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">{group.label} — {group.members.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {group.members.map((member) => {
                        const user = member.user || {};
                        const uid = user._id || user;
                        const isOnline = onlineUserIds.has(uid);
                        const isMe = currentUser && uid === currentUser._id;
                        
                        const bannerStatic = user.activeNameplateStaticUrl || user.activeNameplateAnimatedUrl || '';
                        const bannerAnimated = user.activeNameplateAnimatedUrl || bannerStatic;

                        const frameStatic = user.activeFrameStaticUrl || user.activeFrameAnimatedUrl || '';
                        const frameAnimated = user.activeFrameAnimatedUrl || frameStatic;
                        
                        const hasAnimatedBanner = bannerAnimated && bannerAnimated !== bannerStatic;
                        const hasAnimatedFrame = frameAnimated && frameAnimated !== frameStatic;
                        
                        return (
                          <div 
                            key={uid} 
                            onClick={() => setSelectedModMember(member)}
                            className="relative h-[68px] rounded-xl flex items-center hover:bg-[#2b2d31]/80 transition-colors group overflow-hidden cursor-pointer mb-2 bg-[#2b2d31]/30 border border-white/5"
                          >
                          
                          {/* Banner Background */}
                          {bannerStatic && (
                            <>
                              <div 
                                className={`absolute inset-0 pointer-events-none opacity-80 mix-blend-screen transition-opacity ${hasAnimatedBanner ? 'group-hover:hidden' : 'group-hover:opacity-100'}`}
                                style={{ 
                                  backgroundImage: `url(${bannerStatic})`, 
                                  backgroundSize: 'cover', 
                                  backgroundPosition: 'center', 
                                  maskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 30%)',
                                  WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 30%)'
                                }}
                              ></div>
                              {hasAnimatedBanner && (
                                <div 
                                  className="absolute inset-0 pointer-events-none opacity-100 mix-blend-screen transition-opacity hidden group-hover:block"
                                  style={{ 
                                    backgroundImage: `url(${bannerAnimated})`, 
                                    backgroundSize: 'cover', 
                                    backgroundPosition: 'center', 
                                    maskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 30%)',
                                    WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 30%)'
                                  }}
                                ></div>
                              )}
                            </>
                          )}

                          <div className="relative flex items-center gap-3 px-3 z-10 w-full h-full">
                            {/* Avatar & Frame */}
                            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                              <img 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || 'U'}&background=2b2d31&color=fff`} 
                                alt="avatar" 
                                className="w-[42px] h-[42px] rounded-full object-cover bg-[#2b2d31] border border-black/20"
                              />
                              {frameStatic && (
                                <div className="absolute -inset-[2px] pointer-events-none z-10 scale-[1.15]">
                                  <img src={frameStatic} className={`w-full h-full object-contain drop-shadow-lg ${hasAnimatedFrame ? 'group-hover:hidden' : ''}`} />
                                  {hasAnimatedFrame && (
                                    <img src={frameAnimated} className="w-full h-full object-contain drop-shadow-lg hidden group-hover:block" />
                                  )}
                                </div>
                              )}
                              <div className={`absolute bottom-0.5 right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] border-[#2b2d31] z-20 ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`}></div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-2">
                                <span className={`text-[17px] font-bold tracking-wide ${member.role === 'owner' ? 'text-amber-500' : 'text-white drop-shadow-md'}`}>
                                  {user.displayName || user.username || 'Người dùng ẩn danh'}
                                </span>
                                {isMe && <span className="text-[13px] text-white/50 font-medium">(Bạn)</span>}
                                {member.role === 'owner' && <Crown className="w-4 h-4 text-amber-500 shrink-0 drop-shadow-md" />}
                              </div>
                            </div>
                            
                            {/* Action Menu Trigger */}
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-2">
                              <MoreVertical className="w-5 h-5 text-[#b5bac1] hover:text-white" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

    if (activeTab === 'emoji' || activeTab === 'animated_emoji') {
      const isAnimated = activeTab === 'animated_emoji';
      const filteredEmojis = (fullCommunity?.emojis || []).filter(e => {
        const isGif = e.url.toLowerCase().endsWith('.gif');
        return isAnimated ? isGif : !isGif;
      });

      return (
        <div className="space-y-6 animate-fade-in text-[#dbdee1]">
          <h2 className="text-xl font-bold text-white mb-6">{isAnimated ? 'Emoji Động Máy Chủ' : 'Emoji Máy Chủ'}</h2>
          <div className="flex flex-col items-center justify-center p-10 bg-[#2b2d31] rounded-lg border border-[#1f2023] text-center shadow-lg">
            <div className="w-20 h-20 bg-[#1e1f22] rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-[#5865F2]">
              <Sparkles className="w-10 h-10 text-[#5865F2]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{isAnimated ? 'Thêm Emoji Động' : 'Thêm Emoji Tùy Chỉnh'}</h3>
            <p className="text-[#b5bac1] max-w-md mb-8 text-sm">
              Bạn có thể tải lên {isAnimated ? 'emoji động' : 'emoji tĩnh'} cho máy chủ của mình (yêu cầu máy chủ đạt <strong className="text-pink-400">Đặc Quyền Cấp 2</strong>). Các thành viên có Vetrix Premium sẽ có thể sử dụng chúng.
            </p>
            <button 
              className={`${community?.boost2 ? 'bg-[#5865F2] hover:bg-[#4752c4]' : 'bg-[#f47f1a] cursor-not-allowed opacity-50'} text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2`}
              onClick={() => {
                if (community?.boost2) {
                  emojiInputRef.current?.click();
                }
              }}
              disabled={loading || !community?.boost2}
            >
              {!community?.boost2 && <Gem className="w-4 h-4" />}
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (community?.boost2 ? 'Tải Lên Emoji' : 'Yêu Cầu Cấp 2')}
            </button>
            <input 
              type="file" 
              ref={emojiInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadEmoji} 
            />
          </div>

          {/* Render Emoji List */}
          {filteredEmojis.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-[#b5bac1] uppercase mb-4">{isAnimated ? 'Emoji Động' : 'Emoji'} đã tải lên ({filteredEmojis.length})</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {filteredEmojis.map((emoji) => (
                  <div key={emoji._id} className="relative group bg-[#2b2d31] border border-[#1f2023] rounded p-2 flex flex-col items-center gap-2">
                    <img src={emoji.url} alt={emoji.name} className="w-10 h-10 object-contain" />
                    <span className="text-xs text-[#949ba4] truncate w-full text-center" title={emoji.name}>{emoji.name}</span>
                    {(myRole === 'owner' || myRole === 'admin') && (
                      <button 
                        onClick={() => handleDeleteEmoji(emoji._id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa Emoji"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'sticker') {
      return (
        <div className="space-y-6 animate-fade-in text-[#dbdee1]">
          <h2 className="text-xl font-bold text-white mb-6">Nhãn Dán Máy Chủ</h2>
          <div className="flex flex-col items-center justify-center p-10 bg-[#2b2d31] rounded-lg border border-[#1f2023] text-center shadow-lg">
            <div className="w-20 h-20 bg-[#1e1f22] rounded-lg flex items-center justify-center mb-6 border-2 border-dashed border-[#5865F2]">
              <ImageIcon className="w-10 h-10 text-[#5865F2]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Thêm Nhãn Dán Tùy Chỉnh</h3>
            <p className="text-[#b5bac1] max-w-md mb-8 text-sm">
              Bạn có thể tải lên tối đa 15 nhãn dán tùy chỉnh cho máy chủ của mình (yêu cầu máy chủ đạt <strong className="text-pink-400">Đặc Quyền Cấp 2</strong>). Các thành viên có Vetrix Premium sẽ có thể sử dụng chúng ở mọi nơi.
            </p>
            <button 
              className={`${community?.boost2 ? 'bg-[#5865F2] hover:bg-[#4752c4]' : 'bg-[#f47f1a] cursor-not-allowed opacity-50'} text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2`}
              onClick={() => {
                if (community?.boost2) {
                  stickerInputRef.current?.click();
                }
              }}
              disabled={loading || !community?.boost2}
            >
              {!community?.boost2 && <Gem className="w-4 h-4" />}
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (community?.boost2 ? 'Tải Lên Nhãn Dán' : 'Yêu Cầu Cấp 2')}
            </button>
            <input 
              type="file" 
              ref={stickerInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadSticker} 
            />
          </div>

          {/* Render Sticker List */}
          {fullCommunity?.stickers?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-[#b5bac1] uppercase mb-4">Nhãn dán đã tải lên ({fullCommunity.stickers.length}/15)</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {fullCommunity.stickers.map((sticker) => (
                  <div key={sticker._id} className="relative group bg-[#2b2d31] border border-[#1f2023] rounded p-2 flex flex-col items-center gap-2">
                    <img src={sticker.url} alt={sticker.name} className="w-16 h-16 object-contain" />
                    <span className="text-xs text-[#949ba4] truncate w-full text-center" title={sticker.name}>{sticker.name}</span>
                    {(myRole === 'owner' || myRole === 'admin') && (
                      <button 
                        onClick={() => handleDeleteSticker(sticker._id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa Nhãn Dán"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-[#949ba4] py-20">
        <Hammer className="w-16 h-16 mb-4 opacity-50" />
        <p className="font-semibold text-lg">Tính năng đang được phát triển...</p>
        <p className="text-sm mt-2 opacity-70">Sẽ sớm ra mắt trong các bản cập nhật tiếp theo.</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#313338] flex flex-col md:flex-row animate-fade-in overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[280px] bg-[#2b2d31] flex justify-start md:justify-end shrink-0 border-b md:border-b-0 border-[#1f2023] z-10">
        <div className="w-full md:w-[240px] px-2 py-3 md:py-14 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden no-scrollbar items-center md:items-stretch gap-2 md:gap-0">
          {visibleMenuGroups.map((group, i) => (
            <div key={i} className="flex flex-row md:flex-col md:mb-4 gap-2 md:gap-0 shrink-0">
              <h3 className="hidden md:block text-[11px] font-bold text-[#949ba4] uppercase mb-1 px-2 truncate">
                {group.title}
              </h3>
              {group.items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 md:px-2 md:py-1.5 rounded text-[14px] md:text-[15px] cursor-pointer transition-colors md:mb-0.5 whitespace-nowrap shrink-0 ${
                    activeTab === item.id 
                      ? 'bg-[#404249] text-white font-medium' 
                      : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  {item.label}
                </div>
              ))}
              {i < visibleMenuGroups.length - 1 && <div className="hidden md:block h-[1px] bg-[#1f2023] my-2 mx-2 shrink-0" />}
            </div>
          ))}
          {isOwner && (
            <>
              <div className="hidden md:block h-[1px] bg-[#1f2023] my-2 mx-2 shrink-0" />
              <div 
                className="px-3 py-2 md:px-2 md:py-1.5 rounded text-[14px] md:text-[15px] cursor-pointer transition-colors text-red-400 hover:text-white hover:bg-red-500 md:mt-2 flex items-center gap-2 md:justify-between group whitespace-nowrap shrink-0"
                onClick={() => {
                  setDeleteConfirmText('');
                  setShowDeleteModal(true);
                }}
              >
                <span>Xóa Máy Chủ</span>
                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-white" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#313338] relative flex flex-col w-full h-full">
        {/* ESC Button */}
        <div className="absolute top-4 right-4 md:top-10 md:right-10 flex flex-col items-center gap-1 cursor-pointer group z-50 bg-[#313338]/80 md:bg-transparent rounded-full p-1 backdrop-blur-sm" onClick={onClose}>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-[#b5bac1] group-hover:border-white flex items-center justify-center transition-colors text-[#b5bac1] group-hover:text-white">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="hidden md:block text-xs font-bold text-[#b5bac1] group-hover:text-white">ESC</span>
        </div>

        <div className="max-w-[740px] w-full pt-8 md:pt-14 px-4 md:px-10 overflow-y-auto no-scrollbar pb-24 md:pb-20">
          {renderContent()}
        </div>

        {/* Sticky Unsaved Changes Banner */}
        {(name !== community.name || icon !== (community.icon || '') || banner !== (community.banner || '') || serverTag !== (community.serverTag || '') || serverBadge !== (community.serverBadge || '')) && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-start px-10 pointer-events-none">
            <div className="w-full max-w-[740px] bg-[#111214] p-3 rounded-lg flex items-center justify-between border border-[#1f2023] animate-fade-in shadow-2xl z-50 pointer-events-auto">
              <span className="text-[15px] font-medium text-white px-2">Bạn có thay đổi chưa lưu!</span>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => {
                    setName(community.name);
                    setIcon(community.icon || '');
                    setIconFile(null);
                    setBanner(community.banner || '');
                    setBannerFile(null);
                    setServerTag(community.serverTag || '');
                    setServerBadge(community.serverBadge || '');
                    setBadgeFile(null);
                  }} 
                  className="text-sm text-white hover:underline px-4 py-1.5 font-medium"
                >
                  Đặt lại
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className={`bg-[#23a55a] hover:bg-[#1a7f44] text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invisible Overlay to close Mod View Panel when clicking outside */}
      {selectedModMember && (
        <div 
          className="fixed inset-0 z-[240] cursor-default"
          onClick={() => setSelectedModMember(null)}
        />
      )}

      {/* Mod View Panel Overlay (Root Level) */}
      <div 
        className={`fixed top-0 right-0 h-full w-[350px] bg-[#2b2d31] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-[250] transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${selectedModMember ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedModMember && (() => {
          const u = selectedModMember.user || {};
          const isModOnline = onlineUserIds.has(u._id || u);
          return (
            <div className="flex flex-col h-full relative">
              {/* Panel Header */}
              <div className="p-4 bg-[#111214] border-b border-[#1f2023] relative">
                <button onClick={() => setSelectedModMember(null)} className="absolute top-4 right-4 text-[#949ba4] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="relative">
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username || 'U'}&background=2b2d31&color=fff`} className="w-10 h-10 rounded-full border border-black/50" />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#111214] ${isModOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`}></div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{u.displayName || u.username}</div>
                    <div className="text-[11px] text-[#949ba4]">{u.username}</div>
                  </div>
                </div>
                
                {/* Action Icons row */}
                <div className="flex gap-1 justify-between bg-[#1e1f22] rounded-md p-1 mt-2 border border-[#313338]">
                  <button className="flex-1 p-1.5 flex justify-center text-[#949ba4] hover:text-white hover:bg-[#2b2d31] rounded transition-colors"><MessageSquare className="w-4 h-4"/></button>
                  <button className="flex-1 p-1.5 flex justify-center text-[#949ba4] hover:text-white hover:bg-[#2b2d31] rounded transition-colors"><User className="w-4 h-4"/></button>
                  {selectedModMember.role !== 'owner' && String(u._id || u) !== String(currentUserId) && (
                    <button 
                      onClick={() => handleToggleAdmin(u._id || u)}
                      className={`flex-1 p-1.5 flex justify-center hover:bg-[#2b2d31] rounded transition-colors ${selectedModMember.role === 'admin' ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10' : 'text-[#949ba4] hover:text-white'}`}
                      title={selectedModMember.role === 'admin' ? "Gỡ quyền Quản trị viên" : "Cấp quyền Quản trị viên"}
                    >
                      <Hammer className="w-4 h-4"/>
                    </button>
                  )}
                  {['owner', 'admin'].includes(myRole) && selectedModMember.role !== 'owner' && !(myRole === 'admin' && selectedModMember.role === 'admin') && String(u._id || u) !== String(currentUserId) && (
                    <button 
                      onClick={() => setKickTarget(u)}
                      className="flex-1 p-1.5 flex justify-center text-[#949ba4] hover:text-rose-500 hover:bg-[#2b2d31] rounded transition-colors"
                      title="Đuổi khỏi máy chủ"
                    >
                      <Ban className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-2 bg-[#232428] flex justify-between items-center text-[10px] font-bold text-[#949ba4] uppercase tracking-wider border-b border-[#1f2023]">
                <div className="flex items-center gap-2"><User className="w-3.5 h-3.5"/> Chế Độ Hiển Thị Mod</div>
                <div className="bg-[#1e1f22] px-1.5 py-0.5 rounded border border-[#313338] shadow-sm cursor-pointer" onClick={() => setSelectedModMember(null)}>ESC</div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-[#2b2d31]">
                {/* Hoạt động máy chủ */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Hoạt động máy chủ</h3>
                  <div className="space-y-1 bg-[#1e1f22] rounded-lg p-3 border border-[#313338]">
                    <div className="flex justify-between items-center text-[13px] py-1 text-[#dbdee1]">
                      <div className="flex items-center gap-2.5"><MessageSquare className="w-[18px] h-[18px] text-[#949ba4]"/> Các tin nhắn</div>
                      <span className="font-medium text-[#949ba4]">0</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] py-1 text-[#dbdee1]">
                      <div className="flex items-center gap-2.5"><Link className="w-[18px] h-[18px] text-[#949ba4]"/> Liên kết</div>
                      <span className="font-medium text-[#949ba4]">0</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] py-1 text-[#dbdee1]">
                      <div className="flex items-center gap-2.5"><ImageIcon className="w-[18px] h-[18px] text-[#949ba4]"/> Đa phương tiện</div>
                      <span className="font-medium text-[#949ba4]">0</span>
                    </div>
                  </div>
                </div>

                {/* Quyền hạn */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2 flex justify-between">
                    <span>Quyền hạn điều phối viên</span> 
                    <span className="hover:text-white cursor-pointer transition-colors text-[#949ba4]">Tất cả (53) &gt;</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-[#1e1f22] border border-[#313338] px-2.5 py-1 rounded-sm flex items-center gap-1.5 text-xs text-indigo-400 font-medium"><ShieldCheck className="w-3.5 h-3.5"/> Quản lý Kênh</div>
                    <div className="bg-[#1e1f22] border border-[#313338] px-2.5 py-1 rounded-sm flex items-center gap-1.5 text-xs text-indigo-400 font-medium"><ShieldCheck className="w-3.5 h-3.5"/> Quản lý Vai trò</div>
                    <div className="bg-[#1e1f22] border border-[#313338] px-2.5 py-1 rounded-sm text-xs text-[#b5bac1] font-medium">Tạo Biểu cảm</div>
                  </div>
                </div>

                {/* Tài khoản */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Tài khoản</h3>
                  <div className="space-y-1 bg-[#1e1f22] rounded-lg p-3 border border-[#313338]">
                    <div className="flex justify-between items-center text-[13px] py-1.5 text-[#dbdee1]">
                      <div className="flex items-center gap-2"><ShieldCheck className="w-[18px] h-[18px] text-[#23a55a]"/> Mức xác minh đã vượt qua</div>
                      <span className="text-[#23a55a] font-bold">✓</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] py-1.5 text-[#dbdee1]">
                      <div className="flex items-center gap-2"><span className="text-[#949ba4] font-bold ml-1 mr-1 text-[16px]">#</span> Ngày tham gia Discord</div>
                      <span className="text-[#b5bac1] font-medium text-[12px]">{new Date(u.createdAt || selectedModMember.joinedAt).toLocaleDateString('vi-VN', {day:'numeric', month:'short', year:'numeric'})}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] py-1.5 text-[#dbdee1]">
                      <div className="flex items-center gap-2"><Clock className="w-[18px] h-[18px] text-[#949ba4]"/> Ngày tham gia máy chủ</div>
                      <span className="text-[#b5bac1] font-medium text-[12px]">{new Date(selectedModMember.joinedAt).toLocaleDateString('vi-VN', {day:'numeric', month:'short', year:'numeric'})}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center animate-fade-in" onClick={() => setShowUpgradeModal(false)}>
          <div 
            className="bg-[#313338] rounded-xl w-full max-w-[440px] shadow-2xl flex flex-col p-6 items-center text-center border border-[#1f2023]/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center mb-4">
              <Gem className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {upgradeReason === 'icon' ? 'Mở Khóa Biểu Tượng Động' : 
               upgradeReason === 'id' ? 'Mở Khóa Số Nhận Diện (Cấp 2)' : 'Mở Khóa Biểu Ngữ'}
            </h2>
            <p className="text-[#b5bac1] text-sm mb-6">
              Bạn chưa nâng cấp máy chủ này đủ cấp độ yêu cầu. Nâng cấp máy chủ bằng Boost để mở khóa khả năng thêm {
               upgradeReason === 'icon' ? 'Biểu Tượng Động (GIF)' : 
               upgradeReason === 'id' ? 'Số Nhận Diện Máy Chủ (yêu cầu Nâng cấp Cấp 2)' : 'Ảnh Biểu Ngữ Tùy Chỉnh'
              } và nhiều tính năng xịn xò khác!
            </p>
            <button className="bg-white text-black font-bold px-6 py-3 rounded-md w-full flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <Gem className="w-5 h-5 text-black" />
              Mở khóa với Nâng Cấp
            </button>
            <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-[#949ba4] text-sm hover:underline">
              Hủy
            </button>
          </div>
        </div>
      )}
      {/* Kick Confirmation Modal */}
      {kickTarget && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#313338] rounded-md w-full max-w-[440px] shadow-2xl scale-100 transition-transform">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#f2f3f5] mb-4">Đuổi khỏi máy chủ</h2>
              <p className="text-[#dbdee1] text-[15px]">
                Bạn có chắc chắn muốn đuổi <strong className="text-white">{kickTarget.displayName || kickTarget.username}</strong> khỏi máy chủ? Người này sẽ có thể tham gia lại nếu nhận được lời mời mới.
              </p>
              {kickError && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/50 rounded text-rose-400 text-sm">
                  {kickError}
                </div>
              )}
            </div>
            <div className="bg-[#2b2d31] p-4 rounded-b-md flex justify-end gap-3 mt-2">
              <button 
                onClick={() => { setKickTarget(null); setKickError(''); }}
                className="px-4 py-2 text-sm font-medium text-[#dbdee1] hover:underline"
              >
                Hủy
              </button>
              <button 
                onClick={() => confirmKickMember(kickTarget._id || kickTarget.id)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded transition-colors flex items-center justify-center min-w-[80px]"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đuổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Community Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[400] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#313338] rounded-md w-full max-w-[440px] shadow-2xl scale-100 transition-transform">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#f2f3f5] mb-4">Xóa máy chủ '{community.name}'</h2>
              <div className="text-[#f23f42] mb-4 text-sm font-medium">
                Bạn có chắc chắn muốn xóa máy chủ này không? Hành động này không thể hoàn tác.
              </div>
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                  Nhập tên máy chủ để xác nhận
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded outline-none focus:ring-1 focus:ring-rose-500 transition-all border border-[#1f2023]"
                />
              </div>
            </div>
            <div className="bg-[#2b2d31] p-4 rounded-b-md flex justify-end gap-3 mt-2">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 text-sm font-medium text-[#dbdee1] hover:underline"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteCommunity}
                className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors flex items-center justify-center min-w-[100px] ${
                  deleteConfirmText === community.name && !loading
                    ? 'bg-[#f23f42] hover:bg-[#da373c]'
                    : 'bg-[#f23f42]/50 cursor-not-allowed opacity-50'
                }`}
                disabled={loading || deleteConfirmText !== community.name}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa Máy Chủ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {pendingUpload && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-[#313338] rounded-xl w-full max-w-md shadow-2xl relative border border-[#1f2023] overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Tải Lên {pendingUpload.type === 'emoji' ? 'Emoji' : 'Nhãn Dán'}
              </h3>
              
              <div className="flex flex-col items-center justify-center mb-6 bg-[#2b2d31] rounded-lg p-6 border border-[#1f2023]/50">
                <img 
                  src={pendingUpload.previewUrl} 
                  alt="Preview" 
                  className={pendingUpload.type === 'emoji' ? "w-12 h-12 object-contain" : "w-32 h-32 object-contain"}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                    Tên {pendingUpload.type === 'emoji' ? 'Emoji' : 'Nhãn Dán'}
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value.replace(/\s+/g, '_'))}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] px-3 py-2.5 rounded outline-none focus:ring-1 focus:ring-[#00a8fc] border border-[#1f2023]"
                    placeholder="Nhập tên (không dấu cách)..."
                    maxLength={32}
                  />
                  <p className="text-[#949ba4] text-xs mt-2">Tên phải chứa ít nhất 2 ký tự, không chứa khoảng trắng.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#2b2d31] p-4 flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  URL.revokeObjectURL(pendingUpload.previewUrl);
                  setPendingUpload(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#dbdee1] hover:underline"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={confirmUpload}
                disabled={loading || uploadName.length < 2}
                className={`px-6 py-2 text-white text-sm font-medium rounded transition-colors flex items-center justify-center min-w-[100px] ${
                  uploadName.length >= 2 && !loading
                    ? 'bg-[#5865F2] hover:bg-[#4752c4]'
                    : 'bg-[#5865F2]/50 cursor-not-allowed opacity-50'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tải Lên'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
