import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  Phone, Video, UserPlus, UserMinus, ShieldAlert, Hand, PlusCircle, Gift, Image as ImageIcon, 
  Smile, Send, Search, Loader2, Sparkles, AlertCircle, X, CornerUpLeft, MessageSquare, PanelRightClose, PanelRight, Users, MoreHorizontal, Crown
} from 'lucide-react';
import dmService from '../../services/client/dmService';
import friendService from '../../services/client/friendService';
import { API_BASE_URL } from '../../utils/config';
import { useTitle } from '../../hooks/useTitle';
import EmojiPicker from 'emoji-picker-react';
import MemberProfilePopout from '../../components/MemberProfilePopout';
import LoopingAPNG from '../../components/LoopingAPNG';
import SequentialAPNGLayers from '../../components/SequentialAPNGLayers';

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

  const getFrameInfo = (userObj) => {
    if (!userObj) return null;
    if (userObj.activeFrameAnimatedUrl) return { animatedUrl: userObj.activeFrameAnimatedUrl, staticUrl: userObj.activeFrameStaticUrl };
    if (userObj.activeFrame && typeof userObj.activeFrame === 'object' && userObj.activeFrame.animatedUrl) {
      return { animatedUrl: userObj.activeFrame.animatedUrl, staticUrl: userObj.activeFrame.staticUrl };
    }
    return null;
  };

  const getNameplateInfo = (userObj) => {
    if (!userObj) return null;
    if (userObj.activeNameplateAnimatedUrl) return { animatedUrl: userObj.activeNameplateAnimatedUrl, staticUrl: userObj.activeNameplateStaticUrl || userObj.activeNameplateAnimatedUrl };
    if (userObj.activeNameplate && typeof userObj.activeNameplate === 'object' && userObj.activeNameplate.animatedUrl) {
      return { animatedUrl: userObj.activeNameplate.animatedUrl, staticUrl: userObj.activeNameplate.staticUrl || userObj.activeNameplate.animatedUrl };
    }
    return null;
  };

  const getProfileEffectInfo = (userObj) => {
    if (!userObj) return null;
    const layers = userObj.activeProfileEffectLayers || userObj.activeProfileEffect?.effectLayers || [];
    if (userObj.activeProfileEffectAnimatedUrl) {
      return { 
        animatedUrl: userObj.activeProfileEffectAnimatedUrl, 
        staticUrl: userObj.activeProfileEffectStaticUrl,
        layers 
      };
    }
    if (userObj.activeProfileEffect && typeof userObj.activeProfileEffect === 'object') {
      return { 
        animatedUrl: userObj.activeProfileEffect.animatedUrl, 
        staticUrl: userObj.activeProfileEffect.staticUrl,
        layers: userObj.activeProfileEffect.effectLayers || layers 
      };
    }
    return null;
  };

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

  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@everyone|@[^\s]+|https?:\/\/[^\s]+)/g);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part === '@everyone' || part.startsWith('@')) {
        return <span key={i} className="bg-indigo-500/40 text-indigo-200 font-bold px-1.5 py-0.5 rounded mx-[1px]">{part}</span>;
      }
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

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

                  {(!messages || messages.length === 0) && (
                    <button 
                      onClick={handleSendWave}
                      className="px-4 py-1.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Hand className="w-4 h-4" /> Vẫy tay tới {recipient?.displayName || recipient?.username}
                    </button>
                  )}
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
                        <p className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">
                          {renderMessageContent(msg.content)}
                        </p>
                        {msg.linkMetadata && <LinkPreview linkMetadata={msg.linkMetadata} />}
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
      {showRightSidebar && recipient && (() => {
        const frameInfo = getFrameInfo(recipient);
        const nameplateInfo = getNameplateInfo(recipient);
        const effectInfo = getProfileEffectInfo(recipient);
        const bannerBg = recipient.bannerColor || '#85744a';
        const themePrimary = recipient.themeColors?.primary || bannerBg;
        const themeAccent = recipient.themeColors?.accent || bannerBg;

        return (
          <div 
            className="w-[340px] border-l flex flex-col h-full shrink-0 overflow-y-auto no-scrollbar relative transition-all shadow-2xl"
            style={{
              borderColor: themePrimary || bannerBg || '#1f2023',
              background: `linear-gradient(180deg, color-mix(in srgb, ${themePrimary} 35%, #111214) 0%, color-mix(in srgb, ${bannerBg} 20%, #111214) 40%, #111214 100%)`
            }}
          >
            {/* Profile Effect Overlay - Looping APNG or Sequential Multi-layer */}
            {effectInfo && (
              effectInfo.layers?.length > 0 ? (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
                  <SequentialAPNGLayers layers={effectInfo.layers} durationPerLayer={3000} />
                </div>
              ) : effectInfo.animatedUrl || effectInfo.staticUrl ? (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
                  <LoopingAPNG 
                    src={effectInfo.animatedUrl || effectInfo.staticUrl} 
                    className="w-full h-full object-fill opacity-90" 
                    alt="Profile Effect" 
                    duration={3000} 
                  />
                </div>
              ) : null
            )}

            {/* Header Banner */}
            <div className="relative h-32 w-full overflow-hidden shrink-0" style={{ backgroundColor: bannerBg }}>
              {recipient.bannerImage && (
                <img src={recipient.bannerImage} alt="banner" className="w-full h-full object-cover" />
              )}
              {nameplateInfo && (
                <div className="absolute inset-0 pointer-events-none opacity-90 mix-blend-screen z-10">
                  <img src={nameplateInfo.animatedUrl || nameplateInfo.staticUrl} alt="nameplate" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Top right Three Dots action button */}
              <div className="absolute top-2 right-2 z-20">
                <button className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Avatar Row (Placed outside overflow-hidden banner so avatar is NEVER clipped) */}
            <div className="relative px-4 pt-0 z-20 flex justify-between items-end">
              <div className="relative -mt-12 w-20 h-20 rounded-full border-4 border-[#232428] bg-[#1e1f22] shrink-0">
                <img src={avatarSrc} alt={recipient.username} className="w-full h-full rounded-full object-cover" />
                {frameInfo && (
                  <img 
                    src={frameInfo.animatedUrl || frameInfo.staticUrl} 
                    alt="avatar frame" 
                    className="absolute -top-3 -left-3 w-[130%] h-[130%] max-w-none object-contain pointer-events-none z-30" 
                  />
                )}
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#232428] z-40 ${isOnline ? 'bg-[#23a55a]' : 'bg-[#80848e]'}`} />
              </div>
            </div>

            {/* User Info Card Content */}
            <div className="pt-3 px-4 pb-6 space-y-4 relative z-20">
              <div className="bg-[#111214]/90 backdrop-blur-md p-4 rounded-xl border border-[#1f2023]/80 shadow-xl space-y-3">
                {/* Display Name with Nameplate Overlay */}
                <div className="relative inline-block w-full">
                  <div className="relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg overflow-hidden my-0.5">
                    {nameplateInfo && (
                      <img 
                        src={nameplateInfo.animatedUrl || nameplateInfo.staticUrl} 
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 mix-blend-screen" 
                        alt="nameplate" 
                      />
                    )}
                    <h2 className="relative z-10 text-xl font-bold text-white drop-shadow-md flex items-center gap-1.5">
                      {recipient.displayName || recipient.username}
                      {recipient.isPremium && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" title="Vetrix Premium" />}
                    </h2>
                  </div>
                  <p className="text-xs text-[#b5bac1] flex items-center gap-1 mt-0.5">
                    @{recipient.username}
                    {recipient.pronouns && <span className="text-[#949ba4] font-normal">• {recipient.pronouns}</span>}
                  </p>
                </div>

                {/* Role Badge ("chủ sở hữu" / "Quản trị viên") */}
                {recipient.role === 'admin' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    chủ sở hữu
                  </div>
                )}

                {recipient.aboutMe && (
                  <div className="border-t border-[#232428] pt-2">
                    <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-1">Về tôi</h4>
                    <p className="text-xs text-[#dbdee1] whitespace-pre-wrap leading-relaxed">{recipient.aboutMe}</p>
                  </div>
                )}

                <div className="border-t border-[#232428] pt-2 text-xs space-y-2">
                  <div>
                    <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-0.5">Gia nhập từ</h4>
                    <p className="text-white font-medium">{new Date(recipient.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
                  </div>

                  {recipient.customStatus?.text && (
                    <div>
                      <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-0.5">Trạng thái</h4>
                      <p className="text-white italic">{recipient.customStatus.text}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mutual Servers Section */}
              {mutualCommunities && mutualCommunities.length > 0 && (
                <div className="bg-[#111214]/90 backdrop-blur-md p-3 rounded-xl border border-[#1f2023]/80 shadow-xl">
                  <h4 className="font-bold text-[#b5bac1] uppercase text-[10px] mb-2 flex items-center justify-between">
                    <span>Máy chủ chung</span>
                    <span className="text-[#5865F2] font-semibold">{mutualCommunities.length}</span>
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {mutualCommunities.map((c) => (
                      <div 
                        key={c._id}
                        onClick={() => navigate(`/community/${c._id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#2b2d31] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#2b2d31] overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm border border-[#1f2023]">
                            {c.icon ? <img src={c.icon} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0)}
                          </div>
                          <span className="text-xs text-[#dbdee1] group-hover:text-white font-medium truncate">{c.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Message Input Box inside Profile Card */}
              <form onSubmit={handleSendMessage} className="relative bg-[#111214]/90 border border-[#1f2023]/80 rounded-xl p-2.5 flex items-center justify-between shadow-xl">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Tin nhắn @${recipient.displayName || recipient.username}`}
                  className="w-full bg-transparent text-xs text-white placeholder-[#80848e] outline-none pr-6"
                />
                <Smile 
                  className="w-4 h-4 text-[#949ba4] hover:text-yellow-400 cursor-pointer shrink-0" 
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                />
              </form>
            </div>
          </div>
        );
      })()}

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
