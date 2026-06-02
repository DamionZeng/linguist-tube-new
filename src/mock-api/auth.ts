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
