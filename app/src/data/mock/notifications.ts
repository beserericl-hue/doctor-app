import type { Notification } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Sarah Chen is confirmed for Friday at 9:00 AM.',
    type: 'confirmation', isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    appointmentId: 'appt-001',
  },
  {
    id: 'notif-002',
    title: 'Welcome to MediBook',
    message: 'Your account is set up. Start by finding a doctor near you.',
    type: 'general', isRead: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];
