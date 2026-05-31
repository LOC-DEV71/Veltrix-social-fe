import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import getCroppedImg from '../utils/cropImage';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ 
  isOpen, 
  imageSrc, 
  onClose, 
  onCropComplete, 
  aspectRatio = 17 / 6,
  cropShape = "rect",
  title = "Cắt Ảnh"
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      onCropComplete(croppedImage.file, croppedImage.url);
      onClose();
    } catch (e) {
      console.error(e);
      // fallback or error handling
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#313338] w-full max-w-lg rounded-xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1f2023] flex justify-between items-center">
          <h2 className="text-[#f2f3f5] text-lg font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[#b5bac1] hover:text-[#f2f3f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[400px] bg-[#1e1f22]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            objectFit="contain"
            showGrid={true}
          />
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-col gap-4 bg-[#2b2d31]">
          <div className="flex items-center gap-4">
            <span className="text-[#b5bac1] text-xs font-bold uppercase shrink-0">Thu / Phóng</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-[#5865F2] h-1.5 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-[#dbdee1] hover:underline text-sm font-medium"
              disabled={isProcessing}
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? 'Đang xử lý...' : (
                <>
                  <Check className="w-4 h-4" /> Áp dụng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
