# Samaksh Farms Mobile App Guide

This app is wrapped with Capacitor. The React/Vite app remains the source of truth; Android loads the built `dist` files inside a native WebView.

## Required Tools

- Visual Studio Code for React code edits.
- Android Studio for Android builds, emulator, signing, and Play Store artifacts.
- JDK 21, already used by the backend project.
- A reachable backend API URL. A phone cannot call `http://localhost:8080` on your laptop.

## Separate Web And Mobile API URL Setup

Web development continues to use `.env.local`, so your browser flow can keep:

```text
VITE_API_URL=http://localhost:8080
```

Mobile builds use a separate generated file: `.env.mobile.local`.
This file is created by the mobile build scripts and is ignored by git.

For a physical Android phone on the same Wi-Fi as your laptop, set this before building:

```powershell
$env:MOBILE_API_URL="http://YOUR_LAPTOP_IP:8080"
```

Example:

```powershell
$env:MOBILE_API_URL="http://192.168.1.25:8080"
```

For Android emulator only:

```powershell
$env:MOBILE_API_URL="http://10.0.2.2:8080"
```

For production, use HTTPS:

```powershell
$env:MOBILE_API_URL="https://api.your-domain.com"
```

The mobile build will fail if you accidentally use `localhost`, because on a phone `localhost` means the phone itself.

## Build And Sync Android

```powershell
pnpm run cap:sync
```

This validates the mobile API URL, runs the React build in `mobile` mode, and copies `dist` into the Android app.

## Open In Android Studio

```powershell
pnpm run cap:open:android
```

Then in Android Studio:

1. Let Gradle sync finish.
2. Connect an Android phone with USB debugging enabled, or start an emulator.
3. Click Run.

## Create Debug APK

```powershell
pnpm run android:debug
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

This APK is for internal testing only.

## Install Debug APK On Phone

Option 1: Copy `app-debug.apk` to the phone and open it. Android will ask to allow install from unknown sources.

Option 2: Install using Android Debug Bridge:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Create Play Store Bundle

```powershell
pnpm run android:release
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Before Play Store upload, configure a release signing key in Android Studio.

## Mobile Validation Checklist

- Login with email/phone and password.
- Confirm protected URLs do not open without login.
- Confirm user name and entitlements show in the menu/top area.
- Dashboard loads balances, rankings, charts, and audit digest.
- Sales Delivery Entry:
  - dynamic shop search works
  - shop selection closes the menu
  - default boxes/prices populate
  - amount received updates balance preview
  - save delivery works
- Sales Ledger:
  - pending/partial/paid status appears correctly
  - partial payment edit works
  - mark paid works
  - entered by and updated by are visible
- Shop History:
  - pagination works
  - entered by and payment updated fields appear
- Shop Setup:
  - create/edit shop
  - products multi-select
  - soft delete confirmation for super admin
- User Directory:
  - approve/reject/delete/reset password confirmation
  - multi-role selector opens/closes correctly
- Audit page:
  - user/action/time/reference/remarks appear
- Excel download works on Android.

## Notes

- `android:usesCleartextTraffic="true"` is enabled for local HTTP testing.
- For production, use HTTPS for the backend API.
- iOS can be added later with `cap add ios`, but iOS builds require macOS and Xcode.
