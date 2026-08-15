import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, UserMinus, Search, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import friendService from '../../services/client/friendService';
import { io } from 'socket.io-client';
import axiosClient from '../../services/axiosClient';
import { useTitle } from '../../hooks/useTitle';

import { API_BASE_URL } from '../../utils/config';

export default function FriendsPage() {
  useTitle('Bạn bè');
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState('online');
  const [friendsData, setFriendsData] = useState({ friends: [], friendRequests: [], blockedUsers: [] });
  const [loading, setLoading] = useState(true);
  const [addUsername, setAddUsername] = useState('');
  const [addStatus, setAddStatus] = useState({ type: '', message: '' });
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchFriendsData();

    // Init Socket for Realtime notifications
    const newSocket = io(API_BASE_URL, {
      withCredentials: true
    });

    if (!newSocket.connected) {
      newSocket.connect();
    }

    const handleConnect = () => {
      if (user?._id) {
        newSocket.emit('join_user_room', user._id);
      }
      newSocket.emit('get_online_users', (userIdsArray) => {
        if (userIdsArray) setOnlineUserIds(new Set(userIdsArray));
      });
    };

    if (newSocket.connected) {
      handleConnect();
    }

    newSocket.on('connect', handleConnect);

    newSocket.on('friend_request_received', (data) => {
      fetchFriendsData();
    });

    newSocket.on('friend_request_accepted', (data) => {
      fetchFriendsData();
    });

    newSocket.on('community_invite_received', () => {
      fetchFriendsData();
    });

    newSocket.on('friend_removed', () => {
      fetchFriendsData();
    });

    // Listen for global online status changes
    newSocket.on('user_status_change', ({ userId, isOnline }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        const uStr = String(userId);
        if (isOnline) next.add(uStr);
        else next.delete(uStr);
        return next;
      });
    });

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('friend_request_received');
      newSocket.off('community_invite_received');
      newSocket.off('friend_request_accepted');
      newSocket.off('friend_removed');
      newSocket.off('user_status_change');
    };
  }, [user?._id]);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const res = await friendService.getFriendsData();
      if (res.success) {
        setFriendsData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch friends data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!addUsername.trim()) return;

    try {
      setAddStatus({ type: 'loading', message: '' });
      const res = await friendService.sendFriendRequest(addUsername);
      setAddStatus({ type: 'success', message: res.message });
      setAddUsername('');
      fetchFriendsData();
    } catch (err) {
      setAddStatus({ type: 'error', message: err.message || 'Lỗi gửi yêu cầu kết bạn.' });
    }
  };

  const handleAccept = async (targetId) => {
    try {
      await friendService.acceptFriendRequest(targetId);
      fetchFriendsData();
    } catch (err) {
      alert(err.message || 'Lỗi');
    }
  };

  const handleDecline = async (targetId) => {
    try {
      await friendService.declineFriendRequest(targetId);
      fetchFriendsData();
    } catch (err) {
      alert(err.message || 'Lỗi');
    }
  };

  const handleRemoveFriend = async (targetId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return;
    try {
      await friendService.removeFriend(targetId);
      fetchFriendsData();
    } catch (err) {
      alert(err.message || 'Lỗi');
    }
  };

  const handleAcceptCommunityInvite = async (communityId) => {
    try {
      await axiosClient.post(`/api/communities/${communityId}/join`);
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineCommunityInvite = async (communityId) => {
    try {
      await axiosClient.post(`/api/communities/${communityId}/decline-invite`);
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Derived state
  const friends = friendsData.friends || [];
  const pendingRequests = friendsData.friendRequests || [];
  
  // Real-time online filtering
  const onlineFriends = friends.filter(f => onlineUserIds.has(String(f._id || f.id)));
  const offlineFriends = friends.filter(f => !onlineUserIds.has(String(f._id || f.id))); 

  const incomingRequests = pendingRequests.filter(req => req.type === 'incoming');
  const outgoingRequests = pendingRequests.filter(req => req.type === 'outgoing');
  const communityInvites = friendsData.communityInvites || [];
  const totalPending = incomingRequests.length + communityInvites.length;

  const renderFriendCard = (friend, isRequest = false, reqType = null) => {
    const avatarSrc = friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || friend.username || 'User')}&background=2b2d31&color=fff`;
    const isOnline = onlineUserIds.has(String(friend._id || friend.id));

    return (
      <div key={friend._id} className={`relative flex items-center justify-between p-3 rounded-lg hover:bg-[#35373c]/80 border-t border-[#1f2023] group transition-all overflow-hidden ${!isOnline && !isRequest ? 'opacity-60 hover:opacity-100' : ''}`}>
        {/* Nameplate Background */}
        {(friend.activeNameplateStaticUrl || friend.activeNameplateAnimatedUrl) && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 opacity-80 mix-blend-screen">
              <img src={friend.activeNameplateStaticUrl || friend.activeNameplateAnimatedUrl} className="absolute inset-0 w-full h-full object-cover object-left group-hover:hidden" alt="Nameplate static" />
              <img src={friend.activeNameplateAnimatedUrl} className="absolute inset-0 w-full h-full object-cover object-left hidden group-hover:block" alt="Nameplate animated" />
            </div>
            {/* Gradient Overlay */}
            <div 
              className="absolute inset-0 z-10 mix-blend-overlay"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(220, 62, 151, 0.08) 20%, rgba(220, 62, 151, 0.08) 50%, rgba(220, 62, 151, 0.2) 100%)' }}
            />
          </div>
        )}

        <div className="relative z-10 flex items-center gap-3">
          {/* Avatar with Frame */}
          <div className={`relative shrink-0 w-10 h-10 rounded-full p-[2px] transition-all duration-300 ${
            friend.activeFrame ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-[#1e1f22]'
          }`}>
            <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800">
              <img src={avatarSrc} alt={friend.username} className={`w-full h-full rounded-full object-cover ${!isOnline && !isRequest ? 'grayscale' : ''}`} />
            </div>
            {(() => {
              const staticUrl = friend.activeFrameStaticUrl || (friend.activeFrame && typeof friend.activeFrame === 'object' ? friend.activeFrame.staticUrl : null);
              const animatedUrl = friend.activeFrameAnimatedUrl || (friend.activeFrame && typeof friend.activeFrame === 'object' ? friend.activeFrame.animatedUrl : null);
              
              if (!staticUrl && !animatedUrl) return null;

              return (
                <div className="absolute -inset-[13%] pointer-events-none z-20">
                  {staticUrl && (
                    <img 
                      src={staticUrl} 
                      className={`w-full h-full object-contain pointer-events-none ${animatedUrl ? 'group-hover:hidden' : ''}`} 
                      alt="static frame" 
                    />
                  )}
                  {animatedUrl && (
                    <img 
                      src={animatedUrl} 
                      className={`w-full h-full object-contain pointer-events-none ${staticUrl ? 'absolute inset-0 hidden group-hover:block' : ''}`} 
                      alt="animated frame" 
                    />
                  )}
                </div>
              );
            })()}
            {!isRequest && (
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#313338] ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'} z-30`} />
            )}
          </div>
          <div className="flex flex-col drop-shadow-md">
            <span className="text-[#f2f3f5] font-semibold text-[15px]">{friend.displayName || friend.username}</span>
            <span className="text-[#b5bac1] text-[13px]">{friend.username}</span>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2">
          {isRequest ? (
            reqType === 'incoming' ? (
              <>
                <button onClick={() => handleAccept(friend._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#23a55a] hover:text-white text-[#b5bac1] transition-colors shadow-md" title="Chấp nhận">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => handleDecline(friend._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-rose-500 hover:text-white text-[#b5bac1] transition-colors shadow-md" title="Từ chối">
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button onClick={() => handleDecline(friend._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-rose-500 hover:text-white text-[#b5bac1] transition-colors shadow-md" title="Hủy lời mời">
                <X className="w-5 h-5" />
              </button>
            )
          ) : (
            <button onClick={() => handleRemoveFriend(friend._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-rose-500 hover:text-white text-[#b5bac1] transition-colors opacity-0 group-hover:opacity-100 shadow-md" title="Hủy kết bạn">
              <UserMinus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#313338] text-[#dbdee1]">
      {/* Top Header */}
      <div className="h-12 border-b border-[#1f2023] flex items-center px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 font-bold text-white border-r border-[#3f4147] pr-4 mr-4">
          <Users className="w-5 h-5 text-[#949ba4]" />
          <span>Bạn bè</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 text-sm font-medium">
          <button onClick={() => setActiveTab('online')} className={`px-2 py-1 rounded transition-colors ${activeTab === 'online' ? 'bg-[#3f4147] text-white' : 'hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>Trực tuyến</button>
          <button onClick={() => setActiveTab('all')} className={`px-2 py-1 rounded transition-colors ${activeTab === 'all' ? 'bg-[#3f4147] text-white' : 'hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>Tất cả</button>
          <button onClick={() => setActiveTab('pending')} className={`px-2 py-1 rounded transition-colors ${activeTab === 'pending' ? 'bg-[#3f4147] text-white' : 'hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
            Đang chờ {totalPending > 0 && <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{totalPending}</span>}
          </button>
          <button onClick={() => setActiveTab('add')} className={`px-2 py-1 rounded transition-colors ${activeTab === 'add' ? 'text-[#23a55a]' : 'bg-[#23a55a] text-white hover:bg-[#1a7f44]'}`}>Thêm bạn</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {activeTab === 'add' ? (
              <div className="w-full max-w-2xl text-left">
                <h2 className="text-white font-bold mb-2 uppercase text-[15px]">Thêm bạn</h2>
                <p className="text-[13px] text-[#b5bac1] mb-4">Bạn có thể thêm bạn bè bằng tên người dùng (username) của họ.</p>
                
                <form onSubmit={handleAddFriend} className={`flex items-center bg-[#1e1f22] border rounded-lg p-2 transition-all ${addStatus.type === 'success' ? 'border-emerald-500' : addStatus.type === 'error' ? 'border-rose-500' : 'border-[#1e1f22] focus-within:border-[#5865F2]'}`}>
                  <input 
                    type="text" 
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Nhập username của bạn bè" 
                    className="flex-1 bg-transparent text-[#dbdee1] placeholder-[#80848e] text-[15px] outline-none px-2"
                  />
                  <button type="submit" disabled={!addUsername.trim() || addStatus.type === 'loading'} className="bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#5865F2]/50 text-white text-sm font-medium py-2 px-4 rounded transition-colors">
                    Gửi Yêu Cầu Kết Bạn
                  </button>
                </form>
                {addStatus.message && (
                  <p className={`text-[13px] mt-2 ${addStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{addStatus.message}</p>
                )}

                <div className="mt-10 border-t border-[#3f4147] pt-8 flex flex-col items-center">
                  <div className="w-56 h-56 bg-[#2b2d31] rounded-full mb-8 flex items-center justify-center border-4 border-[#1f2023] shadow-lg">
                    <Search className="w-20 h-20 text-[#3f4147]" />
                  </div>
                  <p className="text-[#949ba4] text-[15px]">Wumpus đang đợi bạn bè. Không cần phải tìm Wumpus.</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-3xl">
                {/* Lists rendering based on tab */}
                {activeTab === 'online' && (
                  <>
                    <h3 className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-4 border-b border-[#3f4147] pb-4">Trực tuyến — {onlineFriends.length}</h3>
                    {onlineFriends.length > 0 ? (
                      onlineFriends.map(f => renderFriendCard(f))
                    ) : (
                      <EmptyState icon={<Users className="w-20 h-20" />} text="Không có ai ở đây để chơi cùng Wumpus." />
                    )}
                  </>
                )}

                {activeTab === 'all' && (
                  <>
                    <h3 className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-4 border-b border-[#3f4147] pb-4">Tất cả bạn bè — {friends.length}</h3>
                    {friends.length > 0 ? (
                      friends.map(f => renderFriendCard(f))
                    ) : (
                      <EmptyState icon={<Users className="w-20 h-20" />} text="Bạn chưa có người bạn nào. Hãy thêm bạn bè nhé!" />
                    )}
                  </>
                )}

                {activeTab === 'pending' && (
                  <>
                    <h3 className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-4 border-b border-[#3f4147] pb-4">Đang chờ — {pendingRequests.length + communityInvites.length}</h3>
                    {(pendingRequests.length > 0 || communityInvites.length > 0) ? (
                      <div className="space-y-2">
                        {incomingRequests.length > 0 && <p className="text-[11px] font-bold text-[#949ba4] uppercase">Yêu cầu nhận được</p>}
                        {incomingRequests.map(req => renderFriendCard(req.user, true, 'incoming'))}
                        
                        {outgoingRequests.length > 0 && <p className="text-[11px] font-bold text-[#949ba4] uppercase mt-4">Yêu cầu đã gửi</p>}
                        {outgoingRequests.map(req => renderFriendCard(req.user, true, 'outgoing'))}

                        {communityInvites.length > 0 && <p className="text-[11px] font-bold text-[#949ba4] uppercase mt-4">Lời mời tham gia máy chủ</p>}
                        {communityInvites.map(invite => (
                          <div key={invite._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#35373c] border border-transparent hover:border-[#3f4147] transition-all group">
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#1e1f22] rounded-[16px] overflow-hidden flex items-center justify-center shrink-0">
                                {invite.community.icon ? (
                                  <img src={invite.community.icon.startsWith('http') || invite.community.icon.startsWith('data:') ? invite.community.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${invite.community.icon}`} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg">{invite.community.name.charAt(0)}</span>
                                )}
                              </div>
                              <div className="flex flex-col drop-shadow-md">
                                <span className="text-[#f2f3f5] font-semibold text-[15px]">{invite.community.name}</span>
                                <span className="text-[#b5bac1] text-[13px]">Từ {invite.inviter?.displayName || invite.inviter?.username}</span>
                              </div>
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                              <button onClick={() => handleAcceptCommunityInvite(invite.community._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#23a55a] hover:text-white text-[#b5bac1] transition-colors shadow-md" title="Chấp nhận tham gia">
                                <Check className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDeclineCommunityInvite(invite.community._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-rose-500 hover:text-white text-[#b5bac1] transition-colors shadow-md" title="Từ chối">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={<UserPlus className="w-20 h-20" />} text="Không có yêu cầu kết bạn hay lời mời máy chủ nào đang chờ." />
                    )}
                  </>
                )}
                
                {activeTab === 'blocked' && (
                  <>
                    <h3 className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-4 border-b border-[#3f4147] pb-4">Bị chặn — {friendsData.blockedUsers?.length || 0}</h3>
                    <EmptyState icon={<UserMinus className="w-20 h-20" />} text="Bạn chưa chặn ai cả." />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center text-center mt-10">
    <div className="w-56 h-56 bg-[#2b2d31] rounded-full mb-8 flex items-center justify-center border-4 border-[#1f2023] shadow-lg text-[#3f4147]">
      {icon}
    </div>
    <p className="text-[#949ba4] text-[15px]">{text}</p>
  </div>
);
