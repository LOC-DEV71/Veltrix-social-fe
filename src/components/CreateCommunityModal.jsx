import React, { useState, useRef } from 'react';
import { X, Upload, Users, ChevronRight, Gamepad2, Heart, GraduationCap, School, MapPin, Palette, Sparkles, Loader2 } from 'lucide-react';
import axiosClient from '../services/axiosClient';

// Template definitions with icons and default channel info
const TEMPLATES = [
  { id: 'custom', label: 'Tạo Mẫu Riêng', icon: '🎨', emoji: <Sparkles className="w-5 h-5" />, isCustom: true },
  { id: 'gaming', label: 'Gaming', icon: '🎮', emoji: <Gamepad2 className="w-5 h-5" /> },
  { id: 'friends', label: 'Bạn bè', icon: '💕', emoji: <Heart className="w-5 h-5" /> },
  { id: 'study', label: 'Nhóm Học Tập', icon: '📚', emoji: <GraduationCap className="w-5 h-5" /> },
  { id: 'school', label: 'Câu Lạc Bộ Trường Học', icon: '🏫', emoji: <School className="w-5 h-5" /> },
  { id: 'community', label: 'Cộng Đồng Địa Phương', icon: '🌿', emoji: <MapPin className="w-5 h-5" /> },
  { id: 'creator', label: 'Nghệ Sĩ và Người Sáng Tạo', icon: '🎭', emoji: <Palette className="w-5 h-5" /> },
];

const PURPOSE_OPTIONS = [
  { id: 'friends', label: 'Dành cho tôi và bạn bè tôi', icon: '👥' },
  { id: 'community', label: 'Dành cho một câu lạc bộ hoặc cộng đồng', icon: '🌐' },
];

const CreateCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Pick template, 2: Pick purpose, 3: Enter name
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [iconFile, setIconFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSelectedPurpose(null);
    setName('');
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setIconFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setStep(2); // Go to purpose step
  };

  const handleSelectPurpose = (purpose) => {
    setSelectedPurpose(purpose);
    setStep(3); // Go to name step
  };

  const handleSkipPurpose = () => {
    setSelectedPurpose(null);
    setStep(3);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type === 'image/gif') {
      setError('Cộng đồng mới chưa được nâng cấp, không thể sử dụng ảnh động (GIF).');
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Vui lòng chọn ảnh nhỏ hơn 5MB.');
      e.target.value = null;
      return;
    }
    
    setError(null);
    setIconFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Tạo community trước
      let response = await axiosClient.post('/api/communities', {
        name,
        template: selectedTemplate?.id || 'custom',
        purpose: selectedPurpose?.id || null,
        icon: selectedTemplate?.icon || '💬',
      });

      let responseData = response.data?.data || response.data || response;
      let newCommunity = responseData.community || responseData;

      // 2. Nếu có icon file, upload riêng
      if (iconFile) {
        console.log('Bắt đầu upload icon cho cộng đồng:', newCommunity?._id, iconFile);
        if (newCommunity && newCommunity._id) {
          try {
            const formData = new FormData();
            formData.append('icon', iconFile);
            console.log('Sending formData for icon...', formData.get('icon'));
            const iconRes = await axiosClient.post(`/api/communities/${newCommunity._id}/icon`, formData);
            console.log('Kết quả upload icon:', iconRes.data);
            if (iconRes.data?.success) {
              newCommunity = iconRes.data.data;
            }
          } catch (iconErr) {
            console.error('Lỗi khi upload icon riêng:', iconErr.response?.data || iconErr.message);
          }
        } else {
          console.warn('Không tìm thấy _id của newCommunity', newCommunity);
        }
      }

      setName('');
      setStep(1);
      setSelectedTemplate(null);
      setSelectedPurpose(null);
      setIconFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      
      if (typeof onSuccess === 'function') {
        onSuccess(newCommunity);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#313338] w-full max-w-[440px] rounded-lg shadow-2xl overflow-hidden">
        
        {/* Close button */}
        <button 
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-[#b5bac1] hover:text-[#f2f3f5] transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* ===== STEP 1: Choose Template ===== */}
        {step === 1 && (
          <div>
            <div className="text-center p-6 pb-2">
              <h2 className="text-2xl font-bold text-[#f2f3f5] mb-2">Tạo Máy Chủ Của Bạn</h2>
              <p className="text-[#b5bac1] text-sm leading-relaxed">
                Máy chủ của bạn là nơi bạn giao lưu với bạn bè của mình. Hãy tạo máy chủ của riêng bạn và bắt đầu trò chuyện.
              </p>
            </div>

            <div className="px-4 pb-2 space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
              {/* Custom - highlighted at top */}
              {TEMPLATES.filter(t => t.isCustom).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="w-full flex items-center px-4 py-3 rounded-lg border border-[#3f4147] hover:bg-[#3f4147] transition-all group cursor-pointer"
                >
                  <span className="text-xl mr-3">{t.icon}</span>
                  <span className="text-[15px] font-semibold text-[#f2f3f5] flex-1 text-left">{t.label}</span>
                  <ChevronRight className="w-5 h-5 text-[#4e5058] group-hover:text-[#b5bac1] transition-colors" />
                </button>
              ))}

              <p className="text-xs font-bold text-[#b5bac1] uppercase pt-2 px-1">Bắt đầu từ mẫu</p>

              {TEMPLATES.filter(t => !t.isCustom).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="w-full flex items-center px-4 py-3 rounded-lg border border-[#3f4147] hover:bg-[#3f4147] transition-all group cursor-pointer"
                >
                  <span className="text-xl mr-3">{t.icon}</span>
                  <span className="text-[15px] font-semibold text-[#f2f3f5] flex-1 text-left">{t.label}</span>
                  <ChevronRight className="w-5 h-5 text-[#4e5058] group-hover:text-[#b5bac1] transition-colors" />
                </button>
              ))}
            </div>

            {/* Join server */}
            <div className="p-4 pt-3 border-t border-[#3f4147] mt-2">
              <p className="text-center text-[#f2f3f5] font-semibold text-base mb-2">Bạn đã nhận được lời mời rồi?</p>
              <button className="w-full bg-[#4e5058] hover:bg-[#6d6f78] text-white text-sm font-semibold py-2.5 rounded transition-colors">
                Tham gia máy chủ
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Choose Purpose ===== */}
        {step === 2 && (
          <div>
            <div className="text-center p-6 pb-4">
              <h2 className="text-xl font-bold text-[#f2f3f5] mb-2">Cho chúng tôi biết thêm về máy chủ của bạn</h2>
              <p className="text-[#b5bac1] text-sm leading-relaxed">
                Để giúp bạn thiết lập, máy chủ mới của bạn chỉ dành cho một vài người bạn hay cho một cộng đồng lớn hơn?
              </p>
            </div>

            <div className="px-4 pb-4 space-y-2">
              {PURPOSE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectPurpose(opt)}
                  className="w-full flex items-center px-4 py-3.5 rounded-lg border border-[#3f4147] hover:bg-[#3f4147] transition-all group cursor-pointer"
                >
                  <span className="text-xl mr-3">{opt.icon}</span>
                  <span className="text-[15px] font-medium text-[#f2f3f5] flex-1 text-left">{opt.label}</span>
                  <ChevronRight className="w-5 h-5 text-[#4e5058] group-hover:text-[#b5bac1] transition-colors" />
                </button>
              ))}

              <p className="text-center text-sm text-[#949ba4] pt-2">
                Bạn không chắc? Bạn có thể tạm thời{' '}
                <button onClick={handleSkipPurpose} className="text-indigo-400 hover:underline font-medium">
                  bỏ qua câu hỏi này
                </button>.
              </p>
            </div>

            <div className="bg-[#2b2d31] p-4 flex items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-[#f2f3f5] hover:underline"
              >
                Trở lại
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Enter Name & Create ===== */}
        {step === 3 && (
          <div>
            <div className="text-center p-6 pb-4">
              <h2 className="text-xl font-bold text-[#f2f3f5] mb-2">Tuỳ chỉnh máy chủ của bạn</h2>
              <p className="text-[#b5bac1] text-sm leading-relaxed">
                Hãy tạo cá tính cho máy chủ mới bằng cách đặt tên và thêm biểu tượng. Bạn có thể thay đổi bất kỳ lúc nào.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-5 space-y-4">
                {/* Upload Icon Placeholder */}
                <div className="flex justify-center mb-2">
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-dashed border-[#4e5058] flex flex-col items-center justify-center text-[#949ba4] hover:bg-[#3f4147] cursor-pointer transition-colors group relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                          <Upload className="w-5 h-5 text-white mb-1" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase">Tải Lên</span>
                      </>
                    )}
                    <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-1.5 text-white shadow-md z-10">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>

                {/* Template info badge */}
                {selectedTemplate && (
                  <div className="flex items-center gap-2 bg-[#2b2d31] rounded-md px-3 py-2 text-sm text-[#b5bac1]">
                    <span className="text-base">{selectedTemplate.icon}</span>
                    <span>Mẫu: <span className="text-[#f2f3f5] font-medium">{selectedTemplate.label}</span></span>
                  </div>
                )}

                {/* Input Name */}
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-2">
                    Tên máy chủ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Máy chủ của ..."
                    className="w-full bg-[#1e1f22] text-[#f2f3f5] rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    autoFocus
                    required
                  />
                  {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
                
                <p className="text-xs text-[#949ba4]">
                  Bằng cách tạo máy chủ, bạn đồng ý với Hướng dẫn cộng đồng của Vetrix.
                </p>
              </div>

              {/* Footer */}
              <div className="bg-[#2b2d31] p-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-medium text-[#f2f3f5] hover:underline"
                >
                  Trở lại
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default CreateCommunityModal;
