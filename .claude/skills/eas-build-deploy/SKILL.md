---
name: eas-build-deploy
description: Build and deploy React Native / Expo apps using Expo Application Services (EAS). Use this skill for any task involving eas build, eas submit, eas update (OTA), eas.json configuration, app signing, App Store Connect submission, Google Play Console submission, environment variables, build profiles, and CI/CD pipeline setup with EAS. This skill covers the full pipeline from development build to production release.
---

# EAS Build & Deployment Skill

You are building, signing, and shipping a React Native / Expo app using **Expo Application Services (EAS)**. EAS is the official Expo build and deployment service. It replaces the legacy `expo build` command (deprecated) and handles cloud builds for both Android and iOS without requiring a local Mac for iOS builds.

Read every section before writing configuration files or running build commands.

---

## 1. Prerequisites & Setup

### Install EAS CLI
```bash
npm install -g eas-cli
eas --version   # must print a version (5.x+)
```

### Login to Expo Account
```bash
eas login
# or
npx eas-cli login
```

An Expo account is required. EAS Free tier allows 30 builds/month. Paid plans remove limits.

### Link Project to Expo
```bash
eas init
```

This creates/updates `app.json` with an `expo.extra.eas.projectId` field. The project ID links your local code to the Expo dashboard at https://expo.dev.

### Verify Configuration
```bash
eas whoami          # prints logged-in account
eas project:info    # prints project details
```

---

## 2. `eas.json` — Build Configuration

`eas.json` lives at the project root. It defines **build profiles** (named environments) and **submit profiles**.

### Full Reference Configuration
```json
{
  "cli": {
    "version": ">= 5.9.1",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "credentialsSource": "remote"
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@apple.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

### Profile Types Explained

**`development`** — Creates a development client build. This is a special build of your app that includes the Expo dev tools and connects to your local Metro bundler. Use this for daily development on physical devices.

**`preview`** — A release-mode build distributed internally (not through the stores). Use for client demos, QA testing, internal review. Distributed via Expo's internal distribution system (sharable link + QR code) or directly as APK/IPA.

**`production`** — A fully optimized, store-ready build. AAB for Android (required by Google Play), IPA for iOS (required by App Store). Code signing uses production certificates.

### Key Fields
| Field | Options | Meaning |
|-------|---------|---------|
| `distribution` | `"store"`, `"internal"` | `"internal"` = shareable link, `"store"` = requires store credentials |
| `developmentClient` | `true`, `false` | `true` = includes Expo dev client |
| `android.buildType` | `"apk"`, `"app-bundle"` | APK for sideloading, AAB for Google Play |
| `autoIncrement` | `true`, `false` | Auto-bumps `versionCode` (Android) and `buildNumber` (iOS) |
| `credentialsSource` | `"remote"`, `"local"` | `"remote"` = EAS manages certs, `"local"` = you provide them |
| `ios.simulator` | `true`, `false` | `true` = build for iOS Simulator (no signing needed) |

---

## 3. Android Builds

### First-Time Credentials Setup
EAS can manage your Android signing keystore automatically:
```bash
eas credentials
# Select: Android → production → Keystore → Generate new keystore
```

EAS generates the keystore, stores it securely in the Expo cloud, and uses it for all future production builds. The keystore is downloadable anytime from the Expo dashboard.

**If you have an existing keystore** (e.g., app already on Play Store):
```bash
eas credentials
# Select: Android → production → Keystore → Upload existing keystore
```

You'll be prompted for the `.jks`/`.keystore` file path and passwords.

### Build Commands
```bash
# Development APK (emulator or device)
eas build --profile development --platform android

# Preview APK (internal distribution)
eas build --profile preview --platform android

# Production AAB (Google Play)
eas build --profile production --platform android

# Build both platforms at once
eas build --profile production --platform all

