---
name: react-native-expo
description: Build production-quality React Native mobile apps using the Expo managed workflow. Use this skill for any task involving React Native, Expo, mobile UI, navigation, device APIs, iOS/Android specifics, or cross-platform mobile development. Covers project scaffolding, component patterns, navigation, state management, styling, platform quirks, Expo SDK APIs, and build configuration.
---

# React Native + Expo Skill

You are building a mobile app using **React Native with Expo (managed workflow)**. This skill contains authoritative patterns, rules, and pitfalls for producing idiomatic, production-quality code. Read every section before writing a single file.

---

## 1. Environment & Toolchain

### Expo SDK Version
Always target **Expo SDK 51** unless the project's `package.json` specifies otherwise. Do not mix SDK versions across packages.

### Project Bootstrap
```bash
npx create-expo-app@latest MyApp --template blank-typescript
cd MyApp
```

### Package Installation Rules
- **Expo-integrated packages** (anything with `expo-*` prefix, plus `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`): use `npx expo install <package>`. This pins the correct version for the current SDK.
- **Pure JS packages** (zustand, zod, react-hook-form, date-fns, etc.): use `npm install <package>`.
- **Never** mix `npx expo install` and `npm install` for the same package — version mismatches cause cryptic Metro bundler errors.

### Metro Bundler
If the bundler shows a "module not found" error after install, always try:
```bash
npx expo start --clear
```
The `--clear` flag resets the Metro cache. Many install issues are cache problems, not missing packages.

### TypeScript
All files must use `.tsx` (components) or `.ts` (logic, types, utilities). Never use `.js` or `.jsx` in a TypeScript project. Maintain `strict: true` in `tsconfig.json`.

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## 2. Project Structure

```
src/
├── assets/              # fonts, images, icons — static files only
├── components/
│   ├── common/          # reusable primitives: Button, Input, Card, Avatar, Badge
│   ├── [feature]/       # feature-scoped components
├── constants/
│   ├── colors.ts        # all color tokens
│   ├── theme.ts         # spacing, radii, shadows, font sizes
│   └── layout.ts        # screen dimensions, safe area helpers
├── data/
│   └── mock/            # mock data files — one per entity type
├── hooks/               # custom React hooks — one per concern
├── navigation/
│   ├── AppNavigator.tsx  # root navigator (auth vs main)
│   ├── AuthNavigator.tsx # auth stack
│   └── MainNavigator.tsx # bottom tabs / main stack
├── screens/             # one directory per feature area
├── store/               # Zustand stores — one per domain
├── types/               # TypeScript interfaces and type aliases
└── utils/               # pure utility functions
```

**Rules:**
- One component per file. Named exports only (no default exports for components — makes refactoring easier).
- Screen files are the only exception: screens use default exports for React Navigation compatibility.
- Keep `App.tsx` at the project root minimal — just providers and the root navigator.

---

## 3. Styling

### StyleSheet — Always
**Never** use inline style objects (`style={{ margin: 16 }}`). Always use `StyleSheet.create()`. Inline objects create a new object on every render, bypassing the native optimization layer.

```tsx
// WRONG
<View style={{ padding: 16, backgroundColor: '#fff' }}>

// CORRECT
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
});
<View style={styles.container}>
```

### Composing Styles
Use an array to compose multiple styles:
```tsx
<View style={[styles.base, isActive && styles.active, style]}>
```

### Units
React Native uses **density-independent pixels (dp)** — not px, rem, em, or %. There is no CSS cascade. All numeric values are unitless dp.

```tsx
// Wrong — no CSS units in React Native
padding: '16px'

// Correct
padding: 16
```

For percentage-based layouts, use the `Dimensions` API or Flexbox (preferred):
```tsx
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
```

### Flexbox Defaults
React Native's Flexbox differs from the web:
- Default `flexDirection` is **`'column'`** (not row)
- Default `alignContent` is **`'flex-start'`** (not stretch)
- `flex: 1` means "take all available space in the parent's main axis"
- There is no `display: grid` — use nested Flexbox

