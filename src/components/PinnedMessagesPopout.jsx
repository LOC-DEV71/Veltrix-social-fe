import React, { useState, useEffect, useRef } from 'react';
import { Pin, X, Loader2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';

export default function PinnedMessagesPopout({ channelId, isOpen, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const popoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !channelId) return;
    
    setLoading(true);
    axiosClient.get(`/api/messages/${channelId}?pinned=true`)
      .then(res => {
        if (res.data.status === 'success' && res.data.data) {
          setMessages(res.data.data.filter(m => m.isPinned));
        }
      })
      .catch(err => console.error('Failed to load pinned messages', err))
      .finally(() => setLoading(false));
  }, [isOpen, channelId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoutRef.current && !popoutRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleUnpin = async (msgId, e) => {
    e.stopPropagation();
    try {
      const res = await axiosClient.put(`/api/messages/${channelId}/${msgId}/pin`);
      if (res.data.success) {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      }
    } catch (error) {
      console.error('Unpin error:', error);
    }
  };

  const handleJumpToMessage = (msgId) => {
    const el = document.getElementById(`message-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-[#5865F2]/20');
      setTimeout(() => el.classList.remove('bg-[#5865F2]/20'), 2000);
    } else {
      // Message not in DOM, we can try to navigate or alert
      alert('Tin nhắn này ở quá xa, tính năng cuộn đến tin nhắn cũ đang phát triển!');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 z-50">
      <div 
        ref={popoutRef}
        className="w-[420px] max-h-[600px] bg-[#2b2d31] border border-[#1f2023] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1f2023] bg-[#313338]">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Pin className="w-5 h-5 text-[#b5bac1]" /> Tin nhắn đã ghim
            </h3>
            <p className="text-[#b5bac1] text-xs mt-0.5">Hiển thị các tin nhắn quan trọng trong kênh</p>
          </div>
          <button onClick={onClose} className="text-[#b5bac1] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[100px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-[#5865F2] mb-2" />
              <span className="text-sm text-[#949ba4]">Đang tải...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-8 text-center">
              <div className="w-16 h-16 bg-[#313338] rounded-full flex items-center justify-center mb-4">
                <Pin className="w-8 h-8 text-[#949ba4]" />
              </div>
              <p className="text-[#dbdee1] font-medium mb-1">Chưa có tin nhắn ghim nào</p>
              <p className="text-[#949ba4] text-xs">Hãy sử dụng menu tin nhắn để ghim các tin nhắn quan trọng.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => {
                const sender = msg.sender || {};
                const avatar = sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.displayName || sender.username || 'U')}&background=5865f2&color=fff`;
                
                return (
                  <div 
                    key={msg._id}
                    className="group bg-[#313338] hover:bg-[#35373c] rounded-md p-3 transition-colors cursor-pointer border border-transparent hover:border-[#1f2023]"
                    onClick={() => handleJumpToMessage(msg._id)}
                  >
                    <div className="flex items-start gap-3">
                      <img src={avatar} alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white truncate text-sm">
                            {sender.displayName || sender.username}
                          </span>
                          <span className="text-[11px] text-[#949ba4] shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="text-[#dbdee1] text-sm break-words line-clamp-4 leading-relaxed">
                          {msg.content}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <span className="text-[#5865F2] text-xs font-medium block mt-1">
                              [Đính kèm {msg.attachments.length} tệp]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover actions */}
                    <div className="mt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="bg-[#2b2d31] hover:bg-rose-500 hover:text-white text-[#b5bac1] text-xs font-medium px-3 py-1.5 rounded transition-colors"
                        onClick={(e) => handleUnpin(msg._id, e)}
                      >
                        Bỏ ghim
                      </button>
                      <button 
                        className="bg-[#2b2d31] hover:bg-[#5865F2] hover:text-white text-[#b5bac1] text-xs font-medium px-3 py-1.5 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToMessage(msg._id);
                        }}
                      >
                        Đi tới
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
