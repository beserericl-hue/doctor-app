---
name: ios-xcode
description: Configure, build, and debug iOS apps from a React Native / Expo project. Use this skill for any task involving Xcode setup, CocoaPods, Swift Package Manager, iOS Simulator, provisioning profiles, certificates, Info.plist permissions, App Store Connect, TestFlight, iOS-specific runtime behavior, or Apple Developer account management. Also covers common Xcode and iOS build errors and how to fix them.
---

# iOS / Xcode Skill

You are configuring, building, or debugging the iOS side of a React Native / Expo project. This skill covers every layer from environment setup to App Store submission. Read every section before touching any iOS configuration file.

---

## 1. Environment Setup

### System Requirements
- **macOS** is mandatory for iOS builds. There is no workaround for local Xcode builds on Windows or Linux. (EAS Build cloud service can build iOS without a local Mac — see the EAS skill.)
- **macOS Sonoma 14+** recommended for Xcode 15+
- **Xcode 15+** — install from the Mac App Store only (not third-party sources)
- **Command Line Tools** — must match the installed Xcode version

### Install Xcode Command Line Tools
```bash
xcode-select --install
```

Verify:
```bash
xcode-select -p
# Expected: /Applications/Xcode.app/Contents/Developer

xcrun --version
# Expected: xcrun version XX
```

If the path points to `/Library/Developer/CommandLineTools` instead of Xcode.app, switch it:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Accept Xcode License
Required before any build tool will run:
```bash
sudo xcodebuild -license accept
```

### Verify Xcode Installation
```bash
xcodebuild -version
# Expected:
# Xcode 15.x
# Build version 15Xxxxx

xcrun simctl list devices | head -20
# Should list available simulators
```

### CocoaPods
```bash
# Install (system Ruby — may need sudo on older macOS)
sudo gem install cocoapods

# Or via Homebrew (recommended — avoids sudo issues)
brew install cocoapods

pod --version   # must print a version (1.14+)
```

### Node & Watchman
```bash
brew install watchman    # file watcher used by Metro bundler
watchman --version
```

---

## 2. Project Structure (Expo Bare / React Native)

After `npx expo prebuild` or ejecting, the iOS directory:

```
ios/
├── Podfile                         # CocoaPods dependency manifest
├── Podfile.lock                    # locked pod versions (commit this)
├── YourApp/
│   ├── AppDelegate.swift           # (or .mm for Obj-C) — app entry point
│   ├── Info.plist                  # app metadata, permissions, URL schemes
│   ├── main.m                      # Obj-C entry point (RN < 0.71)
│   ├── Images.xcassets/            # app icons, launch images
│   │   ├── AppIcon.appiconset/
│   │   └── LaunchImage.imageset/
│   └── SupportingFiles/
├── YourApp.xcodeproj/              # Xcode project file (avoid manual edits)
│   └── project.pbxproj             # raw project config (XML-like, brittle)
├── YourApp.xcworkspace/            # workspace including pods (ALWAYS open this)
│   └── contents.xcworkspacedata
└── Pods/                           # CocoaPods downloaded dependencies (DO NOT COMMIT)
```

**Critical rule:** Always open `YourApp.xcworkspace`, never `YourApp.xcodeproj`. The workspace includes CocoaPods. Opening the `.xcodeproj` directly causes "module not found" errors for all pod dependencies.

---

## 3. CocoaPods

CocoaPods is the dependency manager for native iOS libraries. React Native uses it to link all native modules.

### Podfile Structure
```ruby
# ios/Podfile
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('@react-native/community-cli-plugin/package.json')"`), "../scripts/react_native_pods")

platform :ios, '13.4'   # minimum iOS version — must be >= RN's minimum
prepare_react_native_project!

