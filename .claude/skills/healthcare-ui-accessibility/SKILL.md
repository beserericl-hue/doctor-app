---
name: healthcare-ui-accessibility
description: Build accessible, HIPAA-conscious, and clinically trustworthy mobile UI for healthcare applications. Use this skill for any task involving medical app design, accessibility (VoiceOver, TalkBack, WCAG mobile), touch target sizing, colour contrast for healthcare contexts, patient data display patterns, appointment UI, doctor profile layouts, health status indicators, and inclusive design for users with visual or motor impairments. Covers React Native implementation of every pattern.
---

# Healthcare UI & Accessibility Skill

You are building the UI for a healthcare mobile application. Healthcare apps carry a higher accessibility and trust obligation than most consumer apps — patients may be elderly, have visual impairments, be in physical discomfort, or be making decisions with medical consequences. Every design and implementation choice must reflect this.

Read every section before writing UI code.

---

## 1. Core Principles

### Trust First
Healthcare UI must communicate safety, credibility, and clarity above all else. Patients using this app are making decisions about their health.

- Use conservative, clean layouts. No dark patterns, no artificial urgency.
- Confirmations must be explicit — never auto-submit critical actions (booking, cancellation).
- Error messages must be human-readable and actionable, not developer-facing codes.
- Show doctor credentials, hospital affiliations, and ratings prominently — these build the trust that converts a browser to a booker.

### Accessibility is Non-Negotiable
Healthcare apps serve a disproportionately high share of users who rely on assistive technology — elderly patients, patients with vision impairments from conditions like diabetes, patients on medications that affect motor control. WCAG AA compliance is the floor, not the ceiling.

### Clarity Over Cleverness
Avoid UI novelty in critical paths. A patient with anxiety about a doctor's appointment doesn't benefit from a swipe-gesture calendar widget they've never seen. Use familiar patterns: form fields, buttons, scrolling lists. Save creative design for decorative elements only.

---

## 2. Colour & Contrast

### WCAG AA Contrast Ratios (minimum)
| Use | Ratio |
|-----|-------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (≥ 18pt bold or ≥ 24pt) | 3:1 |
| UI components (borders, icons) | 3:1 |
| Disabled elements | No requirement, but must look visibly disabled |

### Healthcare Colour System
```typescript
// src/constants/colors.ts

export const Colors = {
  // Primary — conveys trust, professionalism
  primary: '#1A56DB',          // WCAG AA on white: 5.9:1 ✓
  primaryLight: '#EBF5FF',
  primaryDark: '#1143A3',

  // Semantic — used only for their established medical meanings
  success: '#057A55',          // confirmed, available, healthy — 5.7:1 on white ✓
  successLight: '#F3FAF7',
  warning: '#B45309',          // caution, upcoming, attention needed — 5.1:1 on white ✓
  warningLight: '#FFFBEB',
  error: '#C81E1E',            // cancellation, urgent, error — 5.4:1 on white ✓
  errorLight: '#FDF2F2',
  info: '#1C64F2',             // informational, neutral — 5.3:1 on white ✓
  infoLight: '#EBF5FF',

  // Neutrals
  white: '#FFFFFF',
  background: '#F9FAFB',       // page background — never pure white, reduces eye strain
  surface: '#FFFFFF',          // card backgrounds
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Text hierarchy — all pass 4.5:1 on white background
  textPrimary: '#111928',      // 17.8:1 ✓ — headings, important info
  textSecondary: '#4B5563',    //  7.0:1 ✓ — body text, descriptions
  textTertiary: '#6B7280',     //  5.1:1 ✓ — captions, metadata
  textDisabled: '#9CA3AF',     //  2.9:1   — explicitly disabled (exempt)
  textInverse: '#FFFFFF',      // text on primary/dark backgrounds

  // Status — appointment states
  statusUpcoming: '#1C64F2',
  statusConfirmed: '#057A55',
  statusCompleted: '#4B5563',
  statusCancelled: '#C81E1E',
  statusPending: '#B45309',
};
```

**Rules:**
- Never use colour as the only indicator of meaning. Always pair with text, icon, or pattern.
- Red and green carry strong medical meaning (emergency/safe). Use them only for their established meanings — never for decorative purposes.
- Avoid orange for anything that isn't a genuine warning — it reads as medical alert to healthcare users.
- Test every colour combination with a contrast checker before committing: https://webaim.org/resources/contrastchecker/

