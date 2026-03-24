import type { Doctor } from '@/types';

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-001',
    firstName: 'Sarah', lastName: 'Chen',
    specialty: 'Cardiologist',
    qualifications: ['MD Johns Hopkins', 'Board Certified Cardiology'],
    experience: 12, rating: 4.9, reviewCount: 284,
    hospital: 'Metro General Hospital', location: 'Baltimore, MD',
    bio: 'Dr. Chen specializes in preventive cardiology with 12 years of clinical experience.',
    consultationFee: 250,
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    timeSlots: [
      { id: 'ts-001', time: '09:00 AM', isAvailable: true },
      { id: 'ts-002', time: '10:00 AM', isAvailable: false },
      { id: 'ts-003', time: '11:00 AM', isAvailable: true },
      { id: 'ts-004', time: '02:00 PM', isAvailable: true },
    ],
    isAvailableToday: true,
    languages: ['English', 'Mandarin'],
  },
];
// TODO: Add 14 more doctors covering all specialties
