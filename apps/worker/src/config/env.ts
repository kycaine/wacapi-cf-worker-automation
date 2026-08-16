import { Bindings } from '../types';

export const getAdmins = (env: Bindings): string[] => {
  return (env.ADMIN_NUMBERS || '')
    .split(',')
    .map((num) => num.trim())
    .filter((num) => num.length > 0);
};

export const isAdmin = (env: Bindings, phoneNumber: string): boolean => {
  const admins = getAdmins(env);
  return admins.includes(phoneNumber);
};
