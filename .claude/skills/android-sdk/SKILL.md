---
name: android-sdk
description: Configure, build, and debug Android apps from a React Native / Expo project. Use this skill for any task involving Android Studio setup, Gradle configuration, emulator management, adb commands, APK/AAB signing, Google Play preparation, or Android-specific runtime behavior. Also covers common Android build errors and how to fix them.
---

# Android SDK Skill

You are configuring, building, or debugging the Android side of a React Native / Expo project. This skill covers every layer from environment setup to signed production builds. Read fully before touching any Android configuration file.

---

## 1. Environment Setup

### Required Tools
| Tool | Version | Install |
|------|---------|---------|
| Android Studio | Latest stable (Hedgehog+) | https://developer.android.com/studio |
| JDK | 17 (required for AGP 8+) | Bundled with Android Studio, or `brew install openjdk@17` |
| Android SDK | API 34 (target), API 26 (min) | Android Studio SDK Manager |
| Build Tools | 34.0.0 | Android Studio SDK Manager |

### Environment Variables
These must be set in the shell profile (`~/.zshrc`, `~/.bashrc`, or Windows System Environment Variables):

```bash
# macOS / Linux
export ANDROID_HOME=$HOME/Library/Android/sdk        # macOS
# export ANDROID_HOME=$HOME/Android/Sdk              # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Verify:
```bash
source ~/.zshrc
echo $ANDROID_HOME           # must print a path
adb --version                # must print a version number
sdkmanager --list_installed  # must list SDK packages
```

On Windows, use System Properties → Environment Variables. Add `ANDROID_HOME` as a User Variable pointing to `%LOCALAPPDATA%\Android\Sdk`.

### local.properties
This file lives at `android/local.properties` and **must never be committed to git**. It tells Gradle where the SDK is:

```properties
sdk.dir=/Users/USERNAME/Library/Android/sdk
```

For React Native / Expo bare workflow, this file is auto-generated. If it's missing or wrong, create it manually. If `ANDROID_HOME` is set correctly, run:
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

---

## 2. Project Structure (Expo Bare / React Native)

After `npx expo prebuild` or ejecting from managed workflow, the Android directory looks like:

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml     # permissions, activities, metadata
│   │       ├── java/com/yourapp/
│   │       │   └── MainActivity.kt     # entry point
│   │       └── res/
│   │           ├── drawable/           # app icon, splash
│   │           ├── mipmap-*/           # adaptive icons
│   │           └── values/             # strings, colors, styles
│   ├── build.gradle                    # app-level Gradle config
│   └── google-services.json            # (if using Firebase)
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties   # Gradle version
├── build.gradle                        # project-level Gradle config
├── gradle.properties                   # JVM args, AndroidX flags
├── gradlew                             # Gradle wrapper script (Unix)
├── gradlew.bat                         # Gradle wrapper script (Windows)
└── local.properties                    # SDK path (DO NOT COMMIT)
```

---

## 3. Gradle Configuration

### Project-level `android/build.gradle`
```groovy
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 26          // Android 8.0 — covers 98%+ of devices
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.9.22"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}
```

### App-level `android/app/build.gradle`
Key sections:
```groovy
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    namespace "com.yourcompany.medibook"  // must match applicationId

    defaultConfig {
        applicationId "com.yourcompany.medibook"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1            // integer, increment for every Play Store upload
        versionName "1.0.0"      // human-readable version
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            // NEVER hardcode credentials here — use gradle.properties or env vars
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("KEY_ALIAS") ?: ""
            keyPassword System.getenv("KEY_PASSWORD") ?: ""
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            minifyEnabled true                       // enables R8 code shrinking
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
            signingConfig signingConfigs.release
        }
    }
}
```

### `android/gradle.properties`
```properties
# JVM memory — prevents OutOfMemoryError on large builds
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m

# AndroidX — required for React Native 0.71+
android.useAndroidX=true
android.enableJetifier=true

# Enable Hermes JS engine (recommended for RN 0.64+)
hermesEnabled=true

# New architecture (leave false for MVP/stable builds)
newArchEnabled=false
```

### Gradle Wrapper Version
Check `android/gradle/wrapper/gradle-wrapper.properties`. For AGP 8.x, Gradle must be 8.x:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip
```

---

## 4. AndroidManifest.xml — Permissions

All permissions must be declared. Common ones for a healthcare appointment app:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network access (required for any API call) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera and photo library (for profile photo) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Vibration (for haptics) -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">    <!-- Remove in production if using HTTPS only -->

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

**Permission request at runtime (API 23+):**
Dangerous permissions (camera, storage, notifications) require both a manifest declaration AND a runtime request. In Expo managed workflow, use the Expo permissions APIs — they handle the runtime request automatically.

---

## 5. Emulator Management

### Create an AVD (Android Virtual Device)
```bash
# List available system images
sdkmanager --list | grep "system-images"

