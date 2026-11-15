# FitTrack (Project 356)

Offline-first Android workout logger: three ready-made workouts, set tracking, history, a weekly count, a best-set summary,
kg/lb, and an optional daily reminder. Built with React Native, Expo Router, Expo SQLite and Expo Notifications.
No account, no server. Package: `com.fittrack.app`, version 1.0.0.

## Run it on your Samsung S23 (Expo Go)

1. Install **Node.js LTS** on your computer and **Expo Go** from the Play Store on your phone.
2. In this folder:
   ```
   npm install
   npx expo start
   ```
3. Phone and computer on the same Wi-Fi, scan the QR code with Expo Go. If it cannot connect, use `npx expo start --tunnel`.

This project uses **Expo SDK 58** (your document says 57). Expo Go normally supports only the newest SDK, so keep Expo Go updated.
Scheduled *local* reminders work in Expo Go; only remote push is unavailable there, and FitTrack does not use push.

## Requirements map (FR-01 to FR-12)

| ID | Where |
| --- | --- |
| FR-01 Exercise library | Add exercise screen: 45 starter exercises grouped by muscle group, plus custom exercises |
| FR-02 Templates | Workouts tab: Full Body A, Upper Body, Lower Body |
| FR-03 Start a workout | Starting a template creates a saved session with 3 starter sets per exercise |
| FR-04 Log a set | Edit reps and weight; weight is stored in kg and converted for display |
| FR-05 Complete a set | Check button on each set; only completed weighted sets count toward best set |
| FR-06 Add an exercise | Active workout > Add exercise (library or custom) |
| FR-07 Finish a session | Finish saves the end time; needs at least one completed set |
| FR-08 Workout history | History tab, grouped by date, tap for details |
| FR-09 Progress summary | Home: workouts this week and the heaviest completed set with its exercise name |
| FR-10 Weight unit | Settings: kg or lb |
| FR-11 Daily reminder | Settings: switch on, pick 7:00 AM / 9:00 AM / 6:00 PM / 8:00 PM, change time, or switch off |
| FR-12 Persistence | SQLite: exercises, sessions, sets, preferences |

## Project structure

```
src/app/                  Expo Router screens (file = route)
  (tabs)/index.js           Home
  (tabs)/workouts.js        Template list
  (tabs)/history.js         Saved sessions
  (tabs)/settings.js        Unit + reminder + data
  workout/[id].js           Active workout
  session/[id].js           Saved workout details
  picker.js                 Exercise picker (modal)
src/db/                   schema, migration, starter exercises
src/repo/                 all SQLite operations
src/services/             workout rules and progress calculations
src/notifications/        reminder scheduling (only place that touches expo-notifications)
src/data/templates.js     the three templates
```

Screens, SQLite operations and notification scheduling are separate modules, as the specification requires.

## Rules

- Best set: highest weight among completed sets above 0 in completed sessions. Ties go to more reps, then the most recent.
- Weekly count: completed sessions started Monday to Sunday of this week (device time).
- Volume (History and details): sum of weight x reps of completed sets. A simple logging metric, not workout quality.
- Reps must be a whole number above 0; weight cannot be negative (0 is allowed for bodyweight); custom exercise names cannot be blank.
- Reminder permission is requested only when the switch is turned on. If denied, the reminder stays off and Settings explains why.
- In line with the specification, sets per exercise are fixed at 3 and routine editing, set removal and reordering are left for later.

## Demo walkthrough

1. Settings > Load demo data (optional). Open Home.
2. Workouts > Start Full Body A.
3. Edit reps and weight, tap the check on several sets, then Add exercise > Create a custom exercise.
4. Finish. The saved workout opens, then find it in History.
5. Home: show the weekly count and best set. Settings: switch kg/lb, then turn on the reminder.

## Build the APK

### Option A: locally (as in the specification)
Needs JDK, Android SDK platform 36 and build tools, and NDK 27.1.12297006.
```
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```
The APK is at `android/app/build/outputs/apk/release/app-release.apk`. Copy it to the project folder as `FitTrack-Android.apk`.
The generated project signs release builds with the debug key, which is fine for sideloading and the class demo, not for the Play Store.

### Option B: Expo cloud build (no Android SDK needed)
```
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android
```
EAS uploads your project source. Download the APK from the link when it finishes, then open it on the phone
(allow "install unknown apps" for your browser or file manager).

## Verification checklist

| Scenario | Expected |
| --- | --- |
| Start a template and complete several sets | Template exercises open; completed sets stay done |
| Add a custom exercise during a workout | It is saved to the library and added with 3 sets |
| Finish a workout, close and reopen the app | It is in History with sets and duration |
| Switch kg to lb | Weights convert for display; stored kg is unchanged |
| Turn the reminder on and allow permission | One daily reminder is scheduled at the chosen time |
| Change the time or turn it off | The old schedule is replaced or cancelled |
| Deny the permission prompt | Reminder stays off with an explanation and a button to open Android settings |
