import axiosClient from '../axiosClient';

const dmService = {
  // Get or create 1-on-1 DM room with target user
  getOrCreateDMRoom: async (targetUserId) => {
    try {
      const response = await axiosClient.post('/api/dm/get-or-create', { targetUserId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get active DM rooms for current user
  getUserDMRooms: async () => {
    try {
      const response = await axiosClient.get('/api/dm/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get message history for DM room
  getDMMessages: async (roomId) => {
    try {
      const response = await axiosClient.get(`/api/dm/messages/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Send direct message
  sendDirectMessage: async (roomId, { content, attachments, replyToId }) => {
    try {
      const response = await axiosClient.post(`/api/dm/messages/${roomId}`, { content, attachments, replyToId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle emoji reaction on DM message
  toggleReaction: async (roomId, msgId, emoji) => {
    try {
      const response = await axiosClient.post(`/api/dm/messages/${roomId}/${msgId}/reactions`, { emoji });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default dmService;
