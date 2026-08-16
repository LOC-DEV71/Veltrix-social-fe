import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import axiosClient from '../../services/axiosClient';
import { PlusCircle, Gift, Image as ImageIcon, Smile, SmilePlus, Send, Crown, Sparkles, Hash, Sticker, Navigation, X, Loader2, AlertTriangle, ArrowLeft, MoreHorizontal, Pencil, Trash2, Copy, Reply, CornerUpRight, CornerUpLeft, Pin, CheckCircle2, MessageSquare, ChevronRight, Palette, Link as LinkIcon, Volume2, Mail, Eraser } from 'lucide-react';
import ExpressionPicker from '../../components/ExpressionPicker';
import NotificationInbox from '../../components/NotificationInbox';
import { checkPermission } from '../../utils/permissionUtils';
import EmojiPicker from 'emoji-picker-react';
import MemberProfilePopout from '../../components/MemberProfilePopout';
import FullProfileModal from '../../components/FullProfileModal';
import ForwardMessageModal from '../../components/ForwardMessageModal';
import LinkPreview from '../../components/chat/LinkPreview';
import { useTitle } from '../../hooks/useTitle';

// Helper to get frame border color based on frame name
const getFrameColorClass = (frameName) => {
  if (!frameName) return 'bg-transparent';
  if (frameName.includes('Hellfire')) return 'from-orange-600 via-red-500 to-yellow-500 bg-gradient-to-r';
  if (frameName.includes('Aura')) return 'from-cyan-400 via-blue-500 to-indigo-600 bg-gradient-to-r';
  if (frameName.includes('Cyber')) return 'from-fuchsia-500 via-purple-600 to-pink-500 bg-gradient-to-r';
  if (frameName.includes('Royal')) return 'from-amber-400 via-yellow-300 to-amber-600 bg-gradient-to-r animate-pulse';
  return 'from-pink-500 via-purple-500 to-indigo-500 bg-gradient-to-r';
};

