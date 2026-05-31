import React, { useState, useEffect } from 'react';
import { X, Search, Link as LinkIcon, UserPlus, Check } from 'lucide-react';
import friendService from '../services/client/friendService';
import axiosClient from '../services/axiosClient';
import { useUserStore } from '../store/useUserStore';

export default function InviteModal({ isOpen, onClose, community }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitedMap, setInvitedMap] = useState({});
  const [copied, setCopied] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setInvitedMap({});
      setCopied(false);
      fetchFriends();
    }
  }, [isOpen, community]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const data = await friendService.getFriendsData();
      if (data.success) {
        setFriends(data.data?.friends || []);
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (friendId) => {
    try {
      setInvitedMap(prev => ({ ...prev, [friendId]: 'loading' }));
      const res = await axiosClient.post(`/api/communities/${community._id}/add-member`, {
        targetUserId: friendId
      });
      if (res.data.success) {
        setInvitedMap(prev => ({ ...prev, [friendId]: 'success' }));
      }
    } catch (err) {
      console.error('Failed to invite:', err);
      // Even if they are already in the server, mark as success (or "joined")
      if (err.message && err.message.includes('thành viên')) {
         setInvitedMap(prev => ({ ...prev, [friendId]: 'joined' }));
      } else {
         setInvitedMap(prev => ({ ...prev, [friendId]: 'error' }));
      }
    }
  };

  const inviteLink = `${window.location.origin}/invite/${community?._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !community) return null;

  const filteredFriends = friends.filter(friend => {
    if (!friend) return false;
    
    const isMember = community?.members?.some(m => {
      const memberId = typeof m.user === 'object' ? m.user._id : m.user;
      return memberId === friend._id;
    });
    
    if (isMember) return false;

    return friend?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           friend?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#313338] w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-extrabold text-lg">Mời bạn bè vào {community.name}</h2>
              <p className="text-[#b5bac1] text-xs">Người nhận sẽ đến <span className="font-semibold text-white"># chung</span></p>
            </div>
            <button 
              onClick={onClose}
              className="text-[#b5bac1] hover:text-[#dbdee1] p-1.5 rounded-full hover:bg-[#3f4147] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm bạn bè" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f22] text-[#dbdee1] placeholder-[#949ba4] text-sm px-3 py-2 pl-9 rounded focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#949ba4] absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#1f2023]" />

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 h-[240px] no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#949ba4]">
              <UserPlus className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Bạn chưa có bạn bè nào.</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-[#949ba4] text-sm">
              Không tìm thấy bạn bè nào.
            </div>
          ) : (
            filteredFriends.map(friend => {
              if (!friend) return null;
              
              const status = invitedMap[friend._id];
              const isInvited = status === 'success';
              const isJoined = status === 'joined';
              
              return (
                <div key={friend._id} className="flex items-center justify-between p-2 rounded hover:bg-[#3f4147] transition-colors group">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}&background=2b2d31&color=fff`} 
                      alt={friend.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="text-[#dbdee1] font-semibold text-[15px]">{friend.displayName || friend.username}</span>
                      <span className="text-[#949ba4] text-xs">{friend.username}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleInvite(friend._id)}
                    disabled={status === 'loading' || isInvited || isJoined}
                    className={`px-4 py-1.5 text-sm font-semibold rounded transition-all ${
                      isInvited || isJoined
                        ? 'bg-transparent border border-green-500 text-green-500 cursor-default'
                        : 'bg-[#2b2d31] text-white hover:bg-[#23a55a] border border-[#2b2d31] hover:border-[#23a55a]'
                    }`}
                  >
                    {status === 'loading' ? 'Đang mời...' : isJoined ? 'Đã tham gia' : isInvited ? 'Đã mời' : 'Mời'}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer (Invite Link) */}
        <div className="p-4 bg-[#2b2d31]">
          <h3 className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Hoặc, gửi link mời cho họ</h3>
          <div className="flex items-center bg-[#1e1f22] rounded p-1">
            <input 
              type="text" 
              readOnly 
              value={inviteLink}
              className="flex-1 bg-transparent text-[#dbdee1] text-sm px-2 focus:outline-none"
            />
            <button 
              onClick={handleCopyLink}
              className={`px-4 py-1.5 rounded text-sm font-semibold transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <p className="text-xs text-[#949ba4] mt-2">
            Link mời của bạn sẽ hết hạn sau 30 ngày. <span className="text-indigo-400 hover:underline cursor-pointer">Chỉnh sửa link mời.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