target 'YourApp' do
  use_expo_modules!
  
  config = use_native_modules!
  
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,        # Hermes JS engine — required for RN 0.70+
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
```

### Installing / Updating Pods
```bash
cd ios
pod install              # install pods per Podfile.lock
pod install --repo-update  # update spec repos first (use when adding new packages)
pod update               # update ALL pods to latest allowed versions (use carefully)
pod update PodName       # update a single pod
pod deintegrate && pod install  # nuclear option — full reinstall
```

**When to run `pod install`:**
- After `npm install` or `npx expo install` adds any package with native code
- After changing the Podfile
- After pulling changes from git that modified `Podfile.lock`
- When Xcode shows "module not found" for a native module

**Never edit `Podfile.lock` manually.** It's auto-generated and tracks exact pod versions for reproducible builds.

### CocoaPods Cache Issues
```bash
pod cache clean --all      # clear downloaded pod cache
rm -rf ios/Pods
rm ios/Podfile.lock
cd ios && pod install --repo-update
```

---

## 4. Info.plist — Permissions & Configuration

`Info.plist` is the iOS app manifest. It declares permissions, URL schemes, app metadata, and system capabilities. Located at `ios/YourApp/Info.plist`.

**Every permission your app uses must have a usage description string.** Apple rejects apps without these. The string is shown to the user in the permission dialog.

### Common Permission Keys

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>

    <!-- Camera (for profile photo) -->
    <key>NSCameraUsageDescription</key>
    <string>MediBook needs camera access to take your profile photo.</string>

    <!-- Photo Library read (for profile photo selection) -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>MediBook needs access to your photo library to set your profile photo.</string>

    <!-- Photo Library write (for saving photos) -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>MediBook needs permission to save photos to your library.</string>

    <!-- Microphone (if adding video calls) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>MediBook needs microphone access for video consultations.</string>

    <!-- Face ID -->
    <key>NSFaceIDUsageDescription</key>
    <string>MediBook uses Face ID to securely authenticate your identity.</string>

    <!-- Location (if adding doctor map) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>MediBook uses your location to find nearby doctors.</string>

    <!-- Notifications (handled at runtime, but declare capability) -->
    <!-- No plist key needed — request via UNUserNotificationCenter -->

    <!-- App Transport Security — remove or restrict in production -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <!-- DEVELOPMENT ONLY: allows HTTP on localhost -->
        <key>NSExceptionDomains</key>
        <dict>
            <key>localhost</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <true/>
            </dict>
        </dict>
        <!-- NEVER set NSAllowsArbitraryLoads to true in production -->
    </dict>

    <!-- URL Schemes (for deep linking) -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>medibook</string>
            </array>
        </dict>
    </array>

    <!-- Required device capabilities -->
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>

    <!-- Supported orientations (portrait only for this app) -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>

    <!-- iPad orientations (if supporting tablet) -->
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>

</dict>
</plist>
```

### Setting Info.plist via `app.json` (Expo Managed Workflow)
In Expo managed workflow, never edit `Info.plist` directly — it's regenerated by `expo prebuild`. Set values in `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.medibook",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "MediBook needs camera access to take your profile photo.",
        "NSPhotoLibraryUsageDescription": "MediBook needs access to your photo library to set your profile photo.",
        "NSPhotoLibraryAddUsageDescription": "MediBook needs permission to save photos to your library.",
        "NSFaceIDUsageDescription": "MediBook uses Face ID to securely authenticate your identity.",
        "NSLocationWhenInUseUsageDescription": "MediBook uses your location to find nearby doctors.",
        "UIBackgroundModes": ["remote-notification"],
        "NSAppTransportSecurity": {
          "NSExceptionDomains": {
            "localhost": {
              "NSExceptionAllowsInsecureHTTPLoads": true
            }
          }
        }
      }
    }
  }
}
```

---

## 5. iOS Simulator

### List Available Simulators
```bash
xcrun simctl list devices
xcrun simctl list devices available    # only installed/available ones

# Formatted list
xcrun simctl list devices | grep -E "iPhone|iPad"
```

### Boot & Open Simulator
```bash
# Boot a specific simulator (use UDID from list)
xcrun simctl boot "iPhone 15 Pro"
open -a Simulator

# Or boot + open in one command
xcrun simctl boot "iPhone 15 Pro" && open -a Simulator
```

### Install & Launch App on Simulator
```bash
# Build first (see Section 7), then install
xcrun simctl install booted path/to/YourApp.app

# Launch the app
xcrun simctl launch booted com.yourcompany.medibook
```

### Simulator Utilities
```bash
# Take screenshot
xcrun simctl io booted screenshot ~/Desktop/screenshot.png

# Record screen
xcrun simctl io booted recordVideo ~/Desktop/recording.mp4
# Press Ctrl+C to stop

# Open a URL (deep link testing)
xcrun simctl openurl booted "medibook://appointment/123"

# Push mock notification
xcrun simctl push booted com.yourcompany.medibook notification.apns

# Reset all simulators (nuclear — deletes all app data)
xcrun simctl erase all

