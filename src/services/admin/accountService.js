import axiosClient from '../axiosClient';

export const accountService = {
  // GET /api/admin/accounts
  getAll: async () => {
    const response = await axiosClient.get('/api/admin/accounts');
    return response.data;
  },

  // GET /api/admin/accounts/:id
  getById: async (id) => {
    const response = await axiosClient.get(`/api/admin/accounts/${id}`);
    return response.data;
  },

  // POST /api/admin/accounts
  create: async (data) => {
    const response = await axiosClient.post('/api/admin/accounts', data);
    return response.data;
  },

  // PUT /api/admin/accounts/:id
  update: async (id, data) => {
    const response = await axiosClient.put(`/api/admin/accounts/${id}`, data);
    return response.data;
  },

  // DELETE /api/admin/accounts/:id
  delete: async (id) => {
    const response = await axiosClient.delete(`/api/admin/accounts/${id}`);
    return response.data;
  }
};

export default accountService;
