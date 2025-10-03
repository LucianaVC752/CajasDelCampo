import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = api;

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  createAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/users/addresses/${id}/default`),
  getSubscriptions: () => api.get('/users/subscriptions'),
  getOrders: (params) => api.get('/users/orders', { params }),
  getOrder: (id) => api.get(`/users/orders/${id}`),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
  getProductsByCategory: (category, params) => api.get(`/products/category/${category}`, { params }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  restoreProduct: (id) => api.patch(`/products/${id}/restore`),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
};

// Farmers API
export const farmersAPI = {
  getFarmers: (params) => api.get('/farmers', { params }),
  getFarmer: (id) => api.get(`/farmers/${id}`),
  getFarmerProducts: (id, params) => api.get(`/farmers/${id}/products`, { params }),
  getFarmerStats: (id) => api.get(`/farmers/${id}/stats`),
  createFarmer: (data) => api.post('/farmers', data),
  updateFarmer: (id, data) => api.put(`/farmers/${id}`, data),
  deleteFarmer: (id) => api.delete(`/farmers/${id}`),
  restoreFarmer: (id) => api.patch(`/farmers/${id}/restore`),
};

// Subscriptions API
export const subscriptionsAPI = {
  getMySubscriptions: () => api.get('/subscriptions/my-subscriptions'),
  createSubscription: (data) => api.post('/subscriptions', data),
  updateSubscription: (id, data) => api.put(`/subscriptions/${id}`, data),
  pauseSubscription: (id, data) => api.patch(`/subscriptions/${id}/pause`, data),
  resumeSubscription: (id) => api.patch(`/subscriptions/${id}/resume`),
  cancelSubscription: (id, data) => api.patch(`/subscriptions/${id}/cancel`, data),
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  getPlans: () => api.get('/subscriptions/plans/available'),
  // Admin routes
  getAllSubscriptions: (params) => api.get('/subscriptions', { params }),
  getSubscriptionAdmin: (id) => api.get(`/subscriptions/admin/${id}`),
  updateSubscriptionAdmin: (id, data) => api.put(`/subscriptions/admin/${id}`, data),
  cancelSubscriptionAdmin: (id, data) => api.patch(`/subscriptions/admin/${id}/cancel`, data),
};

// Orders API
export const ordersAPI = {
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrderFromSubscription: (subscriptionId, data) => api.post(`/orders/from-subscription/${subscriptionId}`, data),
  cancelOrder: (id, data) => api.patch(`/orders/${id}/cancel`, data),
  // Admin routes
  getAllOrders: (params) => api.get('/orders', { params }),
  getOrderAdmin: (id) => api.get(`/orders/admin/${id}`),
  updateOrderStatus: (id, data) => api.patch(`/orders/admin/${id}/status`, data),
};

// Payments API
export const paymentsAPI = {
  getMyPayments: (params) => api.get('/payments/my-payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  updatePaymentStatus: (id, data) => api.patch(`/payments/${id}/status`, data),
  createStripePaymentIntent: (data) => api.post('/payments/stripe/create-payment-intent', data),
  confirmStripePayment: (data) => api.post('/payments/stripe/confirm', data),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  // Admin routes
  getAllPayments: (params) => api.get('/payments', { params }),
  getPaymentAdmin: (id) => api.get(`/payments/admin/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: (params) => api.get('/admin/dashboard', { params }),
  getStats: (params) => api.get('/admin/stats', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
  getProducts: (params) => api.get('/admin/products', { params }),
  getFarmers: (params) => api.get('/admin/farmers', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
};

export default api;
