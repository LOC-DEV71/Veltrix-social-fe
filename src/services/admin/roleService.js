import axiosClient from '../axiosClient';

export const roleService = {
  // GET /api/admin/roles
  getAll: async () => {
    const response = await axiosClient.get('/api/admin/roles');
    return response.data;
  },

  // GET /api/admin/roles/:id
  getById: async (id) => {
    const response = await axiosClient.get(`/api/admin/roles/${id}`);
    return response.data;
  },

  // POST /api/admin/roles
  create: async (data) => {
    const response = await axiosClient.post('/api/admin/roles', data);
    return response.data;
  },

  // PUT /api/admin/roles/:id
  update: async (id, data) => {
    const response = await axiosClient.put(`/api/admin/roles/${id}`, data);
    return response.data;
  },

  // DELETE /api/admin/roles/:id
  delete: async (id) => {
    const response = await axiosClient.delete(`/api/admin/roles/${id}`);
    return response.data;
  }
};

export default roleService;
