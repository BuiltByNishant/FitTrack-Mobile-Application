# FitTrack

[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Storage](https://img.shields.io/badge/Storage-SQLite%20(on%20device)-003B57?logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)](https://www.android.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

FitTrack is an offline-first fitness tracker for Android, built with React Native and Expo. You can plan workouts, log every set, follow your body weight against a goal, and get an optional daily reminder. Everything you enter is stored in a database on your phone. There is no account, no server and no internet requirement.

Developed as Application Development Project 356.

<!--
Screenshots: add your own images to docs/screenshots/ and uncomment this block.

## Screenshots

| Home | Active workout | Weight log |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Active workout](docs/screenshots/workout.png) | ![Weight log](docs/screenshots/weight.png) |
-->

## Contents

- [Features](#features)
- [How the app works](#how-the-app-works)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Build an Android APK](#build-an-android-apk)
- [Using the app](#using-the-app)
- [Project structure](#project-structure)
- [Local data](#local-data)
- [Design and accessibility](#design-and-accessibility)
- [Privacy](#privacy)
- [Troubleshooting](#troubleshooting)
- [Not included](#not-included)
- [License](#license)

## Features

### Workouts

- **Exercise library:** 44 starter exercises across 8 muscle groups (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core) and 6 equipment types (Barbell, Dumbbell, Machine, Cable, Bodyweight, Other). Search the library, or add your own exercises by choosing a muscle group and equipment.
- **Built-in workouts:** three ready-made workouts, each starting with planned sets and reps.
  - *Full Body A:* Back Squat, Barbell Bench Press, Barbell Row, Overhead Press, Romanian Deadlift
  - *Upper Body:* Barbell Bench Press, Barbell Row, Overhead Press, Lat Pulldown, Dumbbell Curl, Triceps Pushdown
  - *Lower Body:* Back Squat, Romanian Deadlift, Leg Press, Leg Curl, Hip Thrust, Standing Calf Raise
- **Custom workouts:** build your own routine with a name, exercises from the library, and a separate number of sets and target reps for each exercise. Reorder or remove exercises, edit a saved routine, duplicate it, or delete it.
- **Set logging:** a live timer, editable reps and weight for every set, and a check button to mark each set done. New sets start from the weight you last completed for that exercise. You can add more exercises while you train.
- **Resume a workout:** a workout is saved as you type, so you can leave the screen or close the app and resume it from Home.
- **History:** finished workouts are listed by date with duration, sets done and volume. Open one to see every exercise and set.

### Body progress

- **Profile:** an optional display name, height, current weight and target weight.
- **Weight log:** add dated check-ins (today, yesterday or any earlier date) with an optional note, then edit or delete them. A trend chart shows your latest check-ins, and the newest one is your current weight.
- **Goal progress:** the difference between your current weight and your target, with a progress bar. It works for losing or gaining weight.
- **Weekly workout goal:** choose 1 to 7 workouts per week and see completed sessions against it.

### Everyday use

- **Home dashboard:** a time-of-day greeting, current weight, goal progress, workouts this week, your best set, reminder status, recent sessions and a quick Start workout button.
- **Units:** weight in kilograms or pounds, and height in centimetres or feet and inches.
- **Daily reminder:** an optional repeating notification at 7:00 AM, 9:00 AM, 6:00 PM or 8:00 PM. Turn it on, change the time, or turn it off.
- **Demo data and data controls:** load example data for a walkthrough, or clear your profile, weight history, workout history, or everything, from Settings.

## How the app works

### Input rules

| Input | Rule |
| --- | --- |
| Set reps | Whole number from 1 to 1000 |
| Set weight | Number from 0 up (0 is allowed for bodyweight sets) |
| Body weight | Positive number, up to 700 kg |
| Height | Positive number from 50 to 300 cm, or the equivalent in feet and inches |
| Workout name, exercise name | Not blank; spaces are trimmed; up to 60 characters |
| Custom exercise name | Must not match an existing exercise (not case-sensitive) |
| Planned sets in a custom workout | Whole number from 1 to 20 |
| Target reps in a custom workout | Whole number from 1 to 1000 |
| Custom workout | Needs a name and at least one exercise; the same exercise cannot be added twice |
| Weekly workout goal | Whole number from 1 to 7 |
| Display name | Optional, up to 40 characters |

Invalid input shows a message next to the field and is never saved.

### Calculations and rules

- **Units:** weight is always stored in kilograms and height in centimetres. The unit setting only changes how values are shown, so switching units never changes saved data.
- **Conversions:** `lb = kg ÷ 0.45359237`. For feet and inches the total inches are rounded first, then split: `totalIn = round(cm ÷ 2.54)`, `ft = floor(totalIn ÷ 12)`, `in = totalIn − 12 × ft`.
- **Current weight:** the newest weight check-in. If you delete it, the one before it becomes current.
- **Goal progress:** measured from your first check-in toward the target. When your weight reaches or passes the target, the goal shows as reached.
- **Weekly count:** completed workouts started in the current calendar week, Monday to Sunday, in the phone's local time.
- **Best set:** the heaviest weight among completed sets above 0 in finished workouts. Ties go to more reps, then to the most recent.
- **Volume:** `weight × reps` summed over completed sets. It is a simple logging figure, not a measure of workout quality.
- **Finishing a workout:** at least one set must be marked done. Sets you did not mark done are kept in history as "Not done".
- **History stays stable:** starting a built-in or custom workout copies its plan into a new session. Editing or deleting a custom workout later never changes workouts you already did.
- **Reminder permission:** Android notification permission is requested only when you turn the reminder on. If you decline, the reminder stays off and Settings explains how to allow it.

## Technology

| Area | Technology |
| --- | --- |
| Framework | React Native 0.88, React 19.3 |
| Tooling | Expo SDK 58 |
| Navigation | Expo Router (file-based routes with a tab bar and modal screens) |
| Storage | Expo SQLite, with write-ahead logging and foreign keys enabled |
| Notifications | Expo Notifications (local, scheduled reminders; no push service) |
| Date selection | `@react-native-community/datetimepicker` (native Android date dialog) |
| Keyboard handling | `react-native-keyboard-controller` (keeps inputs visible above the keyboard) |
| Layout and icons | `react-native-safe-area-context`, `react-native-screens`, `@expo/vector-icons` |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) **22.13 or newer** (or 24.3 or newer), as required by Expo SDK 58 and React Native 0.88
- npm (included with Node.js)
- An Android phone with the **Expo Go** app from the Google Play Store, or an Android emulator
- For a phone: the computer and the phone on the same Wi-Fi network

### Run in development

From the project folder:

```bash
npm install
npx expo start
```

Then either:

- scan the QR code in the terminal with Expo Go on your phone, or
- press `a` in the terminal to open an Android emulator that is already running.

If the phone cannot connect directly (for example on a school or hotel network), use a tunnel:

```bash
npx expo start --tunnel
```

Expo Go must support the same Expo SDK as the project (SDK 58), so keep Expo Go updated from the Play Store. Expo Go is for development and previews. To install FitTrack as a normal app, build an APK as described next.

## Build an Android APK

The generated release build is signed with the project's debug signing configuration. That is fine for installing on your own device and for a class demonstration, but it must be signed with a private release key before it is published on the Play Store.

### Option A: build locally

You need Android Studio, a supported JDK (the one bundled with Android Studio works) and these packages, installed from **Android Studio > Tools > SDK Manager**:

- Android SDK Platform 37 (compile SDK 37)
- Android SDK Build-Tools 37.0.0
- Android NDK 27.1.12297006

Generate the native project:

```bash
npm install
npx expo prebuild --platform android
cd android
```

Tell Gradle where the Android SDK is, then build. The example uses the usual macOS location; use the path shown in SDK Manager if yours differs (on Linux it is commonly `$HOME/Android/Sdk`).

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > local.properties
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The APK is created at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

The command builds for 64-bit ARM phones, which covers current Android phones. To include every architecture React Native supports, leave out `-PreactNativeArchitectures=arm64-v8a`.

### Option B: build with Expo Application Services (EAS)

A cloud build needs no local Android SDK, but it requires a free Expo account and an internet connection.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android
```

The `preview` profile in `eas.json` produces an installable APK (not an app bundle). When the build finishes, download the APK from the link shown in the terminal or on the EAS build page.

### Install the APK

Copy the APK to the phone and open it. Android may ask you to allow installing apps from the browser or file manager you used. After installing, allow notifications when you turn on the daily reminder.

## Using the app

| Tab | What you do there |
| --- | --- |
| **Home** | See your week at a glance, resume a workout in progress, start a workout, and open your Profile |
| **Workouts** | Start a built-in workout, or create, start, edit, duplicate and delete your own |
| **History** | Review finished workouts and open any one for its full set list |
| **Weight** | Add, edit and delete dated weight check-ins, and see your trend and goal progress |
| **Settings** | Choose units, set the weekly workout goal, manage the daily reminder, and control your data |

A typical session:

1. **Set up your profile.** On Home, open **Profile** and enter a name, height, current weight and an optional target weight.
2. **Choose your goals.** In **Settings**, set the weekly workout goal and, if you like, turn on the daily reminder and pick a time.
3. **Pick a workout.** In **Workouts**, start a built-in workout, or choose **Create workout** to build your own: name it, add exercises, set sets and target reps for each, reorder them and save.
4. **Log your sets.** Adjust reps and weight, tap the check button on each set you complete, and use **Add exercise** for anything extra. Tap **Finish** when you are done.
5. **Review.** Open **History** for finished workouts and the **Weight** tab for your trend and goal progress.

For a quick demonstration, open **Settings > Load demo data**. It adds about four weeks of example workouts, weight check-ins, a sample "Push Day" custom workout, and an example name, height and target if your profile is still empty. Your own data is never overwritten.

## Project structure

```text
FitTrack/
├── assets/                App icon, adaptive Android icons and splash image
├── src/
│   ├── app/               Screens, one file per route (Expo Router)
│   │   ├── (tabs)/          Home, Workouts, History, Weight, Settings
│   │   ├── workout/[id]     Active workout
│   │   ├── session/[id]     Saved workout details
│   │   ├── routine/[id]     Custom workout details
│   │   ├── builder.js       Custom workout builder
│   │   ├── picker.js        Exercise picker (library, search, custom exercises)
│   │   ├── profile.js       Profile
│   │   └── weight-entry.js  Add, edit or delete a weight check-in
│   ├── components/        Shared interface pieces (buttons, set row, trend chart, ...)
│   ├── context/           Display units shared across the app
│   ├── data/              Built-in workout definitions
│   ├── db/                Database setup, migrations and starter exercises
│   ├── notifications/     Reminder permission and scheduling
│   ├── repo/              All database reads and writes
│   ├── services/          Workout, routine and progress rules (plain functions)
│   ├── state/             Hands exercises picked in the picker back to the builder
│   ├── utils/             Date, unit-conversion and validation helpers
│   └── theme.js           Colors, spacing and touch-target size
├── app.json               Expo configuration, plugins and app identifier
├── eas.json               EAS build profile (APK)
└── package.json           Dependencies and scripts
```

The code is split into layers. Screens show data and handle taps. `services` hold the rules and calculations. `repo` is the only place that talks to SQLite, and `notifications` is the only place that schedules reminders. This keeps each part easy to test and change on its own.

## Local data

All data lives in one SQLite database on the phone. Database upgrades run automatically at startup, inside transactions, and existing data is kept.

| Table | Purpose |
| --- | --- |
| `exercises` | Starter and custom exercises with muscle group and equipment |
| `workout_sessions` | Each started workout: title, start time and end time |
| `set_entries` | Every set: exercise, set number, reps, weight in kg and done state |
| `custom_workouts` | Saved custom workouts (name and timestamps) |
| `custom_workout_items` | The ordered exercises of a custom workout with target sets and reps |
| `user_profile` | One row: name, height in cm, target weight in kg, units and weekly goal |
| `weight_entries` | Dated weight check-ins in kg, with an optional note |
| `app_preferences` | Reminder settings and the scheduled notification ID |

Deleting a custom workout removes only its own rows. It never deletes library exercises or past workout sessions.

## Design and accessibility

Colors, spacing and touch-target size are defined once in `src/theme.js`:

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#0F766E` | Main actions and brand color |
| `primaryDark` | `#115E59` | Text on the light teal background |
| `primaryLight` | `#CCFBF1` | Badges and highlights |
| `bg` / `card` | `#F3F5F7` / `#FFFFFF` | App background and cards |
| `text` / `muted` | `#111827` / `#4B5563` | Main and secondary text |
| `border` | `#CBD5E1` | Dividers and input borders |
| `danger` / `dangerLight` | `#B91C1C` / `#FEE2E2` | Destructive actions and errors |
| `success` | `#047857` | Completed sets and confirmations |

- **Touch targets:** every control is at least 48 × 48 dp.
- **Contrast:** text colors were checked against their backgrounds at 4.5:1 or better.
- **Not color alone:** completed sets, selected options, errors and progress values are also shown with an icon or text.
- **Screen readers:** controls have roles, labels and states, and progress bars report their value.

## Privacy

- All records stay on the device. FitTrack has no account, cloud backup or sync, and its own code makes no network requests.
- Reminders are scheduled locally on the phone. No push service is used.
- Clearing the app's storage or uninstalling the app permanently removes its data unless you backed it up separately.
- In **Settings** you can clear your profile, your weight history, your workout history, or erase everything.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `npm install` or `npx expo start` fails right away | Check `node -v`. Expo SDK 58 needs Node 22.13 or newer (or 24.3+). |
| Expo Go says the project is incompatible | Update Expo Go from the Play Store. The project uses Expo SDK 58. |
| Expo Go cannot connect after scanning the QR code | Use `npx expo start --tunnel`, and check that the phone and computer are on the same network. |
| The daily reminder does not appear | Allow notifications for the app in Android settings and make sure battery saving is not restricting it. Turning the reminder off and on again reschedules it. |
| Reminder permission was declined | In Settings, use **Open Android settings**, allow notifications, then turn the reminder on again. |
| Gradle cannot find the Android SDK | Check that `android/local.properties` contains `sdk.dir` pointing to your SDK folder. |
| The phone refuses to install the APK | Allow "install unknown apps" for the app you opened the APK from. |

## Not included

FitTrack is deliberately a focused, offline app. These are outside its scope: cloud sync or accounts, sharing workouts, supersets and rest timers, nutrition tracking, wearable integration, progress photos, automatic training plans, and adding or deleting individual sets during a workout.

## License

Released under the MIT License. See [LICENSE](LICENSE).