```tsx
// Full-screen container pattern
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

### Shadows
iOS and Android handle shadows differently. Always provide both:
```tsx
shadow: {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  // Android
  elevation: 4,
},
```

### Platform-Specific Styles
```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1 },
      android: { elevation: 4 },
    }),
  },
});
```

---

## 4. Components

### TouchableOpacity vs Pressable
Use `Pressable` for all interactive elements in new code. `TouchableOpacity` is legacy.

```tsx
import { Pressable } from 'react-native';

<Pressable
  onPress={handlePress}
  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
  accessibilityRole="button"
  accessibilityLabel="Book appointment"
>
  <Text style={styles.label}>Book</Text>
</Pressable>
```

### FlatList — Required Props
Always include these on `FlatList`:
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}          // must be unique string
  renderItem={({ item }) => <Card item={item} />}
  contentContainerStyle={styles.listContent} // padding around the list
  showsVerticalScrollIndicator={false}       // cleaner look
  ListEmptyComponent={<EmptyState />}        // always handle empty
/>
```

**Performance rules for FlatList:**
- Wrap `renderItem` in `useCallback` if the parent re-renders frequently
- Add `removeClippedSubviews={true}` for lists > 50 items
- Add `windowSize={5}` for large lists to limit off-screen rendering
- Never put a `FlatList` inside a `ScrollView` — they conflict and cause the inner list to not scroll

### ScrollView
Use only for short, bounded content (forms, detail screens). For long or dynamic lists, always use `FlatList` or `SectionList`.

Add `keyboardShouldPersistTaps="handled"` to any `ScrollView` that contains interactive elements — otherwise tapping a button while the keyboard is open will dismiss the keyboard instead of triggering the button.

### SafeAreaView
Every screen root must use `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`). The built-in version doesn't handle notches correctly on Android.

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* content */}
    </SafeAreaView>
  );
}
```

Use `edges` to control which sides apply safe area insets. On tab screens, omit `'bottom'` — the tab bar handles it.

### KeyboardAvoidingView — Forms
Wrap all forms in `KeyboardAvoidingView` so the keyboard doesn't cover inputs:

```tsx
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* form inputs */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Text
All text must be inside a `<Text>` component. String literals outside `<Text>` cause a runtime error.

```tsx
// WRONG — crashes on Android
<View>Hello world</View>

// CORRECT
<View><Text>Hello world</Text></View>
```

Never nest `<Text>` components for layout purposes. Use `<View>` for layout; `<Text>` only for actual text content.

### Image
```tsx
import { Image } from 'react-native';

// Local asset
<Image source={require('../assets/logo.png')} style={styles.logo} />

// Remote URL — must specify width+height or flex
<Image
  source={{ uri: 'https://example.com/avatar.jpg' }}
  style={{ width: 48, height: 48, borderRadius: 24 }}
/>
```

For remote images, always provide explicit dimensions. Images without dimensions render at 0×0. Use `resizeMode="cover"` (default) or `"contain"` depending on crop preference.

---

## 5. Navigation (React Navigation v6)

### Setup
```bash
npx expo install @react-navigation/native react-native-screens react-native-safe-area-context
npm install @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-gesture-handler
```

Import `GestureHandlerRootView` at the very top of `App.tsx`:
```tsx
import 'react-native-gesture-handler'; // must be first import in App.tsx
```

### App.tsx Pattern
```tsx
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

### Type-Safe Navigation
Define param lists for every navigator:

```tsx
// src/types/navigation.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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

// Helper type for screen props
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;
```

Usage in screen:
```tsx
import type { AuthScreenProps } from '@/types/navigation';

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const handleSignup = () => navigation.navigate('Signup');
}
```

### Stack Navigator Pattern
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
    </Stack.Navigator>
  );
}
```