---

## 3. Typography

### Scale for Healthcare
Healthcare users skew older than the average app user. Minimum readable sizes:

```typescript
export const Typography = {
  // Display — hero numbers, large headings
  displayLg: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.5 },
  displayMd: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.3 },

  // Headings
  h1: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },

  // Body — MINIMUM 16px for body text in healthcare
  bodyLg: { fontSize: 18, fontWeight: '400', lineHeight: 28 },
  bodyMd: { fontSize: 16, fontWeight: '400', lineHeight: 24 },   // default body
  bodySm: { fontSize: 15, fontWeight: '400', lineHeight: 22 },   // min acceptable

  // Labels & captions — NEVER below 13px
  labelLg: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  labelMd: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  labelSm: { fontSize: 13, fontWeight: '500', lineHeight: 18 },  // absolute minimum

  // Caption — for metadata, timestamps
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18, color: Colors.textTertiary },
};
```

**Rules:**
- Never go below 13px for any visible text. 11px and 12px are inaccessible.
- Line height must be at least 1.5× font size for body text.
- Never use all-caps for body text — it reduces readability by 13–18%.
- Bold weight (700) only for headings and critical values (prices, times). Overuse of bold destroys hierarchy.

---

## 4. Touch Targets

Apple HIG minimum: **44×44pt**. Android Material: **48×48dp**. Healthcare standard: **48×48pt minimum** for all interactive elements — patients may have motor impairment, reduced fine motor control from medication, or be using a phone while unwell.

### Implementing Touch Targets
```tsx
import { Pressable, StyleSheet } from 'react-native';

// CORRECT — visual size 36px, touch target 48px via hitSlop
<Pressable
  onPress={handlePress}
  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  style={styles.smallButton}
  accessibilityRole="button"
>
  <Text style={styles.buttonLabel}>Cancel</Text>
</Pressable>

// CORRECT — visual size is already 56px (exceeds minimum)
<Pressable
  onPress={handleBooking}
  style={styles.primaryButton}
  accessibilityRole="button"
>
  <Text style={styles.buttonLabel}>Book Appointment</Text>
</Pressable>

const styles = StyleSheet.create({
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    // hitSlop adds the remaining 12px to reach 48px touch target
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,         // well above minimum — good for primary CTA
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### Spacing Between Touch Targets
Minimum 8px gap between adjacent interactive elements. Closer than this causes mis-taps on trembling or imprecise inputs.

```tsx
const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 12,               // 12px gap between buttons — exceeds 8px minimum
    paddingHorizontal: 16,
  },
});
```

---

## 5. Accessibility Implementation

### Every Interactive Element
```tsx
// Button — all required accessibility props
<Pressable
  onPress={onBookAppointment}
  accessibilityRole="button"
  accessibilityLabel="Book appointment with Dr. Sarah Chen"
  accessibilityHint="Opens date and time selection"
  accessibilityState={{ disabled: isDisabled, busy: isLoading }}
>

// Image — decorative vs informative
// Decorative (ignore by screen reader):
<Image source={require('./bg-pattern.png')} accessibilityElementsHidden={true} />

// Informative:
<Image
  source={{ uri: doctor.avatarUrl }}
  accessibilityRole="image"
  accessibilityLabel={`Photo of Dr. ${doctor.firstName} ${doctor.lastName}`}
/>

// Rating — don't just show stars, announce value
<View
  accessibilityRole="text"
  accessibilityLabel={`Rated ${doctor.rating} out of 5 stars`}
>
  <StarRating rating={doctor.rating} />
  <Text style={styles.ratingText}>{doctor.rating}</Text>
</View>

// Status badge — must announce state
<View
  accessibilityRole="text"
  accessibilityLabel={`Appointment status: ${appointment.status}`}
>
  <StatusBadge status={appointment.status} />
</View>
```

### Form Inputs
```tsx
// Input with visible label — link label to input
<View>
  <Text
    nativeID="email-label"
    style={styles.inputLabel}
  >
    Email address
  </Text>
  <TextInput
    accessibilityLabelledBy="email-label"
    accessibilityLabel="Email address"
    keyboardType="email-address"
    autoComplete="email"
    textContentType="emailAddress"   // iOS autofill
    autoCapitalize="none"
    autoCorrect={false}
  />
