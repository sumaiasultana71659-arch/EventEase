// ====== Auth helpers (JWT token + user stored in localStorage) ======
const TOKEN_KEY = 'eventease_token';
const USER_KEY = 'eventease_user';

export const Auth = {
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  homePath(user = this.getUser()) {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : user.role === 'guest' ? '/guest-portal' : '/dashboard';
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('eventease_current_event');
  }
};
