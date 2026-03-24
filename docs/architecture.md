# Architecture

## Stack
React Native + Expo SDK 51, TypeScript strict, Zustand, React Navigation v6

## Layer Order
Screens → Components → Hooks → Zustand Stores → Data (Mock → API)

## Navigation
AppNavigator (root)
├── AuthNavigator: Splash → Onboarding → Login → Signup → ProfileSetup
└── MainNavigator (tabs): Dashboard | Doctors | Appointments | Notifications
    └── Pushed screens: DoctorDetail → Booking → Confirmation, Profile

## Stores
- authStore: user, isAuthenticated, isProfileComplete
- appointmentStore: appointments, notifications