export default function ChatPage() {
  useTitle('Kênh chat');
  const { channelId, communityId } = useParams();
  const location = useLocation();
  const outletContext = useOutletContext();
  const selectedCommunity = outletContext?.selectedCommunity;
  const communityMembers = outletContext?.communityMembers || [];
  const myCommunities = outletContext?.myCommunities || [];
  const communityChannels = outletContext?.communityChannels || [];
  const onlineUserIds = outletContext?.onlineUserIds || new Set();
  const handleSelectCommunity = outletContext?.handleSelectCommunity;
  const user = useSelector((state) => state.auth.user);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageTimeRef = useRef(0);
  const prevChannelRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showExpressionPicker, setShowExpressionPicker] = useState(false);
  const expressionPickerRef = useRef(null);
  const [expressionTab, setExpressionTab] = useState('sticker');

  const [channelInfo, setChannelInfo] = useState(null);
  const [nsfwConfirmed, setNsfwConfirmed] = useState(false);
  const [mentionPopup, setMentionPopup] = useState({ show: false, query: '', index: -1 });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [dropdownMessageId, setDropdownMessageId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [reactionDetailModal, setReactionDetailModal] = useState(null);
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalPinnedMessages, setGlobalPinnedMessages] = useState([]);
  const chatFeedRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const isJumpingRef = useRef(false);
  const scrollPreservationRef = useRef({ previousScrollHeight: 0, previousScrollTop: 0, isPrepending: false });
  const [profilePopout, setProfilePopout] = useState({ isOpen: false, member: null, position: null });
  const [fullProfileUser, setFullProfileUser] = useState(null);
  const [slowModeError, setSlowModeError] = useState('');
  const [isViewingOldContext, setIsViewingOldContext] = useState(false);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const myRole = communityMembers?.find(m => {
    if (!m || !m.user) return false;
    const uid = (typeof m.user === 'object' && m.user !== null) ? (m.user._id || m.user.id) : m.user;
    const myUid = user?._id || user?.id;
    return uid && myUid && String(uid) === String(myUid);
  })?.role;

  const canSendMessage = checkPermission(channelInfo, user?._id || user?.id, myRole, 'send_messages');
  const canManageMessages = checkPermission(channelInfo, user?._id || user?.id, myRole, 'manage_messages');
  const canAttachFiles = checkPermission(channelInfo, user?._id || user?.id, myRole, 'attach_files');
  const canAddReactions = checkPermission(channelInfo, user?._id || user?.id, myRole, 'add_reactions');

  useLayoutEffect(() => {
    if (scrollPreservationRef.current.isPrepending && chatFeedRef.current) {
      const container = chatFeedRef.current;
      const heightDifference = container.scrollHeight - scrollPreservationRef.current.previousScrollHeight;
      container.scrollTop = scrollPreservationRef.current.previousScrollTop + heightDifference;
      
      scrollPreservationRef.current.isPrepending = false;
      isLoadingMoreRef.current = false;
    } else if (!isLoadingMoreRef.current && !isJumpingRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Sync channelInfo & nsfwConfirmed
  useEffect(() => {
    if (!channelId || !communityId) return;
    setNsfwConfirmed(localStorage.getItem(`nsfw_${channelId}`) === 'true');

    if (communityChannels && communityChannels.length > 0) {
      const ch = communityChannels.find(c => c._id === channelId);
      if (ch) setChannelInfo(ch);
    } else {
      axiosClient.get(`/api/communities/${communityId}/channels`)
        .then(res => {
          const data = res.data?.data || [];
          const ch = data.find(c => c._id === channelId);
          if (ch) setChannelInfo(ch);
        })
        .catch(err => console.error(err));
    }
  }, [channelId, communityId, communityChannels]);

  const fetchInitialMessages = () => {
    if (!channelId) return;
    setLoadingHistory(true);
    setMessages([]);
    setHasMore(true);
    setIsViewingOldContext(false);

    axiosClient.get(`/api/messages/${channelId}?limit=30`)
      .then(res => {
        if (res.data.status === 'success' && res.data.data) {
          setMessages(res.data.data);
          if (res.data.data.length < 30) setHasMore(false);
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to load message history:', err.message);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  };

  // Load message history from API whenever channelId changes
  useEffect(() => {
    fetchInitialMessages();

    // Load pinned messages
    axiosClient.get(`/api/messages/${channelId}?pinned=true`)
      .then(res => {
        if (res.data.status === 'success' && res.data.data) {
          setGlobalPinnedMessages(res.data.data);
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to load pinned messages:', err.message);
      });
  }, [channelId]);

  // Socket connection & channel management
  useEffect(() => {
    if (!channelId || !user?._id) return;
    if (channelInfo && channelInfo.nsfw && !nsfwConfirmed) return; // Wait for confirmation

    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        autoConnect: false,
        withCredentials: true
      });
    }

    const socket = socketRef.current;

    if (prevChannelRef.current && prevChannelRef.current !== channelId) {
      socket.emit('leave_channel', prevChannelRef.current);
    }
    prevChannelRef.current = channelId;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('join_channel', channelId);
      console.log('🟢 Chat socket connected, joined channel:', channelId);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('🔴 Chat socket disconnected');
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((prev) => prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)));
      setGlobalPinnedMessages(prev => {
        const isCurrentlyPinned = prev.some(m => m._id === updatedMessage._id);
        if (updatedMessage.isPinned && !isCurrentlyPinned) {
          return [...prev, updatedMessage];
        } else if (!updatedMessage.isPinned && isCurrentlyPinned) {
          return prev.filter(m => m._id !== updatedMessage._id);
        }
        return prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m));
      });
    };

    const handleMessageDeleted = (deletedMessageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== deletedMessageId));
      setGlobalPinnedMessages((prev) => prev.filter((m) => m._id !== deletedMessageId));
    };

    const handleUserTyping = ({ user: typingUser, channelId: typingChannelId }) => {
      if (typingChannelId !== channelId) return;
      setTypingUsers(prev => {
        if (prev.some(u => u._id === typingUser._id)) return prev;
        return [...prev, typingUser];
      });
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u._id !== typingUser._id));
      }, 3000);
    };

    const handleUserStopTyping = ({ user: typingUser }) => {
      setTypingUsers(prev => prev.filter(u => u._id !== typingUser._id));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [channelId, user?._id, channelInfo, nsfwConfirmed]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Check for mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (lastAtMatch) {
      setMentionPopup({ show: true, query: lastAtMatch[1], index: lastAtMatch.index });
    } else {
      setMentionPopup({ show: false, query: '', index: -1 });
    }

    if (!socketRef.current || !user) return;

    socketRef.current.emit('typing_start', {
      channelId,
      user: { _id: (user._id || user.id), username: user.displayName || user.username }
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', {
        channelId,
        user: { _id: (user._id || user.id) }
      });
    }, 2000);
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      const res = await axiosClient.put(`/api/messages/${channelId}/${msgId}`, { content: editContent });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
        handleCancelEdit();
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi sửa tin nhắn');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await axiosClient.delete(`/api/messages/${channelId}/${msgId}`);
      if (res.data.success) {
        setMessages(prev => prev.filter(m => m._id !== msgId));
        setDropdownMessageId(null);
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xóa tin nhắn');
    }
  };

  const handleToggleReaction = async (msgId, emoji) => {
    try {
      const res = await axiosClient.post(`/api/messages/${channelId}/${msgId}/reactions`, { emoji });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
      }
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    isLoadingMoreRef.current = true;
    const oldestMessage = messages[0];
    try {
      const res = await axiosClient.get(`/api/messages/${channelId}?limit=30&before=${oldestMessage.createdAt}`);
      if (res.data.status === 'success' && res.data.data) {
        const newMessages = res.data.data;
        if (newMessages.length < 30) setHasMore(false);

        // Save current scroll position BEFORE state update
        const container = chatFeedRef.current;
        if (container) {
          scrollPreservationRef.current = {
            previousScrollHeight: container.scrollHeight,
            previousScrollTop: container.scrollTop,
            isPrepending: true
          };
        }

        setMessages(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(m => m._id));
          const uniqueNew = newMessages.filter(m => !existingIds.has(m._id));
          return [...uniqueNew, ...prev];
        });
      } else {
        isLoadingMoreRef.current = false;
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      isLoadingMoreRef.current = false;
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const handleTogglePin = async (msgId) => {
    try {
      const res = await axiosClient.put(`/api/messages/${channelId}/${msgId}/pin`);
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: res.data.data.isPinned } : m));
        setGlobalPinnedMessages(prev => {
          const isCurrentlyPinned = prev.some(m => m._id === msgId);
          if (res.data.data.isPinned && !isCurrentlyPinned) {
            return [...prev, res.data.data];
          } else if (!res.data.data.isPinned && isCurrentlyPinned) {
            return prev.filter(m => m._id !== msgId);
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Pin error:', error);
    }
  };

  const handleJumpToMessage = async (msgId) => {
    const el = document.getElementById(`message-${msgId}`);
    
    if (!el) {
      // Message not in DOM, fetch its context
      try {
        setLoadingHistory(true);
        isJumpingRef.current = true;
        const res = await axiosClient.get(`/api/messages/${channelId}?around=${msgId}&limit=30`);
        if (res.data.status === 'success' && res.data.data) {
          setMessages(res.data.data);
          setIsViewingOldContext(true);
          
          // Wait for render
          setTimeout(() => {
            const newEl = document.getElementById(`message-${msgId}`);
            if (newEl) {
              newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setHighlightedMsgId(msgId);
              setTimeout(() => setHighlightedMsgId(null), 2000);
            }
            isJumpingRef.current = false;
          }, 100);
        } else {
          isJumpingRef.current = false;
        }
      } catch (err) {
        console.error('Failed to jump to message:', err);
        isJumpingRef.current = false;
      } finally {
        setLoadingHistory(false);
      }
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2000);
    }
    
    setShowPinnedDropdown(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle click outside expression picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expressionPickerRef.current && !expressionPickerRef.current.contains(event.target)) {
        setShowExpressionPicker(false);
      }
    };

    if (showExpressionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExpressionPicker]);

  const onEmojiClick = (emojiObject) => {
    if (emojiObject.isCustom) {
      setInputText(prev => prev + `<e:${emojiObject.names[0]}:${emojiObject.imageUrl}>`);
    } else {
      setInputText(prev => prev + emojiObject.emoji);
    }
  };

  const handleSendSticker = (stickerUrl) => {
    const activeCommunityId = communityId || selectedCommunity?._id;
    if (!socketRef.current || !(user?._id || user?.id)) return;

    // --- SLOW MODE CHECK ---
    if (channelInfo?.slowMode > 0) {
      const now = Date.now();
      if ((now - lastMessageTimeRef.current) / 1000 < channelInfo.slowMode) {
        setSlowModeError(`Bạn đang chat quá nhanh, thời gian mỗi lần chat là ${channelInfo.slowMode}s`);
        setTimeout(() => setSlowModeError(''), 3000);
        return;
      }
      lastMessageTimeRef.current = now;
    }

    const payload = {
      senderId: (user._id || user.id),
      content: '',
      channelId: channelId,
      communityId: activeCommunityId,
      attachments: [{
        url: stickerUrl,
        name: 'sticker.gif',
        fileType: 'image'
      }],
      replyTo: replyingToMessage?._id || undefined
    };

    socketRef.current.emit('send_message', payload);
    setShowExpressionPicker(false);
    setReplyingToMessage(null);

    // Stop typing indicator
    socketRef.current.emit('typing_stop', {
      channelId,
      user: { _id: (user._id || user.id) }
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Handle Send Message
  const handleSendMessage = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || !socketRef.current || !(user?._id || user?.id) || isUploading) return;

    const activeCommunityId = communityId || selectedCommunity?._id;

    // --- SLOW MODE CHECK ---
    if (channelInfo?.slowMode > 0) {
      const now = Date.now();
      if ((now - lastMessageTimeRef.current) / 1000 < channelInfo.slowMode) {
        setSlowModeError(`Bạn đang chat quá nhanh, thời gian mỗi lần chat là ${channelInfo.slowMode}s`);
        setTimeout(() => setSlowModeError(''), 3000);
        return;
      }
      lastMessageTimeRef.current = now;
    }

    if (selectedFiles.length > 0) {
      // Optimistic UI for attachments
      const fakeId = 'temp_' + Date.now();
      const fakeAttachments = selectedFiles.map(f => ({
        url: URL.createObjectURL(f),
        name: f.name
      }));

      const tempMessage = {
        _id: fakeId,
        sender: user,
        content: inputText.trim(),
        createdAt: new Date().toISOString(),
        attachments: fakeAttachments,
        isTemp: true
      };

      setMessages(prev => [...prev, tempMessage]);

      // Save data for upload
      const currentFiles = [...selectedFiles];
      const currentText = inputText.trim();

      setSelectedFiles([]);
      setInputText('');
      setIsUploading(true);

      const formData = new FormData();
      if (currentText) formData.append('content', currentText);
      formData.append('communityId', activeCommunityId);
      if (replyingToMessage) formData.append('replyTo', replyingToMessage._id);
      currentFiles.forEach(file => {
        formData.append('attachments', file);
      });

      try {
        await axiosClient.post(`/api/messages/${channelId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error('Lỗi upload ảnh:', err);
      } finally {
        setIsUploading(false);
        // Remove temp message because the real one is emitted via socket
        setMessages(prev => prev.filter(m => m._id !== fakeId));
      }
    } else {
      const payload = {
        senderId: (user._id || user.id),
        content: inputText.trim(),
        channelId: channelId,
        communityId: activeCommunityId,
        replyTo: replyingToMessage?._id || undefined
      };
      socketRef.current.emit('send_message', payload);
      setInputText('');
    }

    setReplyingToMessage(null);

    // Stop typing indicator
    socketRef.current.emit('typing_stop', {
      channelId,
      user: { _id: (user._id || user.id) }
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hôm nay lúc ${time}`;
    if (isYesterday) return `Hôm qua lúc ${time}`;
    return `${date.toLocaleDateString('vi-VN')} ${time}`;
  };

  // Check if we should show the full header for a message (different sender or >5min gap)
  const shouldShowHeader = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const prevSenderId = prev.sender?._id || prev.sender;
    const currSenderId = msg.sender?._id || msg.sender;
    if (String(prevSenderId) !== String(currSenderId)) return true;
    // If more than 5 minutes apart
    const prevTime = new Date(prev.createdAt).getTime();
    const currTime = new Date(msg.createdAt).getTime();
    return (currTime - prevTime) > 5 * 60 * 1000;
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(<e:[^:]+:[^>]+>|@everyone|@[^\s]+|https?:\/\/[^\s]+)/g);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('<e:') && part.endsWith('>')) {
        const match = part.match(/<e:([^:]+):(.+)>/);
        if (match) {
          const name = match[1];
          const url = match[2];
          return <img key={i} src={url} alt={`:${name}:`} title={`:${name}:`} className="w-6 h-6 inline-block mx-0.5 align-middle object-contain" />;
        }
      }
      if (part === '@everyone' || part.startsWith('@')) {
        return <span key={i} className="bg-indigo-500/40 text-indigo-200 font-bold px-1.5 py-0.5 rounded mx-[1px]">{part}</span>;
      }
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const channelName = channelInfo?.name || location.state?.channelName || 'thảo-luận-chung';
  const pinnedMessages = globalPinnedMessages;

  if (channelInfo?.nsfw && !nsfwConfirmed) {
    return (
      <div className="flex flex-col h-full bg-[#313338] text-[#dbdee1] overflow-hidden items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#2b2d31] rounded-lg border border-[#1f2023] p-8 shadow-2xl flex flex-col items-center animate-fade-in">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Kênh giới hạn độ tuổi</h2>
          <p className="text-[#b5bac1] mb-8 leading-relaxed">
            Kênh <strong className="text-white">#{channelName}</strong> chứa nội dung không dành cho người dưới 18 tuổi. Bằng cách tiếp tục, bạn xác nhận rằng bạn đã đủ tuổi theo quy định.
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <button
              onClick={() => {
                localStorage.setItem(`nsfw_${channelId}`, 'true');
                setNsfwConfirmed(true);
              }}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded font-medium transition-colors"
            >
              Tôi đủ 18 tuổi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#313338] text-[#dbdee1] overflow-hidden">

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="relative z-20 shrink-0 bg-[#313338] border-b border-[#1f2023] shadow-sm">
          <div
            className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-[#2b2d31] transition-colors"
            onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
          >
            <Pin className="w-4 h-4 text-amber-500 mr-2 shrink-0 fill-amber-500" />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-bold text-white mr-2">{pinnedMessages.length} tin nhắn ghim</span>
              <span className="text-[#949ba4] truncate max-w-[200px] sm:max-w-[400px] inline-block align-bottom">
                {renderMessageContent(pinnedMessages[pinnedMessages.length - 1].content)}
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-[#949ba4] transition-transform ${showPinnedDropdown ? 'rotate-90' : ''}`} />
          </div>

          {/* Dropdown list */}
          {showPinnedDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPinnedDropdown(false)} />
              <div className="absolute top-full left-0 right-0 max-h-[300px] bg-[#2b2d31] border-b border-[#1f2023] overflow-y-auto shadow-xl z-20">
                {pinnedMessages.map(msg => (
                  <div
                    key={msg._id}
                    className="flex items-start px-4 py-3 hover:bg-[#1e1f22] cursor-pointer border-b border-[#1f2023] last:border-0 group transition-colors"
                    onClick={() => handleJumpToMessage(msg._id)}
                  >
                    <img
                      src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.displayName || msg.sender?.username || 'V')}&background=5865f2&color=fff`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full mr-3 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-white text-sm hover:underline">{msg.sender?.displayName || msg.sender?.username}</span>
                        <span className="text-[10px] text-[#949ba4]">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[#dbdee1] line-clamp-2">
                        {renderMessageContent(msg.content)}
                      </p>
                    </div>
                    {/* Unpin button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(msg._id);
                      }}
                      className="ml-3 p-1.5 rounded hover:bg-[#404249] text-[#949ba4] hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      title="Bỏ ghim"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}


      {/* Scrollable Chat Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 relative" ref={chatFeedRef} onScroll={handleScroll}>

        {hasMore && !loadingHistory && (
          <div className="text-center py-4 text-[#80848e] text-sm flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#80848e] border-t-transparent rounded-full animate-spin"></span>
            Đang tải thêm tin nhắn cũ...
          </div>
        )}

        {isViewingOldContext && (
          <div className="sticky top-0 z-50 flex justify-center mt-2 mb-4">
            <div 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg cursor-pointer transition-colors flex items-center gap-2"
              onClick={fetchInitialMessages}
            >
              <span>Đang xem tin nhắn cũ</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1">Nhảy tới hiện tại ⬇</span>
            </div>
          </div>
        )}

        {/* Loading more spinner */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-[#5865F2] animate-spin" />
            <span className="ml-2 text-xs text-[#949ba4]">Đang tải...</span>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="mb-8 pt-4">
          <div className="w-[68px] h-[68px] rounded-full bg-[#5865F2] flex items-center justify-center mb-2">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-[32px] font-extrabold text-white leading-tight">
            Chào mừng đến #{channelName}!
          </h2>
          <p className="text-[#949ba4] text-[15px] mt-1">
            Đây là sự khởi đầu của kênh <strong className="text-white">#{channelName}</strong>.
          </p>
        </div>

        {/* Loading state */}
        {loadingHistory && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-[#949ba4]">Đang tải tin nhắn...</span>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const sender = msg.sender || {};
          const showHeader = shouldShowHeader(msg, idx);

          const serverMember = communityMembers?.find(m => String(m.user?._id || m.user) === String(sender._id || sender.id));
          const senderDisplayName = serverMember?.nickname || sender.displayName || sender.username || 'Vô danh';
          const senderAvatar = serverMember?.avatar || sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderDisplayName)}&background=5865f2&color=fff`;

          // Frame info
          const activeFrame = sender.activeFrame;
          const frameStaticUrl = sender.activeFrameStaticUrl || (typeof activeFrame === 'object' ? activeFrame?.staticUrl : null);
          const frameAnimatedUrl = sender.activeFrameAnimatedUrl || (typeof activeFrame === 'object' ? activeFrame?.animatedUrl : null);

          return (
            <div
              id={`message-${msg._id}`}
              key={msg._id}
              className={`flex items-start group hover:bg-[#2e3035]/50 -mx-4 px-4 py-0.5 transition-all duration-300 relative ${showHeader ? 'mt-[17px]' : 'mt-0'
                } ${highlightedMsgId === msg._id ? 'bg-amber-500/15' : ''}`}
              onMouseEnter={() => setHoveredMessageId(msg._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {/* Hover Actions Menu */}
              {(hoveredMessageId === msg._id || reactionPickerMsgId === msg._id) && !msg.isTemp && (
                <div className="absolute right-4 -top-4 bg-[#313338] border border-[#1f2023] rounded shadow-sm flex items-center p-0.5 z-10">
                  {canAddReactions && (
                    <div
                      className={`p-1.5 hover:text-[#dbdee1] hover:bg-[#404249] rounded cursor-pointer transition-colors ${reactionPickerMsgId === msg._id ? 'text-[#dbdee1] bg-[#404249]' : 'text-[#b5bac1]'}`}
                      title="Thêm Biểu Cảm"
                      onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg._id ? null : msg._id)}
                    >
                      <SmilePlus className="w-[18px] h-[18px]" />
                    </div>
                  )}
                  {String(sender._id || sender) === String(user?._id || user?.id) && canSendMessage && (
                    <div
                      className="p-1.5 text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#404249] rounded cursor-pointer transition-colors"
                      title="Chỉnh Sửa"
                      onClick={() => handleStartEdit(msg)}
                    >
                      <Pencil className="w-[18px] h-[18px]" />
                    </div>
                  )}
                  <div
                    className="p-1.5 text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#404249] rounded cursor-pointer transition-colors"
                    title="Thêm"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      let topPos = rect.bottom + 4;
                      if (topPos + 680 > window.innerHeight) {
                        topPos = Math.max(10, window.innerHeight - 680);
                      }
                      setDropdownPos({ top: topPos, right: window.innerWidth - rect.right });
                      setDropdownMessageId(msg._id);
                    }}
                  >
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                  </div>

                  {/* Reaction Emoji Picker */}
                  {reactionPickerMsgId === msg._id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReactionPickerMsgId(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50" onClick={(e) => e.stopPropagation()}>
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            handleToggleReaction(msg._id, emojiData.emoji);
                            setReactionPickerMsgId(null);
                          }}
                          width={350}
                          height={400}
                          theme="dark"
                          searchPlaceHolder="Tìm kiếm"
                          skinTonesDisabled
                          previewConfig={{ showPreview: false }}
                          lazyLoadEmojis
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Avatar column */}
              <div className="w-10 mr-4 shrink-0 flex justify-center">
                {showHeader ? (
                  <div
                    className="relative w-10 h-10 rounded-full group/avatar cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const cMember = communityMembers.find(m => m.user?._id === (sender._id || sender.id));
                      setProfilePopout({
                        isOpen: true,
                        member: {
                          ...sender,
                          realUsername: sender.username,
                          username: cMember?.nickname || sender.displayName || sender.username,
                          role: cMember?.role || 'member',
                          isOnline: onlineUserIds.has(sender._id || sender.id)
                        },
                        position: { top: rect.top, left: rect.right + 12 }
                      });
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#313338]">
                      <img
                        src={senderAvatar}
                        alt={sender.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {frameAnimatedUrl && (
                      <div className="absolute -inset-[15%] pointer-events-none z-10">
                        <img
                          src={frameStaticUrl || frameAnimatedUrl}
                          alt=""
                          className="w-full h-full object-contain group-hover/avatar:hidden"
                        />
                        <img
                          src={frameAnimatedUrl}
                          alt=""
                          className="w-full h-full object-contain absolute inset-0 hidden group-hover/avatar:block"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity leading-[22px] select-none w-10 text-center text-[10px]">
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                {msg.replyTo && (
                  <div
                    className="flex items-center gap-1.5 mb-1 mt-0.5 text-[13px] text-[#b5bac1] opacity-80 hover:opacity-100 cursor-pointer select-none relative"
                    onClick={() => handleJumpToMessage(msg.replyTo._id)}
                  >
                    <div className="absolute -left-[30px] top-1/2 w-6 h-6 border-l-2 border-t-2 border-[#4f545c] rounded-tl-lg -mt-3" />
                    {(() => {
                      const replySender = msg.replyTo.sender || {};
                      const replyServerMember = communityMembers?.find(m => String(m.user?._id || m.user) === String(replySender._id || replySender.id));
                      const replySenderName = replyServerMember?.nickname || replySender.displayName || replySender.username || 'Ai đó';
                      const replySenderAvatar = replyServerMember?.avatar || replySender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(replySenderName)}&background=313338&color=fff`;
                      return (
                        <>
                          <img
                            src={replySenderAvatar}
                            alt="avatar"
                            className="w-4 h-4 rounded-full shrink-0 relative z-10"
                          />
                          <span className="font-semibold text-[#dbdee1] hover:underline shrink-0 relative z-10">
                            {replySenderName}
                          </span>
                        </>
                      );
                    })()}
                    <span className="truncate max-w-[150px] md:max-w-[400px] relative z-10">
                      {msg.replyTo.content || (msg.replyTo.attachments?.length > 0 ? '[Tệp đính kèm]' : '')}
                    </span>
                  </div>
                )}
                {showHeader && (
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[15px] font-medium cursor-pointer hover:underline ${sender.isPremium ? 'text-[#f47fff]' : 'text-white'
                        }`}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cMember = communityMembers.find(m => m.user?._id === (sender._id || sender.id));
                        setProfilePopout({
                          isOpen: true,
                          member: {
                            ...sender,
                            realUsername: sender.username,
                            username: cMember?.nickname || sender.displayName || sender.username,
                            role: cMember?.role || 'member',
                            isOnline: onlineUserIds.has(sender._id || sender.id)
                          },
                          position: { top: rect.top - 40, left: rect.left }
                        });
                      }}
                    >
                      {senderDisplayName}
                    </span>
                    {sender.isPremium && <Sparkles className="w-3.5 h-3.5 text-[#f47fff] shrink-0 self-center" />}

                    {selectedCommunity?.boost2 && (selectedCommunity.serverTag || selectedCommunity.serverBadge) && (
                      <div className="flex items-center gap-1 bg-[#2b2d31] px-1.5 py-[1px] rounded text-[10px] text-[#b5bac1] shrink-0 border border-[#1f2023]/50 self-center">
                        {selectedCommunity.serverBadge && (
                          selectedCommunity.serverBadge.length > 2 ? (
                            <img src={selectedCommunity.serverBadge} alt="badge" className="w-3 h-3 object-cover rounded-[2px]" />
                          ) : (
                            <span>{selectedCommunity.serverBadge}</span>
                          )
                        )}
                        {selectedCommunity.serverTag && <span className="font-bold tracking-wide">{selectedCommunity.serverTag}</span>}
                      </div>
                    )}

                    <span className="text-[11px] text-[#949ba4] font-normal">
                      {formatTime(msg.createdAt)}
                    </span>
                    {msg.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 self-center ml-1" title="Đã ghim" />}
                    {msg.isTemp && <Loader2 className="w-3.5 h-3.5 text-[#5865F2] animate-spin self-center ml-1" title="Đang gửi..." />}
                  </div>
                )}
                <div className="flex flex-col mt-0.5">
                  {editingMessageId === msg._id ? (
                    <div className="mt-1 mb-1">
                      <div className="bg-[#383a40] rounded-lg px-4 py-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => {
                            setEditContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg._id); }
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                          className="w-full bg-transparent outline-none text-[#dbdee1] text-[15px] leading-[1.375rem] resize-none overflow-hidden whitespace-pre-wrap break-words"
                          rows={1}
                        />
                      </div>
                      <div className="text-[11px] text-[#949ba4] mt-1">
                        escape để <span className="text-[#00a8fc] cursor-pointer hover:underline" onClick={handleCancelEdit}>hủy</span> • enter để <span className="text-[#00a8fc] cursor-pointer hover:underline" onClick={() => handleSaveEdit(msg._id)}>lưu</span>
                      </div>
                    </div>
                  ) : (
                    msg.content && (
                      <p className={`text-[15px] leading-[1.375rem] text-[#dbdee1] whitespace-pre-wrap break-words inline-block ${msg.isTemp ? 'opacity-70' : ''}`}>
                        {renderMessageContent(msg.content)}
                        {msg.isEdited && <span className="text-[10px] text-[#949ba4] ml-1">(đã chỉnh sửa)</span>}
                      </p>
                    )
                  )}
                  {msg.linkMetadata && <LinkPreview linkMetadata={msg.linkMetadata} />}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className={`relative ${msg.isTemp ? 'opacity-60' : ''}`}>
                          <img
                            src={att.url}
                            alt={att.name || 'attachment'}
                            className="max-w-[400px] max-h-[300px] rounded-md object-contain bg-[#2b2d31] border border-[#1f2023]"
                          />
                          {msg.isTemp && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                              <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions Row */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 items-center">
                      {msg.reactions.map((reaction, rIdx) => {
                        const iReacted = reaction.users?.some(u => String(u._id || u) === String(user?._id || user?.id));
                        const userNames = reaction.users?.map(u => u.displayName || u.username || 'User') || [];
                        const first3 = userNames.slice(0, 3);
                        const rest = userNames.length - 3;
                        let tooltipText = '';
                        if (first3.length > 0) {
                          tooltipText = first3.join(', ');
                          if (rest > 0) tooltipText += ` và ${rest} người khác`;
                        }
                        return (
                          <div key={rIdx} className="relative group/reaction">
                            <button
                              onClick={() => handleToggleReaction(msg._id, reaction.emoji)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[13px] border transition-colors ${iReacted
                                  ? 'bg-[#5865F2]/20 border-[#5865F2]/50 text-[#dee0fc]'
                                  : 'bg-[#2b2d31] border-[#1f2023] text-[#b5bac1] hover:border-[#949ba4]'
                                }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-[11px] font-medium min-w-[12px] text-center">{reaction.users?.length || 0}</span>
                            </button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reaction:block z-50 pointer-events-none">
                              <div className="bg-[#111214] text-white text-xs rounded-lg px-3 py-2.5 shadow-xl border border-[#1f2023] w-[200px]">
                                <div className="text-center text-2xl mb-1.5">{reaction.emoji}</div>
                                <div className="text-[11px] text-[#b5bac1] text-center leading-relaxed">
                                  <span className="text-white font-medium">{reaction.emoji}</span> đã được tương tác bởi{' '}
                                  <span className="text-white">{first3.join(', ')}</span>
                                  {rest > 0 && <> và <span className="text-[#00a8fc]">{rest} người khác</span></>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Add Reaction button */}
                      {canAddReactions && (
                        <button
                          onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg._id ? null : msg._id)}
                          className="flex items-center justify-center w-7 h-7 rounded-md bg-[#2b2d31] border border-[#1f2023] text-[#949ba4] hover:text-white hover:border-[#949ba4] transition-colors"
                          title="Thêm biểu cảm"
                        >
                          <SmilePlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* View all reactions button */}
                      <button
                        onClick={() => setReactionDetailModal({ msg, selectedEmoji: msg.reactions[0]?.emoji })}
                        className="text-[11px] text-[#949ba4] hover:text-[#dbdee1] hover:underline transition-colors ml-1 cursor-pointer"
                      >
                        Xem biểu cảm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={chatEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 h-6 flex items-center text-xs text-[#949ba4] shrink-0">
          <div className="flex gap-[3px] mr-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
          <span className="font-semibold text-white">
            {typingUsers.map(u => u.username).join(', ')}
          </span>
          &nbsp;đang nhập...
        </div>
      )}

      {/* Input Message Form Bar */}
      <div className="px-4 pb-6 pt-0 shrink-0 relative">
        {replyingToMessage && (
          <div className="bg-[#2b2d31] flex items-center justify-between px-4 py-2 rounded-t-lg border-x border-t border-[#1f2023] shadow-sm">
            <div className="flex items-center text-[13px] text-[#b5bac1] min-w-0">
              <span className="font-semibold text-[#dbdee1] mr-2">Đang trả lời {replyingToMessage.sender?.displayName || replyingToMessage.sender?.username}</span>
              <span className="truncate flex-1 max-w-[200px] md:max-w-md">{replyingToMessage.content || (replyingToMessage.attachments?.length > 0 ? '[Tệp đính kèm]' : '')}</span>
            </div>
            <button onClick={() => setReplyingToMessage(null)} className="shrink-0 p-1 rounded-full hover:bg-[#35373c] text-[#b5bac1] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className={`bg-[#383a40] flex flex-col px-4 py-1 ${replyingToMessage ? 'rounded-b-lg' : 'rounded-lg'}`}>
          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-4 overflow-x-auto py-4 border-b border-[#1f2023]/50 w-full mb-1">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative shrink-0 w-[200px] h-[200px] bg-[#2b2d31] rounded-md p-2 group">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-contain rounded" alt="preview" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-[#f23f42] rounded-full flex items-center justify-center shadow-md hover:bg-[#da373c] transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mention Autocomplete Popup */}
          {mentionPopup.show && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-[#2b2d31] rounded-lg shadow-xl border border-[#1f2023] overflow-hidden flex flex-col z-50">
              <div className="bg-[#1e1f22] px-3 py-2 text-xs font-bold text-[#b5bac1] uppercase tracking-wide">
                Gợi ý nhắc đến
              </div>
              <div className="max-h-48 overflow-y-auto p-1 no-scrollbar">
                {(() => {
                  const query = mentionPopup.query.toLowerCase();

                  // Filter members based on query
                  const filteredMembers = communityMembers.filter(m => {
                    if (!m.user || typeof m.user !== 'object') return false;
                    const name = (m.user.displayName || m.user.username || '').toLowerCase();
                    return name.includes(query);
                  });

                  const showEveryone = 'everyone'.includes(query);

                  if (!showEveryone && filteredMembers.length === 0) {
                    return <div className="p-2 text-sm text-[#949ba4] text-center">Không tìm thấy ai</div>;
                  }

                  const options = [];
                  if (showEveryone) {
                    options.push(
                      <div
                        key="everyone"
                        onClick={() => {
                          const newText = inputText.substring(0, mentionPopup.index) + '@everyone ' + inputText.substring(mentionPopup.index + mentionPopup.query.length + 1);
                          setInputText(newText);
                          setMentionPopup({ show: false, query: '', index: -1 });
                          textareaRef.current?.focus();
                        }}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#35373c] transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center font-bold">@</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#dbdee1] group-hover:text-white">everyone</span>
                          <span className="text-[10px] text-[#949ba4]">Nhắc tất cả mọi người trong máy chủ</span>
                        </div>
                      </div>
                    );
                  }

                  filteredMembers.forEach((m, idx) => {
                    const u = m.user;
                    const avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'V')}&background=5865f2&color=fff`;
                    options.push(
                      <div
                        key={u._id || idx}
                        onClick={() => {
                          const nameToInsert = u.displayName || u.username;
                          const formattedName = nameToInsert.replace(/\s+/g, '');
                          const newText = inputText.substring(0, mentionPopup.index) + '@' + formattedName + ' ' + inputText.substring(mentionPopup.index + mentionPopup.query.length + 1);
                          setInputText(newText);
                          setMentionPopup({ show: false, query: '', index: -1 });
                          textareaRef.current?.focus();
                        }}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#35373c] transition-colors group"
                      >
                        <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#dbdee1] group-hover:text-white">{u.displayName || u.username}</span>
                          <span className="text-[10px] text-[#949ba4]">@{u.username}</span>
                        </div>
                      </div>
                    );
                  });

                  return options;
                })()}
              </div>
            </div>
          )}

          {/* Files Preview Container */}
          {selectedFiles.length > 0 && (
            <div className="bg-[#2b2d31] rounded-t-lg p-4 border border-[#1f2023] border-b-0 flex gap-4 overflow-x-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative w-24 h-24 bg-[#1e1f22] rounded flex items-center justify-center group shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative mt-2">
            {slowModeError && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#da373c] text-white px-4 py-2 rounded-md shadow-2xl text-[13px] font-bold animate-bounce z-50 whitespace-nowrap border border-[#f23f43] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {slowModeError}
              </div>
            )}
            <div className={`bg-[#383a40] ${selectedFiles.length > 0 ? 'rounded-b-lg' : 'rounded-lg'} flex items-start px-2 relative min-h-[44px]`}>
              {!canSendMessage ? (
                <div className="flex-1 py-[12px] px-2 text-[#949ba4] text-[15px] font-medium flex items-center justify-center">
                  Bạn không có quyền gửi tin nhắn trong kênh này.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`${canAttachFiles ? 'text-[#b5bac1] hover:text-white cursor-pointer' : 'text-[#4e5058] cursor-not-allowed'} transition-all mb-[10px] mr-2 shrink-0 self-end pb-1.5`}
                    disabled={isUploading || !canAttachFiles}
                  >
                    <PlusCircle className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    disabled={!canAttachFiles}
                  />

                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Auto resize
                      const el = textareaRef.current;
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`Nhắn #${channelName}`}
                    className="flex-1 bg-transparent text-[#dbdee1] placeholder-[#6d6f78] text-[15px] focus:outline-none py-[12px] resize-none max-h-[200px] leading-[1.375rem]"
                    rows={1}
                    disabled={isUploading}
                  />

                  <div className="flex items-center gap-2 text-[#b5bac1] ml-2 shrink-0 self-end pb-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:text-white transition-all cursor-pointer" title="Hình ảnh">
                      <ImageIcon className="w-[22px] h-[22px]" />
                    </button>

                    <div className="relative flex items-center gap-2" ref={expressionPickerRef}>
                      <button
                        type="button"
                        onClick={() => {
                          if (showExpressionPicker && expressionTab === 'sticker') {
                            setShowExpressionPicker(false);
                          } else {
                            setExpressionTab('sticker');
                            setShowExpressionPicker(true);
                          }
                        }}
                        className={`transition-all cursor-pointer ${showExpressionPicker && expressionTab === 'sticker' ? 'text-[#f2f3f5]' : 'hover:text-white'}`}
                        title="Sticker"
                      >
                        <Sticker className="w-[22px] h-[22px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (showExpressionPicker && expressionTab === 'emoji') {
                            setShowExpressionPicker(false);
                          } else {
                            setExpressionTab('emoji');
                            setShowExpressionPicker(true);
                          }
                        }}
                        className={`transition-all cursor-pointer ${showExpressionPicker && expressionTab === 'emoji' ? 'text-[#f2f3f5]' : 'hover:text-white'}`}
                        title="Biểu cảm"
                      >
                        <Smile className="w-[22px] h-[22px]" />
                      </button>

                      {showExpressionPicker && (
                        <ExpressionPicker
                          initialTab={expressionTab}
                          onEmojiClick={onEmojiClick}
                          onStickerClick={handleSendSticker}
                          user={user}
                          community={selectedCommunity}
                          communities={myCommunities}
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      className={`transition-all cursor-pointer ${(inputText.trim() || selectedFiles.length > 0) ? 'text-[#5865F2] hover:text-[#4752c4]' : 'text-[#5865F2]/30 cursor-default'
                        }`}
                      title="Gửi tin nhắn"
                      disabled={(!inputText.trim() && selectedFiles.length === 0) || isUploading}
                    >
                      {isUploading ? <Loader2 className="w-[22px] h-[22px] animate-spin text-[#5865F2]" /> : <Navigation className="w-[22px] h-[22px]" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Reaction Detail Modal */}
      {reactionDetailModal && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4" onClick={() => setReactionDetailModal(null)}>
          <div className="bg-[#313338] rounded-lg w-full max-w-[500px] h-[520px] shadow-2xl flex flex-col border border-[#1f2023] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2023]">
              <h2 className="text-lg font-bold text-white">Biểu Cảm</h2>
              <button onClick={() => setReactionDetailModal(null)} className="text-[#b5bac1] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar - emoji list */}
              <div className="w-[120px] border-r border-[#1f2023] overflow-y-auto py-2 shrink-0">
                {reactionDetailModal.msg.reactions?.map((reaction, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => setReactionDetailModal(prev => ({ ...prev, selectedEmoji: reaction.emoji }))}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${reactionDetailModal.selectedEmoji === reaction.emoji
                        ? 'bg-[#404249] text-white'
                        : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
                      }`}
                  >
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-sm font-semibold">{reaction.users?.length || 0}</span>
                  </button>
                ))}
              </div>
              {/* Right side - user list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {(() => {
                  const selectedReaction = reactionDetailModal.msg.reactions?.find(r => r.emoji === reactionDetailModal.selectedEmoji);
                  if (!selectedReaction || !selectedReaction.users?.length) {
                    return <div className="text-[#949ba4] text-sm text-center py-8">Không có ai thả biểu cảm này</div>;
                  }
                  return selectedReaction.users.map((u, uIdx) => {
                    const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`;
                    return (
                      <div
                        key={uIdx}
                        className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#2b2d31] transition-colors cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setReactionDetailModal(null);
                          setProfilePopout({
                            isOpen: true,
                            member: { ...u, isOnline: onlineUserIds.has(u._id || u.id) },
                            position: { top: Math.min(rect.top, window.innerHeight - 400), left: rect.right + 12 }
                          });
                        }}
                      >
                        <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-semibold text-white">{u.displayName || u.username}</div>
                          <div className="text-[11px] text-[#949ba4]">{u.username}</div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Message Context Menu (Dropdown) */}
      {(() => {
        if (!dropdownMessageId) return null;
        const activeDropdownMsg = messages.find(m => m._id === dropdownMessageId);
        if (!activeDropdownMsg) return null;

        return (
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={(e) => { e.stopPropagation(); setDropdownMessageId(null); }}
              onContextMenu={(e) => { e.preventDefault(); setDropdownMessageId(null); }}
            />
            <div
              className="fixed z-[101] bg-[#111214] border border-[#1f2023] rounded shadow-2xl flex flex-col p-2 w-[280px] text-[#b5bac1] text-[13px] font-medium"
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              {/* Quick reactions */}
              <div className="flex justify-between px-1 py-1 mb-1">
                <div className="hover:bg-[#35373c] p-2 rounded cursor-pointer transition-colors text-lg" onClick={() => { handleToggleReaction(activeDropdownMsg._id, '😭'); setDropdownMessageId(null); }}>😭</div>
                <div className="hover:bg-[#35373c] p-2 rounded cursor-pointer transition-colors text-lg" onClick={() => { handleToggleReaction(activeDropdownMsg._id, '🇷🇺'); setDropdownMessageId(null); }}>🇷🇺</div>
                <div className="hover:bg-[#35373c] p-2 rounded cursor-pointer transition-colors text-lg" onClick={() => { handleToggleReaction(activeDropdownMsg._id, '🤣'); setDropdownMessageId(null); }}>🤣</div>
                <div className="hover:bg-[#35373c] p-2 rounded cursor-pointer transition-colors text-lg" onClick={() => { handleToggleReaction(activeDropdownMsg._id, '☝️'); setDropdownMessageId(null); }}>☝️</div>
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { setReactionPickerMsgId(activeDropdownMsg._id); setDropdownMessageId(null); }}
              >
                <span>Thêm Biểu Cảm</span>
                <ChevronRight className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => {
                  if (activeDropdownMsg.reactions && activeDropdownMsg.reactions.length > 0) {
                    setReactionDetailModal({ msg: activeDropdownMsg, selectedEmoji: activeDropdownMsg.reactions[0].emoji });
                  } else {
                    alert('Chưa có biểu cảm nào!');
                  }
                  setDropdownMessageId(null);
                }}
              >
                <span>Xem Biểu Cảm</span>
                <Palette className="w-4 h-4" />
              </div>

              <div className="h-[1px] bg-[#1f2023] my-1 mx-1" />

              {String(activeDropdownMsg.sender?._id || activeDropdownMsg.sender) === String(user?._id || user?.id) && canSendMessage && (
                <div
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                  onClick={() => { handleStartEdit(activeDropdownMsg); setDropdownMessageId(null); }}
                >
                  <span>Chỉnh Sửa Tin Nhắn</span>
                  <Pencil className="w-4 h-4" />
                </div>
              )}

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { setReplyingToMessage(activeDropdownMsg); setDropdownMessageId(null); }}
              >
                <span>Trả lời</span>
                <CornerUpLeft className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { setForwardingMessage(activeDropdownMsg); setDropdownMessageId(null); }}
              >
                <span>Chuyển tiếp</span>
                <CornerUpRight className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { alert('Tính năng Tạo chủ đề đang phát triển!'); setDropdownMessageId(null); }}
              >
                <span>Tạo Chủ Đề</span>
                <Hash className="w-4 h-4" />
              </div>

              <div className="h-[1px] bg-[#1f2023] my-1 mx-1" />

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { navigator.clipboard.writeText(activeDropdownMsg.content); setDropdownMessageId(null); }}
              >
                <span>Sao Chép Văn Bản</span>
                <Copy className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => {
                  if (canManageMessages) {
                    handleTogglePin(activeDropdownMsg._id);
                  } else {
                    alert('Bạn không có quyền ghim tin nhắn!');
                  }
                }}
              >
                <span>{activeDropdownMsg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}</span>
                <Pin className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { alert('Tính năng Đánh dấu tin nhắn đang phát triển!'); setDropdownMessageId(null); }}
              >
                <span>Đánh Dấu Tin Nhắn</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors text-[#b5bac1]/70"
                onClick={() => { alert('Tính năng Ứng dụng đang phát triển!'); setDropdownMessageId(null); }}
              >
                <span>Ứng dụng</span>
                <ChevronRight className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => { alert('Tính năng Đánh dấu chưa đọc đang phát triển!'); setDropdownMessageId(null); }}
              >
                <span>Đánh Dấu Chưa Đọc</span>
                <Mail className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => {
                  const url = `${window.location.origin}/community/${communityId}/channel/${channelId}?message=${activeDropdownMsg._id}`;
                  navigator.clipboard.writeText(url);
                  setDropdownMessageId(null);
                }}
              >
                <span>Sao Chép Đường Dẫn Tin Nhắn</span>
                <LinkIcon className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white cursor-pointer group transition-colors"
                onClick={() => {
                  const u = new SpeechSynthesisUtterance(activeDropdownMsg.content);
                  u.lang = 'vi-VN';
                  window.speechSynthesis.speak(u);
                  setDropdownMessageId(null);
                }}
              >
                <span>Đọc Tin Nhắn</span>
                <Volume2 className="w-4 h-4" />
              </div>

              <div className="h-[1px] bg-[#1f2023] my-1 mx-1" />

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-rose-500 hover:text-white cursor-pointer group transition-colors text-rose-500"
                onClick={() => {
                  if (activeDropdownMsg.reactions) {
                    activeDropdownMsg.reactions.forEach(r => {
                      if (r.users?.some(u => String(u._id || u) === String(user?._id || user?.id))) {
                        handleToggleReaction(activeDropdownMsg._id, r.emoji);
                      }
                    });
                  }
                  setDropdownMessageId(null);
                }}
              >
                <span>Xóa Biểu Cảm</span>
                <ChevronRight className="w-4 h-4" />
              </div>

              <div
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-rose-500 hover:text-white cursor-pointer group transition-colors text-rose-500"
                onClick={() => { alert('Tính năng Loại bỏ tất cả biểu cảm đang phát triển!'); setDropdownMessageId(null); }}
              >
                <span>Loại bỏ tất cả các biểu cảm</span>
              </div>

              {(String(activeDropdownMsg.sender?._id || activeDropdownMsg.sender) === String(user?._id || user?.id) || canManageMessages) && (
                <div
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-[#da373c]/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer group transition-colors mt-1"
                  onClick={() => { handleDeleteMessage(activeDropdownMsg._id); setDropdownMessageId(null); }}
                >
                  <span>Xoá tin nhắn</span>
                  <Trash2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Member Profile Popout */}
      <MemberProfilePopout
        isOpen={profilePopout.isOpen}
        onClose={() => setProfilePopout({ isOpen: false, member: null, position: null })}
        member={profilePopout.member}
        position={profilePopout.position}
        currentCommunity={selectedCommunity}
        myCommunities={myCommunities}
        onSelectCommunity={(c) => {
          setProfilePopout({ isOpen: false, member: null, position: null });
          if (handleSelectCommunity) handleSelectCommunity(c);
        }}
        onOpenFullProfile={(memberObj) => {
          setProfilePopout({ isOpen: false, member: null, position: null });
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
          if (handleSelectCommunity) handleSelectCommunity(c);
        }}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        myCommunities={myCommunities}
        user={user}
      />
    </div>
  );
}
