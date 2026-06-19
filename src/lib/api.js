// Location: lib/api.js

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use relative URL to use Next.js proxy

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // withCredentials not needed for same-origin requests via Next.js proxy
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Check if 401 Unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/users/auth/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              this.setAccessToken(access);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access}`;
              }

              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed (expired/invalid refresh token) - clear tokens
            this.clearTokens();

            // Surface the original 401 instead of silently retrying without auth.
            // Retrying without auth just produces a second, confusing 401 for any
            // protected endpoint (e.g. contact_seller) and masks the real cause
            // (expired session) from the calling code's error handling.
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  getAccessToken() {
    return typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  }

  getRefreshToken() {
    return typeof window !== 'undefined' ? sessionStorage.getItem('refresh_token') : null;
  }

  setAccessToken(token) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', token);
    }
  }

  setTokens(access, refresh) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
    }
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    }
  }

  // Authentication
  async register(data) {
    const response = await this.client.post('/users/auth/register/', data);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  }

  async login(email, password) {
    const response = await this.client.post('/users/auth/login/', { email, password });
    if (response.data.tokens) {
      this.setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  }

  // Generic social login
  async socialLogin(provider, credentials) {
    const response = await this.client.post(`/users/auth/${provider}/`, credentials);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  }

  async loginWithGoogle(token) {
    return this.socialLogin('google', { token });
  }

  async loginWithDiscord(code, redirect_uri) {
    return this.socialLogin('discord', { code, redirect_uri });
  }

  async loginWithMicrosoft(code, redirect_uri) {
    return this.socialLogin('microsoft', { code, redirect_uri });
  }

  logout() {
    this.clearTokens();
  }

  // User
  async getCurrentUser() {
    // Add timestamp to bust browser cache — stale role data causes UI issues
    const response = await this.client.get('/users/auth/profile/', {
      params: { _t: Date.now() }
    });
    return response.data;
  }

  async updateProfile(data) {
    const response = await this.client.patch('/users/auth/profile/', data);
    return response.data;
  }

  async changePassword(oldPassword, newPassword) {
    const response = await this.client.post('/users/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  async forgotPassword(email) {
    const response = await this.client.post('/users/auth/forgot-password/', { email });
    return response.data;
  }

  async resetPassword(email, otp, newPassword) {
    const response = await this.client.post('/users/auth/reset-password/', {
      email,
      otp,
      new_password: newPassword,
    });
    return response.data;
  }

  // Products
  async getProducts(params) {
    // Add timestamp to bust cache
    const paramsWithTimestamp = {
      ...params,
      _t: Date.now()
    };
    const response = await this.client.get('/products/', { params: paramsWithTimestamp });
    return response.data;
  }

  async getProduct(id) {
    const response = await this.client.get(`/products/${id}/`);
    return response.data;
  }

  async getFeaturedProducts() {
    // Add timestamp to bust cache
    const response = await this.client.get('/products/featured/', {
      params: { _t: Date.now() }
    });
    return response.data;
  }

  async getRecommendations(userId) {
    const endpoint = userId ? `/recommendations/user/${userId}/` : '/recommendations/';
    const response = await this.client.get(endpoint);
    return response.data;
  }

  // Categories
  async getCategories() {
    const response = await this.client.get('/categories/');
    return response.data;
  }

  // Cart
  async getCart() {
    const response = await this.client.get('/cart/');
    return response.data;
  }

  async addToCart(productId, quantity = 1) {
    const response = await this.client.post('/cart/add/', {
      product_id: productId,
      quantity,
    });
    return response.data;
  }

  async updateCartItem(itemId, quantity) {
    const response = await this.client.patch(`/cart/items/${itemId}/`, { quantity });
    return response.data;
  }

  async removeFromCart(itemId) {
    const response = await this.client.delete(`/cart/items/${itemId}/`);
    return response.data;
  }

  async clearCart() {
    const response = await this.client.delete('/cart/clear/');
    return response.data;
  }

  // Orders
  async createOrder(data) {
    const response = await this.client.post('/orders/create/', data);
    return response.data;
  }

  async getOrders(params) {
    const response = await this.client.get('/orders/', { params });
    return response.data;
  }

  async getOrder(id) {
    const response = await this.client.get(`/orders/${id}/`);
    return response.data;
  }

  // Payment
  async initiatePayment(orderId, phoneNumber, service = 'MTN') {
    const response = await this.client.post(`/payments/initiate/`, {
      order_id: orderId,
      phone_number: phoneNumber,
      service,
    });
    return response.data;
  }

  async checkPaymentStatus(transactionId) {
    const response = await this.client.get(`/payments/status/${transactionId}/`);
    return response.data;
  }

  // Wishlist
  async getWishlist() {
    const response = await this.client.get('/wishlist/');
    return response.data;
  }

  async addToWishlist(productId) {
    const response = await this.client.post('/wishlist/add/', {
      product_id: productId,
    });
    return response.data;
  }

  async removeFromWishlist(itemId) {
    const response = await this.client.delete(`/wishlist/${itemId}/`);
    return response.data;
  }

  // Reviews
  async addReview(productId, rating, comment, title) {
    const response = await this.client.post('/reviews/', {
      product: productId,
      rating,
      comment,
      title,
    });
    return response.data;
  }

  async getProductReviews(productId, params) {
    const response = await this.client.get(`/products/${productId}/reviews/`, { params });
    return response.data;
  }

  // Activity tracking
  async trackActivity(activityType, productId, metadata) {
    try {
      await this.client.post('/activity/track/', {
        activity_type: activityType,
        product_id: productId,
        metadata,
      });
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  }

  // ============ NEW FEATURES ============

  // Vendors
  async registerVendor(data) {
    const response = await this.client.post('/vendor/register/', data);
    return response.data;
  }

  async getVendorDashboard() {
    const response = await this.client.get('/vendor/dashboard/');
    return response.data;
  }

  async getVendorProducts() {
    const response = await this.client.get('/vendor/products/');
    return response.data;
  }

  async getVendorOrders() {
    const response = await this.client.get('/vendor/orders/');
    return response.data;
  }

  async getVendors() {
    const response = await this.client.get('/vendors/');
    return response.data;
  }

  async getVendor(slug) {
    const response = await this.client.get(`/vendors/${slug}/`);
    return response.data;
  }

  async getVendorPublicProducts(slug) {
    const response = await this.client.get(`/vendors/${slug}/products/`);
    return response.data;
  }

  // Chat
  async getConversations() {
    const response = await this.client.get('/chat/conversations/');
    return response.data;
  }

  async getMessages(conversationId) {
    const response = await this.client.get(`/chat/conversations/${conversationId}/messages/`);
    return response.data;
  }

  async sendChatMessage(data) {
    const response = await this.client.post('/chat/send/', data);
    return response.data;
  }

  async getUnreadCount() {
    const response = await this.client.get('/chat/unread/');
    return response.data;
  }

  // Admin private threads (admin <-> single buyer/seller)
  async getAdminThreads() {
    const response = await this.client.get('/chat/admin-threads/');
    return response.data;
  }

  /** For buyers/sellers: fetch their own admin threads (messages from the admin team) */
  async getMyAdminThreads() {
    const response = await this.client.get('/chat/admin-threads/');
    return response.data;
  }

  async getAdminThreadMessages(threadId) {
    const response = await this.client.get(`/chat/admin-threads/${threadId}/messages/`);
    return response.data;
  }

  async startAdminThread(userId, conversationId) {
    const response = await this.client.post('/chat/admin-threads/start/', {
      user_id: userId,
      conversation_id: conversationId,
    });
    return response.data;
  }

  async sendAdminThreadMessage(threadId, content) {
    const response = await this.client.post('/chat/admin-threads/send/', {
      thread_id: threadId,
      content,
    });
    return response.data;
  }

  // Delivery
  async getDeliveryZones() {
    const response = await this.client.get('/delivery/zones/');
    return response.data;
  }

  async estimateDelivery(data) {
    const response = await this.client.post('/delivery/estimate/', data);
    return response.data;
  }

  // Coupons
  async validateCoupon(code, orderTotal) {
    const response = await this.client.post('/coupons/validate/', {
      code,
      order_total: orderTotal,
    });
    return response.data;
  }

  // Analytics (Admin)
  async getDashboardStats() {
    const response = await this.client.get('/analytics/dashboard/');
    return response.data;
  }

  async getSalesChart(days = 30) {
    const response = await this.client.get(`/analytics/sales-chart/?days=${days}`);
    return response.data;
  }

  async getTopProducts(limit = 10) {
    const response = await this.client.get(`/analytics/top-products/?limit=${limit}`);
    return response.data;
  }

  async getRecentOrders(limit = 20) {
    const response = await this.client.get(`/analytics/recent-orders/?limit=${limit}`);
    return response.data;
  }

  // Price Tracking
  async getPriceHistory(productId) {
    const response = await this.client.get(`/products/${productId}/price-history/`);
    return response.data;
  }

  async createPriceAlert(productId, targetPrice) {
    const response = await this.client.post('/price-alerts/create/', {
      product_id: productId,
      target_price: targetPrice,
    });
    return response.data;
  }

  async getMyPriceAlerts() {
    const response = await this.client.get('/price-alerts/');
    return response.data;
  }

  async deletePriceAlert(alertId) {
    const response = await this.client.delete(`/price-alerts/${alertId}/`);
    return response.data;
  }

  // Visual Search
  async visualSearch(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await this.client.post('/products/visual-search/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Generic HTTP methods for flexibility
  async get(url, config) {
    const response = await this.client.get(url, config);
    return response;
  }

  async post(url, data, config) {
    const response = await this.client.post(url, data, config);
    return response;
  }

  async put(url, data, config) {
    const response = await this.client.put(url, data, config);
    return response;
  }

  async patch(url, data, config) {
    const response = await this.client.patch(url, data, config);
    return response;
  }

  async delete(url, config) {
    const response = await this.client.delete(url, config);
    return response;
  }
}

export const api = new APIClient();
export default api;

