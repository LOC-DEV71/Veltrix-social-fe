import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Trash2, Hash, Loader2, Plus, Shield, Users, MessageSquare, Mic, LayoutGrid, HelpCircle, Settings } from 'lucide-react';
import axiosClient from '../services/axiosClient';

const menuItems = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'permissions', label: 'Quyền hạn' },
  { id: 'invites', label: 'Lời mời' },
  { id: 'integrations', label: 'Tích hợp' },
];

const PERMISSIONS_LIST = [
  {
    category: 'Quyền Tổng Quát Kênh',
    items: [
      { id: 'view_channel', label: 'Xem Kênh', desc: 'Cho phép thành viên xem được kênh này theo mặc định. Nếu không cấp cho @everyone quyền này, kênh sẽ bị chuyển thành kênh riêng tư.' },
      { id: 'manage_channel', label: 'Quản lý kênh', desc: 'Cho phép thành viên đổi tên, nội dung mô tả và cài đặt chat của kênh. Thành viên cũng có quyền xóa kênh.' },
      { id: 'manage_permissions', label: 'Quản lý quyền hạn', desc: 'Cho phép thành viên thay đổi quyền trong kênh này.' },
      { id: 'manage_webhooks', label: 'Quản lý Webhook', desc: 'Cho phép thành viên tạo, chỉnh sửa hoặc xóa webhook trong kênh này, webhook cho phép người dùng đăng tin nhắn từ các ứng dụng hoặc trang web khác.' },
    ]
  },
  {
    category: 'Quyền Thành Viên',
    items: [
      { id: 'create_invite', label: 'Tạo Lời Mời', desc: 'Cho phép thành viên mời người mới vào máy chủ thông qua liên kết mời trực tiếp đến kênh này.' },
    ]
  },
  {
    category: 'Quyền Kênh Tin Nhắn',
    items: [
      { id: 'send_messages', label: 'Gửi tin nhắn', desc: 'Cho phép thành viên gửi tin nhắn trong kênh này.' },
      { id: 'send_messages_in_threads', label: 'Gửi Tin Nhắn trong Chủ Đề', desc: 'Cho phép thành viên được gửi tin nhắn trong chủ đề dưới kênh này.' },
      { id: 'create_public_threads', label: 'Tạo Chủ Đề Công Khai', desc: 'Cho phép thành viên được tạo chủ đề mà mọi người trong kênh này đều có thể xem.' },
      { id: 'create_private_threads', label: 'Tạo Các Chủ Đề Riêng Tư', desc: 'Cho phép thành viên được tạo chủ đề theo chỉ được mời trong kênh này.' },
      { id: 'embed_links', label: 'Nhúng liên kết', desc: 'Cho phép hiển thị nội dung nhúng của liên kết do thành viên chia sẻ trong kênh này.' },
      { id: 'attach_files', label: 'Đính kèm tập tin', desc: 'Cho phép thành viên tải lên tệp hoặc tệp media trong kênh này.' },
      { id: 'add_reactions', label: 'Thêm Biểu Cảm', desc: 'Cho phép thành viên thêm hiệu ứng tương tác emoji mới với tin nhắn trong kênh này. Nếu không cấp quyền, thành viên vẫn có thể sử dụng các tương tác có sẵn.' },
      { id: 'use_external_emojis', label: 'Dùng Emoji Mở Rộng', desc: 'Cho phép thành viên sử dụng emoji của máy chủ khác trong kênh này, nếu thành viên đó có đăng ký Premium.' },
      { id: 'use_external_stickers', label: 'Dùng Sticker Mở Rộng', desc: 'Cho phép thành viên sử dụng sticker của máy chủ khác trong kênh này, nếu thành viên đó có đăng ký Premium.' },
      { id: 'mention_everyone', label: 'Đề cập @everyone, @here và Tất Cả Vai Trò', desc: 'Cho phép thành viên dùng @everyone hoặc @here (chỉ các thành viên đang trực tuyến) trong kênh này. Thành viên cũng có thể dùng @mention cho tất cả các vai trò trong kênh này, ngay cả khi quyền "Cho phép tất cả mọi người đề cập vai trò này" của vai trò không được cấp.' },
      { id: 'manage_messages', label: 'Quản lý tin nhắn', desc: 'Cho phép thành viên xóa hoặc gỡ bỏ các nội dung nhúng khỏi tin nhắn của các thành viên khác trong kênh này.' },
      { id: 'manage_threads', label: 'Quản Lý Chủ Đề', desc: 'Cho phép các thành viên đổi tên, xóa, đóng và bật chế độ chậm cho chủ đề trong kênh này. Họ cũng có thể xem các chủ đề riêng tư.' },
      { id: 'read_message_history', label: 'Xem lịch sử tin nhắn', desc: 'Cho phép thành viên đọc các tin nhắn đã được gửi trước đó trong kênh này. Nếu không cấp quyền này, thành viên sẽ chỉ nhìn thấy các tin nhắn được gửi khi họ đang trực tuyến.' },
      { id: 'send_tts_messages', label: 'Gửi Tin Nhắn Văn Bản Thành Giọng Nói', desc: 'Cho phép thành viên gửi tin nhắn "văn bản thành giọng nói" trong kênh này bằng cách nhập lệnh /tts vào đầu tin nhắn. Tất cả thành viên đang hoạt động trong kênh đều có thể nghe được tin nhắn này.' },
    ]
  },
  {
    category: 'Quyền Kênh Thoại',
    items: [
      { id: 'send_voice_messages', label: 'Gửi tin nhắn thoại', desc: 'Cho phép thành viên gửi tin nhắn thoại trong kênh này. Cần có quyền hạn "Đính kèm tập tin".' },
      { id: 'create_polls', label: 'Tạo khảo sát', desc: 'Cho phép thành viên tạo khảo sát trong kênh này.' },
    ]
  },
  {
    category: 'Quyền Hạn Ứng Dụng',
    items: [
      { id: 'use_application_commands', label: 'Sử Dụng Câu Lệnh Ứng Dụng', desc: 'Cho phép thành viên sử dụng câu lệnh từ ứng dụng trong kênh này, bao gồm lệnh slash và lệnh menu ngữ cảnh.' },
      { id: 'use_activities', label: 'Sử dụng Hoạt động', desc: 'Cho phép thành viên sử dụng Hoạt Động trong kênh này.' },
      { id: 'use_external_apps', label: 'Dùng ứng dụng mở rộng', desc: 'Cho phép các ứng dụng mà thành viên đã thêm vào tài khoản của họ được đăng tin nhắn trong kênh này. Khi tắt, tin nhắn sẽ ở dạng riêng tư.' }
    ]
  }
];