# Local build (runs Gradle on your machine instead of EAS servers)
eas build --profile preview --platform android --local
```

### Monitor Build Progress
```bash
eas build:list                    # list recent builds
eas build:view <BUILD_ID>         # details for a specific build
```

Or monitor at https://expo.dev — builds stream logs in real-time.

### Download Build Artifact
```bash
eas build:download --id <BUILD_ID>
```

Or click the download link on the Expo dashboard.

---

## 4. iOS Builds

iOS requires an **Apple Developer account** ($99/year). Without it, you can build for the Simulator only.

### Credentials: What's Needed
| Credential | Purpose | Managed by |
|-----------|---------|-----------|
| Distribution Certificate | Signs the IPA | EAS (auto) or you |
| Provisioning Profile | Authorizes devices / App Store distribution | EAS (auto) or you |
| Push Notification Key | APNs (for push notifications) | Separate, manual |

### First-Time iOS Credentials
```bash
eas credentials
# Select: iOS → production → set up certificates and provisioning
```

EAS will prompt for your Apple ID and password (or App Store Connect API Key — recommended for CI). It then creates and manages the certificate and provisioning profile automatically.

**App Store Connect API Key** (recommended over password):
1. Go to App Store Connect → Users and Access → Integrations → App Store Connect API
2. Create a key with Admin role
3. Download the `.p8` file
4. Note the Key ID and Issuer ID

Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "ios": {
        "credentialsSource": "remote"
      }
    }
  }
}
```

Set as EAS secret:
```bash
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_KEY_ID --value "XXXXXXXXXX"
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ISSUER_ID --value "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# Upload the .p8 file separately via the Expo dashboard
```

### iOS Build Commands
```bash
# iOS Simulator build (no Apple account needed)
eas build --profile development --platform ios

# Preview IPA (Ad Hoc distribution)
eas build --profile preview --platform ios

# Production IPA (App Store)
eas build --profile production --platform ios
```

### Register Test Devices (for Ad Hoc / Internal Distribution)
```bash
eas device:create    # generates a registration URL/QR code
eas device:list      # list registered devices
```

After registering devices, rebuild with the preview profile — EAS updates the provisioning profile automatically.

---

## 5. Environment Variables & Secrets

### Types of Variables

**Plain env vars** (`eas.json` → `env` block) — visible in build logs, stored in the repo. Use only for non-sensitive config like `APP_ENV`.

**EAS Secrets** — encrypted, not visible in logs, not stored in the repo. Use for API keys, service account files, signing credentials.

### Setting Secrets
```bash
# String secret
eas secret:create --scope project --name API_BASE_URL --value "https://api.yourapp.com"

# Sensitive secret (hidden input)
eas secret:create --scope project --name STRIPE_SECRET_KEY

# File secret (e.g., Google Services JSON, service account key)
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json

# List all secrets
eas secret:list

# Delete a secret
eas secret:delete --name OLD_SECRET
```

### Using Secrets in the App
Secrets are injected as environment variables during the build. Access them via `process.env` or Expo's `Constants.expoConfig.extra`:

In `app.config.js` (use this instead of `app.json` when you need dynamic values):
```javascript
export default {
  expo: {
    name: 'MediBook',
    slug: 'medibook',
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      appEnv: process.env.APP_ENV || 'development',
    },
  },
};
```

In the app:
```typescript
import Constants from 'expo-constants';

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
const appEnv = Constants.expoConfig?.extra?.appEnv;
```

**Never access `process.env` directly in React Native at runtime** — it's only available at build time via Metro's inline substitution. Always pipe env vars through `app.config.js` → `Constants.expoConfig.extra`.

---

## 6. `eas submit` — Store Submission

EAS Submit automates uploading the built artifact to Google Play or App Store.

### Android — Google Play
**Requirements:**
- App already created in Google Play Console (EAS cannot create new apps)
- Service account JSON key with Play Developer API access

**Create Service Account:**
1. Google Play Console → Setup → API Access → Link to Google Cloud project
2. Google Cloud Console → IAM & Admin → Service Accounts → Create Service Account
3. Grant role: `Service Account User` + `Firebase App Distribution Admin` (or specific Play permissions)
4. Create key → JSON → download
5. Back in Play Console → Grant access to the service account with `Release Manager` role

```bash
eas submit --platform android --profile production
```

Or non-interactively:
```bash
eas submit \
  --platform android \
  --profile production \
  --path ./app-release.aab
```

**Tracks:**
| Track | Use | Audience |
|-------|-----|---------|
| `internal` | First submission, testing | Up to 100 internal testers |
| `alpha` | Broader testing | Opt-in testers |
| `beta` | Pre-release | Opt-in testers |
| `production` | Live release | All users |

Always start with `internal`. Promote to production from the Play Console after testing.

### iOS — App Store
**Requirements:**
- App created in App Store Connect (bundle ID must already exist)
- App Store Connect API Key (see Section 4)

```bash
eas submit --platform ios --profile production
```

EAS will prompt for App Store Connect credentials if not configured in `eas.json`.

