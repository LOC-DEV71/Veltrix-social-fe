import axiosClient from '../axiosClient';

const friendService = {
  // Lấy danh sách bạn bè & lời mời
  getFriendsData: async () => {
    try {
      const response = await axiosClient.get('/api/friends');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Gửi lời mời kết bạn (bằng username)
  sendFriendRequest: async (targetUsername) => {
    try {
      const response = await axiosClient.post('/api/friends/request', { targetUsername });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Chấp nhận lời mời
  acceptFriendRequest: async (targetId) => {
    try {
      const response = await axiosClient.post('/api/friends/accept', { targetId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Từ chối / Hủy lời mời
  declineFriendRequest: async (targetId) => {
    try {
      const response = await axiosClient.post('/api/friends/decline', { targetId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa bạn
  removeFriend: async (targetId) => {
    try {
      const response = await axiosClient.delete(`/api/friends/remove/${targetId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default friendService;
