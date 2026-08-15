import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout as reduxLogout } from '../redux/slices/authSlice';
import axiosClient from '../services/axiosClient';
import { API_BASE_URL } from '../utils/config';
import { 
  Hash, 
  Volume2, 
  Plus, 
  Compass, 
  Mic, 
  MicOff, 
  Headphones, 
  Settings, 
  Search, 
  Bell, 
  Users, 
  Crown, 
  Sparkles, 
  ShoppingBag,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Coins,
  Shield,
  LogOut,
  UserPlus,
  X,
  Calendar,
  Gem,
  Settings as SettingsIcon,
  Check
} from 'lucide-react';
import { io } from 'socket.io-client';
import UserProfileModal from '../components/UserProfileModal';
import UserSettingsModal from '../components/UserSettingsModal';
import MemberProfilePopout from '../components/MemberProfilePopout';
import FullProfileModal from '../components/FullProfileModal';
import CreateCommunityModal from '../components/CreateCommunityModal';
import InviteModal from '../components/InviteModal';
import CreateChannelModal from '../components/CreateChannelModal';
import NotificationInbox from '../components/NotificationInbox';
import CommunitySettingsModal from '../components/CommunitySettingsModal';
import ChannelSettingsModal from '../components/ChannelSettingsModal';
import CustomStatusModal from '../components/CustomStatusModal';
import { checkPermission } from '../utils/permissionUtils';
import logoVeltrix from '../assets/logo-veltrix.png';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user) || {};
  const [micMuted, setMicMuted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('account');
  const [activeTab, setActiveTab] = useState('online');
  const [showNotification, setShowNotification] = useState(null);
  const [isCustomStatusOpen, setIsCustomStatusOpen] = useState(false);
  
  // Selected User Profile Popout State
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [fullProfileUser, setFullProfileUser] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [profileModalPos, setProfileModalPos] = useState({ bottom: '64px', left: '80px' });
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  
  const [unreadMentions, setUnreadMentions] = useState({ community: {}, channel: {} });
  const [unreadMessages, setUnreadMessages] = useState({ community: {}, channel: {} });
  
  // Real communities fetched from backend
  const [myCommunities, setMyCommunities] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  
  // Selected community & its channels
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityChannels, setCommunityChannels] = useState([]);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCommunitySettings, setShowCommunitySettings] = useState(false);
  const [settingChannel, setSettingChannel] = useState(null); // The channel currently being edited
  const [contextMenu, setContextMenu] = useState(null);
  const [voiceChannelUsers, setVoiceChannelUsers] = useState({}); // channelId -> [users]

  useEffect(() => {
    // Nếu người dùng điều hướng ra khỏi cộng đồng (ví dụ: sang /shop hoặc /friends), xóa state cộng đồng hiện tại
    if (!location.pathname.startsWith('/community/')) {
      setSelectedCommunity(null);
      setCommunityChannels([]);
      setCommunityMembers([]);
      setSelectedChannel(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user?._id) {
      axiosClient.get('/api/communities')
        .then(res => {
          const data = res.data?.data || res.data || [];
          setMyCommunities(Array.isArray(data) ? data : []);
          
          // Wait for socket to be available, or join later if it connects
        })
        .catch(err => console.error('Lỗi lấy communities:', err));

      axiosClient.get('/api/notifications')
        .then(res => {
          const notifs = res.data?.data || [];
          const mentions = { community: {}, channel: {} };
          const msgs = { community: {}, channel: {} };
          notifs.forEach(n => {
            if (!n.isRead && n.community) {
              const commId = typeof n.community === 'object' ? n.community._id : n.community;
              let chId = null;
              if (n.link && n.link.includes('/channel/')) {
                const parts = n.link.split('/');
                chId = parts[parts.length - 1];
              }
              
              if (n.type === 'mention') {
                mentions.community[commId] = (mentions.community[commId] || 0) + 1;
                if (chId) mentions.channel[chId] = (mentions.channel[chId] || 0) + 1;
              } else if (n.type === 'channel_message') {
                msgs.community[commId] = (msgs.community[commId] || 0) + 1;
                if (chId) msgs.channel[chId] = (msgs.channel[chId] || 0) + 1;
              }
            }
          });
          setUnreadMentions(mentions);
          setUnreadMessages(msgs);
        })
        .catch(err => console.error('Lỗi lấy thông báo:', err));

      axiosClient.get('/api/friends')
        .then(res => {
          if (res.data?.success && res.data?.data?.friends) {
            setMyFriends(res.data.data.friends);
          }
        })
        .catch(err => console.error('Lỗi lấy danh sách bạn bè:', err));
    }
  }, [user?._id]);

  // Fetch channels + members when a community is selected
  const handleSelectCommunity = async (community) => {
    if (selectedCommunity?._id === community._id) return; // Already selected
    setSelectedCommunity(community);
    
    try {
      const [chRes, memRes] = await Promise.all([
        axiosClient.get(`/api/communities/${community._id}/channels`),
        axiosClient.get(`/api/communities/${community._id}`),
      ]);
      // axiosClient returns { data: { success, data: [...] } }
      const channels = chRes.data?.data || [];
      const channelsArray = Array.isArray(channels) ? channels : [];
      setCommunityChannels(channelsArray);
      
      const fullCommunity = memRes.data?.data;
      if (fullCommunity?.members) {
        setCommunityMembers(fullCommunity.members);
      } else {
        setCommunityMembers([]);
      }

      // Automatically navigate to the first text channel if currently not in this community's channels
      const currentChannelId = location.pathname.split('/').pop();
      const firstTextChannel = channelsArray.find(ch => ch.type === 'text');
      if (firstTextChannel && currentChannelId !== firstTextChannel._id) {
        setSelectedChannel(firstTextChannel);
        navigate(`/community/${community._id}/channel/${firstTextChannel._id}`, {
          state: { communityName: community.name, channelName: firstTextChannel.name }
        });
      }
    } catch (err) {
      console.error('Lỗi lấy kênh/thành viên:', err);
      setCommunityChannels([]);
      setCommunityMembers([]);
    }
  };

  const handleBackToDM = () => {
    setSelectedCommunity(null);
    setCommunityChannels([]);
    setCommunityMembers([]);
    setSelectedChannel(null);
    navigate('/friends');
  };

  const handleContextMenu = (e, community) => {
    e.preventDefault();
    
    // Calculate position to prevent going off-screen (naive approach: limit max height)
    let y = e.clientY;
    if (window.innerHeight - y < 400) {
      y = window.innerHeight - 400; // rough height of menu
    }

    setContextMenu({
      mouseX: e.clientX,
      mouseY: y,
      community
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Global Socket connection for real-time notifications
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(API_BASE_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    const handleConnect = () => {
      // Join community rooms after connect
      socket.emit('join_user_room', user._id);
      myCommunities.forEach(c => {
        socket.emit('join_community', c._id);
      });
      socket.emit('get_online_users', (userIdsArray) => {
        setOnlineUserIds(new Set(userIdsArray));
      });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);

    socket.on('friend_request_received', (data) => {
      setShowNotification({
        title: 'Lời mời kết bạn',
        message: `${data.user.displayName || data.user.username} vừa gửi cho bạn một lời mời kết bạn!`,
        icon: <UserPlus className="w-5 h-5 text-indigo-400" />
      });
      setTimeout(() => setShowNotification(null), 5000);
    });

    socket.on('friend_request_accepted', (data) => {
      setShowNotification({
        title: 'Bạn bè mới',
        message: `${data.friend.displayName || data.friend.username} đã chấp nhận lời mời kết bạn của bạn!`,
        icon: <Users className="w-5 h-5 text-emerald-400" />
      });
      setTimeout(() => setShowNotification(null), 5000);
    });

    socket.on('new_notification', (data) => {
      // Show toast ONLY if not channel_message
      if (data.type !== 'channel_message') {
        setShowNotification({
          title: data.type === 'mention' ? 'Có người nhắc đến bạn' : 'Thông báo mới',
          message: data.content,
          icon: <Bell className="w-5 h-5 text-yellow-400" />
        });
        setTimeout(() => setShowNotification(null), 5000);
      }

      // Update unread badges
      if ((data.type === 'mention' || data.type === 'channel_message') && data.community) {
        const commId = typeof data.community === 'object' ? data.community._id : data.community;
        let chId = null;
        if (data.link && data.link.includes('/channel/')) {
          const parts = data.link.split('/');
          chId = parts[parts.length - 1];
        }

        const isViewingChannel = window.location.pathname.includes(chId);
        if (isViewingChannel) {
          axiosClient.put(`/api/notifications/read-channel/${chId}`).then(() => {
            window.dispatchEvent(new CustomEvent('notifications_read'));
          }).catch(() => {});
          return;
        }

        if (data.type === 'mention') {
          setUnreadMentions(prev => {
            const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
            copy.community[commId] = (copy.community[commId] || 0) + 1;
            if (chId) copy.channel[chId] = (copy.channel[chId] || 0) + 1;
            return copy;
          });
        } else if (data.type === 'channel_message') {
          setUnreadMessages(prev => {
            const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
            copy.community[commId] = (copy.community[commId] || 0) + 1;
            if (chId) copy.channel[chId] = (copy.channel[chId] || 0) + 1;
            return copy;
          });
        }
      }
    });
    socket.on('voice_channel_update', ({ channelId, users }) => {
      setVoiceChannelUsers(prev => ({
        ...prev,
        [channelId]: users
      }));
    });

    socket.on('user_status_change', ({ userId, isOnline }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    return () => socket.close();
  }, [user?._id, myCommunities]);

  const getFrameInfo = (userObj) => {
    if (!userObj) return null;
    if (userObj.activeFrameAnimatedUrl) {
      return {
        animatedUrl: userObj.activeFrameAnimatedUrl,
        staticUrl: userObj.activeFrameStaticUrl
      };
    }
    // If populated object
    if (userObj.activeFrame && typeof userObj.activeFrame === 'object' && userObj.activeFrame.animatedUrl) {
      return {
        animatedUrl: userObj.activeFrame.animatedUrl,
        staticUrl: userObj.activeFrame.staticUrl
      };
    }
    return null;
  };

  const getNameplateInfo = (userObj) => {
    if (!userObj) return null;
    if (userObj.activeNameplateAnimatedUrl) {
      return {
        animatedUrl: userObj.activeNameplateAnimatedUrl,
        staticUrl: userObj.activeNameplateStaticUrl || userObj.activeNameplateAnimatedUrl
      };
    }
    if (userObj.activeNameplate && typeof userObj.activeNameplate === 'object' && userObj.activeNameplate.animatedUrl) {
      return {
        animatedUrl: userObj.activeNameplate.animatedUrl,
        staticUrl: userObj.activeNameplate.staticUrl || userObj.activeNameplate.animatedUrl
      };
    }
    return null;
  };

  const activeFrameInfo = getFrameInfo(user);
  const activeNameplateInfo = getNameplateInfo(user);

  // Only show the authenticated real user — no mock data
  const members = user && user.username ? [
    { 
      id: user._id || 'me', 
      name: `${user.displayName || user.username} (Bạn)`, 
      role: user.role === 'admin' ? 'Admin' : (user.isPremium ? 'Premium' : 'Member'), 
      avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.username || 'User')}&background=2b2d31&color=fff`,
      frameInfo: activeFrameInfo,
      nameplateInfo: activeNameplateInfo,
      isOnline: true,
      badge: <Crown className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
    }
  ] : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#313338] text-[#dbdee1] font-sans antialiased select-none">
      
      {/* 🔴 CỘT 1: SERVER LIST */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 space-y-2 shrink-0 z-10">
        <div 
          onClick={handleBackToDM}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 cursor-pointer mb-2 ${
            !selectedCommunity ? 'bg-[#2b2d31] rounded-[16px] shadow-inner' : 'bg-[#313338] hover:bg-[#2b2d31]'
          }`}
        >
          <img src={logoVeltrix} alt="Home" className="w-8 h-auto drop-shadow-md" />
          <span className={`absolute left-0 w-1 bg-white rounded-r-lg group-hover:h-5 transition-all duration-200 ${!selectedCommunity ? 'h-10 scale-100' : 'h-2 scale-0'}`} />
          <span className="absolute left-20 px-3 py-1.5 text-sm font-semibold text-white bg-[#111214] rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 translate-x-0 transition-all duration-200 z-55 whitespace-nowrap">
            Tin nhắn trực tiếp
          </span>
        </div>

        <div className="w-8 h-[2px] bg-[#35363c] rounded mb-2" />

        <div className="flex-1 w-full space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center">
          {(myCommunities || []).map((srv) => (
            <div 
              key={srv._id}
              onClick={() => handleSelectCommunity(srv)}
              onContextMenu={(e) => handleContextMenu(e, srv)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 cursor-pointer overflow-visible ${
                selectedCommunity?._id === srv._id ? 'bg-indigo-500 text-white rounded-[16px]' : 'bg-[#313338] hover:bg-indigo-500'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center rounded-[inherit] overflow-hidden">
                {srv.icon && (srv.icon.includes('/') || srv.icon.includes('.') || srv.icon.length > 5) ? (
                  <img 
                    src={srv.icon.startsWith('http') || srv.icon.startsWith('data:') ? srv.icon : (srv.icon.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${srv.icon}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${srv.icon}`)} 
                    alt={srv.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-lg">{srv.icon || (srv.name ? srv.name.charAt(0) : '💬')}</span>
                )}
              </div>
              
              {/* Mention Badge */}
              {unreadMentions.community?.[srv._id] > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-[#1e1f22] flex items-center justify-center pointer-events-none z-20">
                  <span className="text-[10px] font-bold text-white">{unreadMentions.community[srv._id] > 9 ? '9+' : unreadMentions.community[srv._id]}</span>
                </div>
              )}

              <span className={`absolute left-0 w-1 bg-white rounded-r-lg group-hover:h-5 transition-all duration-200 ${
                selectedCommunity?._id === srv._id ? 'h-10 scale-100' : (unreadMentions.community?.[srv._id] > 0 || unreadMessages.community?.[srv._id] > 0 ? 'h-2 scale-100' : 'h-2 scale-0')
              }`} />
              <span className="absolute left-20 px-3 py-1.5 text-sm font-semibold text-white bg-[#111214] rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 translate-x-0 transition-all duration-200 z-55 whitespace-nowrap">
                {srv.name}
              </span>
            </div>
          ))}

          <div 
            onClick={() => setShowCreateCommunity(true)}
            className="group relative flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-6 h-6" />
            <span className="absolute left-20 px-3 py-1.5 text-sm font-semibold text-white bg-[#111214] rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 translate-x-0 transition-all duration-200 z-55 whitespace-nowrap">
              Thêm máy chủ
            </span>
          </div>

          <div className="group relative flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all duration-300 cursor-pointer">
            <Compass className="w-6 h-6" />
            <span className="absolute left-20 px-3 py-1.5 text-sm font-semibold text-white bg-[#111214] rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 translate-x-0 transition-all duration-200 z-55 whitespace-nowrap">
              Khám phá máy chủ
            </span>
          </div>
        </div>
      </div>

      {/* 🟢 CỘT 2: CHANNEL / SIDEBAR */}
      <div className="w-[240px] bg-[#2b2d31] flex flex-col shrink-0 z-5 border-r border-[#1f2023]/30">
        
        {/* Sidebar Header */}
        <div 
          className={`relative flex justify-between px-4 transition-all cursor-pointer group shadow-sm border-b border-[#1f2023] ${
            selectedCommunity?.banner && selectedCommunity?.isBoosted
              ? 'h-[135px] items-start pt-3 hover:bg-black/10' 
              : 'h-12 items-center hover:bg-[#35373c]'
          }`}
        >
          {selectedCommunity?.banner && selectedCommunity?.isBoosted && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img src={selectedCommunity.banner} alt="banner" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              {/* Top gradient for text readability, bottom gradient to blend seamlessly into channel list background */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#2b2d31]"></div>
            </div>
          )}
          <span className={`truncate font-bold text-white z-10 ${selectedCommunity?.banner && selectedCommunity?.isBoosted ? 'text-shadow-sm drop-shadow-md' : ''}`}>
            {selectedCommunity ? selectedCommunity.name : 'Tin nhắn trực tiếp'}
          </span>
          {selectedCommunity && (
            <div className="flex items-center space-x-1 z-10 mt-[2px]">
              <UserPlus 
                className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md hover:text-gray-200" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInviteModal(true);
                }}
              />
              <ChevronDown className="w-4 h-4 shrink-0 text-white drop-shadow-md" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
          
          {/* === DM Mode (no community selected) === */}
          {!selectedCommunity && (
            <>
              {/* Friends Navigation Button */}
              <div 
                onClick={() => navigate('/friends')}
                className={`flex items-center px-2 py-2 rounded-md cursor-pointer transition-all ${
                  location.pathname === '/friends'
                    ? 'bg-[#35373c] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                <Users className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-semibold text-[15px]">Bạn bè</span>
              </div>

              {/* Shop Navigation Button */}
              <div 
                onClick={() => navigate('/shop')}
                className={`flex items-center px-2 py-2 rounded-md cursor-pointer transition-all ${
                  location.pathname === '/shop'
                    ? 'bg-pink-950/40 text-pink-300 border-l-2 border-pink-500'
                    : 'text-pink-400/80 hover:bg-pink-950/20 hover:text-pink-300'
                }`}
              >
                <ShoppingBag className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-semibold text-[15px]">Cửa hàng</span>
              </div>

              {/* Divider Line */}
              <div className="w-full h-[1px] bg-[#3f4147]/40 my-3" />

              {/* Direct Messages List Header */}
              <div className="flex items-center justify-between px-2 mb-1 group">
                <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
                  Tin nhắn trực tiếp
                </span>
                <Plus 
                  className="w-4 h-4 text-[#949ba4] hover:text-white cursor-pointer transition-colors"
                  onClick={() => navigate('/friends')}
                  title="Thêm bạn bè"
                />
              </div>

              {/* Friends List */}
              <div className="space-y-0.5 mt-1">
                {myFriends.length > 0 ? (
                  myFriends.map((friend) => {
                    const isOnline = onlineUserIds.has(String(friend._id || friend.id));
                    const avatarSrc = friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || friend.username || 'User')}&background=2b2d31&color=fff`;

                    const isActive = location.pathname === `/dm/${friend._id}`;

                    return (
                      <div 
                        key={friend._id}
                        onClick={() => navigate(`/dm/${friend._id}`)}
                        className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-all group relative overflow-hidden ${
                          isActive 
                            ? 'bg-[#35373c] text-white font-semibold' 
                            : 'text-[#949ba4] hover:bg-[#35373c]/80 hover:text-[#dbdee1]'
                        }`}
                      >
                        {/* Nameplate background if present */}
                        {(friend.activeNameplateStaticUrl || friend.activeNameplateAnimatedUrl) && (
                          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
                            <img src={friend.activeNameplateStaticUrl || friend.activeNameplateAnimatedUrl} className="w-full h-full object-cover" alt="nameplate" />
                          </div>
                        )}

                        <div className="relative z-10 flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0 w-8 h-8 rounded-full">
                            <img src={avatarSrc} alt={friend.username} className="w-full h-full rounded-full object-cover" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-[#f2f3f5] truncate group-hover:text-white">{friend.displayName || friend.username}</span>
                            <span className="text-[11px] text-[#949ba4] truncate">@{friend.username}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-2 py-3 text-xs text-[#949ba4] text-center italic">
                    Chưa có bạn bè nào
                  </div>
                )}
              </div>
            </>
          )}

          {/* === Community Mode (community selected) === */}
          {selectedCommunity && (
            <>
              {/* Server actions (Events, Boost) */}
              <div className="space-y-0.5 pb-2 border-b border-[#1f2023]/30 mb-2">
                <div className="flex items-center px-2 py-1.5 rounded-md cursor-pointer text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-all">
                  <Calendar className="w-4 h-4 mr-2 shrink-0" />
                  <span className="text-sm font-semibold">Sự Kiện</span>
                </div>
                {(!selectedCommunity?.isBoosted) && (
                  <div className="flex items-center px-2 py-1.5 rounded-md cursor-pointer text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-all">
                    <Gem className="w-4 h-4 mr-2 shrink-0" />
                    <span className="text-sm font-semibold">Nâng Cấp Máy Chủ</span>
                  </div>
                )}
              </div>

              {/* Text Channels */}
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1 px-1 flex items-center justify-between">
                  <span>Kênh Text</span>
                  <Plus 
                    className="w-4 h-4 cursor-pointer hover:text-[#dbdee1] transition-colors" 
                    onClick={() => setShowCreateChannel(true)}
                  />
                </h3>
                {communityChannels.filter(ch => ch.type === 'text').map((ch) => (
                  <div
                    key={ch._id}
                    onClick={async () => {
                      setSelectedChannel(ch);
                      
                      // Clear badge and mark as read
                      if (unreadMentions.channel?.[ch._id] > 0) {
                        try {
                          await axiosClient.put(`/api/notifications/read-channel/${ch._id}`);
                          window.dispatchEvent(new CustomEvent('notifications_read'));
                          setUnreadMentions(prev => {
                            const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
                            // Also decrement community badge
                            if (copy.community[selectedCommunity._id]) {
                              copy.community[selectedCommunity._id] = Math.max(0, copy.community[selectedCommunity._id] - copy.channel[ch._id]);
                            }
                            delete copy.channel[ch._id];
                            return copy;
                          });
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      
                      // Clear unread message indicator
                      if (unreadMessages.channel?.[ch._id] > 0) {
                        setUnreadMessages(prev => {
                          const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
                          if (copy.community[selectedCommunity._id]) {
                            copy.community[selectedCommunity._id] = Math.max(0, copy.community[selectedCommunity._id] - copy.channel[ch._id]);
                          }
                          delete copy.channel[ch._id];
                          return copy;
                        });
                      }
                      
                      navigate(`/community/${selectedCommunity._id}/channel/${ch._id}`, {
                        state: { communityName: selectedCommunity.name, channelName: ch.name }
                      });
                    }}
                    className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-all group ${
                      selectedChannel?._id === ch._id
                        ? 'bg-[#35373c] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 relative">
                      {unreadMessages.channel?.[ch._id] > 0 && !unreadMentions.channel?.[ch._id] && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                      <Hash className="w-4 h-4 mr-2 shrink-0 text-[#80848e]" />
                      <span className={`text-[15px] truncate ${(unreadMentions.channel?.[ch._id] > 0 || unreadMessages.channel?.[ch._id] > 0) ? 'font-bold text-white' : ''}`}>{ch.name}</span>
                    </div>
                    {unreadMentions.channel?.[ch._id] > 0 && (
                      <div className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 shrink-0 mx-1">
                      </div>
                    )}
                    
                    {(() => {
                      const userId = user?._id || user?.id;
                      const myRole = communityMembers.find(m => {
                        if (!m || !m.user) return false;
                        const uId = m.user._id || m.user.id || m.user;
                        return uId && String(uId) === String(userId);
                      })?.role;
                      const canCreateInvite = checkPermission(ch, userId, myRole, 'create_invite');
                      const canManageChannel = checkPermission(ch, userId, myRole, 'manage_channel');
                      
                      return (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canCreateInvite && (
                            <UserPlus 
                              className="w-3.5 h-3.5 text-[#b5bac1] hover:text-[#dbdee1]" 
                              title="Tạo Lời mời"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowInviteModal(true);
                              }}
                            />
                          )}
                          {canManageChannel && (
                            <SettingsIcon 
                              className="w-3.5 h-3.5 text-[#b5bac1] hover:text-[#dbdee1]" 
                              title="Chỉnh sửa kênh" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSettingChannel(ch);
                              }}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Voice Channels */}
              <div>
                <h3 className="text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1 px-1 flex items-center justify-between">
                  <span>Kênh Thoại</span>
                  <Plus 
                    className="w-4 h-4 cursor-pointer hover:text-[#dbdee1] transition-colors" 
                    onClick={() => setShowCreateChannel(true)}
                  />
                </h3>
                {communityChannels.filter(ch => ch.type === 'voice').map((ch) => {
                  const usersInChannel = voiceChannelUsers[ch._id] || [];
                  return (
                    <div key={ch._id} className="flex flex-col mb-0.5">
                      <div
                        onClick={() => navigate(`/community/${selectedCommunity._id}/voice/${ch._id}`)}
                        className="flex items-center px-2 py-1.5 rounded-md cursor-pointer text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-all group"
                      >
                        <Volume2 className="w-4 h-4 mr-2 shrink-0 text-[#80848e]" />
                        <span className="text-[15px] truncate">{ch.name}</span>
                      </div>
                      
                      {/* Voice users list */}
                      {usersInChannel.length > 0 && (
                        <div className="pl-8 pr-2 flex flex-col gap-1 mt-1 mb-1">
                          {usersInChannel.map(u => (
                            <div key={u._id} className="flex items-center gap-2 group/vuser hover:bg-[#35373c]/50 p-1 rounded cursor-pointer transition-colors">
                              <img 
                                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`} 
                                alt={u.username}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                              <span className="text-xs text-[#949ba4] group-hover/vuser:text-[#dbdee1] truncate max-w-[100px]">
                                {u.displayName || u.username}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 👤 Bảng User Panel dưới cùng */}
        <div className="h-[56px] bg-[#232428] flex items-center justify-between px-2 shrink-0 border-t border-[#1f2023]/40">
          <div 
            id="profile-toggle-btn"
            onClick={(e) => {
              if (!showProfile) {
                setSelectedProfileUser(null);
                setProfileModalPos({ bottom: '64px', left: '80px' });
                setShowProfile(true);
              } else {
                setShowProfile(false);
              }
            }}
            className="relative flex flex-1 items-center p-1.5 rounded-lg hover:bg-[#35373c]/80 transition-all cursor-pointer group overflow-hidden min-w-0 mr-1"
            title="Xem hồ sơ"
          >
            {activeNameplateInfo && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-80 mix-blend-screen">
                  <img src={activeNameplateInfo.staticUrl} className="absolute inset-0 w-full h-full object-cover object-left group-hover:opacity-0 transition-opacity" alt="Nameplate static" />
                  <img src={activeNameplateInfo.animatedUrl} className="absolute inset-0 w-full h-full object-cover object-left opacity-0 group-hover:opacity-100 transition-opacity" alt="Nameplate animated" />
                </div>
                <div 
                  className="absolute inset-0 z-10 mix-blend-overlay"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220, 62, 151, 0.08) 20%, rgba(220, 62, 151, 0.08) 50%, rgba(220, 62, 151, 0.2) 100%)' }}
                />
              </div>
            )}
            <div className="relative z-10 flex items-center space-x-2 min-w-0 w-full">
              {/* Dynamic Active Avatar Frame! */}
              <div className={`relative shrink-0 w-8 h-8 rounded-full p-[2px] transition-all duration-300 ${
                activeFrameInfo ? activeFrameInfo.colorClass : 'bg-[#35373c]'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
                  <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=2b2d31&color=fff`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Animated GIF overlay if frame is equipped */}
                {activeFrameInfo && (
                  <div className="absolute -inset-[13%] pointer-events-none z-20">
                    <img 
                      src={activeFrameInfo.staticUrl} 
                      alt="active static frame" 
                      className="w-full h-full object-contain pointer-events-none group-hover:opacity-0 transition-opacity"
                    />
                    <img 
                      src={activeFrameInfo.animatedUrl} 
                      alt="active animated frame" 
                      className="w-full h-full object-contain pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
                {/* Online Status Dot */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#232428]" />
              </div>

              {/* Text Area */}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-white text-xs font-bold truncate leading-none flex items-center drop-shadow-md">
                  {user.displayName || user.username}
                  <Crown className="w-3 h-3 text-amber-500 ml-1 shrink-0" />
                </span>
                <span className="text-[10px] text-[#dbdee1] opacity-80 truncate mt-0.5 flex items-center gap-0.5 drop-shadow-md">
                  <Coins className="w-3 h-3 text-amber-400" /> {user?.coins}
                </span>
              </div>
            </div>
          </div>

          {/* User controls */}
          <div className="flex items-center text-[#b5bac1]">
            <button 
              onClick={() => setMicMuted(!micMuted)} 
              className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-all cursor-pointer ${micMuted ? 'text-rose-500' : ''}`}
            >
              {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setSoundMuted(!soundMuted)} 
              className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-all cursor-pointer ${soundMuted ? 'text-rose-500' : ''}`}
            >
              <Headphones className="w-4 h-4" />
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-all cursor-pointer text-amber-500 hover:text-amber-400"
                title="Bảng điều khiển Admin"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔵 CỘT 3: MAIN AREA */}
      <div className="flex-1 flex flex-col bg-[#313338] h-full min-w-0 z-1 relative">
        {/* Global Toast Notification */}
        {showNotification && (
          <div className="absolute top-4 right-4 z-50 bg-[#2b2d31] border border-[#1f2023] shadow-2xl rounded-lg p-4 flex items-start gap-3 w-[320px] animate-fade-in">
            <div className="shrink-0 bg-[#1e1f22] p-2 rounded-full border border-[#3f4147]">
              {showNotification.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm">{showNotification.title}</h4>
              <p className="text-[#b5bac1] text-xs mt-1 leading-relaxed">{showNotification.message}</p>
            </div>
            <button onClick={() => setShowNotification(null)} className="shrink-0 text-[#949ba4] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="h-12 border-b border-[#1f2023] flex items-center justify-between px-4 shrink-0 shadow-sm bg-[#313338]">
          <div className="flex items-center space-x-2 font-bold text-white">
            {location.pathname === '/shop' ? (
              <>
                <ShoppingBag className="w-6 h-6 text-pink-400" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  cửa-hàng-avatar-khung
                </span>
              </>
            ) : selectedChannel ? (
              <>
                <Hash className="w-6 h-6 text-[#80848e]" />
                <span>{selectedChannel.name}</span>
              </>
            ) : location.pathname === '/friends' ? (
              <>
                <Users className="w-6 h-6 text-[#80848e]" />
                <span>Bạn bè</span>
              </>
            ) : (
              <>
                <Hash className="w-6 h-6 text-[#80848e]" />
                <span>thảo-luận-chung</span>
              </>
            )}
            <span className="hidden md:inline-block w-[1px] h-4 bg-[#3f4147] mx-2" />
            <p className="hidden md:inline-block text-xs text-[#949ba4] font-normal truncate">
              {location.pathname === '/shop' 
                ? 'Khám phá và mua các khung avatar cao cấp bằng Coin hoặc Premium'
                : selectedChannel
                  ? `Gửi tin nhắn tới #${selectedChannel.name}`
                  : 'Kênh thảo luận về tất cả chủ đề của Vetrix'}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[#b5bac1]">
            <NotificationInbox />

            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-1 hover:text-white transition-all cursor-pointer ${showMembers ? 'text-white' : ''}`}
            >
              <Users className="w-5 h-5" />
            </button>
            
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-36 md:w-48 h-6 bg-[#1e1f22] text-[#dbdee1] placeholder-[#949ba4] text-xs px-2 pr-6 rounded focus:outline-none focus:w-60 transition-all duration-300"
              />
              <Search className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-[#949ba4]" />
            </div>
          </div>
        </div>

        {/* Content Outlet */}
        <div className="flex-grow overflow-hidden">
          <Outlet context={{ selectedCommunity, communityMembers, myCommunities, communityChannels, onlineUserIds, handleSelectCommunity }} />
        </div>
      </div>

      {/* 🟡 CỘT 4: MEMBER LIST (Only when in community channels) */}
      {showMembers && !location.pathname.startsWith('/dm/') && (
        <div className="w-[240px] bg-[#2b2d31] flex flex-col shrink-0 border-l border-[#1f2023]/30 h-full hidden lg:flex">
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 no-scrollbar">
            {!selectedCommunity ? (
              <div className="flex flex-col items-center justify-center h-full px-2">
                <p className="text-center text-[#949ba4] text-sm px-4">
                  Bạn chưa tham gia cộng đồng nào. Hãy tạo hoặc tham gia cộng đồng để xem danh sách thành viên.
                </p>
              </div>
            ) : (() => {
              // Group members by role like Discord
              const roleOrder = { owner: 0, admin: 1, member: 2 };
              const roleLabels = { owner: 'Chủ sở hữu', admin: 'Quản trị viên', member: 'Thành viên' };
              const roleColors = { owner: 'text-amber-500', admin: 'text-rose-400', member: 'text-[#949ba4]' };
              const nameColors = { owner: 'text-amber-500', admin: 'text-rose-400', member: 'text-[#dbdee1]' };

              const grouped = {};
              communityMembers.forEach((mbr) => {
                const role = mbr.role || 'member';
                if (!grouped[role]) grouped[role] = [];
                grouped[role].push(mbr);
              });

              const sortedRoles = Object.keys(grouped).sort((a, b) => (roleOrder[a] ?? 99) - (roleOrder[b] ?? 99));

              const renderMemberCard = (mbr, idx) => {
                const memberUser = mbr.user;
                if (!memberUser || typeof memberUser === 'string') return null;
                const isCurrentUser = memberUser._id === user._id;
                const mFrameInfo = getFrameInfo(memberUser);
                const mNameplateInfo = getNameplateInfo(memberUser);
                const role = mbr.role || 'member';
                const displayName = mbr.nickname || memberUser.displayName || memberUser.username;
                const avatar = mbr.avatar || memberUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberUser.username || 'U')}&background=2b2d31&color=fff`;
                const isOnline = onlineUserIds.has(memberUser._id || memberUser.id);

                return (
                  <div
                    key={memberUser._id || idx}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setProfileModalPos({
                        top: `${Math.min(rect.top, window.innerHeight - 400)}px`,
                        right: '256px',
                      });
                      setShowProfile(false);
                      setSelectedProfileUser({
                        _id: memberUser._id,
                        username: displayName,
                        realUsername: memberUser.username,
                        avatar: avatar,
                        activeFrameAnimatedUrl: memberUser.activeFrameAnimatedUrl,
                        activeFrameStaticUrl: memberUser.activeFrameStaticUrl,
                        activeNameplateAnimatedUrl: memberUser.activeNameplateAnimatedUrl,
                        activeNameplateStaticUrl: memberUser.activeNameplateStaticUrl,
                        activeProfileEffectAnimatedUrl: memberUser.activeProfileEffectAnimatedUrl,
                        activeProfileEffectStaticUrl: memberUser.activeProfileEffectStaticUrl,
                        activeProfileEffectLayers: memberUser.activeProfileEffectLayers || [],
                        isOnline: isOnline,
                        role: role,
                        bannerColor: memberUser.bannerColor,
                        bannerImage: memberUser.bannerImage,
                        customStatus: memberUser.customStatus,
                        isPremium: memberUser.isPremium,
                        themeColors: memberUser.themeColors,
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        type: 'member',
                        member: mbr,
                        isCurrentUser: isCurrentUser,
                        mouseX: e.clientX,
                        mouseY: e.clientY
                      });
                    }}
                    className="relative flex items-center p-1.5 rounded-lg hover:bg-[#35373c]/80 transition-all cursor-pointer group overflow-hidden mb-0.5"
                  >
                    {mNameplateInfo && (
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 opacity-80 mix-blend-screen">
                          <img src={mNameplateInfo.staticUrl} className="absolute inset-0 w-full h-full object-cover object-left group-hover:opacity-0 transition-opacity" alt="" />
                          <img src={mNameplateInfo.animatedUrl} className="absolute inset-0 w-full h-full object-cover object-left opacity-0 group-hover:opacity-100 transition-opacity" alt="" />
                        </div>
                      </div>
                    )}
                    <div className="relative z-10 flex items-center space-x-2.5 w-full">
                      <div className={`relative shrink-0 w-8 h-8 rounded-full p-[2px] transition-all duration-300 ${mFrameInfo ? '' : 'bg-transparent'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
                          <img
                            src={avatar}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {mFrameInfo && (
                          <div className="absolute -inset-[13%] pointer-events-none z-20">
                            <img src={mFrameInfo.staticUrl} alt="" className="w-full h-full object-contain pointer-events-none group-hover:opacity-0 transition-opacity" />
                            <img src={mFrameInfo.animatedUrl} alt="" className="w-full h-full object-contain pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'} border-2 border-[#2b2d31]`} />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className={`text-[13px] font-semibold truncate transition-all flex items-center gap-1 drop-shadow-md ${isOnline ? (nameColors[role] || 'text-[#dbdee1] group-hover:text-white') : 'text-[#80848e] group-hover:text-[#949ba4]'}`}>
                          {displayName}
                          {isCurrentUser && <span className="text-[10px] text-[#949ba4] font-normal ml-0.5">(Bạn)</span>}
                          {role === 'owner' && <Crown className={`w-3.5 h-3.5 shrink-0 ${isOnline ? 'text-amber-500' : 'text-amber-500/50'}`} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              };

              return sortedRoles.map((role) => (
                <div key={role}>
                  <h3 className={`text-[11px] font-bold tracking-wider uppercase mb-1 px-1 ${roleColors[role] || 'text-[#949ba4]'}`}>
                    {roleLabels[role] || role} — {grouped[role].length}
                  </h3>
                  <div className="space-y-0.5">
                    {grouped[role].map((mbr, idx) => renderMemberCard(mbr, idx))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Personal Profile Modal (Bottom left toggle) */}
      <UserProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        onOpenSettings={(tab) => {
          setShowProfile(false);
          setSettingsTab(tab);
          setShowSettings(true);
        }}
        onOpenCustomStatus={() => setIsCustomStatusOpen(true)}
      />

      {/* Other Member Profile Popout (Right sidebar clicks) */}
      <MemberProfilePopout
        isOpen={!!selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
        member={selectedProfileUser}
        position={profileModalPos}
        currentCommunity={selectedCommunity}
        myCommunities={myCommunities}
        onSelectCommunity={(c) => {
          setSelectedProfileUser(null);
          handleSelectCommunity(c);
        }}
        onOpenFullProfile={(memberObj) => {
          setSelectedProfileUser(null);
          setFullProfileUser(memberObj);
        }}
      />

      <FullProfileModal
        isOpen={!!fullProfileUser}
        onClose={() => setFullProfileUser(null)}
        member={fullProfileUser}
        myCommunities={myCommunities}
        onSelectCommunity={(c) => {
          setFullProfileUser(null);
          handleSelectCommunity(c);
        }}
      />

      {/* Full Screen Settings Overlay */}
      {/* Settings Modal */}
      <UserSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        initialTab={settingsTab}
        myCommunities={myCommunities}
        selectedCommunity={selectedCommunity}
      />
      
      {/* Custom Status Modal (Global) */}
      <CustomStatusModal 
        isOpen={isCustomStatusOpen} 
        onClose={() => setIsCustomStatusOpen(false)}
        currentStatus={user?.customStatus}
      />

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        onSuccess={(newComm) => {
          setMyCommunities(prev => [newComm, ...prev]);
          handleSelectCommunity(newComm);
        }}
      />

      {/* Invite Member Modal */}
      <InviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={selectedCommunity}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        communityId={selectedCommunity?._id}
        onChannelCreated={(newChannel) => {
          setCommunityChannels(prev => [...prev, newChannel]);
          // auto switch to the new channel if it's a text channel
          if (newChannel.type === 'text') {
            setSelectedChannel(newChannel);
            navigate(`/community/${selectedCommunity._id}/channel/${newChannel._id}`, {
              state: { communityName: selectedCommunity.name, channelName: newChannel.name }
            });
          }
        }}
      />

      {/* Context Menu Overlay */}
      {contextMenu && (() => {
        if (contextMenu.type === 'member') {
          const { member, isCurrentUser, mouseX, mouseY } = contextMenu;
          const memberUser = member.user;
          const displayName = member.nickname || memberUser.displayName || memberUser.username;
          
          return (
            <div 
              className="fixed inset-0 z-[100]"
              onClick={closeContextMenu}
              onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
            >
              <div 
                className="absolute bg-[#111214] border border-[#1f2023] rounded shadow-2xl py-2 w-[220px] text-[13px] text-[#dbdee1] font-medium animate-fade-in"
                style={{ 
                  top: Math.min(mouseY, window.innerHeight - 300), 
                  left: mouseX - 220,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfile(false);
                    setSelectedProfileUser(null);
                    setFullProfileUser({
                      _id: memberUser._id,
                      username: displayName,
                      realUsername: memberUser.username,
                      avatar: member.avatar || memberUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberUser.username || 'U')}&background=2b2d31&color=fff`,
                      activeFrameAnimatedUrl: memberUser.activeFrameAnimatedUrl,
                      activeFrameStaticUrl: memberUser.activeFrameStaticUrl,
                      activeNameplateAnimatedUrl: memberUser.activeNameplateAnimatedUrl,
                      activeNameplateStaticUrl: memberUser.activeNameplateStaticUrl,
                      activeProfileEffectAnimatedUrl: memberUser.activeProfileEffectAnimatedUrl,
                      activeProfileEffectStaticUrl: memberUser.activeProfileEffectStaticUrl,
                      activeProfileEffectLayers: memberUser.activeProfileEffectLayers || [],
                      isOnline: onlineUserIds.has(memberUser._id || memberUser.id),
                      role: member.role || 'member',
                      bannerColor: memberUser.bannerColor,
                      bannerImage: memberUser.bannerImage,
                      customStatus: memberUser.customStatus,
                      isPremium: memberUser.isPremium,
                      themeColors: memberUser.themeColors,
                    });
                    closeContextMenu();
                  }}
                >
                  <span>Hồ sơ</span>
                </div>
                
                {isCurrentUser ? (
                  <>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Đề cập</span>
                    </div>
                    <div 
                      className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                      onClick={() => {
                        setSettingsTab('server-profile');
                        setShowSettings(true);
                        closeContextMenu();
                      }}
                    >
                      <span>Chỉnh Sửa Hồ Sơ Theo Máy Chủ</span>
                    </div>
                    <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group">
                      <span>Ứng dụng</span>
                      <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
                    </div>
                    <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Mở trong Chế Độ Hiển Thị Mod</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Nhắn tin</span>
                    </div>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Bắt Đầu Cuộc Gọi</span>
                    </div>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Thêm ghi chú</span>
                        <span className="text-[10px] text-[#949ba4]">Chỉ hiển thị cho bạn</span>
                      </div>
                    </div>
                    <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group">
                      <span>Ứng dụng</span>
                      <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
                    </div>
                    <div 
                      className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group"
                      onClick={() => { setShowInviteModal(true); closeContextMenu(); }}
                    >
                      <span>Mời Vào Máy Chủ</span>
                      <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
                    </div>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Thêm Bạn</span>
                    </div>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                      <span>Bỏ qua</span>
                    </div>
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#da373c] hover:text-white text-[#da373c] transition-colors flex items-center justify-between">
                      <span>Chặn</span>
                    </div>
                    <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                    <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group">
                      <span>Vai trò</span>
                      <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        }

        const ctxComm = contextMenu.community;
        const isOwnerCtx = ctxComm && String(ctxComm.owner?._id || ctxComm.owner) === String(user?._id);
        const myRoleMember = ctxComm?.members?.find(m => {
          const uid = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
          const isSameId = String(uid) === String(user?._id);
          const isSameUsername = typeof m.user === 'object' && m.user.username === user?.username;
          return isSameId || isSameUsername;
        });
        const myRoleCtx = myRoleMember?.role;
        const isAdminOrOwner = isOwnerCtx || myRoleCtx === 'admin';
        
        const notifSettings = myRoleMember?.notificationSettings || {
          level: 'all',
          suppressEveryone: false,
          suppressRoles: false,
          suppressHighlights: false,
          muteEvents: false,
          mobilePush: true
        };

        const handleUpdateNotif = async (updates) => {
          try {
            const res = await axiosClient.put(`/api/communities/${ctxComm._id}/notification-settings`, updates);
            if (res.data?.success) {
              setMyCommunities(prev => prev.map(c => {
                if (c._id === ctxComm._id) {
                  const mIndex = c.members.findIndex(m => String(m.user._id || m.user) === String(user._id));
                  if (mIndex > -1) {
                    c.members[mIndex].notificationSettings = res.data.data;
                  }
                }
                return c;
              }));
              setContextMenu(prev => ({
                ...prev,
                community: {
                  ...prev.community,
                  members: prev.community.members.map(m => {
                    if (String(m.user._id || m.user) === String(user._id)) {
                      return { ...m, notificationSettings: res.data.data };
                    }
                    return m;
                  })
                }
              }));
            }
          } catch (err) {
            console.error(err);
          }
        };

        return (
        <div 
          className="fixed inset-0 z-[100]"
          onClick={closeContextMenu}
          onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
        >
          <div 
            className="absolute bg-[#111214] border border-[#1f2023] rounded shadow-2xl py-2 w-[220px] text-[13px] text-[#dbdee1] font-medium animate-fade-in"
            style={{ 
              top: contextMenu.mouseY, 
              left: contextMenu.mouseX,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="px-2 py-1.5 mx-2 text-[#b5bac1] cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await axiosClient.put(`/api/notifications/read-community/${ctxComm._id}`);
                  window.dispatchEvent(new CustomEvent('notifications_read'));
                  setUnreadMentions(prev => {
                    const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
                    delete copy.community[ctxComm._id];
                    return copy;
                  });
                  setUnreadMessages(prev => {
                    const copy = { community: { ...prev.community }, channel: { ...prev.channel } };
                    delete copy.community[ctxComm._id];
                    // Technically we should clear all associated channels from copy.channel, 
                    // but they won't render unless selectedCommunity is this community.
                    return copy;
                  });
                } catch (err) {
                  console.error(err);
                }
                closeContextMenu();
              }}
            >
              <span>Đánh Dấu Đã Đọc</span>
            </div>
            
            <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
            
            <div 
              className="px-2 py-1.5 mx-2 text-[#5865F2] hover:bg-[#5865F2] hover:text-white cursor-pointer rounded transition-colors"
              onClick={() => {
                setSelectedCommunity(contextMenu.community);
                setShowInviteModal(true);
                closeContextMenu();
              }}
            >
              Mời Vào Máy Chủ
            </div>

            <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />

            <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group">
              <span>Tắt âm Máy chủ</span>
              <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
            </div>
            
            <div className="relative group">
              <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                <div className="flex flex-col">
                  <span>Cài đặt thông báo</span>
                  <span className="text-[10px] text-[#949ba4] group-hover:text-[#e0e1e5]">
                    {notifSettings.level === 'all' ? 'Tất cả các tin nhắn' : notifSettings.level === 'mentions' ? 'Chỉ @mentions' : 'Không có'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
              </div>
              
              {/* Notification Settings Sub-Menu */}
              <div className="absolute left-[calc(100%-8px)] -top-10 w-[260px] bg-[#111214] border border-[#1f2023] rounded shadow-2xl py-2 hidden group-hover:block z-[110] animate-fade-in">
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ level: 'all' }); }}
                >
                  <span>Tất cả các tin nhắn</span>
                  {notifSettings.level === 'all' ? (
                    <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center ring-2 ring-[#5865F2] border-2 border-[#111214]"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#80848e]"></div>
                  )}
                </div>
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ level: 'mentions' }); }}
                >
                  <span>Chỉ @mentions</span>
                  {notifSettings.level === 'mentions' ? (
                    <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center ring-2 ring-[#5865F2] border-2 border-[#111214]"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#80848e]"></div>
                  )}
                </div>
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ level: 'none' }); }}
                >
                  <span>Không có</span>
                  {notifSettings.level === 'none' ? (
                    <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center ring-2 ring-[#5865F2] border-2 border-[#111214]"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#80848e]"></div>
                  )}
                </div>
                
                <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ suppressEveryone: !notifSettings.suppressEveryone }); }}
                >
                  <span>Cấm @everyone và @here</span>
                  <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center ${notifSettings.suppressEveryone ? 'border-none bg-[#5865F2]' : 'border border-[#80848e]'}`}>
                    {notifSettings.suppressEveryone && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ suppressRoles: !notifSettings.suppressRoles }); }}
                >
                  <span>Bỏ Tất Cả Vai Trò @mentions</span>
                  <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center ${notifSettings.suppressRoles ? 'border-none bg-[#5865F2]' : 'border border-[#80848e]'}`}>
                    {notifSettings.suppressRoles && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ suppressHighlights: !notifSettings.suppressHighlights }); }}
                >
                  <span>Ẩn các tin tức nổi bật</span>
                  <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center ${notifSettings.suppressHighlights ? 'border-none bg-[#5865F2]' : 'border border-[#80848e]'}`}>
                    {notifSettings.suppressHighlights && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ muteEvents: !notifSettings.muteEvents }); }}
                >
                  <span>Tắt âm báo sự kiện mới</span>
                  <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center ${notifSettings.muteEvents ? 'border-none bg-[#5865F2]' : 'border border-[#80848e]'}`}>
                    {notifSettings.muteEvents && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />
                
                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={(e) => { e.stopPropagation(); handleUpdateNotif({ mobilePush: !notifSettings.mobilePush }); }}
                >
                  <span>Thông báo nhắc nhở trên di động</span>
                  <div className={`w-4 h-4 rounded-[3px] flex items-center justify-center ${notifSettings.mobilePush ? 'border-none bg-[#5865F2]' : 'border border-[#80848e]'}`}>
                    {notifSettings.mobilePush && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group">
              <span>Ẩn Các Kênh Bị Tắt Âm</span>
              <div className="w-4 h-4 border border-[#80848e] rounded-[3px] group-hover:border-white"></div>
            </div>

            <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />

            {isAdminOrOwner && (
              <div 
                className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between group"
                onClick={() => {
                  setSelectedCommunity(contextMenu.community);
                  setShowCommunitySettings(true);
                  closeContextMenu();
                }}
              >
                <span>Cài đặt máy chủ</span>
                <ChevronRight className="w-4 h-4 text-[#80848e] group-hover:text-white" />
              </div>
            )}
            
            {isOwnerCtx && (
              <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                <span>Cài Đặt Bảo Mật</span>
              </div>
            )}

            <div 
              className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
              onClick={() => {
                setSettingsTab('server-profile');
                setShowSettings(true);
                closeContextMenu();
              }}
            >
              <span>Chỉnh Sửa Hồ Sơ Theo Máy Chủ</span>
            </div>

            {isOwnerCtx && (
              <>
                <div className="h-[1px] bg-[#1f2023] my-1 mx-2" />

                <div 
                  className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between"
                  onClick={() => {
                    setSelectedCommunity(contextMenu.community);
                    setShowCreateChannel(true);
                    closeContextMenu();
                  }}
                >
                  <span>Tạo kênh</span>
                </div>
                
                <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                  <span>Tạo Danh Mục</span>
                </div>
                
                <div className="px-2 py-1.5 mx-2 cursor-pointer rounded hover:bg-[#5865F2] hover:text-white transition-colors flex items-center justify-between">
                  <span>Tạo Sự kiện</span>
                </div>
              </>
            )}
          </div>
        </div>
        );
      })()}

      {/* Community Settings Modal */}
      <CommunitySettingsModal 
        isOpen={showCommunitySettings}
        onClose={() => setShowCommunitySettings(false)}
        community={selectedCommunity}
        onUpdate={(updatedComm) => {
          // Update the specific community in myCommunities state
          setMyCommunities(prev => prev.map(c => c._id === updatedComm._id ? updatedComm : c));
          setSelectedCommunity(updatedComm);
        }}
      />

      {/* Channel Settings Modal */}
      {selectedCommunity && settingChannel && (
        <ChannelSettingsModal
          isOpen={!!settingChannel}
          onClose={() => setSettingChannel(null)}
          channel={settingChannel}
          communityId={selectedCommunity._id}
          onUpdate={(updatedChannel) => {
            setCommunityChannels(prev => prev.map(c => c._id === updatedChannel._id ? updatedChannel : c));
            setSettingChannel(updatedChannel);
            if (selectedChannel?._id === updatedChannel._id) {
              setSelectedChannel(updatedChannel);
            }
          }}
          onDelete={(deletedChannelId) => {
            const remaining = communityChannels.filter(c => c._id !== deletedChannelId);
            setCommunityChannels(remaining);
            if (selectedChannel?._id === deletedChannelId) {
              if (remaining.length > 0) {
                setSelectedChannel(remaining[0]);
                navigate(`/community/${selectedCommunity._id}/channel/${remaining[0]._id}`);
              } else {
                setSelectedChannel(null);
                navigate(`/community/${selectedCommunity._id}`);
              }
            }
          }}
        />
      )}
    </div>
  );
}
