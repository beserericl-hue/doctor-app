---
name: mobile-testing
description: Write and run tests for React Native / Expo apps. Use this skill for any task involving Jest configuration, React Native Testing Library (RNTL) unit and component tests, Maestro E2E flows, accessibility testing, snapshot testing, mocking Expo SDK modules, testing navigation, testing Zustand stores, and CI test pipeline setup. Covers the full testing pyramid from individual components to end-to-end user flows.
---

# Mobile Testing Skill

You are writing tests for a React Native / Expo application. This skill covers the full testing pyramid: unit tests for utilities and stores, component tests with React Native Testing Library, and end-to-end flows with Maestro. Read every section before writing test files.

---

## 1. Testing Stack

| Layer | Tool | What it tests |
|-------|------|--------------|
| Unit | Jest | Pure functions, utilities, store logic |
| Component | React Native Testing Library (RNTL) | Individual components in isolation |
| Integration | RNTL + mock navigation | Multi-component flows, screen behaviour |
| E2E | Maestro | Full user flows on a real device/emulator |
| Accessibility | jest-native matchers | ARIA roles, labels, screen reader behaviour |

---

## 2. Jest Setup

### Install
```bash
npx expo install jest-expo
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  @testing-library/user-event \
  jest \
  babel-jest
```

### `package.json` — Jest Config
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "setupFiles": ["./jest.setup.js"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/types/**",
      "!src/data/mock/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**`transformIgnorePatterns` is critical.** Jest's default transform ignores all of `node_modules`, but React Native packages ship untranspiled ESM code. The pattern above whitelists every common RN/Expo package that needs Babel transformation. If a new native package causes a `SyntaxError: Cannot use import statement`, add its name to this list.

### `jest.setup.js`
```javascript
import '@testing-library/jest-native/extend-expect';

// Silence specific React Native warnings in test output
jest.spyOn(console, 'warn').mockImplementation((msg) => {
  if (
    msg.includes('Animated: `useNativeDriver`') ||
    msg.includes('VirtualizedLists should never be nested')
  ) return;
  console.warn(msg);
});

// Mock expo-font (prevents font loading errors in tests)
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: { loadAsync: jest.fn() },
}));

// Mock @expo/vector-icons (icons render as null in tests — that's fine)
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));
```

---

## 3. Mocking Expo SDK Modules

Each Expo module that accesses device hardware must be mocked. Add to `jest.setup.js` or individual test files.

### expo-haptics
```javascript
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));
```

### expo-image-picker
```javascript
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'mock://photo.jpg' }] })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));
```

### expo-linear-gradient
```javascript
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));
```

### expo-status-bar
```javascript
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));
```

### expo-constants
```javascript
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'TestApp',
      extra: { apiBaseUrl: 'http://localhost:3000', appEnv: 'test' },
    },
  },
}));
```

### AsyncStorage (if used)
```javascript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### react-native-gesture-handler
```javascript
// Add this import at the top of jest.setup.js
import 'react-native-gesture-handler/jestSetup';
```

---

## 4. Testing Utilities and Pure Functions

Unit tests for utilities don't need any React Native setup — they're pure Jest.

### Example: Testing Date Utilities
```typescript
// src/utils/dateUtils.ts
import { format, isToday, isFuture } from 'date-fns';

export function formatAppointmentDate(isoString: string): string {
  return format(new Date(isoString), 'EEEE, MMMM d, yyyy');
}

export function isUpcoming(isoString: string): boolean {
  return isFuture(new Date(isoString));
}

export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  if (isToday(date)) return 'Today';
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return format(date, 'MMM d');
}
```

```typescript
// src/utils/__tests__/dateUtils.test.ts
import { formatAppointmentDate, isUpcoming, getRelativeTime } from '../dateUtils';

describe('formatAppointmentDate', () => {
  it('formats ISO string to readable date', () => {
    expect(formatAppointmentDate('2025-03-24T10:00:00Z'))
      .toBe('Monday, March 24, 2025');
  });

  it('handles end of month correctly', () => {
    expect(formatAppointmentDate('2025-01-31T10:00:00Z'))
      .toBe('Friday, January 31, 2025');
  });
});

describe('isUpcoming', () => {
  it('returns true for future dates', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isUpcoming(future)).toBe(true);
  });

  it('returns false for past dates', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isUpcoming(past)).toBe(false);
  });
});

describe('getRelativeTime', () => {
  it('returns "Tomorrow" for next day', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    expect(getRelativeTime(tomorrow)).toBe('Tomorrow');
  });

  it('returns "In N days" for dates within a week', () => {
    const threeDays = new Date(Date.now() + 3 * 86400000).toISOString();
    expect(getRelativeTime(threeDays)).toBe('In 3 days');
  });
});
```

---

## 5. Testing Zustand Stores

Test stores in isolation — no React rendering needed.

### Pattern: Reset Store Between Tests
```typescript
// src/store/__tests__/authStore.test.ts
import { act } from 'react-test-renderer';
import { useAuthStore } from '../authStore';

// Reset store state between tests to prevent leakage
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isProfileComplete: false,
  });
});

describe('authStore', () => {
  describe('login', () => {
    it('sets isAuthenticated to true on successful login', async () => {
      const { login } = useAuthStore.getState();

      await act(async () => {
        await login('test@example.com', 'password123');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets user email from login credentials', async () => {
      await act(async () => {
        await useAuthStore.getState().login('user@test.com', 'pass');
      });

      expect(useAuthStore.getState().user?.email).toBe('user@test.com');
    });
  });

  describe('logout', () => {
    it('clears user and authentication state', async () => {
      // Setup: logged in state
      await act(async () => {
        await useAuthStore.getState().login('user@test.com', 'pass');
      });

      act(() => {
        useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('merges new data with existing user', async () => {
      await act(async () => {
        await useAuthStore.getState().login('user@test.com', 'pass');
      });

      act(() => {
        useAuthStore.getState().updateProfile({ firstName: 'Updated' });
      });

      expect(useAuthStore.getState().user?.firstName).toBe('Updated');
    });
  });
});
```

### Testing Appointment Store
```typescript
// src/store/__tests__/appointmentStore.test.ts
import { act } from 'react-test-renderer';
import { useAppointmentStore } from '../appointmentStore';
import { mockDoctors } from '@/data/mock/doctors';

const mockTimeSlot = { id: 'slot-1', time: '10:00 AM', isAvailable: true };

beforeEach(() => {
  useAppointmentStore.setState({ appointments: [], notifications: [] });
});

describe('bookAppointment', () => {
  it('adds a new appointment with upcoming status', () => {
    act(() => {
      useAppointmentStore.getState().bookAppointment(
        mockDoctors[0].id,
        '2025-03-24',
        mockTimeSlot
      );
    });

    const { appointments } = useAppointmentStore.getState();
    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toBe('upcoming');
    expect(appointments[0].doctorId).toBe(mockDoctors[0].id);
  });

  it('adds a confirmation notification after booking', () => {
    act(() => {
      useAppointmentStore.getState().bookAppointment(
        mockDoctors[0].id,
        '2025-03-24',
        mockTimeSlot
      );
    });

    const { notifications } = useAppointmentStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('confirmation');
  });
});

describe('cancelAppointment', () => {
  it('changes appointment status to cancelled', () => {
    act(() => {
      useAppointmentStore.getState().bookAppointment(
        mockDoctors[0].id,
        '2025-03-24',
        mockTimeSlot
      );
    });

    const { appointments } = useAppointmentStore.getState();
    const id = appointments[0].id;

    act(() => {
      useAppointmentStore.getState().cancelAppointment(id);
    });

    expect(useAppointmentStore.getState().appointments[0].status).toBe('cancelled');
  });
});
```

---

## 6. React Native Testing Library (RNTL)

RNTL renders components in a simulated React Native environment. It queries by accessibility attributes — the same signals VoiceOver and TalkBack use.

### Core Queries (in priority order)
| Query | Use when |
|-------|---------|
| `getByRole` | Button, heading, checkbox, link — preferred for interactive elements |
| `getByLabelText` | Input with `accessibilityLabel` |
| `getByText` | Visible text content |
| `getByPlaceholderText` | Input placeholder |
| `getByTestId` | Last resort — use only when no semantic query works |

**Never** use `getByTestId` as the first choice. It couples tests to implementation details.

### Render Helper
Create a shared wrapper that provides all necessary providers:

```typescript
// src/test-utils/render.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </SafeAreaProvider>
);

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
```

Use this in all component tests:
```typescript
import { render, screen, fireEvent } from '@/test-utils/render';
```

---

## 7. Component Tests

### Testing a Button Component
```typescript
// src/components/common/__tests__/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@/test-utils/render';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label text', () => {
    render(<Button label="Book Appointment" onPress={() => {}} />);
    expect(screen.getByText('Book Appointment')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Submit" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Submit" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    render(<Button label="Submit" onPress={() => {}} loading />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    // Button label hidden while loading
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('applies disabled style when disabled prop is true', () => {
    render(<Button label="Submit" onPress={() => {}} disabled />);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });
});
```

### Testing a Form Input Component
```typescript
// src/components/common/__tests__/Input.test.tsx
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@/test-utils/render';
import { Input } from '../Input';

// Wrapper to test controlled input
const ControlledInput = ({ initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);
  return <Input label="Email" value={value} onChangeText={setValue} />;
};

describe('Input', () => {
  it('renders with label', () => {
    render(<ControlledInput />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('updates value on text change', () => {
    render(<ControlledInput />);
    const input = screen.getByLabelText('Email');

    fireEvent.changeText(input, 'user@example.com');

    expect(input.props.value).toBe('user@example.com');
  });

  it('displays error message when error prop is set', () => {
    render(<Input label="Email" value="" onChangeText={() => {}} error="Enter a valid email" />);

    expect(screen.getByText('Enter a valid email')).toBeTruthy();
  });

  it('does not display error message when error is undefined', () => {
    render(<Input label="Email" value="" onChangeText={() => {}} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
```

### Testing a DoctorCard Component
```typescript
// src/components/doctors/__tests__/DoctorCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@/test-utils/render';
import { DoctorCard } from '../DoctorCard';
import { mockDoctors } from '@/data/mock/doctors';

const mockDoctor = mockDoctors[0];

describe('DoctorCard', () => {
  it('renders doctor name', () => {
    render(<DoctorCard doctor={mockDoctor} onPress={() => {}} />);

    expect(screen.getByText(`Dr. ${mockDoctor.firstName} ${mockDoctor.lastName}`))
      .toBeTruthy();
  });

  it('renders specialty', () => {
    render(<DoctorCard doctor={mockDoctor} onPress={() => {}} />);

    expect(screen.getByText(mockDoctor.specialty)).toBeTruthy();
  });

  it('calls onPress with doctor id when tapped', () => {
    const onPress = jest.fn();
    render(<DoctorCard doctor={mockDoctor} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith(mockDoctor.id);
  });

  it('shows available today badge when doctor is available', () => {
    const availableDoctor = { ...mockDoctor, isAvailableToday: true };
    render(<DoctorCard doctor={availableDoctor} onPress={() => {}} />);

    expect(screen.getByText('Available Today')).toBeTruthy();
  });

  it('does not show available badge when doctor is unavailable', () => {
    const unavailableDoctor = { ...mockDoctor, isAvailableToday: false };
    render(<DoctorCard doctor={unavailableDoctor} onPress={() => {}} />);

    expect(screen.queryByText('Available Today')).toBeNull();
  });
});
```

---

## 8. Screen Tests (with Navigation Mocking)

### Mock React Navigation
```typescript
// In test file or jest.setup.js
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
      name: 'MockScreen',
    }),
  };
});
```

### Testing Login Screen
```typescript
// src/screens/auth/__tests__/LoginScreen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils/render';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import LoginScreen from '../LoginScreen';

// Mock the store
jest.mock('@/store/authStore');
const mockLogin = jest.fn();
(useAuthStore as jest.Mock).mockReturnValue({
  login: mockLogin,
  isAuthenticated: false,
});

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  it('renders email and password inputs', () => {
    render(<LoginScreen />);

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('renders login button', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('button', { name: /login/i })).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'notanemail');
    fireEvent.press(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeTruthy();
    });
  });

  it('shows validation error for short password', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'user@test.com');
    fireEvent.changeText(screen.getByLabelText('Password'), '123');
    fireEvent.press(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeTruthy();
    });
  });

  it('calls login store action with correct credentials', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'user@test.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.press(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  it('navigates to Signup when sign up link is pressed', () => {
    const { navigate } = useNavigation() as any;
    render(<LoginScreen />);

    fireEvent.press(screen.getByText(/sign up/i));

    expect(navigate).toHaveBeenCalledWith('Signup');
  });
});
```

### Testing DoctorListScreen with Filtering
```typescript
// src/screens/doctors/__tests__/DoctorListScreen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils/render';
import DoctorListScreen from '../DoctorListScreen';
import { mockDoctors } from '@/data/mock/doctors';

describe('DoctorListScreen', () => {
  it('renders all doctors initially', async () => {
    render(<DoctorListScreen />);

    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    // At least the first doctor should be visible
    expect(screen.getByText(`Dr. ${mockDoctors[0].firstName} ${mockDoctors[0].lastName}`))
      .toBeTruthy();
  });

  it('filters doctors by search query', async () => {
    render(<DoctorListScreen />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(searchInput, mockDoctors[0].lastName);

    await waitFor(() => {
      expect(screen.getByText(`Dr. ${mockDoctors[0].firstName} ${mockDoctors[0].lastName}`))
        .toBeTruthy();
      // A doctor with a different name should not appear
      const unrelatedDoctor = mockDoctors.find(
        (d) => d.lastName !== mockDoctors[0].lastName
      );
      if (unrelatedDoctor) {
        expect(
          screen.queryByText(`Dr. ${unrelatedDoctor.firstName} ${unrelatedDoctor.lastName}`)
        ).toBeNull();
      }
    });
  });

  it('shows empty state when no doctors match search', async () => {
    render(<DoctorListScreen />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'zzznomatch');

    await waitFor(() => {
      expect(screen.getByText(/no doctors found/i)).toBeTruthy();
    });
  });
});
```

---

## 9. Testing Custom Hooks

```typescript
// src/hooks/__tests__/useDoctors.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDoctors } from '../useDoctors';
import { mockDoctors } from '@/data/mock/doctors';

describe('useDoctors', () => {
  it('returns all doctors initially', () => {
    const { result } = renderHook(() => useDoctors());

    expect(result.current.filteredDoctors).toHaveLength(mockDoctors.length);
  });

  it('filters doctors by search query', () => {
    const { result } = renderHook(() => useDoctors());
    const targetDoctor = mockDoctors[0];

    act(() => {
      result.current.setSearchQuery(targetDoctor.lastName);
    });

    expect(result.current.filteredDoctors.every(
      (d) => d.lastName.toLowerCase().includes(targetDoctor.lastName.toLowerCase()) ||
              d.specialty.toLowerCase().includes(targetDoctor.lastName.toLowerCase())
    )).toBe(true);
  });

  it('filters doctors by specialty', () => {
    const { result } = renderHook(() => useDoctors());
    const targetSpecialty = mockDoctors[0].specialty;

    act(() => {
      result.current.setSelectedSpecialty(targetSpecialty);
    });

    expect(result.current.filteredDoctors.every(
      (d) => d.specialty === targetSpecialty
    )).toBe(true);
  });

  it('returns featured doctors with rating >= 4.8', () => {
    const { result } = renderHook(() => useDoctors());

    expect(result.current.featuredDoctors.every((d) => d.rating >= 4.8)).toBe(true);
  });

  it('clears specialty filter when set to null', () => {
    const { result } = renderHook(() => useDoctors());

    act(() => {
      result.current.setSelectedSpecialty('Cardiologist');
    });
    act(() => {
      result.current.setSelectedSpecialty(null);
    });

    expect(result.current.filteredDoctors).toHaveLength(mockDoctors.length);
  });
});
```

---

## 10. Accessibility Testing

RNTL renders the full accessibility tree. Test the same attributes that VoiceOver (iOS) and TalkBack (Android) read to users.

```typescript
// src/components/common/__tests__/Button.a11y.test.tsx
import React from 'react';
import { render, screen } from '@/test-utils/render';
import { Button } from '../Button';

describe('Button Accessibility', () => {
  it('has button role', () => {
    render(<Button label="Book" onPress={() => {}} />);

    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has accessible name matching label', () => {
    render(<Button label="Book Appointment" onPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeTruthy();
  });

  it('is marked as disabled when disabled prop is set', () => {
    render(<Button label="Book" onPress={() => {}} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// src/screens/auth/__tests__/LoginScreen.a11y.test.tsx
describe('LoginScreen Accessibility', () => {
  it('has accessible labels on all form inputs', () => {
    render(<LoginScreen />);

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('announces error messages to screen readers', async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      // Error messages should have accessibilityRole="alert"
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('login button is not disabled initially', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
  });
});
```

### jest-native Matchers Reference
```typescript
expect(element).toBeVisible()
expect(element).toBeEnabled()
expect(element).toBeDisabled()
expect(element).toBeEmptyElement()
expect(element).toHaveAccessibilityValue({ text: 'Loading 50%' })
expect(element).toHaveDisplayValue('user@example.com')
expect(element).toHaveProp('accessibilityLabel', 'Submit form')
expect(element).toHaveStyle({ backgroundColor: '#2D6BE4' })
expect(element).toHaveTextContent('Book Appointment')
```

---

## 11. Snapshot Testing

Use snapshots sparingly — only for components with complex, stable render output that's difficult to assert semantically. Overuse leads to brittle tests that are blindly updated.

**Good candidates:** confirmation screen, notification item, static cards.
**Bad candidates:** any screen with dynamic data, loading states, or frequent design changes.

```typescript
// src/components/appointments/__tests__/AppointmentCard.snapshot.test.tsx
import React from 'react';
import renderer from 'react-test-renderer';
import { AppointmentCard } from '../AppointmentCard';
import { mockAppointments } from '@/data/mock/appointments';
import { mockDoctors } from '@/data/mock/doctors';

const doctor = mockDoctors[0];
const appointment = { ...mockAppointments[0], doctorId: doctor.id };

it('renders upcoming appointment card correctly', () => {
  const tree = renderer.create(
    <AppointmentCard appointment={appointment} doctor={doctor} onCancel={() => {}} />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});
```

Update snapshots when design intentionally changes:
```bash
jest --updateSnapshot
# or
jest -u
```

---

## 12. Maestro — End-to-End Testing

Maestro is a mobile E2E framework that runs real UI flows on a simulator or physical device. It uses YAML flow files — no code compilation required.

### Install
```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify
maestro --version
```

### Start Your App First
Maestro tests run against a running app. Before running flows:
```bash
npx expo start &
# or for a dev build:
eas build --profile development --platform ios --local
```

### Flow File Structure
```
e2e/
├── flows/
│   ├── auth/
│   │   ├── login.yaml
│   │   └── signup.yaml
│   ├── booking/
│   │   └── book-appointment.yaml
│   └── smoke.yaml      # critical path — run on every CI build
└── .maestro/
    └── config.yaml
```

### Login Flow
```yaml
# e2e/flows/auth/login.yaml
appId: com.yourcompany.medibook
---
- launchApp:
    clearState: true

# Tap through onboarding
- scrollUntilVisible:
    element:
      text: "Get Started"
    direction: RIGHT
- tapOn: "Get Started"

# Fill login form
- tapOn:
    text: "Email"
- inputText: "test@example.com"
- tapOn:
    text: "Password"
- inputText: "password123"

# Submit
- tapOn:
    text: "Login"

# Assert dashboard appears
- assertVisible:
    text: "Good morning"
- takeScreenshot: login-success
```

### Full Booking Flow
```yaml
# e2e/flows/booking/book-appointment.yaml
appId: com.yourcompany.medibook
---
- launchApp

# Navigate to doctors
- tapOn:
    id: "tab-doctors"

# Assert doctor list loaded
- assertVisible:
    text: "Find a Doctor"
- waitForAnimationToEnd

# Search for a doctor
- tapOn:
    placeholder: "Search doctors..."
- inputText: "Smith"
- waitForAnimationToEnd

# Open first result
- tapOn:
    text: "Book Now"
    index: 0

# Verify doctor detail page
- assertVisible:
    text: "About"
- tapOn:
    text: "Availability"

# Select a date
- tapOn:
    index: 1    # second date chip (tomorrow)

# Select a time slot
- assertVisible:
    text: "09:00 AM"
- tapOn:
    text: "09:00 AM"

# Proceed to booking
- tapOn:
    text: "Book Appointment"

# Confirm booking
- assertVisible:
    text: "Confirm Booking"
- tapOn:
    text: "Confirm Booking"

# Assert confirmation screen
- assertVisible:
    text: "Appointment Confirmed!"
- takeScreenshot: booking-confirmed
```

### Smoke Test (critical path only)
```yaml
# e2e/flows/smoke.yaml
# Run this on every CI build — covers the essential user journey in < 2 minutes
appId: com.yourcompany.medibook
---
- launchApp:
    clearState: true

# App launches
- assertVisible:
    text: "MediBook"

# Can reach login
- waitForAnimationToEnd
- tapOn:
    text: "Get Started"
    optional: true
- assertVisible:
    text: "Login"

# Can log in
- tapOn:
    text: "Email"
- inputText: "test@example.com"
- tapOn:
    text: "Password"
- inputText: "password123"
- tapOn:
    text: "Login"
- assertVisible:
    text: "Good morning"

# Doctor list loads
- tapOn:
    id: "tab-doctors"
- assertVisible:
    text: "Find a Doctor"

# Notifications tab accessible
- tapOn:
    id: "tab-notifications"
- assertVisible:
    text: "Notifications"
```

### Run Maestro Flows
```bash
# Run a single flow
maestro test e2e/flows/auth/login.yaml

# Run all flows in a directory
maestro test e2e/flows/

# Run smoke test
maestro test e2e/flows/smoke.yaml

# Run in CI (no interactive output)
maestro test e2e/flows/smoke.yaml --format junit --output results.xml
```

### Maestro Assertions Reference
```yaml
# Text visible on screen
- assertVisible:
    text: "Appointment Confirmed!"

# Element with id
- assertVisible:
    id: "booking-confirmation-card"

# Element NOT visible
- assertNotVisible:
    text: "Error"

# Wait for element (max 5s default)
- waitForAnimationToEnd
- extendedWaitUntil:
    visible:
      text: "Loading complete"
    timeout: 10000

# Conditional tap (won't fail if element not present)
- tapOn:
    text: "Skip"
    optional: true

# Scroll
- scroll            # scroll down once
- scrollUntilVisible:
    element:
      text: "Dr. Johnson"
    direction: DOWN
```

---

## 13. CI/CD — Running Tests in GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage --ci --forceExit

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  e2e-tests:
    runs-on: macos-latest     # Maestro iOS requires macOS
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build development app
        run: eas build --profile development --platform ios --local --non-interactive

      - name: Boot simulator
        run: |
          xcrun simctl boot "iPhone 15 Pro" || true
          sleep 5

      - name: Install app on simulator
        run: xcrun simctl install booted *.app

      - name: Run smoke tests
        run: maestro test e2e/flows/smoke.yaml --format junit --output results.xml

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: maestro-results
          path: results.xml
```

---

## 14. Test File Organisation Rules

```
src/
├── components/
│   └── common/
│       ├── Button.tsx
│       └── __tests__/
│           ├── Button.test.tsx        # unit/component tests
│           └── Button.a11y.test.tsx   # accessibility-focused tests
├── screens/
│   └── auth/
│       ├── LoginScreen.tsx
│       └── __tests__/
│           └── LoginScreen.test.tsx
├── hooks/
│   ├── useDoctors.ts
│   └── __tests__/
│       └── useDoctors.test.ts
├── store/
│   ├── authStore.ts
│   └── __tests__/
│       └── authStore.test.ts
└── utils/
    ├── dateUtils.ts
    └── __tests__/
        └── dateUtils.test.ts

e2e/
└── flows/
    ├── smoke.yaml
    ├── auth/
    └── booking/
```

**Naming conventions:**
- `*.test.ts` / `*.test.tsx` — unit and component tests (picked up by Jest)
- `*.a11y.test.tsx` — accessibility-focused tests (still picked up by Jest)
- `*.snapshot.test.tsx` — snapshot tests (still Jest, named to make them easy to find)
- `*.yaml` — Maestro E2E flows (not Jest)

---

## 15. Running Tests

```bash
# All tests
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# With coverage report
npm run test:coverage

# Single file
npx jest src/components/common/__tests__/Button.test.tsx

# Pattern match
npx jest --testPathPattern="auth"

# Verbose output
npx jest --verbose

# Update snapshots
npx jest --updateSnapshot

# Clear cache (use when tests fail for no obvious reason)
npx jest --clearCache
```