export default function ChannelSettingsModal({ isOpen, onClose, channel, communityId, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [slowMode, setSlowMode] = useState(0);
  const [nsfw, setNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [permissionOverwrites, setPermissionOverwrites] = useState([]);
  const [selectedRoleOrMember, setSelectedRoleOrMember] = useState('everyone');
  useEffect(() => {
    if (isOpen && channel) {
      setName(channel.name || '');
      setTopic(channel.topic || '');
      setSlowMode(channel.slowMode || 0);
      setNsfw(channel.nsfw || false);
      setPermissionOverwrites(channel.permissionOverwrites || []);
      setActiveTab('overview');
    }
  }, [isOpen, channel]);

  const hasChanges = React.useMemo(() => (
    name !== (channel?.name || '') || 
    topic !== (channel?.topic || '') || 
    slowMode !== (channel?.slowMode || 0) || 
    nsfw !== (channel?.nsfw || false) ||
    JSON.stringify(permissionOverwrites) !== JSON.stringify(channel?.permissionOverwrites || [])
  ), [name, topic, slowMode, nsfw, permissionOverwrites, channel]);

  const handleSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosClient.put(`/api/communities/${communityId}/channels/${channel?._id}`, {
        name,
        topic,
        slowMode,
        nsfw,
        permissionOverwrites
      });
      if (res.data.success) {
        onUpdate(res.data.data);
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thay đổi kênh');
    } finally {
      setLoading(false);
    }
  }, [name, topic, slowMode, nsfw, permissionOverwrites, communityId, channel, onUpdate]);

  const confirmDelete = React.useCallback(async () => {
    try {
      setDeleteLoading(true);
      setError('');
      const res = await axiosClient.delete(`/api/communities/${communityId}/channels/${channel?._id}`);
      if (res.data.success) {
        onDelete(channel?._id);
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa kênh');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  }, [communityId, channel, onDelete, onClose]);

  const handleDelete = React.useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handlePermissionChange = React.useCallback((permId, value) => {
    setPermissionOverwrites(prev => {
      let copy = [...prev];
      let overwriteIndex = copy.findIndex(o => o.id === selectedRoleOrMember);
      
      if (overwriteIndex === -1) {
        copy.push({ id: selectedRoleOrMember, type: 'role', allow: [], deny: [] });
        overwriteIndex = copy.length - 1;
      }
      
      let overwrite = { ...copy[overwriteIndex] };
      overwrite.allow = overwrite.allow.filter(p => p !== permId);
      overwrite.deny = overwrite.deny.filter(p => p !== permId);
      
      if (value === 'allow') overwrite.allow.push(permId);
      if (value === 'deny') overwrite.deny.push(permId);
      
      copy[overwriteIndex] = overwrite;
      return copy;
    });
  }, [selectedRoleOrMember]);

  if (!isOpen || !channel) return null;

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="space-y-6 animate-fade-in text-[#dbdee1] max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Tổng quan</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Tên kênh</label>
              <div className="bg-[#1e1f22] rounded flex items-center px-3 py-2 border border-[#1f2023] focus-within:border-[#00a8fc] transition-colors">
                <Hash className="w-5 h-5 text-[#80848e] mr-2" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="bg-transparent text-[#dbdee1] outline-none flex-1 font-medium"
                  placeholder="nhập-tên-kênh"
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Chủ đề kênh</label>
              <div className="bg-[#1e1f22] rounded border border-[#1f2023] focus-within:border-[#00a8fc] transition-colors p-3">
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-transparent text-[#dbdee1] outline-none w-full resize-none h-24"
                  placeholder="Hãy hướng dẫn mọi người cách sử dụng kênh này!"
                  maxLength={1024}
                />
                <div className="text-right text-xs text-[#949ba4] mt-2 font-medium">
                  {1024 - topic.length}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1f2023]">
              <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Chế độ chậm</label>
              <select 
                value={slowMode}
                onChange={(e) => setSlowMode(Number(e.target.value))}
                className="w-full bg-[#1e1f22] text-[#dbdee1] px-3 py-2.5 rounded border border-[#1f2023] focus:border-[#00a8fc] outline-none appearance-none"
              >
                <option value={0}>Tắt</option>
                <option value={5}>5 giây</option>
                <option value={10}>10 giây</option>
                <option value={15}>15 giây</option>
                <option value={30}>30 giây</option>
                <option value={60}>1 phút</option>
                <option value={120}>2 phút</option>
                <option value={300}>5 phút</option>
                <option value={600}>10 phút</option>
              </select>
              <p className="text-xs text-[#949ba4] mt-2">Thành viên sẽ bị giới hạn số lượng tin nhắn gửi đi trong cùng một khoảng thời gian.</p>
            </div>

            <div className="pt-4 border-t border-[#1f2023] flex items-center justify-between">
              <div>
                <label className="block text-[15px] font-medium text-[#dbdee1] mb-1">Kênh giới hạn độ tuổi</label>
                <p className="text-xs text-[#949ba4] max-w-[400px]">Người dùng sẽ cần xác nhận đủ tuổi hợp pháp để xem các nội dung trong kênh này.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={nsfw}
                  onChange={(e) => setNsfw(e.target.checked)}
                />
                <div className="w-11 h-6 bg-[#80848e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a55a]"></div>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'permissions') {
      const currentOverwrite = permissionOverwrites.find(o => o.id === selectedRoleOrMember) || { allow: [], deny: [] };

      const getCategoryIcon = (idx) => {
        switch (idx) {
          case 0: return <Shield className="w-4 h-4 mr-2 text-[#00a8fc]" />;
          case 1: return <Users className="w-4 h-4 mr-2 text-[#23a55a]" />;
          case 2: return <MessageSquare className="w-4 h-4 mr-2 text-[#fcd53f]" />;
          case 3: return <Mic className="w-4 h-4 mr-2 text-[#eb459e]" />;
          case 4: return <LayoutGrid className="w-4 h-4 mr-2 text-[#5865F2]" />;
          default: return <Settings className="w-4 h-4 mr-2" />;
        }
      };

      return (
        <div className="flex h-full min-h-[500px]">
          {/* Roles Sidebar */}
          <div className="w-[200px] border-r border-[#1f2023] pr-4 flex flex-col gap-2 shrink-0">
            <h3 className="text-[11px] font-bold text-[#949ba4] uppercase mb-1 px-2 flex justify-between items-center">
              VAI TRÒ/THÀNH VIÊN
              <button className="hover:text-[#dbdee1] w-4 h-4 rounded hover:bg-[#3f4147] flex items-center justify-center" title="Thêm vai trò/thành viên">
                <Plus className="w-3 h-3" />
              </button>
            </h3>
            
            <div 
              className={`px-2 py-1.5 rounded flex items-center cursor-pointer transition-colors ${selectedRoleOrMember === 'everyone' ? 'bg-[#404249] text-white shadow-sm' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
              onClick={() => setSelectedRoleOrMember('everyone')}
            >
              <div className="w-5 h-5 rounded-full bg-[#35373c] flex items-center justify-center mr-2 shrink-0">
                <span className="text-[10px] font-bold">@</span>
              </div>
              <span className="truncate text-[14px] font-medium">@everyone</span>
            </div>

            <a href="#" className="text-[#00a8fc] text-[13px] hover:underline px-2 mt-4 inline-flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Cần giúp về Quyền hạn?
            </a>
          </div>

          {/* Permissions Content */}
          <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex-1 pl-8 overflow-y-auto pr-4 hide-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="animate-fade-in">
              <div className="mb-8 bg-[#2b2d31] p-4 rounded-lg border border-[#1f2023] shadow-md flex items-start justify-between relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-[#00a8fc]"></div>
                 <div className="pl-2">
                   <h2 className="text-[17px] font-bold text-white flex items-center gap-2 mb-1">
                     Đang chỉnh sửa quyền cho: 
                     <span className="text-[#00a8fc] bg-[#00a8fc]/10 px-2.5 py-0.5 rounded-md text-[15px]">
                       {selectedRoleOrMember === 'everyone' ? '@everyone' : 'Vai trò được chọn'}
                     </span>
                   </h2>
                   <p className="text-[13px] text-[#949ba4]">Các quyền được thiết lập tại đây sẽ ghi đè lên quyền mặc định của máy chủ. Cẩn thận khi cấp quyền quản trị.</p>
                 </div>
              </div>

              {PERMISSIONS_LIST.map((category, idx) => (
                <div key={idx} className="mb-10">
                  <h3 className="text-[#b5bac1] text-[13px] font-bold mb-4 uppercase tracking-wider px-1 flex items-center">
                    {getCategoryIcon(idx)}
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((perm) => {
                      const isAllowed = currentOverwrite.allow.includes(perm.id);
                      const isDenied = currentOverwrite.deny.includes(perm.id);
                      const isInherit = !isAllowed && !isDenied;

                      return (
                        <div key={perm.id} className="flex justify-between items-start p-4 bg-[#2b2d31] hover:bg-[#313338] rounded-xl border border-[#1f2023] transition-all hover:border-[#3f4147] hover:shadow-md group">
                          <div className="flex-1 pr-6">
                            <div className="text-[15px] text-[#dbdee1] font-semibold mb-1 group-hover:text-white transition-colors">{perm.label}</div>
                            <div className="text-[#949ba4] text-[13px] leading-relaxed mb-3">{perm.desc}</div>
                            <div className="text-[11px] font-medium text-[#b5bac1] bg-[#1e1f22] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1f2023]">
                              <span className="text-[14px]">✨</span> 
                              Áp dụng cho: <strong className="text-[#dbdee1]">{selectedRoleOrMember === 'everyone' ? 'Tất cả mọi người trong kênh này' : 'Thành viên có vai trò này'}</strong>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center shrink-0 pt-1">
                            <div className="flex bg-[#1e1f22] rounded-lg overflow-hidden p-1 shadow-sm border border-[#1f2023] gap-0.5">
                              <button 
                                onClick={() => handlePermissionChange(perm.id, 'deny')}
                                title="Từ chối: Chặn hoàn toàn quyền này"
                                className={`w-11 h-9 flex items-center justify-center rounded-md transition-all
                                  ${isDenied ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(244,63,94,0.4)]' : 'text-[#80848e] hover:bg-[#3f4147] hover:text-[#dbdee1]'}
                                `}
                              >
                                <X className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handlePermissionChange(perm.id, 'inherit')}
                                title="Kế thừa: Theo cài đặt gốc của máy chủ"
                                className={`w-11 h-9 flex items-center justify-center transition-all rounded-md
                                  ${isInherit ? 'bg-[#4e5058] text-white shadow-[0_2px_8px_rgba(78,80,88,0.4)]' : 'text-[#80848e] hover:bg-[#3f4147] hover:text-[#dbdee1]'}
                                `}
                              >
                                <span className="font-bold text-[18px]">/</span>
                              </button>
                              <button 
                                onClick={() => handlePermissionChange(perm.id, 'allow')}
                                title="Cho phép: Cấp quyền này vô điều kiện"
                                className={`w-11 h-9 flex items-center justify-center transition-all rounded-md
                                  ${isAllowed ? 'bg-[#23a55a] text-white shadow-[0_2px_8px_rgba(35,165,90,0.4)]' : 'text-[#80848e] hover:bg-[#3f4147] hover:text-[#dbdee1]'}
                                `}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                            <div className="flex justify-between w-full px-1.5 text-[10px] font-bold text-[#80848e] mt-1.5 uppercase tracking-wider">
                              <span className={isDenied ? 'text-rose-400' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>Từ chối</span>
                              <span className={isAllowed ? 'text-[#23a55a]' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>Cho phép</span>
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
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-[#949ba4]">
        Tính năng đang được phát triển...
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#313338] flex animate-fade-in">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#2b2d31] flex justify-end shrink-0">
        <div className="w-[240px] py-14 px-2 overflow-y-auto no-scrollbar">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-[#949ba4] uppercase mb-2 px-2 truncate flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1" /> {channel.name.toUpperCase()}
            </h3>
            {menuItems.map(item => (
              <div 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2 py-1.5 rounded text-[15px] cursor-pointer transition-colors mb-0.5 ${
                  activeTab === item.id 
                    ? 'bg-[#404249] text-white font-medium' 
                    : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                {item.label}
              </div>
            ))}
            
            <div className="h-[1px] bg-[#1f2023] my-2 mx-2" />
            
            <div 
              onClick={handleDelete}
              className="px-2 py-1.5 rounded text-[15px] cursor-pointer text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-between group"
            >
              <span>Xóa kênh</span>
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100" />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#313338] relative flex flex-col">
        {/* ESC Button */}
        <div className="absolute top-10 right-10 flex flex-col items-center gap-1 cursor-pointer group" onClick={onClose}>
          <div className="w-9 h-9 rounded-full border-2 border-[#b5bac1] group-hover:border-white flex items-center justify-center transition-colors text-[#b5bac1] group-hover:text-white">
            <X className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#b5bac1] group-hover:text-white">ESC</span>
        </div>

        <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div 
          className={`${activeTab === 'permissions' ? 'max-w-[960px]' : 'max-w-[740px]'} w-full pt-14 px-10 overflow-y-auto hide-scroll pb-20 relative`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-4 py-3 rounded mb-6 flex justify-between items-center animate-fade-in">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
            </div>
          )}
          {renderContent()}
        </div>

        {/* Sticky Unsaved Changes Banner */}
        {hasChanges && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-start px-10 pointer-events-none">
            <div className={`w-full ${activeTab === 'permissions' ? 'max-w-[960px]' : 'max-w-[740px]'} bg-[#111214] p-3 rounded-lg flex items-center justify-between border border-[#1f2023] animate-fade-in shadow-2xl z-50 pointer-events-auto`}>
              <span className="text-[15px] font-medium text-white px-2">Bạn có thay đổi chưa lưu!</span>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => {
                    setName(channel.name || '');
                    setTopic(channel.topic || '');
                    setSlowMode(channel.slowMode || 0);
                    setNsfw(channel.nsfw || false);
                    setPermissionOverwrites(channel.permissionOverwrites || []);
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center animate-fade-in">
          <div className="bg-[#313338] w-[440px] rounded-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Xóa Kênh</h2>
            </div>
            <div className="px-4 pb-6 text-[#dbdee1]">
              Bạn có chắc chắn muốn xóa kênh <strong className="text-white">#{channel.name}</strong> không? Hành động này không thể hoàn tác và tất cả tin nhắn trong kênh sẽ bị mất.
            </div>
            <div className="bg-[#2b2d31] p-4 flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded text-white hover:underline transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteLoading}
                className={`bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2 ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Xóa Kênh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
