import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { useUserStore } from '../../store/useUserStore';

export default function InvitePage() {
  const { inviteCode } = useParams(); // Using community ID as invite code for now
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch community basic info
    const fetchCommunity = async () => {
      try {
        const res = await axiosClient.get(`/api/communities/${inviteCode}`);
        setCommunity(res.data.data);
      } catch (err) {
        setError('Link mời không hợp lệ hoặc máy chủ không tồn tại.');
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [inviteCode]);

  const handleJoin = async () => {
    try {
      setLoading(true);
      await axiosClient.post(`/api/communities/${inviteCode}/join`);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.message?.includes('đã là thành viên')) {
        navigate('/'); // Redirect to app if already in
      } else {
        setError(err.response?.data?.message || 'Không thể tham gia máy chủ.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#313338] text-white">Đang tải...</div>;
  }

  const bannerUrl = (community?.banner && community?.isBoosted)
    ? (community.banner.startsWith('http') || community.banner.startsWith('data:') ? community.banner : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${community.banner}`)
    : null;

  return (
    <div 
      className="flex h-screen w-screen items-center justify-center bg-[#313338] relative bg-cover bg-center"
      style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none' }}
    >
      {bannerUrl && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />}
      <div className="bg-[#1e1f22] w-full max-w-md p-8 rounded-xl shadow-2xl flex flex-col items-center text-center relative z-10">
        {error ? (
          <div className="text-rose-500 mb-4">{error}</div>
        ) : (
          <>
            <div className="w-20 h-20 bg-[#2b2d31] rounded-[32px] overflow-hidden mb-4">
              {community?.icon ? (
                 <img src={community.icon.startsWith('http') || community.icon.startsWith('data:') ? community.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${community.icon}`} className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">{community?.name?.charAt(0)}</div>
              )}
            </div>
            <h2 className="text-[#dbdee1] text-xl font-bold mb-1">
              Bạn đã được mời tham gia máy chủ
            </h2>
            <h1 className="text-white text-3xl font-extrabold mb-8">{community?.name}</h1>
            
            <button 
              onClick={handleJoin}
              className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Chấp nhận lời mời
            </button>
          </>
        )}
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-[#949ba4] hover:text-[#dbdee1] text-sm font-medium"
        >
          Quay lại trang chính
        </button>
      </div>
    </div>
  );
}