### Bottom Tab Navigator Pattern
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: focused ? 'home' : 'home-outline',
            Doctors: focused ? 'search' : 'search-outline',
            Appointments: focused ? 'calendar' : 'calendar-outline',
            Notifications: focused ? 'notifications' : 'notifications-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Doctors" component={DoctorListScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
    </Tab.Navigator>
  );
}
```

### Passing Params
```tsx
// Navigating with params
navigation.navigate('DoctorDetail', { doctorId: doctor.id });

// Reading params in target screen
const { doctorId } = route.params;
```

Never pass complex objects as params. Pass IDs and look up data in the target screen from the store or mock data. Passing full objects makes deep linking impossible and inflates navigation state.

---

## 6. State Management (Zustand)

```bash
npm install zustand
```

### Store Pattern
```tsx
// src/store/authStore.ts
import { create } from 'zustand';
import { mockUser } from '@/data/mock/user';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  completeProfile: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isProfileComplete: false,

  login: async (email, password) => {
    // Simulate async API call
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: { ...mockUser, email },
      isAuthenticated: true,
      isProfileComplete: mockUser.isProfileComplete,
    });
  },

  signup: async (data) => {
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: { ...mockUser, ...data, id: Date.now().toString() },
      isAuthenticated: true,
      isProfileComplete: false,
    });
  },

  logout: () => set({ user: null, isAuthenticated: false, isProfileComplete: false }),

  updateProfile: (data) =>
    set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),

  completeProfile: () =>
    set((state) => ({
      isProfileComplete: true,
      user: state.user ? { ...state.user, isProfileComplete: true } : null,
    })),
}));
```

### Selecting from Store
Only select what you need to avoid unnecessary re-renders:
```tsx
// WRONG — subscribes to entire store, re-renders on any change
const store = useAuthStore();

// CORRECT — re-renders only when user.firstName changes
const firstName = useAuthStore((s) => s.user?.firstName);
const logout = useAuthStore((s) => s.logout);
```

---

## 7. Forms (React Hook Form + Zod)

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Pattern
```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
  };

  return (
    <Controller
      control={control}
      name="email"
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label="Email"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
    />
  );
}
```

---

## 8. Expo SDK APIs

### expo-image-picker
```tsx
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  // Request permission first — required on iOS
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    // use uri
  }
};
```

### expo-haptics
```tsx
import * as Haptics from 'expo-haptics';

// Light tap — most common
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Success confirmation
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

Call haptics on primary user actions (button taps, booking confirmations) — not on every interaction.

### expo-font
```tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <NavigationContainer>...</NavigationContainer>;
}
```

### expo-linear-gradient
```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[Colors.primary, Colors.primaryDark]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.hero}
>
  {/* content */}
</LinearGradient>
```

### expo-status-bar
```tsx
import { StatusBar } from 'expo-status-bar';

// Light text on dark backgrounds
<StatusBar style="light" />

// Dark text on light backgrounds
<StatusBar style="dark" />
```

---

## 9. Platform-Specific Code

### Inline Platform Check
```tsx
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Conditional value
const paddingTop = Platform.OS === 'ios' ? 44 : 24;
```

### Platform.select
```tsx
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
});
```

### Platform-Specific Files
For larger divergences, create platform-specific files:
```
Button.ios.tsx      // loaded on iOS
Button.android.tsx  // loaded on Android
Button.tsx          // fallback for both (if above exist, this is unused)
```

Metro automatically resolves the correct file by platform.

### Safe Area Insets
```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Header() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8 }}>
      {/* header content */}
    </View>
  );
}
```

### Keyboard Height
```tsx
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return height;
}
```

---

## 10. Loading States & UX Patterns

### Simulated Async Loading
In mock-data MVPs, simulate loading to build the right UX structure for future API integration:

```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 800);
  return () => clearTimeout(timer);
}, []);
```

