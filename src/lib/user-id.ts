// Simple anonymous user ID using localStorage
// This keeps sessions separate between different browsers/devices

const USER_ID_KEY = 'distill_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