</View>

// Error state — announce to screen reader
{error && (
  <Text
    accessibilityRole="alert"          // announces immediately to screen reader
    accessibilityLiveRegion="assertive" // Android equivalent
    style={styles.errorText}
  >
    {error}
  </Text>
)}
```

### Lists
```tsx
// FlatList — announce item count
<FlatList
  data={doctors}
  accessibilityLabel={`${doctors.length} doctors available`}
  renderItem={({ item, index }) => (
    <DoctorCard
      doctor={item}
      accessibilityLabel={
        `Doctor ${index + 1} of ${doctors.length}. ` +
        `Dr. ${item.firstName} ${item.lastName}, ${item.specialty}. ` +
        `Rated ${item.rating} out of 5. ` +
        `${item.isAvailableToday ? 'Available today.' : 'Not available today.'}`
      }
    />
  )}
/>
```

### Loading States
```tsx
// Loading state — announce to screen reader
{isLoading && (
  <View accessibilityRole="progressbar" accessibilityLabel="Loading doctors">
    <SkeletonCard />
  </View>
)}

// Success state — announce completion
{!isLoading && (
  <View
    accessibilityLiveRegion="polite"   // announces once loading completes
    accessibilityLabel={`${doctors.length} doctors loaded`}
  >
    {/* list content */}
  </View>
)}
```

### Focus Management
After navigation or modal open, move focus to the new content:
```tsx
import { useRef, useEffect } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

