// Token validation utility

/**
 * Decode JWT token without verification (client-side check only)
 */
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // Check if token expires in the next 5 seconds
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime + 5;
}

/**
 * Validate and clean up expired tokens.
 * Only clears tokens when the refresh token is expired (session is dead).
 * If only the access token is expired, the API interceptor will refresh it
 * automatically — so we must NOT remove it here.
 */
export function validateAndCleanupTokens() {
  if (typeof window === 'undefined') return;
  
  const refreshToken = sessionStorage.getItem('refresh_token');
  
  // Only clean up when the refresh token is expired — session is truly dead
  if (!refreshToken || isTokenExpired(refreshToken)) {
    console.log('Refresh token expired or missing, clearing auth session...');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth-storage');
  }
}

export { decodeToken, isTokenExpired };
