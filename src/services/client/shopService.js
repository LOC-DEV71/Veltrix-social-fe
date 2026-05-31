import axiosClient from '../axiosClient';

export const shopService = {
  // GET /api/products
  getProducts: async () => {
    const response = await axiosClient.get('/api/products');
    return response.data;
  },

  // POST /api/shop/buy
  buyProduct: async (userId, productId) => {
    const response = await axiosClient.post('/api/shop/buy', { userId, productId });
    return response.data;
  }
};

export default shopService;
