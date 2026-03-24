import type { Appointment } from '@/types';

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-001',
    doctorId: 'doc-001',
    patientId: 'user-001',
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    timeSlot: { id: 'ts-001', time: '09:00 AM', isAvailable: false },
    status: 'upcoming',
    type: 'in-person',
    notes: 'Annual cardiac checkup',
    createdAt: new Date().toISOString(),
  },
];