function ConfirmationScreen() {
  const headingRef = useRef(null);

  useEffect(() => {
    // Move screen reader focus to the confirmation heading
    const node = findNodeHandle(headingRef.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);

  return (
    <View>
      <Text
        ref={headingRef}
        accessibilityRole="header"
        style={styles.heading}
      >
        Appointment Confirmed!
      </Text>
    </View>
  );
}
```

---

## 6. Component Patterns — Healthcare-Specific

### Doctor Card
```tsx
// src/components/doctors/DoctorCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants';
import type { Doctor } from '@/types';

interface Props {
  doctor: Doctor;
  onPress: (id: string) => void;
  variant?: 'horizontal' | 'vertical';
}

export function DoctorCard({ doctor, onPress, variant = 'horizontal' }: Props) {
  const accessibilityLabel = [
    `Dr. ${doctor.firstName} ${doctor.lastName}`,
    doctor.specialty,
    `${doctor.experience} years experience`,
    `Rated ${doctor.rating} out of 5`,
    doctor.hospital,
    `Consultation fee $${doctor.consultationFee}`,
    doctor.isAvailableToday ? 'Available today' : 'Not available today',
  ].join('. ');

  return (
    <Pressable
      onPress={() => onPress(doctor.id)}
      style={[styles.card, variant === 'vertical' && styles.cardVertical]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens doctor profile and booking"
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {/* Avatar image or initials */}
        {doctor.isAvailableToday && (
          <View
            style={styles.availableDot}
            accessibilityElementsHidden={true}   // conveyed by accessibilityLabel
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          Dr. {doctor.firstName} {doctor.lastName}
        </Text>
        <Text style={styles.specialty} numberOfLines={1}>
          {doctor.specialty}
        </Text>

        {/* Rating — text alongside stars for screen readers */}
        <View style={styles.ratingRow} accessibilityElementsHidden={true}>
          {/* Stars rendered here */}
          <Text style={styles.ratingText}>{doctor.rating}</Text>
          <Text style={styles.reviewCount}>({doctor.reviewCount})</Text>
        </View>

        {/* Fee — clear currency formatting */}
        <Text style={styles.fee}>
          From <Text style={styles.feeAmount}>${doctor.consultationFee}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardVertical: {
    flexDirection: 'column',
    width: 180,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  info: { flex: 1 },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    ...Typography.bodySm,
    color: Colors.primary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    ...Typography.labelMd,
    color: Colors.textPrimary,
  },
  reviewCount: {
    ...Typography.caption,
  },
  fee: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  feeAmount: {
    ...Typography.labelLg,
    color: Colors.textPrimary,
  },
});
```

### Appointment Status Badge
```tsx
// src/components/appointments/StatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import type { Appointment } from '@/types';

const STATUS_CONFIG: Record<Appointment['status'], { label: string; bg: string; text: string }> = {
  upcoming: { label: 'Upcoming',  bg: Colors.infoLight,    text: Colors.info },
  confirmed: { label: 'Confirmed', bg: Colors.successLight, text: Colors.success },
  completed: { label: 'Completed', bg: Colors.divider,      text: Colors.textSecondary },
  cancelled: { label: 'Cancelled', bg: Colors.errorLight,   text: Colors.error },
  pending:   { label: 'Pending',   bg: Colors.warningLight, text: Colors.warning },
};

interface Props {
  status: Appointment['status'];
}

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
```

### Time Slot Grid
```tsx
// src/components/appointments/TimeSlotGrid.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Colors, Typography } from '@/constants';
import type { TimeSlot } from '@/types';

interface Props {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({ slots, selectedSlotId, onSelect }: Props) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Available appointment times"
    >
      <FlatList
        data={slots}
        numColumns={3}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedSlotId;
          const isDisabled = !item.isAvailable;

          return (
            <Pressable
              onPress={() => !isDisabled && onSelect(item)}
              disabled={isDisabled}
              style={[
                styles.slot,
                isSelected && styles.slotSelected,
                isDisabled && styles.slotDisabled,
              ]}
              accessibilityRole="radio"
              accessibilityLabel={item.time}
              accessibilityState={{
                selected: isSelected,
                disabled: isDisabled,
              }}
              accessibilityHint={
                isDisabled
                  ? 'This time slot is unavailable'
                  : isSelected
                  ? 'Selected'
                  : 'Tap to select this time'
              }
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected && styles.slotTextSelected,
                  isDisabled && styles.slotTextDisabled,
                ]}
              >
                {item.time}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
    paddingVertical: 4,
  },
  slot: {
    flex: 1,
    minHeight: 48,         // meets touch target minimum
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  slotSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  slotDisabled: {
    backgroundColor: Colors.divider,
    borderColor: Colors.divider,
  },
  slotText: {
    ...Typography.labelMd,
    color: Colors.textPrimary,
  },
  slotTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  slotTextDisabled: {
    color: Colors.textDisabled,
  },
});
```

### Confirmation Screen
```tsx
// Animated success — accessible announcement of outcome
import { AccessibilityInfo } from 'react-native';

useEffect(() => {
  // Announce to screen reader once animation completes
  const timer = setTimeout(() => {
    AccessibilityInfo.announceForAccessibility(
      'Appointment confirmed. You will receive a reminder before your appointment.'
    );
  }, 600);  // after animation
  return () => clearTimeout(timer);
}, []);
```

---

## 7. Forms — Healthcare-Specific Patterns

### Date of Birth Picker
```tsx
// DOB — use a date picker, never free text
// Validate reasonable medical ranges

const validateDOB = (date: Date): string | null => {
  const age = differenceInYears(new Date(), date);
  if (age < 0) return 'Date of birth cannot be in the future';
  if (age > 120) return 'Please enter a valid date of birth';
  if (age < 18) return 'You must be 18 or older to create an account';
  return null;
};
```

### Blood Type Selector
```tsx
const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'];

// Use minus sign (−) not hyphen (-) for blood type negative
// Screen readers distinguish these correctly
```

### Allergy Multi-Select
```tsx
// Each allergy chip is a toggle button — not a checkbox
// Use accessibilityRole="togglebutton" and accessibilityState.checked
<Pressable
  onPress={() => toggleAllergy(allergy)}
  accessibilityRole="togglebutton"   // correct role for toggle
  accessibilityLabel={allergy}
  accessibilityState={{ checked: selectedAllergies.includes(allergy) }}
  style={[styles.chip, selectedAllergies.includes(allergy) && styles.chipSelected]}
>
  <Text style={styles.chipText}>{allergy}</Text>
</Pressable>
```

### Medical Notes Input
```tsx
<TextInput
  multiline
  numberOfLines={4}
  placeholder="Any relevant medical history or notes for your doctor (optional)"
  accessibilityLabel="Medical notes"
  accessibilityHint="Optional. Share any relevant medical history with your doctor."
  maxLength={500}
  textAlignVertical="top"   // Android: start text from top of multiline input
/>
// Show character count
<Text accessibilityLiveRegion="polite" style={styles.charCount}>
  {noteValue.length}/500
</Text>
```

---

## 8. Error Handling — Patient-Facing Messages

Never show developer-facing errors to patients. Map all errors to clear, actionable messages.

```typescript
// src/utils/errorMessages.ts
export function getPatientFacingError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    // Timeout
    if (error.message.includes('timeout')) {
      return 'This is taking longer than expected. Please try again.';
    }
  }

  // Generic fallback — never expose stack traces or error codes
  return 'Something went wrong. Please try again or contact support.';
}

// Appointment-specific errors
export const AppointmentErrors = {
  SLOT_TAKEN: 'This time slot has just been taken. Please choose another time.',
  DOCTOR_UNAVAILABLE: 'This doctor is no longer available on the selected date.',
  PAST_DATE: 'Please select a future date for your appointment.',
  BOOKING_LIMIT: 'You already have an appointment booked with this doctor.',
} as const;
```

### Inline Validation — Real-Time, Not On Submit
```tsx
// Validate as user types (with debounce), not only on submit
// This reduces cognitive load — patients see errors before pressing a button

const validateEmail = (value: string): string | undefined => {
  if (!value) return undefined; // don't show error on empty until touched
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
  return undefined;
};
```

---

## 9. Loading & Empty States

Every data-dependent screen must have explicit loading and empty states. Patients who see a blank screen assume the app is broken, which is particularly damaging in a healthcare context.

### Loading State — Skeleton
Always show a skeleton that matches the shape of the real content. This reduces layout shift and communicates "content is coming" rather than "app is broken."

```tsx
function DoctorListSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading doctors">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
```

### Empty State — Helpful, Not Passive
```tsx
function NoDoctorsFound({ specialty }: { specialty: string | null }) {
  return (
    <View style={styles.emptyState} accessibilityRole="text">
      {/* Icon: search with X */}
      <Text style={styles.emptyTitle}>No doctors found</Text>
      <Text style={styles.emptyBody}>
        {specialty
          ? `No ${specialty} doctors match your search. Try a different name or clear the specialty filter.`
          : 'No doctors match your search. Try a different name or specialty.'}
      </Text>
      <Button
        label="Clear filters"
        variant="outline"
        onPress={clearFilters}
      />
    </View>
  );
}

function NoUpcomingAppointments() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No upcoming appointments</Text>
      <Text style={styles.emptyBody}>
        Find a doctor and book your first appointment.
      </Text>
      <Button
        label="Find a doctor"
        variant="primary"
        onPress={() => navigation.navigate('Doctors')}
      />
    </View>
  );
}
```

---

## 10. Notification Patterns

### Notification Item Accessibility
```tsx
function NotificationItem({ notification }: { notification: Notification }) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <Pressable
      onPress={() => markAsRead(notification.id)}
      style={[styles.item, !notification.isRead && styles.itemUnread]}
      accessibilityRole="button"
      accessibilityLabel={[
        notification.isRead ? '' : 'Unread. ',
        notification.title,
        '. ',
        notification.message,
        '. ',
        timeAgo,
      ].join('')}
      accessibilityHint={notification.isRead ? undefined : 'Tap to mark as read'}
      accessibilityState={{ selected: !notification.isRead }}
    >
      {/* Unread indicator — NOT colour-only */}
      {!notification.isRead && (
        <View style={styles.unreadDot} accessibilityElementsHidden={true} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </Pressable>
  );
}
```

### Tab Bar Badge
```tsx
// Announce unread count to screen reader
<Tab.Screen
  name="Notifications"
  options={{
    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
    tabBarAccessibilityLabel: unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications',
  }}