### Skeleton Loader Component
```tsx
import { View, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '45%' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#F0F3F9', borderRadius: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D8DCE8' },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  line: { height: 12, borderRadius: 6, backgroundColor: '#D8DCE8' },
});
```

### Pull to Refresh
```tsx
import { FlatList, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';

const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await new Promise((r) => setTimeout(r, 1000)); // simulate API call
  setRefreshing(false);
}, []);

<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary}
    />
  }
  // ...
/>
```

### Alert Dialogs
```tsx
import { Alert } from 'react-native';

Alert.alert(
  'Cancel Appointment',
  'Are you sure you want to cancel this appointment?',
  [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Cancel appointment', style: 'destructive', onPress: () => cancelAppointment(id) },
  ]
);
```

---

## 11. Animations

### Animated API (built-in)
Use `useNativeDriver: true` for opacity and transform animations — they run on the UI thread without JS involvement, ensuring 60fps.

```tsx
import { Animated, StyleSheet } from 'react-native';
import { useRef, useEffect } from 'react';

// Fade in on mount
function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

// Scale confirmation checkmark
function AnimatedCheck() {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {/* checkmark icon */}
    </Animated.View>
  );
}
```

**Properties that support `useNativeDriver: true`:**
- `opacity`
- `transform` (translateX, translateY, scale, rotate)

**Properties that do NOT support `useNativeDriver`:**
- `backgroundColor`, `borderRadius`, `width`, `height`, `padding`, `margin`
- For these, omit `useNativeDriver` or set it to `false`

### react-native-animatable
For common entry animations on mount:
```bash
npm install react-native-animatable
```

```tsx
import * as Animatable from 'react-native-animatable';

<Animatable.View animation="fadeInUp" duration={500} delay={100}>
  <DoctorCard doctor={doctor} />
</Animatable.View>
```

---

## 12. Accessibility

All interactive elements must include:
- `accessibilityLabel` — what the element is (read by screen reader)
- `accessibilityRole` — semantics: `'button'`, `'link'`, `'image'`, `'header'`, `'checkbox'`, etc.
- `accessibilityHint` — what will happen when activated (optional but recommended for non-obvious actions)

```tsx
<Pressable
  onPress={bookAppointment}
  accessibilityRole="button"
  accessibilityLabel="Book appointment with Dr. Smith"
  accessibilityHint="Opens the date and time selection screen"
>
```

### Touch Target Size
Minimum 44×44pt on iOS, 48×48dp on Android. Use `hitSlop` to extend the tap area without changing visual size:
```tsx
<Pressable
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  onPress={handlePress}
>
  <Ionicons name="close" size={20} />
</Pressable>
```

### Focus Management on Forms
Connect inputs so the user can advance through the form using the keyboard's Next button:
```tsx
const emailRef = useRef<TextInput>(null);
const passwordRef = useRef<TextInput>(null);

<TextInput
  ref={emailRef}
  returnKeyType="next"
  onSubmitEditing={() => passwordRef.current?.focus()}
/>
<TextInput
  ref={passwordRef}
  returnKeyType="done"
  onSubmitEditing={handleSubmit}
/>
```

---

## 13. Common Pitfalls & Silent Failures

### 1. `VirtualizedList inside ScrollView` Warning
Never put `FlatList` or `SectionList` inside `ScrollView`. This disables virtualization and causes performance issues and warnings. Use a `ListHeaderComponent` on the FlatList instead:

```tsx
// WRONG
<ScrollView>
  <Header />
  <FlatList data={...} />
</ScrollView>

// CORRECT
<FlatList
  data={doctors}
  ListHeaderComponent={<Header />}
  renderItem={...}
/>
```

### 2. Missing `key` on Mapped Elements
React Native's same-key warning crashes in development mode. Always use unique, stable IDs — never array indices:
```tsx
// WRONG
doctors.map((d, index) => <DoctorCard key={index} />)

// CORRECT
doctors.map((d) => <DoctorCard key={d.id} />)
```

