import axiosClient from '../axiosClient';

export const permissionService = {
  // GET /api/admin/permissions
  getAll: async () => {
    const response = await axiosClient.get('/api/admin/permissions');
    return response.data;
  },

  // GET /api/admin/permissions/:id
  getById: async (id) => {
    const response = await axiosClient.get(`/api/admin/permissions/${id}`);
    return response.data;
  },

  // POST /api/admin/permissions
  create: async (data) => {
    const response = await axiosClient.post('/api/admin/permissions', data);
    return response.data;
  },

  // PUT /api/admin/permissions/:id
  update: async (id, data) => {
    const response = await axiosClient.put(`/api/admin/permissions/${id}`, data);
    return response.data;
  },

  // DELETE /api/admin/permissions/:id
  delete: async (id) => {
    const response = await axiosClient.delete(`/api/admin/permissions/${id}`);
    return response.data;
  }
};

export default permissionService;