# Delete simulator
xcrun simctl delete "iPhone 15 Pro"
```

### notification.apns format
```json
{
  "aps": {
    "alert": {
      "title": "Appointment Reminder",
      "body": "Your appointment with Dr. Smith is in 1 hour."
    },
    "badge": 1,
    "sound": "default"
  }
}
```

### Run Expo Dev Build on Simulator
```bash
npx expo run:ios --simulator "iPhone 15 Pro"

# Or with specific iOS version
npx expo run:ios --simulator "iPhone 15 Pro (17.0)"
```

---

## 6. Xcode Project Settings

When you need to configure things that `app.json` / `eas.json` don't cover, open Xcode:

```
open ios/YourApp.xcworkspace
```

### Signing & Capabilities (Xcode UI)
1. In the Project Navigator (left panel), click the project name at the top
2. Select the `YourApp` target (not the Pods targets)
3. Go to **Signing & Capabilities** tab

**Development signing:**
- Check "Automatically manage signing"
- Select your Apple Developer team from the dropdown
- Xcode generates a development certificate and provisioning profile automatically

**Production signing:**
- Uncheck "Automatically manage signing" (recommended for production)
- Select `Distribution` certificate and `App Store` provisioning profile
- Or use EAS to manage this (preferred — see EAS skill)

### Adding Capabilities
In **Signing & Capabilities** tab → "+ Capability":
- **Push Notifications** — required for APNs
- **Background Modes** — check "Remote notifications" for background push
- **Associated Domains** — for universal links (deep linking)
- **Sign In with Apple** — if using Apple auth

Adding a capability automatically updates `YourApp.entitlements`.

### Build Settings (Xcode UI)
Target → **Build Settings** tab. Key settings:

| Setting | Recommended Value |
|---------|-----------------|
| IPHONEOS_DEPLOYMENT_TARGET | 13.4 |
| SWIFT_VERSION | 5.0 |
| ENABLE_BITCODE | NO (deprecated — Apple removed bitcode in Xcode 14) |
| CODE_SIGN_STYLE | Automatic (dev) or Manual (prod) |

### `project.pbxproj` — Do Not Edit Manually
The `ios/YourApp.xcodeproj/project.pbxproj` file is Xcode's raw project definition. It's a fragile format — manual edits cause corrupt projects that silently fail. Always use Xcode's UI or `expo prebuild` to modify it. If it becomes corrupted, the safest fix is:
```bash
npx expo prebuild --clean    # regenerates ios/ from scratch
cd ios && pod install
```

---

## 7. Build Commands

### Build for Simulator (Debug)
```bash
# Via React Native CLI
npx react-native run-ios

# Target specific simulator
npx react-native run-ios --simulator "iPhone 15 Pro"

# Via Expo
npx expo run:ios

# Via xcodebuild directly
xcodebuild \
  -workspace ios/YourApp.xcworkspace \
  -scheme YourApp \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  build
```

### Build for Physical Device (Debug)
```bash
npx react-native run-ios --device "My iPhone"

# List connected devices
instruments -s devices    # legacy but works
xcrun xctrace list devices
```

### Archive for App Store (Release)
```bash
xcodebuild \
  -workspace ios/YourApp.xcworkspace \
  -scheme YourApp \
  -configuration Release \
  -sdk iphoneos \
  -archivePath ios/build/YourApp.xcarchive \
  archive

# Export IPA from archive
xcodebuild \
  -exportArchive \
  -archivePath ios/build/YourApp.xcarchive \
  -exportPath ios/build/export \
  -exportOptionsPlist ios/ExportOptions.plist
```

### ExportOptions.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>   <!-- or "ad-hoc", "development", "enterprise" -->
    <key>teamID</key>
    <string>XXXXXXXXXX</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

### Clean Build
```bash
# Clean derived data (fixes most mysterious build failures)
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ios && xcodebuild clean

