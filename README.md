# RangeKeeper EV

Track your EV range. Understand the trend.

RangeKeeper EV is a private, offline EV range journal that helps EV owners track displayed range over time, estimate range changes, and forecast possible future range trends based on manually entered data.

---

## Features

- Create one or more EV profiles with manufacturer rated range
- Log daily battery percentage and displayed range readings
- Estimate 100% range equivalent from any partial charge
- Compare estimates to manufacturer rated range
- Track estimated range change over time
- View simple local trend forecasts
- Export data as CSV, JSON, or text summary report
- Optional daily local reminders
- Offline-first with no login, no backend, and no ads

---

## Offline-first

All data is manually entered and stored locally on the device using AsyncStorage. No internet connection is required. No data is transmitted anywhere.

---

## No login required

The app is personal and device-local. It does not require an account, email, phone number, or any form of authentication.

---

## No backend

All calculations, forecasting, storage, exports, and reminders run entirely on the device. There is no server, no cloud database, and no remote API.

---

## Local storage

Data is stored using React Native AsyncStorage. It includes:

- Vehicle profiles
- Range check-in entries
- App settings
- Reminder preferences

---

## Daily reminders

The app can send an optional local daily notification to remind you to log your range. You choose the time. The notification uses your active vehicle name. Notification permission is requested only when you enable reminders. You can disable reminders at any time from Settings.

---

## Forecasting

The forecast screen uses simple linear regression over your logged entries to estimate possible future range trends. The forecast uses estimated full range values over time. At least 3 entries are required. Confidence labels (Low, Medium, Higher) reflect the number of entries. Forecasts are estimates only and do not guarantee future range.

---

## Disclaimer

RangeKeeper EV is not a battery diagnostic tool and does not measure actual battery capacity. Estimates are based on manually entered data. Actual EV range may vary due to temperature, driving style, terrain, tire condition, charging habits, vehicle software, and manufacturer range calculation methods. This app is for informational use only.

---

## How to run the app (development)

### Prerequisites

- Node.js 22 or later
- Android Studio with Android SDK
- Java (bundled with Android Studio)
- React Native CLI

### Install dependencies

```
cd rangekeeper
npm install
```

### Start Metro bundler

```
npm start
```

### Run on Android

```
npm run android
```

---

## How to build debug APK

```
cd rangekeeper/android
./gradlew assembleDebug
```

Output: `rangekeeper/android/app/build/outputs/apk/debug/app-debug.apk`

---

## How to build release

Use `release.py` from the parent directory. See release.py section below.

Manual release build:

```
cd rangekeeper/android
./gradlew bundleRelease
./gradlew assembleRelease
```

Output APK: `android/app/build/outputs/apk/release/app-release.apk`
Output AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## How to use release.py

`release.py` is located in the parent directory outside the rangekeeper app folder.

### Check environment

```
python release.py --check-env
```

Checks Java, adb, keytool, and project structure.

### Generate signing key only

```
python release.py --generate-key-only
```

Creates the release keystore and signing properties without building.

### Full release build

```
python release.py
```

Builds the release APK and AAB, captures screenshots if an emulator is running, and copies all assets to the releases folder.

### Skip screenshot capture

```
python release.py --skip-screenshots
```

### Screenshots only (no build)

```
python release.py --screenshots-only
```

### Skip the Gradle build

```
python release.py --skip-build
```

### Clean before build

```
python release.py --clean
```

---

## How to check environment

```
python release.py --check-env
```

This checks:
- Java installation
- Android SDK location
- adb availability
- keytool availability
- Gradle wrapper presence
- assets/logo.png presence

---

## How to generate signing key only

```
python release.py --generate-key-only
```

This generates:
- `rangekeeper/android/keystore/rangekeeper-release.keystore`
- `rangekeeper/android/keystore/keystore.properties`

---

## Keystore backup warning

The release keystore is required to update the app on Google Play. If you lose it, you cannot publish updates under the same listing. Back up these files immediately after generation:

- `rangekeeper/android/keystore/rangekeeper-release.keystore`
- `rangekeeper/android/keystore/keystore.properties`

Store them in a secure location separate from the project repository. Never commit them to version control.

---

## How to capture screenshots

Screenshots are captured interactively during `release.py`. You are prompted to navigate to each screen, then press Enter to capture.

You can also run screenshot capture separately:

```
python release.py --screenshots-only
```

Requires a connected Android device or running emulator with adb available and the app already running.

---

## Google Play upload notes

1. Run `python release.py` to generate the signed AAB file.
2. The AAB is located at `releases/builds/RangeKeeperEV-release.aab`.
3. Upload the AAB to Google Play Console under Production or Internal Testing track.
4. Fill in the store listing using the files in `releases/store-assets/`.
5. Review data safety using `releases/store-assets/data-safety-notes.md`.
6. Set app category to Auto and Vehicles or Tools.
7. Upload screenshots from `releases/screenshots/`.
8. Set the app as paid in the Google Play pricing section.
9. Complete the content rating questionnaire.

---

## Troubleshooting

### App crashes on launch

- Check that all npm packages are installed: `npm install`
- Confirm Java is detected: `python release.py --check-env`

### Gradle build fails

- Make sure Android Studio is installed with SDK
- Confirm JAVA_HOME is set or Android Studio JBR is detected automatically by release.py
- Run `cd rangekeeper/android && gradlew.bat clean` on Windows or `./gradlew clean` on Mac or Linux

### Keystore errors

- Run `python release.py --generate-key-only` to create the keystore
- Confirm `android/keystore/keystore.properties` exists and has correct values

### adb not found

- Add Android SDK platform-tools to your PATH
- Default path on Windows: `C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools`

### Notifications not working

- Enable notification permission in device Settings for RangeKeeper EV
- Enable reminders in the app Settings screen

### Screenshots not captured

- Ensure adb is available and a device or emulator is connected
- Run `adb devices` to confirm a device is listed

---

## Store asset preparation notes

All store assets are in the `store_assets/` folder inside the project and copied to `releases/store-assets/` by release.py.

Files included:
- store-listing.md
- short-description.txt
- full-description.txt
- promo-text.txt
- release-notes.txt
- screenshot-captions.txt
- data-safety-notes.md
- privacy-summary.txt
- feature-graphic-notes.md

Screenshot files are saved to `releases/screenshots/` by release.py.

App icon and branding are copied to `releases/branding/`.

---

## Package details

- App name: RangeKeeper EV
- Package: com.oldalexhub.rangekeeper
- Developer: Old Alex Hub
- Platform: Android
- Framework: Bare React Native
- Storage: AsyncStorage (local only)
- Backend: None
- Internet: Not required