# Install a system image
sdkmanager "system-images;android-34;google_apis_playstore;x86_64"

# Create AVD via command line
avdmanager create avd \
  --name "Pixel_7_API_34" \
  --device "pixel_7" \
  --package "system-images;android-34;google_apis_playstore;x86_64" \
  --force
```

Or use Android Studio → Device Manager → Create Device (GUI is easier for initial setup).

### Start Emulator
```bash
# List available AVDs
emulator -list-avds

# Start a specific AVD
emulator -avd Pixel_7_API_34 &

# Start with options
emulator -avd Pixel_7_API_34 -no-snapshot-load &
```

### Verify Emulator is Detected
```bash
adb devices
# Should show: emulator-5554   device
```

---

## 6. ADB (Android Debug Bridge)

`adb` is the primary tool for communicating with connected devices and emulators. It's in `$ANDROID_HOME/platform-tools/`.

### Device Management
```bash
adb devices                          # list connected devices
adb devices -l                       # with device details

# If multiple devices are connected, target one
adb -s emulator-5554 <command>
adb -s R3CT90XXXXX <command>         # real device serial
```

### App Management
```bash
# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk  # reinstall (keeps data)

# Uninstall
adb uninstall com.yourcompany.medibook

# Launch app
adb shell am start -n com.yourcompany.medibook/.MainActivity

# Force stop app
adb shell am force-stop com.yourcompany.medibook

# Clear app data
adb shell pm clear com.yourcompany.medibook
```

### Logs
```bash
# Stream all logs
adb logcat

# Filter by app (most useful during development)
adb logcat --pid=$(adb shell pidof -s com.yourcompany.medibook)

# Filter by tag
adb logcat -s ReactNative ReactNativeJS

# Clear log buffer first
adb logcat -c && adb logcat -s ReactNative ReactNativeJS
```

### File Transfer
```bash
# Push file to device
adb push local_file.txt /sdcard/Download/

# Pull file from device
adb pull /sdcard/Download/file.txt .
```

### Network (Metro Bundler)
For Expo Go or dev builds on a physical Android device:
```bash
# Set Metro bundler host
adb reverse tcp:8081 tcp:8081    # forward port from device to machine
adb reverse tcp:19000 tcp:19000  # Expo dev server
adb reverse tcp:19001 tcp:19001
```

This allows the device to reach your local Metro server at `localhost:8081` even when not on the same network.

### Screenshots
```bash
adb shell screencap /sdcard/screen.png
adb pull /sdcard/screen.png .
```

---

## 7. Build Commands

### Debug Build (development)
```bash
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (unsigned, for testing)
```bash
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Release AAB (required for Google Play)
```bash
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

AAB is the required format for new apps on Google Play (as of August 2021). APK is for direct distribution (sideloading, Firebase App Distribution, internal testing).

### Clean Build
Run this when changing native dependencies or when builds act strangely:
```bash
cd android
./gradlew clean
cd ..
npx expo start --clear
```

### Run on Device/Emulator via React Native CLI
```bash
npx react-native run-android                    # default device
npx react-native run-android --variant=release  # release build
```

---

## 8. Keystore & APK Signing

**Never commit the keystore file or its passwords to git.** Add to `.gitignore`:
```
android/app/*.keystore
android/app/*.jks
*.keystore
*.jks
```

### Generate a Keystore
```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias medibook-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for passwords and certificate details. Store the resulting `.keystore` file and passwords somewhere secure (password manager, secrets vault). **If you lose this keystore, you can never update your app on Google Play.**

### Sign an APK Manually (if not using Gradle signing)
```bash
# Align the APK
zipalign -v 4 app-release-unsigned.apk app-release-aligned.apk

# Sign
apksigner sign \
  --ks release.keystore \
  --ks-key-alias medibook-key \
  --out app-release-signed.apk \
  app-release-aligned.apk

# Verify
apksigner verify app-release-signed.apk
```

`zipalign` and `apksigner` are in `$ANDROID_HOME/build-tools/34.0.0/`.

### Using Environment Variables for CI/CD
In `android/app/build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: "")
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
        keyAlias System.getenv("KEY_ALIAS") ?: ""
        keyPassword System.getenv("KEY_PASSWORD") ?: ""
    }
}
```

Or use `gradle.properties` (not committed):
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=medibook-key
MYAPP_RELEASE_STORE_PASSWORD=xxxxxxxx
MYAPP_RELEASE_KEY_PASSWORD=xxxxxxxx
```

Then reference in `build.gradle`:
```groovy
storeFile file(MYAPP_RELEASE_STORE_FILE)
storePassword MYAPP_RELEASE_STORE_PASSWORD
```

---

## 9. ProGuard / R8 Rules