# Full reset (when clean doesn't help)
rm -rf ios/build
rm -rf ios/Pods
cd ios && pod install
```

---

## 8. Code Signing Deep Dive

### The Four Components
| Component | What it is | Where it lives |
|-----------|-----------|---------------|
| Apple Developer Certificate | Proves you are a registered Apple developer | Keychain + Apple's servers |
| Private Key | Cryptographic key paired with the certificate | Keychain only (never leave your machine) |
| Provisioning Profile | Lists: app ID + certificate(s) + allowed devices | Downloaded from Apple Developer Portal |
| App ID / Bundle ID | Unique identifier: `com.yourcompany.appname` | Registered in Apple Developer Portal |

### Certificate Types
| Type | Use |
|------|-----|
| Apple Development | Running app on physical devices during development |
| Apple Distribution | Submitting to TestFlight and App Store |

### Provisioning Profile Types
| Type | Use | Device limit |
|------|-----|-------------|
| Development | Testing on registered devices | 100 devices |
| Ad Hoc | Internal distribution (not App Store) | 100 devices |
| App Store | TestFlight and App Store submission | Unlimited |

### Manual Signing Workflow (when EAS is not used)
1. **Create an App ID** at https://developer.apple.com/account/resources/identifiers
   - Explicit App ID (not wildcard)
   - Bundle ID: `com.yourcompany.medibook`
   - Enable capabilities needed (Push Notifications, etc.)

2. **Create a Certificate**
   - In Xcode: Preferences → Accounts → Manage Certificates → + → Apple Distribution
   - Or via Apple Developer Portal → Certificates → +

3. **Create a Provisioning Profile**
   - Apple Developer Portal → Profiles → +
   - Type: App Store Distribution
   - Select App ID, Certificate, save and download

4. **Install in Xcode**
   - Double-click downloaded `.mobileprovision` file
   - Xcode → Signing & Capabilities → select profile manually

### Check Installed Certificates
```bash
# List certificates in login keychain
security find-identity -v -p codesigning

# Expected output line:
# 1) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX "Apple Distribution: Your Name (XXXXXXXXXX)"
```

If this list is empty, no valid distribution certificate is installed — use Xcode → Preferences → Accounts to download it, or use EAS to manage certificates.

---

## 9. App Icons & Launch Screen

### App Icon Requirements
Apple requires icons at specific sizes. Provide a single 1024×1024px source — Xcode or EAS generates all variants.

| Slot | Size | Usage |
|------|------|-------|
| iPhone Notification | 20pt @2x, @3x | 40px, 60px |
| iPhone Settings | 29pt @2x, @3x | 58px, 87px |
| iPhone Spotlight | 40pt @2x, @3x | 80px, 120px |
| iPhone App | 60pt @2x, @3x | 120px, 180px |
| iPad (various) | multiple | see AppIcon.appiconset/Contents.json |
| App Store | 1024×1024 | no alpha channel allowed |

**Rules:**
- No alpha channel (transparency) on any icon — Apple rejects them
- No rounded corners in your source — iOS applies the mask
- PNG format only

In Expo managed workflow, set in `app.json`:
```json
{
  "expo": {
    "icon": "./assets/icon.png"
  }
}
```

Run `npx expo prebuild` to generate all sizes into `ios/YourApp/Images.xcassets/AppIcon.appiconset/`.

### Launch Screen (Splash Screen)
```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2D6BE4"
    },
    "ios": {
      "splash": {
        "image": "./assets/splash.png",
        "resizeMode": "cover",
        "backgroundColor": "#2D6BE4"
      }
    }
  }
}
```

Recommended splash source size: **1284×2778px** (iPhone 14 Pro Max — largest supported). Use `"resizeMode": "contain"` to avoid cropping on smaller devices.

---

## 10. Push Notifications Setup (APNs)

### APNs Key vs Certificate
Use an **APNs Auth Key** (`.p8` file) — it never expires and works for all your apps.

1. Apple Developer Portal → Keys → + → Apple Push Notifications service (APNs)
2. Download the `.p8` file — you can only download it once
3. Note the Key ID (10-char string)

### Registering for Notifications in React Native
```typescript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token (works in Expo Go and dev builds)
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  return token.data;
}
```

### Notification Handler
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### `Info.plist` for Background Notifications
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

This allows the app to receive silent push notifications while in background.

---

## 11. Deep Linking & Universal Links

### URL Scheme (works without a domain)
```json
{
  "expo": {
    "scheme": "medibook"
  }
}
```

Test in simulator:
```bash
xcrun simctl openurl booted "medibook://doctors/123"
```

Handle in React Navigation:
```typescript
const linking = {
  prefixes: ['medibook://'],
  config: {
    screens: {
      DoctorDetail: 'doctors/:doctorId',
      Booking: 'booking/:doctorId',
    },
  },
};

