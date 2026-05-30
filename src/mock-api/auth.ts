import { MOCK_USERS } from '../mocks/general';

export const loginApi = async (password: string) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.password === password);
      if (user) resolve(user);
      else reject(new Error('Invalid password'));
    }, 500);
  });
};
