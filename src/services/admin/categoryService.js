import axiosClient from '../axiosClient';

const categoryService = {
  // GET /api/admin/categories → dạng Tree lồng nhau
  getAll: async () => {
    const res = await axiosClient.get('/api/admin/categories');
    return res.data;
  },

  // GET /api/admin/categories/flat → dạng phẳng (dùng cho dropdown)
  getFlat: async () => {
    const res = await axiosClient.get('/api/admin/categories/flat');
    return res.data;
  },

  // POST /api/admin/categories
  create: async (data) => {
    const res = await axiosClient.post('/api/admin/categories', data);
    return res.data;
  },

  // PUT /api/admin/categories/:id
  update: async (id, data) => {
    const res = await axiosClient.put(`/api/admin/categories/${id}`, data);
    return res.data;
  },

  // DELETE /api/admin/categories/:id?strategy=cascade|detach
  delete: async (id, strategy = 'cascade') => {
    const res = await axiosClient.delete(`/api/admin/categories/${id}?strategy=${strategy}`);
    return res.data;
  }
};

export default categoryService;
