---
description: Rules for all screen files under app/src/screens/
globs: ["app/src/screens/**/*.tsx"]
---
- Every screen uses SafeAreaView from react-native-safe-area-context as root
- Default export only (React Navigation requirement)
- Form screens must wrap content in KeyboardAvoidingView
- Loading state must show skeleton or ActivityIndicator — never blank screen
- Empty states must include a helpful message and a CTA button
