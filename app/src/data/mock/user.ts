import type { User } from '@/types';

export const mockUser: User = {
  id: 'user-001',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (443) 555-0182',
  dateOfBirth: '1990-06-15',
  gender: 'male',
  bloodType: 'O+',
  allergies: ['Penicillin'],
  isProfileComplete: true,
};
