import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  Phone, Video, UserPlus, UserMinus, ShieldAlert, Hand, PlusCircle, Gift, Image as ImageIcon, 
  Smile, Send, Search, Loader2, Sparkles, AlertCircle, X, CornerUpLeft, MessageSquare, PanelRightClose, PanelRight, Users
} from 'lucide-react';
import dmService from '../../services/client/dmService';
import friendService from '../../services/client/friendService';
import { API_BASE_URL } from '../../utils/config';
import { useTitle } from '../../hooks/useTitle';
import EmojiPicker from 'emoji-picker-react';
import MemberProfilePopout from '../../components/MemberProfilePopout';

export default function DirectMessagePage() {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = useSelector((state) => state.auth.user);
  const onlineUserIds = outletContext?.onlineUserIds || new Set();

  const [room, setRoom] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [mutualCommunities, setMutualCommunities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMutualModal, setShowMutualModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useTitle(recipient ? `@${recipient.displayName || recipient.username}` : 'Tin nhắn trực tiếp');

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load or create DM Room & Fetch messages
  useEffect(() => {
    if (!recipientId || !user?._id) return;

    let isMounted = true;
    setLoading(true);

    dmService.getOrCreateDMRoom(recipientId)
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setRoom(res.data.room);
          setRecipient(res.data.recipient);
          setMutualCommunities(res.data.mutualCommunities || []);

          // Fetch DM messages
          return dmService.getDMMessages(res.data.room._id);
        }
      })
      .then(resMsg => {
        if (!isMounted) return;
        if (resMsg && resMsg.success && resMsg.data) {
          setMessages(resMsg.data);
        }
      })
      .catch(err => {
        console.error('🔴 Failed to load DM room:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recipientId, user?._id]);

  // Socket management for DM Room
  useEffect(() => {
    if (!room?._id || !user?._id) return;

    if (!socketRef.current) {
      socketRef.current = io(API_BASE_URL, {
        withCredentials: true
      });
    }

    const socket = socketRef.current;

    const handleConnect = () => {
      socket.emit('join_dm_room', room._id);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);

    const handleReceiveDM = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleDMTypingStart = ({ user: typingUser }) => {
      setTypingUsers(prev => {
        if (prev.some(u => u._id === typingUser._id)) return prev;
        return [...prev, typingUser];
      });
    };

    const handleDMTypingStop = ({ user: typingUser }) => {
      setTypingUsers(prev => prev.filter(u => u._id !== typingUser._id));
    };

    socket.on('receive_dm_message', handleReceiveDM);
    socket.on('dm_typing_start', handleDMTypingStart);
    socket.on('dm_typing_stop', handleDMTypingStop);

    return () => {
      socket.emit('leave_dm_room', room._id);
      socket.off('connect', handleConnect);
      socket.off('receive_dm_message', handleReceiveDM);
      socket.off('dm_typing_start', handleDMTypingStart);
      socket.off('dm_typing_stop', handleDMTypingStop);
    };
  }, [room?._id, user?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !room?._id) return;

    const contentToSend = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      const res = await dmService.sendDirectMessage(room._id, { content: contentToSend });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        
        // Emit via socket
        socketRef.current?.emit('send_dm_message', {
          roomId: room._id,
          message: res.data
        });
      }
    } catch (err) {
      console.error('🔴 Error sending DM:', err);
      alert('Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handleSendWave = async () => {
    if (!room?._id || sending) return;
    try {
      setSending(true);
      const waveContent = '👋 Vẫy tay chào!';
      const res = await dmService.sendDirectMessage(room._id, { content: waveContent });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        socketRef.current?.emit('send_dm_message', { roomId: room._id, message: res.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (!socketRef.current || !room?._id || !user) return;

    socketRef.current.emit('dm_typing_start', {
      roomId: room._id,
      user: { _id: user._id, username: user.displayName || user.username }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('dm_typing_stop', {
        roomId: room._id,
        user: { _id: user._id }
      });
    }, 2000);
  };

  const isOnline = recipient ? onlineUserIds.has(String(recipient._id || recipient.id)) : false;
  const avatarSrc = recipient?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.displayName || recipient?.username || 'User')}&background=2b2d31&color=fff`;

  return (
    <div className="flex h-full w-full bg-[#313338] text-[#dbdee1] overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <div className="h-12 border-b border-[#1f2023] flex items-center justify-between px-4 shrink-0 shadow-sm z-10 bg-[#313338]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-8 h-8 rounded-full">
              <img src={avatarSrc} alt={recipient?.username} className="w-full h-full rounded-full object-cover" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-white text-[15px] truncate">{recipient?.displayName || recipient?.username}</span>
              <span className="text-xs text-[#949ba4] truncate">@{recipient?.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#b5bac1]">
            <button className="hover:text-white transition-colors" title="Cuộc gọi thoại (Mock)">
              <Phone className="w-5 h-5" />
            </button>
            <button className="hover:text-white transition-colors" title="Cuộc gọi video (Mock)">
              <Video className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowRightSidebar(prev => !prev)}
              className={`hover:text-white transition-colors ${showRightSidebar ? 'text-white' : ''}`}
              title="Xem hồ sơ người dùng"
            >
              {showRightSidebar ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* Discord Header Greeting Banner */}
              <div className="mb-8 pt-4">
                <div className="relative w-20 h-20 rounded-full mb-4">
                  <img src={avatarSrc} alt={recipient?.username} className="w-full h-full rounded-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">{recipient?.displayName || recipient?.username}</h1>
                <p className="text-lg text-[#b5bac1] font-semibold mb-2">{recipient?.username}</p>
                <p className="text-sm text-[#949ba4] mb-4">
                  Đây là phần mở đầu trong lịch sử các tin nhắn trực tiếp của bạn với <span className="font-semibold text-white">{recipient?.displayName || recipient?.username}</span>.
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                  {mutualCommunities && mutualCommunities.length > 0 ? (
                    <button 
                      onClick={() => setShowMutualModal(true)}
                      className="px-3 py-1.5 rounded bg-[#2b2d31] hover:bg-[#35373c] text-xs text-[#5865F2] font-semibold border border-[#1e1f22] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={mutualCommunities.map(c => c.name).join(', ')}
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {mutualCommunities.length} máy chủ chung
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded bg-[#2b2d31] text-xs text-[#949ba4] font-medium border border-[#1e1f22]">
                      Không có máy chủ chung
                    </span>
                  )}
                  <button 
                    onClick={handleSendWave}
                    className="px-4 py-1.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Hand className="w-4 h-4" /> Vẫy tay tới {recipient?.displayName || recipient?.username}
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="space-y-3">
                {messages.map((msg) => {
                  const sender = msg.sender || {};
                  const isMe = String(sender._id || sender.id) === String(user?._id);
                  const msgAvatar = sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.displayName || sender.username || 'User')}&background=2b2d31&color=fff`;

                  return (
                    <div key={msg._id} className="flex items-start gap-3 group hover:bg-[#2e3035]/60 -mx-4 px-4 py-1.5 rounded transition-colors relative">
                      <img src={msgAvatar} alt={sender.username} className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-semibold text-sm ${isMe ? 'text-indigo-400' : 'text-white'}`}>
                            {sender.displayName || sender.username}
                          </span>
                          <span className="text-[11px] text-[#949ba4]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 shrink-0 bg-[#313338]">
          <form onSubmit={handleSendMessage} className="relative bg-[#383a40] rounded-lg p-2.5 flex items-center gap-2">
            <button type="button" className="text-[#b5bac1] hover:text-white p-1 transition-colors">
              <PlusCircle className="w-6 h-6" />
            </button>
            
            <input 
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Nhắn @${recipient?.displayName || recipient?.username || ''}`}
              className="w-full bg-transparent text-sm text-white placeholder-[#80848e] outline-none"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className="text-[#b5bac1] hover:text-yellow-400 p-1 transition-colors"
              >
                <Smile className="w-6 h-6" />
              </button>
              <button 
                type="submit" 
                disabled={!inputText.trim() || sending}
                className="bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-gray-600 text-white p-2 rounded-md transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-14 z-50 shadow-2xl">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setInputText(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme="dark"
                />
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Right Sidebar: Recipient Profile Panel */}
      {showRightSidebar && recipient && (
        <div className="w-[340px] bg-[#232428] border-l border-[#1f2023] flex flex-col h-full shrink-0 overflow-y-auto no-scrollbar">
          {/* Header Banner */}
          <div className="relative h-28 bg-[#18191c]">
            {recipient.bannerImage && (
              <img src={recipient.bannerImage} alt="banner" className="w-full h-full object-cover" />
            )}
            {/* Avatar with Frame */}
            <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-[#232428] bg-[#1e1f22]">
              <img src={avatarSrc} alt={recipient.username} className="w-full h-full rounded-full object-cover" />
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#232428] ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
            </div>
          </div>

          {/* User Info Section */}
          <div className="pt-12 px-4 pb-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">{recipient.displayName || recipient.username}</h2>
              <p className="text-xs text-[#b5bac1]">@{recipient.username}</p>
            </div>

            <div className="border-t border-[#35373c] pt-4 space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-1">Gia nhập từ</h4>
                <p className="text-white font-medium">{new Date(recipient.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
              </div>

              {recipient.customStatus?.text && (
                <div>
                  <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-1">Trạng thái</h4>
                  <p className="text-white italic">{recipient.customStatus.text}</p>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button 
                onClick={() => navigate('/friends')}
                className="w-full py-2 bg-[#35373c] hover:bg-[#404249] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Xem danh sách bạn bè
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mutual Servers Modal */}
      {showMutualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-[#3f4147]/50 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5865F2]" />
                Máy chủ chung ({mutualCommunities.length})
              </h3>
              <button onClick={() => setShowMutualModal(false)} className="text-[#949ba4] hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mutualCommunities.map((c) => (
                <div 
                  key={c._id}
                  className="flex items-center justify-between bg-[#2b2d31] p-3 rounded-lg hover:bg-[#35373c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e1f22] overflow-hidden flex items-center justify-center font-bold text-white shrink-0">
                      {c.icon ? <img src={c.icon} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-white text-sm">{c.name}</span>
                  </div>

                  <button 
                    onClick={() => {
                      setShowMutualModal(false);
                      navigate(`/community/${c._id}`);
                    }}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Đến máy chủ
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
