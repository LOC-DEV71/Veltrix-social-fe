import React, { useState } from 'react';
import { X, Hash, Volume2, Loader2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';

export default function CreateChannelModal({ isOpen, onClose, communityId, onChannelCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên kênh không được để trống');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await axiosClient.post(`/api/communities/${communityId}/channels`, {
        name,
        type
      });
      
      if (res.data.success) {
        onChannelCreated(res.data.data);
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tạo kênh');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setType('text');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fade-in px-4">
      <div 
        className="bg-[#313338] rounded-xl w-full max-w-[460px] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1f2023]/40">
          <h2 className="text-white font-bold text-xl">Tạo Kênh</h2>
          <button onClick={handleClose} className="text-[#949ba4] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg text-sm border border-rose-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">Loại Kênh</label>
            <div className="flex flex-col gap-2">
              <div 
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${type === 'text' ? 'bg-[#404249]' : 'bg-[#2b2d31] hover:bg-[#35373c]'}`}
                onClick={() => setType('text')}
              >
                <Hash className="w-6 h-6 text-[#949ba4]" />
                <div className="flex-1">
                  <div className="text-[#dbdee1] font-medium text-[15px]">Kênh Chat</div>
                  <div className="text-[#949ba4] text-xs">Gửi tin nhắn, hình ảnh, nhãn dán...</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${type === 'text' ? 'border-white' : 'border-[#80848e]'}`}>
                  {type === 'text' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
              </div>

              <div 
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${type === 'voice' ? 'bg-[#404249]' : 'bg-[#2b2d31] hover:bg-[#35373c]'}`}
                onClick={() => setType('voice')}
              >
                <Volume2 className="w-6 h-6 text-[#949ba4]" />
                <div className="flex-1">
                  <div className="text-[#dbdee1] font-medium text-[15px]">Kênh Thoại</div>
                  <div className="text-[#949ba4] text-xs">Trò chuyện bằng giọng nói, video...</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${type === 'voice' ? 'border-white' : 'border-[#80848e]'}`}>
                  {type === 'voice' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
              Tên Kênh
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]">
                {type === 'text' ? <Hash className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={type === 'text' ? 'kênh-mới' : 'Phòng Thoại Mới'}
                className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 pl-9 rounded outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-[#949ba4]"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white hover:underline"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo Kênh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
