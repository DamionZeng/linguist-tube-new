import { MOCK_USERS } from '../mocks/general';
import { User, UserRole } from '../context/AuthContext';

export const loginApi = async (username: string, password: string):Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        resolve({ username: user.username, role: user.role as UserRole });
      } else {
        reject(new Error('Invalid username or password'));
      }
    }, 500);
  });
};
