import React, { useState, useEffect } from 'react';
import { X, Search, Hash, Loader2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';

export default function ForwardMessageModal({ isOpen, onClose, message, myCommunities, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [channelsByCommunity, setChannelsByCommunity] = useState({});
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    if (isOpen && myCommunities.length > 0) {
      // Fetch channels for all communities to allow searching and selecting
      const fetchAllChannels = async () => {
        setIsLoadingChannels(true);
        try {
          const promises = myCommunities.map(c => 
            axiosClient.get(`/api/communities/${c.community?._id || c._id}/channels`)
              .then(res => ({
                communityId: c.community?._id || c._id,
                channels: res.data?.data || []
              }))
              .catch(() => ({
                communityId: c.community?._id || c._id,
                channels: []
              }))
          );
          
          const results = await Promise.all(promises);
          const channelsMap = {};
          results.forEach(res => {
            channelsMap[res.communityId] = res.channels.filter(ch => ch.type === 'text');
          });
          setChannelsByCommunity(channelsMap);
        } catch (err) {
          console.error('Lỗi khi lấy danh sách kênh:', err);
        } finally {
          setIsLoadingChannels(false);
        }
      };
      fetchAllChannels();
    }
  }, [isOpen, myCommunities]);

  if (!isOpen || !message) return null;

  const handleForward = async () => {
    if (!selectedChannelId || !selectedCommunityId) return;
    setIsForwarding(true);
    
    try {
      const payload = {
        content: message.content || '',
        communityId: selectedCommunityId,
        forwardedAttachments: JSON.stringify(message.attachments || [])
      };
      
      await axiosClient.post(`/api/messages/${selectedChannelId}`, payload);
      onClose();
    } catch (error) {
      console.error('Lỗi khi chuyển tiếp:', error);
      alert('Có lỗi xảy ra khi chuyển tiếp tin nhắn.');
    } finally {
      setIsForwarding(false);
    }
  };

  const filteredCommunities = myCommunities.filter(c => {
    const community = c.community || c;
    if (searchQuery) {
      const channels = channelsByCommunity[community._id] || [];
      const hasMatchingChannel = channels.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCommunity = community.name.toLowerCase().includes(searchQuery.toLowerCase());
      return hasMatchingChannel || matchesCommunity;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#313338] w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#dbdee1]">Chuyển tiếp tin nhắn</h2>
            <p className="text-sm text-[#b5bac1]">Chọn kênh để chuyển tiếp tin nhắn này.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#2b2d31] rounded-full text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="px-4 py-3 bg-[#2b2d31]/50 border-b border-[#1f2023] shrink-0">
          <div className="flex gap-3">
            <img 
              src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.displayName || message.sender?.username || 'U')}&background=5865f2&color=fff`} 
              className="w-8 h-8 rounded-full shrink-0"
              alt="avatar" 
            />
            <div className="min-w-0">
              <span className="font-semibold text-sm text-[#dbdee1] block">{message.sender?.displayName || message.sender?.username}</span>
              <span className="text-sm text-[#b5bac1] truncate block">{message.content || (message.attachments?.length > 0 ? '[Tệp đính kèm]' : '')}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 shrink-0">
          <div className="bg-[#1e1f22] rounded flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-[#949ba4] mr-2 shrink-0" />
            <input 
              type="text"
              placeholder="Tìm kiếm máy chủ hoặc kênh..."
              className="bg-transparent border-none outline-none text-[#dbdee1] text-sm flex-1 placeholder:text-[#949ba4]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
          {isLoadingChannels ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#5865F2] animate-spin" />
            </div>
          ) : (
            filteredCommunities.map(c => {
              const community = c.community || c;
              const channels = channelsByCommunity[community._id] || [];
              const filteredChannels = channels.filter(ch => 
                searchQuery ? ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || community.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
              );

              if (filteredChannels.length === 0) return null;

              return (
                <div key={community._id} className="mb-4">
                  <div className="px-2 py-1 mb-1">
                    <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">{community.name}</span>
                  </div>
                  {filteredChannels.map(ch => (
                    <div 
                      key={ch._id}
                      className={`flex items-center gap-3 px-2 py-2 rounded cursor-pointer transition-colors ${
                        selectedChannelId === ch._id ? 'bg-[#5865F2]/20' : 'hover:bg-[#3f4147]/50'
                      }`}
                      onClick={() => {
                        setSelectedChannelId(ch._id);
                        setSelectedCommunityId(community._id);
                      }}
                    >
                      <div className={`p-1.5 rounded-full ${selectedChannelId === ch._id ? 'bg-[#5865F2]' : 'bg-[#2b2d31]'}`}>
                        <Hash className={`w-4 h-4 ${selectedChannelId === ch._id ? 'text-white' : 'text-[#949ba4]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block truncate ${selectedChannelId === ch._id ? 'text-[#dbdee1] font-semibold' : 'text-[#b5bac1]'}`}>
                          {ch.name}
                        </span>
                      </div>
                      {selectedChannelId === ch._id && (
                        <div className="w-4 h-4 rounded-full border-4 border-[#5865F2]" />
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f2023] bg-[#2b2d31] rounded-b-lg flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#dbdee1] hover:underline"
            disabled={isForwarding}
          >
            Hủy
          </button>
          <button 
            onClick={handleForward}
            disabled={!selectedChannelId || isForwarding}
            className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isForwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Gửi chuyển tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