### Submit Immediately After Build
```bash
eas build --platform all --profile production --auto-submit
```

`--auto-submit` triggers `eas submit` automatically when the build completes. Requires submit profile to be configured in `eas.json`.

---

## 7. OTA Updates with `eas update`

EAS Update allows you to push JavaScript and asset changes to production users **without a new store release**. Only JS/assets change — native code changes still require a full build.

### When to Use OTA Updates
✅ Bug fixes in JavaScript  
✅ Text/copy changes  
✅ Style adjustments  
✅ New screens that don't require new native modules  
❌ Adding a new native package (requires full build)  
❌ Changes to `app.json`, `AndroidManifest.xml`, `Info.plist`  
❌ Gradle or Xcode configuration changes  

### Setup
```bash
npx expo install expo-updates
```

Add to `app.json`:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID",
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### Push an Update
```bash
# Push to default branch (production)
eas update --branch production --message "Fix appointment booking crash"

# Push to a specific channel
eas update --branch preview --message "New doctor filter UI"

# Push to both platforms
eas update --branch production --platform all --message "Copy update"
```

### Update Branches
Branches map to build profiles. Set the channel in `eas.json`:
```json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

### Check Update Status
```bash
eas update:list                        # list recent updates
eas update:view <UPDATE_ID>            # details
eas channel:list                       # list branches/channels
```

### Runtime Version Policy
`"policy": "appVersion"` ties OTA compatibility to the `version` field in `app.json`. When you make a native change and release a new store build (e.g., `version: "1.1.0"`), users on `1.0.0` won't receive updates targeting `1.1.0`. This prevents JS/native mismatches.

---

## 8. Build Variants & Channels Strategy

### Recommended Strategy for MVP
```
Development  →  Preview  →  Production
(local Metro)   (internal APK/IPA)  (store AAB/IPA)
     ↓                ↓                  ↓
  developers      client review       end users
```

### Branch/Channel Mapping
```json
{
  "build": {
    "development": { "channel": "development" },
    "preview":     { "channel": "preview" },
    "production":  { "channel": "production" }
  }
}
```

```bash
# Developer: update development channel
eas update --branch development --message "WIP: new feature"

# QA sign-off: promote preview update to production
eas channel:rollout --channel production --update <UPDATE_ID>
```

---

## 9. CI/CD with GitHub Actions

```yaml
# .github/workflows/eas-build.yml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build (Android preview)
        run: eas build --profile preview --platform android --non-interactive

      - name: Build (iOS preview)
        run: eas build --profile preview --platform ios --non-interactive
```

### Get Expo Token for CI
```bash
eas account:view    # note your account name
# Go to https://expo.dev → Account Settings → Access Tokens → Create
# Add as GitHub secret: EXPO_TOKEN
```

---

## 10. App Store Connect — iOS Submission Steps

Before submitting for review:

1. **Create the app** in App Store Connect (https://appstoreconnect.apple.com):
   - My Apps → + → New App
   - Platform: iOS
   - Bundle ID: must match `ios.bundleIdentifier` in `app.json`
   - SKU: unique identifier (use your bundle ID without dots)

2. **App Information:**
   - Name (30 chars max on the store)
   - Subtitle (30 chars max)
   - Category: Medical or Health & Fitness
   - Privacy Policy URL (required — even for MVP)

3. **Version Information:**
   - Screenshots: required for each device size (6.7" iPhone is mandatory)
   - Description: up to 4000 chars
   - Keywords: 100 chars max, comma-separated
   - Support URL

4. **App Review Information:**
   - Demo account credentials (if the app requires login)
   - Notes for reviewer explaining the app flow

5. **Upload the build** via `eas submit` (Section 6)

6. **Submit for Review** — processing takes 10–30 minutes after upload before it appears in TestFlight/App Review

**Typical review time:** 24–48 hours for first submissions. Updates are faster.

---

## 11. Google Play Console — Android Submission Steps

1. **Create the app** at https://play.google.com/console:
   - Create app → App details (name, default language, app/game, free/paid)

2. **Dashboard tasks** — Play Console shows a checklist. Complete all required items:
   - App content questionnaire (data safety, content rating)
   - Privacy policy URL
   - App access (provide test credentials)
   - Store listing (description, screenshots, feature graphic)

3. **Screenshots required:**
   - Phone: at least 2 screenshots
   - 7-inch tablet: optional for MVP
   - 10-inch tablet: optional for MVP
   - Feature graphic: 1024×500px

4. **Data Safety Section** (required since Nov 2022):
   - Declare all data types collected (name, email, health info)
   - Declare sharing with third parties
   - Must match your app's actual behavior — false declarations cause rejection

5. **Upload the AAB** via `eas submit` (Section 6) to Internal Testing track

6. **Release to Internal Testing** → add tester emails → publish

7. **Promote to Production** after internal testing passes

**First-time review:** 3–7 days for new developer accounts.

---

## 12. Version Management

### `autoIncrement` in `eas.json`
```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

