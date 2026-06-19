// Location: store\cartStore.js
/**
 * Shopping Cart Store using Zustand
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '@/lib/api'

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      totalItems: 0,
      subtotal: 0,
      isLoading: false,
      error: null,

      // Fetch cart from server
      fetchCart: async () => {
        // Only fetch if authenticated
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null
        if (!token) {
          set({ items: [], totalItems: 0, subtotal: 0 })
          return
        }

        set({ isLoading: true, error: null })
        try {
          const cart = await api.getCart()
          
          set({
            items: cart.items || [],
            totalItems: cart.total_items || 0,
            subtotal: cart.subtotal || 0,
            isLoading: false,
          })
        } catch (error) {
          console.error('Error fetching cart:', error)
          if (error.response?.status === 401) {
            // Not authenticated, clear cart
            set({ isLoading: false, items: [], totalItems: 0, subtotal: 0 })
          } else {
            set({ isLoading: false, error: 'Failed to load cart' })
          }
        }
      },

      // Add item to cart
      addItem: async (productId, quantity = 1) => {
        // Check if user is authenticated
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null
        if (!token) {
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
          return { 
            success: false, 
            error: 'Please login to add items to cart',
            requiresAuth: true 
          }
        }

        set({ isLoading: true, error: null })
        try {
          const updatedItem = await api.addToCart(productId, quantity)
          
          // Track activity
          try {
            await api.trackActivity('add_cart', productId)
          } catch (e) {
            console.warn('Activity tracking failed:', e)
          }
          
          // Refresh cart
          await get().fetchCart()
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to add to cart'
          const requiresAuth = error.response?.status === 401
          
          // If 401, redirect to login
          if (requiresAuth && typeof window !== 'undefined') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
          
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage, requiresAuth }
        }
      },

      // Update item quantity
      updateItem: async (itemId, quantity) => {
        if (quantity < 1) {
          return get().removeItem(itemId)
        }

        set({ isLoading: true, error: null })
        try {
          await api.updateCartItem(itemId, quantity)
          
          // Refresh cart
          await get().fetchCart()
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to update cart'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Remove item from cart
      removeItem: async (itemId) => {
        set({ isLoading: true, error: null })
        try {
          await api.removeFromCart(itemId)
          
          // Refresh cart
          await get().fetchCart()
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to remove item'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Clear entire cart
      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          await api.clearCart()
          
          set({
            items: [],
            totalItems: 0,
            subtotal: 0,
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to clear cart'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Reset cart (for logout)
      resetCart: () => {
        set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          isLoading: false,
          error: null,
        })
      },

      // Get item by product ID
      getItemByProductId: (productId) => {
        const { items } = get()
        return items.find(item => item.product.id === productId)
      },

      // Check if product is in cart
      isInCart: (productId) => {
        return !!get().getItemByProductId(productId)
      },

      // Get item quantity
      getItemQuantity: (productId) => {
        const item = get().getItemByProductId(productId)
        return item?.quantity || 0
      },

      // Calculate totals
      calculateTotals: () => {
        const { items } = get()
        
        const subtotal = items.reduce((total, item) => {
          return total + (parseFloat(item.price) * item.quantity)
        }, 0)
        
        const totalItems = items.reduce((total, item) => {
          return total + item.quantity
        }, 0)
        
        set({ subtotal, totalItems })
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'cart-storage',
      // Tied to sessionStorage to match auth-storage scoping (per-tab session)
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
      }),
    }
  )
)

export default useCartStore
