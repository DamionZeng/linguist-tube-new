import { MOCK_USERS } from '../mocks/general';

export const loginApi = async (username: string, password: string) => {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => (u.username === username || !username) && u.password === password);
      if (user) resolve(user);
      else reject(new Error('Invalid username or password'));
    }, 500);
  });
};

export const registerApi = async (username: string, password: string, invite_key: string) => {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => {
      if (!username || !password || !invite_key) {
        reject(new Error('Please fill in all fields'));
        return;
      }
      if (password.length < 6) {
        reject(new Error('Password must be at least 6 characters'));
        return;
      }
      // Mock: 总是注册成功
      resolve({ username, role: 'vip', vipExpiresAt: null, createdAt: new Date().toISOString(), token: 'mock-token-' + Date.now() });
    }, 500);
  });
};
