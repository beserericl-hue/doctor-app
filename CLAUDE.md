# Doctor Appointment Booking App — Claude Code

## Project
React Native + Expo MVP for patient appointment booking. TypeScript strict. Android + iOS.
All source code lives in `app/`. Mock data only — no live backend in this version.

## Stack
- Framework: React Native + Expo SDK 51
- Language: TypeScript (strict, no `any`)
- State: Zustand (`app/src/store/`)
- Navigation: React Navigation v6 (`app/src/navigation/`)
- Forms: React Hook Form + Zod
- Styling: StyleSheet.create() only — no inline style objects
- Testing: Jest + RNTL + Maestro

## Code Rules
- Named exports for all components (default exports for screens only)
- `accessibilityLabel` + `accessibilityRole` on every interactive element
- Minimum 48x48pt touch targets on all pressable elements
- All text through `<Text>` — never bare strings in JSX
- `useCallback` on all `renderItem` functions passed to FlatList
- Never nest FlatList inside ScrollView
- Every async function wrapped in try/catch

## File Conventions
- Components: `src/components/[category]/ComponentName.tsx`
- Screens: `src/screens/[feature]/ScreenName.tsx` (default export)
- Hooks: `src/hooks/useHookName.ts`
- Store: `src/store/domainStore.ts`
- Tests: `__tests__/` sibling folder to the file being tested
- Mock data: `src/data/mock/entityName.ts`

## Skills Available
All 6 skills are in `.claude/skills/` and load automatically.
Invoke manually: /react-native-expo, /android-sdk, /ios-xcode,
/eas-build-deploy, /mobile-testing, /healthcare-ui-accessibility

## Build Commands
cd app
npx expo start              # dev server
npx expo run:ios            # iOS simulator
npx expo run:android        # Android emulator
npm test                    # Jest tests
eas build --profile preview # EAS preview build
