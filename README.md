# FitTrack

Offline-first Android fitness tracker: three ready-made workouts, **your own saved workouts (new in 1.2)**, set tracking and history,
a personal profile, dated weight check-ins, goal progress, a weekly workout goal and a personal dashboard.
kg/lb, cm/ft-in and an optional daily reminder.
Built with React Native, Expo Router, Expo SQLite and Expo Notifications. No account, no server.
Package: `com.fittrack.app`, version 1.2.0.

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

## What is new in 1.2: Custom Workout Builder

| Requirement | Where / how |
| --- | --- |
| CWB-01 Create a routine | Workouts tab > Create workout. Needs a name (spaces trimmed) and at least one exercise |
| CWB-02 Choose exercises | Add exercises opens the library picker (multi-select, search, custom exercises) |
| CWB-03 Set targets | Each exercise has its own Sets and Target reps (positive whole numbers; sets up to 20) |
| CWB-04 Arrange the plan | Move up / down and remove, before saving |
| CWB-05 Edit a routine | Details > Edit changes name, exercises, order and targets |
| CWB-06 Start a routine | Start creates a normal session in the saved order with the planned sets and reps |
| CWB-07 Keep history stable | Starting copies the plan into session and set rows, so editing or deleting a routine never changes past sessions |
| CWB-08 Persist offline | Saved in SQLite (`custom_workouts`, `custom_workout_items`), kept after closing the app |

Also included: Duplicate and Delete (with a warning that history is kept), a "Discard changes?" prompt when cancelling an edited form, and a duplicate-exercise guard.
The three built-in workouts remain in the Workouts tab under "Built-in workouts".
Upgrading from 1.1 keeps all existing data (database migration 2 to 3 only adds the two routine tables).

## What was added in 1.1 (Enhancement Proposal)

| Proposal item | Where |
| --- | --- |
| Personal profile | My Profile (open from Home): display name, height, current weight, optional target weight, units |
| Weight check-ins | Weight tab: add for today or another date, edit, delete; the newest entry is the current weight |
| Goal progress | Weight tab and Home: current weight, target, remaining difference, progress bar |
| Weekly workout goal | Settings: 1 to 7 workouts per week; Home shows "2 of 3" with a progress bar |
| Personal dashboard | Home: greeting, current weight, goal progress, workouts this week, reminder status |
| Units | Settings or My Profile: kg/lb and cm/ft-in. Saved values stay in kg and cm; units change only the display |
| Clear local data | Settings: clear profile, clear weight history, delete workout history, or erase everything |
| Reminder | Unchanged: optional, permission asked only when switched on |

Validation: height and weight must be positive numbers (blank is allowed for optional fields), with friendly messages.
Upgrading from 1.0 keeps your workouts, unit choice and reminder.

## Requirements map (workout core, FR-01 to FR-12)

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
src/app/builder.js        Workout builder (create / edit)
src/app/routine/[id].js   Saved workout details: Start, Edit, Duplicate, Delete
src/repo/customWorkouts.js  saved routines (plan only)
src/services/routineService.js  builder validation and ordering rules
src/state/pickerResult.js   hands chosen exercises from the picker back to the builder
src/app/profile.js        My Profile
src/app/(tabs)/weight.js  Weight log, goal progress and trend
src/app/weight-entry.js   Add / edit / delete one check-in (modal)
src/repo/profile.js       profile row (units, height, target, weekly goal)
src/repo/weight.js        weight check-ins
src/services/progressService.js   goal progress, weekly goal, greeting
```

Screens, SQLite operations and notification scheduling are separate modules, as the specification requires.

## Rules

- Best set: highest weight among completed sets above 0 in completed sessions. Ties go to more reps, then the most recent.
- Weekly count: completed sessions started Monday to Sunday of this week (device time).
- Volume (History and details): sum of weight x reps of completed sets. A simple logging metric, not workout quality.
- Reps must be a whole number above 0; weight cannot be negative (0 is allowed for bodyweight); custom exercise names cannot be blank.
- Reminder permission is requested only when the switch is turned on. If denied, the reminder stays off and Settings explains why.
- Current weight = the newest check-in. Goal progress runs from your first check-in to the target (works for losing or gaining).
- Check-ins are stored as a calendar date (noon, local time); two on the same day are ordered by when they were added.
- Data model (SQLite): `custom_workouts`, `custom_workout_items`, `user_profile` (one row), `weight_entries`, plus `exercises`, `workout_sessions`, `set_entries`, `app_preferences`.
- In line with the specification, sets per exercise are fixed at 3 and routine editing, set removal and reordering are left for later.

## Demo walkthrough (custom workouts)

1. Workouts > Create workout. Name it "Push Day", add three exercises, give each different sets and reps, then Save.
2. Close Expo Go completely and reopen it: "Push Day" is still listed under My workouts.
3. Open it, Edit: move one exercise, remove another, Save.
4. Start workout: it opens with the saved order and the planned sets. Mark sets done and Finish.
5. Edit the routine again (or delete it), then open History: the finished session still shows its original exercises and sets.

## Demo walkthrough (profile and progress)

1. Home > Profile: enter a name, height, current weight and target weight, then Save.
2. Switch the units (kg/lb, cm/ft-in) and show the values convert.
3. Weight tab > Add a check-in (use Yesterday or Pick date). Show the new current weight, the trend and the target progress.
4. Workouts > Start Full Body A. Edit reps and weight, mark sets done, add a custom exercise, then Finish.
5. Home: show weekly goal progress ("1 of 3"), best set and reminder status. History: open the saved workout.
6. Settings: change the weekly target, turn on the reminder, change its time.
(Settings > Load demo data fills in a few weeks of example data if you want a quick start.)

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
| Create "Push Day" with 3 exercises and different targets | Saved; listed in My workouts after restarting the app |
| Enter 0, a negative or text as sets or reps | Message under that field; nothing is saved |
| Save with no name or no exercises | Messages explain what is missing |
| Start a saved workout | Exercise order and set counts match the plan |
| Edit or delete a routine after using it | Past sessions in History are unchanged |
| Switch kg to lb, or cm to ft-in | Values convert for display; stored kg and cm are unchanged |
| Save profile, close and reopen the app | Name, height, target and check-ins are still there |
| Enter 0, a negative number or text as weight or height | Clear message; nothing is saved |
| Add, edit and delete check-ins | Newest entry becomes current weight; Home and Weight tab update |
| Finish workouts and change the weekly target | Home shows completed sessions against the target |
| Clear profile / clear weight history | Data removed after confirmation; workouts kept |
| Turn the reminder on and allow permission | One daily reminder is scheduled at the chosen time |
| Change the time or turn it off | The old schedule is replaced or cancelled |
| Deny the permission prompt | Reminder stays off with an explanation and a button to open Android settings |
