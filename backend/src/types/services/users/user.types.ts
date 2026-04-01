import { User } from '@/entities/User';

export type PublicUser = Omit<User, 'password' | 'roles'> & {
  role: string | null;
};
