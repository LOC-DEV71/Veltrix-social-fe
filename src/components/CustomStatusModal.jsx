import React, { useState } from 'react';
import { X, Save, Smile, Trash2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';
import EmojiPicker from 'emoji-picker-react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';

export default function CustomStatusModal({ isOpen, onClose, currentStatus, onSaved }) {
  const [text, setText] = useState(currentStatus?.text || '');
  const [emoji, setEmoji] = useState(currentStatus?.emoji || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleSave = async (statusData) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.put('/api/auth/profile', {
        customStatus: statusData
      });
      if (res.data?.success) {
        dispatch(loginSuccess(res.data.data));
        if (onSaved) onSaved(res.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi lưu trạng thái:', error);
      alert(error.response?.data?.message || 'Không thể lưu trạng thái!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    handleSave(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave({ text, emoji });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#313338] w-full max-w-md rounded-lg shadow-2xl flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#1f2023]/30">
          <h2 className="text-xl font-bold text-white">Đặt trạng thái tùy chỉnh</h2>
          <button onClick={onClose} className="text-[#949ba4] hover:text-[#dbdee1] transition-colors p-1 rounded hover:bg-[#2b2d31]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Trạng thái của bạn là gì?</p>
            <div className="flex bg-[#1e1f22] rounded overflow-visible relative">
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#2b2d31] transition-colors rounded-l flex items-center justify-center shrink-0"
              >
                {emoji ? <span className="text-xl leading-none">{emoji}</span> : <Smile className="w-5 h-5" />}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-0 right-[calc(100%+16px)] z-[500] shadow-2xl rounded-lg border border-[#1f2023] animate-in fade-in zoom-in-95 duration-200">
                  <EmojiPicker 
                    onEmojiClick={(e) => { setEmoji(e.emoji); setShowEmojiPicker(false); }}
                    theme="dark"
                  />
                </div>
              )}

              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Hỗ trợ tối đa 128 ký tự"
                maxLength={128}
                className="flex-1 bg-transparent border-none text-[#dbdee1] p-3 focus:outline-none focus:ring-0 placeholder-[#949ba4] text-sm"
              />
              
              {(text || emoji) && (
                <button 
                  type="button"
                  onClick={() => { setText(''); setEmoji(''); }}
                  className="p-3 text-[#949ba4] hover:text-[#dbdee1] transition-colors rounded-r flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-[#2b2d31] p-3 rounded-md border border-[#1f2023]">
            <p className="text-[13px] text-[#dbdee1] mb-1">
              Trạng thái sẽ tự động xóa sau <strong>24 giờ</strong>.
            </p>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button 
              type="button" 
              onClick={handleClear}
              disabled={isLoading || (!currentStatus?.text && !currentStatus?.emoji)}
              className="text-[13px] font-medium text-rose-500 hover:underline disabled:opacity-50 disabled:hover:no-underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa trạng thái
            </button>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white hover:underline transition-all"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={isLoading || (!text && !emoji)}
                className="px-5 py-2 text-sm font-medium text-white bg-[#5865F2] hover:bg-[#4752C4] rounded transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
              >
                {isLoading ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
