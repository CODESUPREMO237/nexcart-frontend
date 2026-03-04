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
            // Token refresh failed, clear tokens
            this.clearTokens();
            
            // Don't redirect to login, just retry the request without auth
            // This allows public endpoints to work even after token expiry
            delete originalRequest.headers.Authorization;
            return this.client(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  getAccessToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  }

  getRefreshToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  }

  setAccessToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  setTokens(access, refresh) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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
    const response = await this.client.get('/users/auth/profile/');
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
      product_id: productId,
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