/>
```

---

## 11. Navigation & Screen Transitions

### Back Navigation — Always Accessible
Every non-root screen needs a visible back button. Don't rely solely on the swipe gesture — it's not accessible to users with motor impairments or large-screen device users.

```tsx
screenOptions={{
  headerLeft: ({ canGoBack }) =>
    canGoBack ? (
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>
    ) : null,
}}
```

### Screen Headers
Every screen must have a meaningful title — screen readers announce it on navigation.

```tsx
<Stack.Screen
  name="DoctorDetail"
  options={({ route }) => ({
    title: `Dr. ${route.params?.doctorName ?? 'Doctor Profile'}`,
    // Ensures screen reader announces "Dr. Smith, screen" on navigation
  })}
/>
```

---

## 12. Reduce Motion

Some patients take medications or have conditions (vertigo, epilepsy, vestibular disorders) that make motion in apps genuinely harmful.

```typescript
// src/hooks/useReduceMotion.ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
```

Usage:
```tsx
function ConfirmationAnimation() {
  const reduceMotion = useReduceMotion();

  const animationConfig = reduceMotion
    ? { duration: 0 }       // instant — no animation
    : { duration: 500, useNativeDriver: true };

  // apply to Animated.timing calls
}
```

---

## 13. Dark Mode Support

Many patients use dark mode for eye comfort, especially if reading at night or managing light sensitivity from medication.

```tsx
import { useColorScheme } from 'react-native';

