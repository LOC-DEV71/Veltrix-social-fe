import axiosClient from '../axiosClient';

const productService = {
  // GET /api/admin/products/list
  getAll: async (params = {}) => {
    const res = await axiosClient.get('/api/admin/products/list', { params });
    return res.data;
  },

  // POST /api/admin/products (với FormData)
  create: async (formData) => {
    const res = await axiosClient.post('/api/admin/products', formData);
    return res.data;
  },

  // PUT /api/admin/products/:id (với FormData)
  update: async (id, formData) => {
    const res = await axiosClient.put(`/api/admin/products/${id}`, formData);
    return res.data;
  },

  // DELETE /api/admin/products/:id
  delete: async (id) => {
    const res = await axiosClient.delete(`/api/admin/products/${id}`);
    return res.data;
  },

  // PUT /api/admin/products/bulk
  bulkAction: async (ids, action) => {
    const res = await axiosClient.put('/api/admin/products/bulk', { ids, action });
    return res.data;
  }
};

export default productService;