With `autoIncrement: true` and `"appVersionSource": "remote"` in the CLI config, EAS automatically increments:
- `android.versionCode` (integer, must be higher than previous Play Console upload)
- `ios.buildNumber` (string, must be higher than previous TestFlight upload)

The `version` field (`1.0.0`) is **not** auto-incremented — update it manually for user-visible releases.

### Manual Version Bump
In `app.json`:
```json
{
  "expo": {
    "version": "1.1.0",
    "ios": { "buildNumber": "5" },
    "android": { "versionCode": 5 }
  }
}
```

**Rule:** `versionCode` and `buildNumber` must be monotonically increasing integers. You can never re-upload a build with a lower or equal version code/build number to the same track.

---

## 13. Common EAS Errors & Fixes

### `Build failed: ENOENT: no such file or directory, open 'eas.json'`
**Fix:** Run `eas build` from the project root directory where `eas.json` lives.

### `No credentials found for Android`
**Fix:**
```bash
eas credentials
# Set up Android keystore interactively
```

### iOS: `You do not have permission to access this resource`
**Cause:** App Store Connect API key lacks required permissions.
**Fix:** In App Store Connect → Users and Access → Key → ensure role is `Admin` or `App Manager`.

### `Build failed: Gradle daemon disappeared unexpectedly`
**Cause:** JVM memory exhaustion on the build server.
**Fix:** Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease",
        "buildType": "app-bundle"
      },
      "env": {
        "GRADLE_OPTS": "-Xmx4096m"
      }
    }
  }
}
```

### `iOS: Provisioning profile doesn't include device`
**Cause:** Ad Hoc build but the test device isn't registered.
**Fix:**
```bash
eas device:create    # register the device
eas build --profile preview --platform ios   # rebuild (EAS updates profile automatically)
```

### `eas update` — update not appearing in app
**Cause:** Runtime version mismatch between the update and the installed build.
**Fix:** Ensure the build and update share the same `runtimeVersion`. If you changed native code since the last build, you need a new full build before OTA updates will apply.

### `expo-updates` module not found
**Fix:**
```bash
npx expo install expo-updates
npx expo prebuild --clean   # if using bare workflow
```

---

## 14. Security Checklist Before Production

- [ ] No hardcoded API keys, passwords, or secrets in source code
- [ ] All secrets stored as EAS Secrets (`eas secret:create`)
- [ ] `android/local.properties` in `.gitignore`
- [ ] Keystore file and passwords stored in a password manager or secrets vault
- [ ] `android.usesCleartextTraffic` set to `false` (HTTPS only)
- [ ] iOS `NSAppTransportSecurity` not set to `NSAllowsArbitraryLoads: true`
- [ ] Service account JSON key not committed to git
- [ ] Apple `.p8` API key not committed to git
- [ ] Privacy policy URL live and accurate (both stores require this)
- [ ] Data Safety / Privacy Nutrition Label declarations match actual app behavior

---

## 15. Quick Reference: EAS Command Cheatsheet

```bash
# Setup
eas login
eas init
eas credentials

# Builds
eas build -p android --profile development
eas build -p ios    --profile development
eas build -p all    --profile preview
eas build -p all    --profile production
eas build -p all    --profile production --auto-submit
eas build -p android --local   # run Gradle locally

# Build management
eas build:list
eas build:view <id>
eas build:download --id <id>
eas build:cancel <id>

# Submissions
eas submit -p android
eas submit -p ios
eas submit -p all

# OTA updates
eas update --branch production --message "Fix: booking crash"
eas update:list
eas channel:list
eas channel:rollout --channel production --update <id>

# Secrets
eas secret:list
eas secret:create --scope project --name KEY --value value
eas secret:delete --name KEY

# Devices (iOS Ad Hoc)
eas device:create
eas device:list
```