<NavigationContainer linking={linking}>
```

### Universal Links (requires a domain + AASA file)
1. Add Associated Domains capability in Xcode
2. Add `applinks:yourdomain.com` to entitlements
3. Host `https://yourdomain.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourcompany.medibook",
        "paths": ["/appointment/*", "/doctors/*"]
      }
    ]
  }
}
```

---

## 12. TestFlight Distribution

TestFlight is Apple's official beta distribution platform. Internal testers (up to 100) get access immediately; external testers require a brief App Review.

### Workflow
1. Build and archive (`xcodebuild archive` or `eas build --profile production --platform ios`)
2. Upload to App Store Connect (`xcodebuild -exportArchive` → Transporter app, or `eas submit --platform ios`)
3. App Store Connect → TestFlight tab → wait for processing (10–30 min)
4. Add internal testers → they receive an email invitation
5. For external testing: create a group → add builds → submit for TestFlight review (1–2 days)

### Transporter App (manual upload alternative)
```bash
# Install via Mac App Store: "Transporter" by Apple
# Or use xcrun altool (deprecated) or notarytool
xcrun altool --upload-app \
  --type ios \
  --file YourApp.ipa \
  --apiKey KEY_ID \
  --apiIssuer ISSUER_ID
```

---

## 13. Common Xcode & iOS Build Errors

### `No signing certificate "iOS Development" found`
**Cause:** No development certificate in the local Keychain.
**Fix:**
```
Xcode → Preferences → Accounts → select Apple ID → Manage Certificates → + → Apple Development
```
Or use EAS to manage signing remotely.

### `Provisioning profile doesn't include the currently selected device`
**Cause:** Physical device UDID not registered in the provisioning profile.
**Fix:**
1. Find device UDID: Xcode → Window → Devices and Simulators → select device → copy UDID
2. Register at Apple Developer Portal → Devices → +
3. Regenerate provisioning profile to include the new device
4. Re-download and install the profile

### `Module 'XYZ' not found` (after pod install)
**Cause:** Pods not installed, or opened `.xcodeproj` instead of `.xcworkspace`.
**Fix:**
```bash
cd ios && pod install
open YourApp.xcworkspace   # not .xcodeproj
```

### `unable to find utility "simctl"`
**Cause:** Xcode Command Line Tools pointing to the wrong location.
**Fix:**
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### `error: no such module 'React'`
**Cause:** Metro bundler not running, or pod install not run after adding a new package.
**Fix:**
```bash
cd ios && pod install
npx expo start   # ensure Metro is running before launching the app
```

### `Build input file cannot be found: .../node_modules/...`
**Cause:** npm packages installed but native files not linked.
**Fix:**
```bash
cd ios && pod install --repo-update
```

### `Sandbox: rsync ... Operation not permitted`
**Cause:** Xcode 14+ sandbox restrictions on build scripts.
**Fix:** In Xcode → Build Settings → search "User Script Sandboxing" → set to `NO`.
Or add to `Podfile` post_install block:
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
    end
  end
end
```

### `ld: framework not found XYZ`
**Cause:** A native library isn't linked.
**Fix:**
```bash
cd ios && pod deintegrate && pod install
```

### `The application's Info.plist does not contain NSPhotoLibraryUsageDescription`
**Cause:** Missing permission string for a capability used at runtime.
**Fix:** Add the appropriate `NS*UsageDescription` key to `Info.plist` or `app.json` (see Section 4).

### `Code signing is required for product type 'Application' in SDK 'iOS 17.0'`
**Cause:** No signing identity selected.
**Fix:** Xcode → Target → Signing & Capabilities → set Team to your Apple Developer account.

### `DerivedData` errors (mysterious build failures after updating packages)
**Fix:** Always try this before anything else:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Simulator doesn't reflect latest code changes
**Fix:**
```bash
xcrun simctl erase booted   # wipe the simulator
npx expo start --clear      # clear Metro cache
```

---

## 14. Debugging iOS-Specific Issues

### Flipper (React Native debugger)
Flipper is a desktop debugging tool for React Native. For Expo SDK 50+, it's disabled by default (replaced by the Expo dev tools). For RN bare workflow:
```bash
brew install --cask flipper
```

### Console Logs from Simulator
```bash
# Stream device logs filtered to your app
xcrun simctl spawn booted log stream \
  --predicate 'processImagePath contains "YourApp"' \
  --level debug
```

### Safari Web Inspector (for JS debugging on device)
1. Safari → Preferences → Advanced → "Show Develop menu in menu bar"
2. Connect iPhone → Settings → Safari → Advanced → Web Inspector: ON
3. Safari → Develop → [Your iPhone] → [Your App]

