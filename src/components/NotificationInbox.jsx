import React, { useState, useEffect } from 'react';
import { Bell, Check, X, UserPlus, Users, MessageSquare, AtSign } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function NotificationInbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useSelector((state) => state.auth.user);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true
      });

      if (!newSocket.connected) {
        newSocket.connect();
      }

      const handleConnect = () => {
        newSocket.emit('join_user_room', user._id);
      };

      if (newSocket.connected) {
        handleConnect();
      }

      newSocket.on('connect', handleConnect);

      newSocket.on('new_notification', (notif) => {
        if (notif.type !== 'channel_message') {
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });

      setSocket(newSocket);

      const handleNotificationsRead = () => {
        fetchNotifications();
      };
      window.addEventListener('notifications_read', handleNotificationsRead);

      return () => {
        newSocket.close();
        window.removeEventListener('notifications_read', handleNotificationsRead);
      };
    }
  }, [user?._id]);

  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get('/api/notifications');
      if (res.data?.success) {
        const filtered = res.data.data.filter(n => n.type !== 'channel_message');
        setNotifications(filtered);
        setUnreadCount(filtered.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-5 h-5 text-yellow-400" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="w-5 h-5 text-indigo-400" />;
      case 'community_invite':
      case 'community_join':
        return <Users className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-[#313338]">
            <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-[#2b2d31] rounded-lg shadow-xl border border-[#1e1f22] overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-[#1e1f22] flex items-center justify-between">
              <h3 className="font-bold text-[#f2f3f5]">Hộp thư đến</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-[#00a8fc] hover:underline">
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center text-[#949ba4]">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Chưa có thông báo nào.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif._id} 
                    onClick={() => { 
                      if (!notif.isRead) markAsRead(notif._id); 
                      setIsOpen(false);
                      if (notif.link) {
                        navigate(notif.link);
                      } else {
                        navigate('/friends');
                      }
                    }}
                    className={`flex items-start gap-3 p-3 border-b border-[#1e1f22] hover:bg-[#35373c] transition-colors cursor-pointer ${notif.isRead ? 'opacity-60' : 'bg-[#313338]'}`}
                  >
                    <div className="mt-1 bg-[#1e1f22] p-2 rounded-full">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#dbdee1] leading-tight">
                        <span className="font-bold text-[#f2f3f5]">
                          {notif.sender ? (notif.sender.displayName || notif.sender.username) : 'Hệ thống'}
                        </span>{' '}
                        {notif.content}
                      </p>
                      <span className="text-xs text-[#949ba4] mt-1 block">
                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
