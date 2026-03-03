// Location: lib/utils/format.js
/**
 * Utility functions for formatting data from the API
 */

/**
 * Convert a value to a number safely
 * Handles strings, decimals, and null/undefined values
 */
export function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Format a rating value
 * @param {string|number} rating - The rating value (can be string from Decimal field)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted rating
 */
export function formatRating(rating, decimals = 1) {
  return toNumber(rating, 0).toFixed(decimals);
}

/**
 * Format a price value
 * @param {string|number} price - The price value
 * @param {string} currency - Currency symbol (default: FCFA)
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = 'FCFA ') {
  const numPrice = toNumber(price, 0);
  return `${currency}${numPrice.toFixed(2)}`;
}

/**
 * Format a discount percentage
 * @param {string|number} percentage - The discount percentage
 * @returns {string} Formatted percentage (e.g., "25%")
 */
export function formatDiscount(percentage) {
  const numPercentage = toNumber(percentage, 0);
  return `${Math.round(numPercentage)}%`;
}

/**
 * Calculate discount percentage from compare_price and price
 * @param {string|number} comparePrice - Original price
 * @param {string|number} price - Current price
 * @returns {number} Discount percentage
 */
export function calculateDiscountPercentage(comparePrice, price) {
  const compare = toNumber(comparePrice, 0);
  const current = toNumber(price, 0);
  
  if (compare <= 0 || current >= compare) {
    return 0;
  }
  
  return Math.round(((compare - current) / compare) * 100);
}

/**
 * Format product data from API
 * Ensures all numeric fields are properly typed
 */
export function formatProductData(product) {
  if (!product) return null;
  
  return {
    ...product,
    price: toNumber(product.price, 0),
    compare_price: product.compare_price ? toNumber(product.compare_price, 0) : null,
    average_rating: toNumber(product.average_rating, 0),
    review_count: toNumber(product.review_count, 0),
    stock_quantity: toNumber(product.stock_quantity, 0),
    view_count: toNumber(product.view_count, 0),
    purchase_count: toNumber(product.purchase_count, 0),
    discount_percentage: toNumber(product.discount_percentage, 0),
  };
}

/**
 * Format an array of products
 */
export function formatProductsArray(products) {
  if (!Array.isArray(products)) return [];
  return products.map(formatProductData);
}