When `minifyEnabled true` is set, R8 (Google's code shrinker) can strip code that React Native needs at runtime. Add rules to `android/app/proguard-rules.pro`:

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# OkHttp (networking)
-dontwarn okhttp3.**
-dontwarn okio.**

# Your app
-keep class com.yourcompany.medibook.** { *; }

# Expo modules
-keep class expo.modules.** { *; }

# Serializable / Parcelable
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
```

If a release build crashes but the debug build works, the problem is almost always a missing ProGuard rule. Enable mapping output for debugging:
```groovy
buildTypes {
    release {
        minifyEnabled true
        proguardFiles ...
        // Keep mapping file for crash report deobfuscation
    }
}
```

---

## 10. Common Build Errors & Fixes

### `SDK location not found`
**Cause:** `local.properties` is missing or has the wrong path.
**Fix:**
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### `Execution failed for task ':app:mergeDebugResources'` — Duplicate resource
**Cause:** Two libraries define the same resource name.
**Fix:** Add to `android/app/build.gradle`:
```groovy
android {
    // ...
    sourceSets {
        main {
            res.srcDirs = ['src/main/res']
        }
    }
}
```

### `INSTALL_FAILED_UPDATE_INCOMPATIBLE`
**Cause:** An app with the same package ID is installed with a different signature.
**Fix:**
```bash
adb uninstall com.yourcompany.medibook
adb install app-debug.apk
```

### `java.lang.OutOfMemoryError` during build
**Cause:** Gradle JVM heap too small.
**Fix:** Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### `Unsupported class file major version`
**Cause:** JDK version mismatch. AGP 8 requires JDK 17.
**Fix:**
```bash
java -version  # must be 17.x
# If wrong, set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### `Could not resolve com.android.tools.build:gradle`
**Cause:** Gradle can't reach Maven repositories (offline or corporate network).
**Fix:** Add to project-level `build.gradle`:
```groovy
repositories {
    google()
    mavenCentral()
    maven { url 'https://jitpack.io' }
}
```

### `Duplicate class kotlin.collections.jdk8`
**Cause:** Multiple Kotlin stdlib versions on classpath.
**Fix:** Add to `android/app/build.gradle`:
```groovy
configurations.all {
    resolutionStrategy {
        force "org.jetbrains.kotlin:kotlin-stdlib:1.9.22"
        force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.22"
    }
}
```

### App crashes on launch in release but not debug
**Cause:** Missing ProGuard rules stripping necessary classes.
**Fix:** Temporarily disable minification to confirm, then add the missing keep rule:
```groovy
buildTypes {
    release {
        minifyEnabled false  // test only — re-enable and add rules
    }
}
```

### Metro bundler not connecting on physical device
**Fix:**
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
```

---

## 11. Adaptive Icons (Android 8.0+)

Android adaptive icons consist of two layers: a foreground (the actual icon) and a background. The system clips them to the device's chosen shape (circle, squircle, rounded square).

Asset requirements:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` — legacy icon (API < 26)
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png` — round icon (API < 26)
- `android/app/src/main/res/drawable/ic_launcher_background.xml` — solid color or shape
- `android/app/src/main/res/drawable/ic_launcher_foreground.png` — actual icon (keep content in center 66% = safe zone)

Sizes for each density bucket:
| Density | mipmap folder | Size |
|---------|--------------|------|
| mdpi | mipmap-mdpi | 48×48 |
| hdpi | mipmap-hdpi | 72×72 |
| xhdpi | mipmap-xhdpi | 96×96 |
| xxhdpi | mipmap-xxhdpi | 144×144 |
| xxxhdpi | mipmap-xxxhdpi | 192×192 |

For Expo managed/bare workflow, define in `app.json` and run `npx expo prebuild` — it generates all density variants automatically from a single 1024×1024 source.

---

## 12. Google Play Preparation Checklist

Before submitting to Google Play:

- [ ] `applicationId` is globally unique (reverse-domain format)
- [ ] `versionCode` incremented from any previous upload
- [ ] `targetSdkVersion` is at the current Play requirement (API 34 as of Aug 2024)
- [ ] AAB built with `./gradlew bundleRelease` (not APK)
- [ ] AAB signed with upload keystore
- [ ] `android:allowBackup="false"` if the app handles sensitive data
- [ ] All `uses-permission` entries have corresponding runtime requests
- [ ] Cleartext traffic disabled (`android:usesCleartextTraffic="false"`) if API is HTTPS-only
- [ ] ProGuard/R8 enabled and mapping file saved
- [ ] App tested on at least one physical device in addition to emulator
- [ ] 64-bit ABIs included (default with modern AGP)
- [ ] Play Console: app created, first release track set (Internal Testing recommended)

---

## 13. `.gitignore` Entries for Android

Add these to the root `.gitignore`:
```gitignore
# Android
android/local.properties
android/.gradle
android/app/build
android/build
*.keystore
*.jks
android/app/google-services.json  # if using Firebase and treating as secret
```
