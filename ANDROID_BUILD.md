# 🤖 MilkMaatu Android App Build & Signing Instructions

This document provides complete instructions for compiling, signing, versioning, and building release packages for the **MilkMaatu** native Android application using Capacitor.

---

## 📋 Prerequisites

Before compiling the Android app, ensure your development machine has the following tools installed:

1. **Node.js (v18+)** and **npm**
2. **Android Studio** (which includes the Android SDK, Build Tools, and Platform tools)
3. **Java Development Kit (JDK 17 or 21)**
   > 💡 **macOS tip:** Android Studio bundles JDK 21 internally. You can utilize the embedded JDK by prepending the Gradle commands with the `JAVA_HOME` environment variable:
   > ```bash
   > export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
   > ```

---

## 🛠️ Project Configurations

The native Android app integration uses the following configuration files:

- **Capacitor Core Config:** [capacitor.config.json](file:///Users/susheel/milkfront1/frontend/capacitor.config.json) — Defines the app ID (`com.milkmaatu.app`), app name (`MilkMaatu`), assets directory (`dist`), and external web navigation rules.
- **Gradle Config:** [build.gradle](file:///Users/susheel/milkfront1/frontend/android/app/build.gradle) — Defines SDK compile versions, version codes, dependencies, and automatic release signing configurations.
- **Android Manifest:** [AndroidManifest.xml](file:///Users/susheel/milkfront1/frontend/android/app/src/main/AndroidManifest.xml) — Controls permissions (Camera, Storage), hardware rendering, and phone dialer intent filters (`tel:` protocol support).
- **Keystore Signing File:** [milkmaatu-release.keystore](file:///Users/susheel/milkfront1/frontend/android/app/milkmaatu-release.keystore) — The cryptographic key used to sign the production builds.

---

## 🚀 Step-by-Step Build Workflow

Whenever you make updates to the React codebase inside `frontend/src/` and want to build the Android application:

### Step 1: Compile the Web Frontend
Compile the production-ready React web assets inside the `frontend` folder:
```bash
cd frontend
npm run build
```
This updates the [dist](file:///Users/susheel/milkfront1/frontend/dist) directory with optimized production chunks.

### Step 2: Sync Code to Android
Sync the compiled web files and native Capacitor plugins to the native Android folder:
```bash
npx cap sync
```

### Step 3: Run the Build inside Android (via Terminal)
Navigate to the native Android directory and invoke the Gradle Wrapper to build and sign the application.

* Make sure your `JAVA_HOME` matches your JDK location (example below uses Android Studio's bundled JDK on macOS):
```bash
cd android

# Set JDK environment variable for macOS
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# 📦 Option A: Compile a signed Release APK (for sideloading / testing)
./gradlew assembleRelease

# 📦 Option B: Compile a signed Release AAB (for Google Play Store upload)
./gradlew bundleRelease
```

---

## 📦 Build Output Locations

Once the compilation commands complete successfully, the signed packages can be found in the following output paths:

| Package Type | Purpose | File Path |
|--------------|---------|-----------|
| **Release APK** | Manual installation, testing on physical devices, or local QA | [app-release.apk](file:///Users/susheel/milkfront1/frontend/android/app/build/outputs/apk/release/app-release.apk) |
| **Release AAB** | Official Google Play Store upload (Android App Bundle format) | [app-release.aab](file:///Users/susheel/milkfront1/frontend/android/app/build/outputs/bundle/release/app-release.aab) |

---

## 🔑 Key Signing Configuration

The release build uses a keystore stored in the Android module to sign the compiled code automatically.

### Keystore Settings:
- **Location:** [milkmaatu-release.keystore](file:///Users/susheel/milkfront1/frontend/android/app/milkmaatu-release.keystore)
- **Key Alias:** `milkmaatu`
- **Store Password:** `milkmaatu`
- **Key Password:** `milkmaatu`

This configuration is linked directly in [build.gradle](file:///Users/susheel/milkfront1/frontend/android/app/build.gradle) under:
```groovy
signingConfigs {
    release {
        storeFile file("milkmaatu-release.keystore")
        storePassword "milkmaatu"
        keyAlias "milkmaatu"
        keyPassword "milkmaatu"
    }
}
```

> ⚠️ **Important Security Note:** For testing purposes in this environment, credentials are hardcoded inside `build.gradle`. Before uploading to a public repository or a production-critical environment, extract these credentials into a secure `key.properties` file or system environment variables.

---

## 📈 Managing App Version Updates

When submitting updates to the Google Play Store, you must increment the version values.

1. Open [build.gradle](file:///Users/susheel/milkfront1/frontend/android/app/build.gradle).
2. Find the `defaultConfig` block:
   ```groovy
   defaultConfig {
       applicationId "com.milkmaatu.app"
       minSdkVersion rootProject.ext.minSdkVersion
       targetSdkVersion rootProject.ext.targetSdkVersion
       versionCode 1       // 👈 Increment this by +1 for every store upload
       versionName "1.0"   // 👈 Update this to represent user-facing version (e.g. "1.1")
       ...
   }
   ```
3. Save the file and run `npx cap sync` followed by `./gradlew bundleRelease` to generate the new bundle.