### React Native Inspector (in-app)
Shake the device (or press Cmd+D in Simulator) → "Toggle Inspector" to inspect component hierarchy and styles.

### `console.log` in Metro
All `console.log` from JS appears in the Metro bundler terminal window. No special setup needed.

### Checking Crash Logs
```bash
# Simulator crash logs
ls ~/Library/Logs/DiagnosticReports/ | grep YourApp

# Device crash logs
xcrun devicectl device info files --device UDID
```

---

## 15. iOS-Specific React Native Gotchas

### Safe Area
Use `react-native-safe-area-context` (not the built-in). The notch, Dynamic Island, and home indicator on modern iPhones are handled only by the third-party library.

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// insets.top = notch/Dynamic Island height
// insets.bottom = home indicator height
```

### `KeyboardAvoidingView` Behavior
On iOS, use `behavior="padding"`. On Android, use `behavior="height"`. Always check both:
```tsx
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
```

### Font Rendering
iOS uses San Francisco as the system font. `fontFamily: undefined` or `fontFamily: 'System'` renders SF Pro automatically. Custom fonts must be bundled in the app and referenced by exact PostScript name:
```bash
# Find the PostScript name of a font file
fc-scan --format "%{postscriptname}\n" MyFont-Bold.ttf
```

### `StatusBar` Height
On iOS, the status bar height varies by device:
- Standard iPhone: 20pt
- iPhone with notch (X/11/12/13): 44pt  
- iPhone with Dynamic Island (14 Pro / 15): 59pt

Never hardcode status bar height. Use `useSafeAreaInsets().top`.

### Modal Presentation
On iOS, the default modal slides up from the bottom (sheet style). To get a full-screen modal:
```tsx
import { Modal } from 'react-native';

<Modal
  animationType="slide"
  presentationStyle="fullScreen"   // iOS only
  visible={isVisible}
>
```

Or in React Navigation:
```tsx
<Stack.Screen
  name="BookingModal"
  component={BookingScreen}
  options={{ presentation: 'modal' }}
/>
```

### Haptic Feedback
iOS haptics are richer than Android. `expo-haptics` maps to the iOS UIFeedbackGenerator APIs:
- `Haptics.impactAsync(ImpactFeedbackStyle.Light)` → light tap
- `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` → medium tap
- `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` → heavy tap
- `Haptics.notificationAsync(NotificationFeedbackType.Success)` → double tap
- `Haptics.notificationAsync(NotificationFeedbackType.Error)` → triple tap with pause

---

## 16. `.gitignore` Entries for iOS

Add to root `.gitignore`:
```gitignore
# iOS
ios/Pods/
ios/build/
ios/DerivedData/
ios/*.xcworkspace/xcuserdata/
ios/*.xcodeproj/xcuserdata/
ios/*.xcodeproj/project.xcworkspace/xcuserdata/
*.ipa
*.dSYM.zip
*.dSYM
ios/YourApp/GoogleService-Info.plist   # if using Firebase
```

**Commit `Podfile.lock`** — it ensures every developer and CI build uses identical pod versions. Unlike `package-lock.json`, Podfile.lock is intentionally committed.

---

## 17. App Store Submission Checklist

Before submitting for App Store review:

- [ ] Bundle ID registered in Apple Developer Portal and App Store Connect
- [ ] All `NS*UsageDescription` keys present in `Info.plist` for every permission used
- [ ] `NSAllowsArbitraryLoads` NOT set to true in production
- [ ] App icons present at all required sizes, no alpha channel
- [ ] Splash screen configured
- [ ] `ITSAppUsesNonExemptEncryption` set to `NO` in `Info.plist` if no custom encryption (most apps)
  ```xml
  <key>ITSAppUsesNonExemptEncryption</key>
  <false/>
  ```
- [ ] Build number incremented from any previous TestFlight/App Store upload
- [ ] App tested on physical iPhone (not simulator only)
- [ ] App tested on oldest supported iOS version (13.4)
- [ ] No private API usage (causes automatic rejection)
- [ ] Demo account credentials added in App Review Information
- [ ] Privacy policy URL live and accessible
- [ ] App Store screenshots prepared (6.7" required, 6.1" recommended)
- [ ] App description, keywords, category filled in App Store Connect
- [ ] Age rating questionnaire completed
- [ ] Content Rights declaration completed
- [ ] Data collection practices declared in App Privacy section