### 3. State Updates on Unmounted Components
Always cancel async operations in `useEffect` cleanup:
```tsx
useEffect(() => {
  let cancelled = false;
  loadData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, []);
```

### 4. `useCallback` and `useMemo` in FlatList
Memoize `renderItem` to prevent full-list re-renders:
```tsx
const renderDoctor = useCallback(({ item }: { item: Doctor }) => (
  <DoctorCard doctor={item} onPress={() => navigation.navigate('DoctorDetail', { doctorId: item.id })} />
), [navigation]);
```

### 5. Image Dimensions
Remote images without explicit dimensions render invisible. Always set `width` and `height` or use `flex: 1` inside a sized container.

### 6. Android Back Button
React Navigation handles the Android back button automatically for stack navigators. For modals or custom back behavior:
```tsx
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

useEffect(() => {
  const handler = BackHandler.addEventListener('hardwareBackPress', () => {
    // return true to prevent default back behavior
    return false;
  });
  return () => handler.remove();
}, []);
```

### 7. Text Outside `<Text>`
Any string literal outside a `<Text>` component crashes on Android. This includes whitespace between JSX elements — always wrap strings.

### 8. Absolute Positioning
`position: 'absolute'` is relative to the nearest parent with `position: 'relative'` (default for View). Always verify the positioning context.

```tsx
// Floating button in bottom-right corner of screen
const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## 14. app.json Configuration

Essential fields for an MVP:

```json
{
  "expo": {
    "name": "MediBook",
    "slug": "medibook",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2D6BE4"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.medibook",
      "infoPlist": {
        "NSCameraUsageDescription": "Used for profile photo",
        "NSPhotoLibraryUsageDescription": "Used for profile photo selection"
      }
    },
    "android": {
      "package": "com.yourcompany.medibook",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2D6BE4"
      },
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-image-picker"
    ]
  }
}
```

**Rules:**
- `slug` must be unique on Expo's servers — use your client's app name in lowercase with hyphens
- `bundleIdentifier` (iOS) and `package` (Android) must be reverse-domain format and must match what's registered in App Store Connect / Google Play Console
- Always add permission descriptions to `infoPlist` for any Expo API that accesses device hardware

---

## 15. Build Preparation (EAS)

While deep EAS setup is a separate skill, the MVP should be structured for it from day one.

### eas.json
```json
{
  "cli": { "version": ">= 5.9.1" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Asset Requirements (create placeholder files)
Ensure these exist before any build attempt:
- `assets/icon.png` — 1024×1024px, no transparency
- `assets/splash.png` — 1284×2778px (iPhone 14 Pro Max size)
- `assets/adaptive-icon.png` — 1024×1024px with safe zone (content in center 720×720px)

---

## 16. Code Quality Rules

1. **No `any` types.** If the type is unknown, use `unknown` and narrow it.
2. **No inline functions as props** on frequently-rendered components — always `useCallback`.
3. **No magic numbers.** Put all numeric constants in `src/constants/theme.ts`.
4. **No console.log in committed code.** Use a conditional logger utility.
5. **Destructure props** at function signature level, not inside the function body.
6. **One concern per file.** A file that exports both a component and a store slice is doing too much.
7. **Prefer composition over props drilling.** If a prop passes more than 2 levels deep, introduce a Zustand selector or context.
8. **Every async function has error handling.** No bare `await` without try/catch or `.catch()`.

---

## Quick Reference: Import Cheatsheet

```tsx
// Core RN
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView,
         TextInput, Image, Alert, ActivityIndicator, Modal,
         Animated, Keyboard, Platform, Dimensions,
         RefreshControl, KeyboardAvoidingView } from 'react-native';

// Safe Area
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Expo SDK
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

// State & Forms
import { create } from 'zustand';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Utilities
import { format, parseISO, isToday, isFuture } from 'date-fns';
```
