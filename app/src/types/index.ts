export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ProfileSetup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Doctors: undefined;
  Appointments: undefined;
  Notifications: undefined;
};

export type RootStackParamList = {
  DoctorDetail: { doctorId: string };
  Booking: { doctorId: string; date: string; slotId: string };
  Confirmation: { appointmentId: string };
  Profile: undefined;
};

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  avatarUrl?: string;
  isProfileComplete: boolean;
}

export type Specialty =
  | 'General Practitioner' | 'Cardiologist' | 'Dermatologist'
  | 'Neurologist' | 'Pediatrician' | 'Orthopedist'
  | 'Ophthalmologist' | 'Psychiatrist' | 'Gynecologist' | 'Endocrinologist';

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  qualifications: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  hospital: string;
  location: string;
  bio: string;
  consultationFee: number;
  avatarUrl: string;
  availableDays: string[];
  timeSlots: TimeSlot[];
  isAvailableToday: boolean;
  languages: string[];
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type AppointmentType = 'in-person' | 'video';

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  notes?: string;
  type: AppointmentType;
  createdAt: string;
}

export type NotificationType = 'reminder' | 'confirmation' | 'cancellation' | 'general';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  appointmentId?: string;
}