// src/hooks/useThemeColors.ts
export function useThemeColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    background: isDark ? '#111827' : Colors.background,
    surface: isDark ? '#1F2937' : Colors.surface,
    textPrimary: isDark ? '#F9FAFB' : Colors.textPrimary,
    textSecondary: isDark ? '#9CA3AF' : Colors.textSecondary,
    border: isDark ? '#374151' : Colors.border,
    primary: Colors.primary,     // primary colour constant across modes
  };
}
```

Re-verify contrast ratios in both light and dark mode. A colour that passes 4.5:1 on white may fail on dark backgrounds.

---

## 14. HIPAA-Conscious UI Patterns

While this MVP uses mock data, the UI must be structured for future real patient data handling.

### Screen Content Rules
- **Never show full patient record on a list screen.** Show initials or first name only.
- **Appointment lists** should show doctor name and date only. Medical notes visible only in detail view.
- **Mask sensitive fields** in screenshots (e.g., use `secureTextEntry` pattern for DOB in profile summary).

### Auto-lock Awareness
```tsx
// Session timeout warning — 5 minutes inactivity
// Placeholder for future backend integration
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Show a countdown modal before logging out
// This is a UI pattern — wire to auth store when backend is integrated
```

### Data Display — Minimal Exposure
```tsx
// Appointment card — show minimum necessary
// BAD: shows full medical notes on list
<AppointmentCard showNotes={true} />

// GOOD: notes only on detail screen
<AppointmentCard showNotes={false} />   // list
<AppointmentDetail showNotes={true} />  // detail screen only
```

---

## 15. Pre-Submission Accessibility Checklist

Run through this before every release:

**Screen reader (VoiceOver / TalkBack):**
- [ ] Swipe through every screen with screen reader on — every element is announced meaningfully
- [ ] No "unlabeled button" or "unlabeled image" announcements
- [ ] Form errors are announced immediately (not just visually highlighted)
- [ ] Loading states are announced
- [ ] Confirmation of completed actions is announced

**Touch targets:**
- [ ] Every interactive element is at least 48×48pt (use Xcode Accessibility Inspector or Android Layout Inspector to verify)
- [ ] At least 8px gap between adjacent targets

**Colour & contrast:**
- [ ] All text passes 4.5:1 on its background (use Colour Contrast Analyser)
- [ ] No information conveyed by colour alone
- [ ] App is usable in greyscale mode

**Typography:**
- [ ] No text below 13px anywhere in the app
- [ ] Body text is 16px minimum
- [ ] App is usable with system font size set to largest (Accessibility → Larger Text)

**Motion:**
- [ ] All animations respect `reduceMotion` setting
- [ ] No auto-playing video or rapidly flashing content

**Keyboard / switch access:**
- [ ] All interactive elements reachable by keyboard navigation (iPad external keyboard)
- [ ] Focus order follows visual reading order
- [ ] No keyboard trap (user can always navigate away from any element)

**Forms:**
- [ ] All inputs have visible labels (not placeholder-only)
- [ ] Error messages are specific and actionable
- [ ] Required fields are marked (not just colour)
- [ ] Autocomplete attributes set (`textContentType` on iOS, `autoComplete` on Android)
