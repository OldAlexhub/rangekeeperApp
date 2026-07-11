# Google Play Data Safety Notes - RangeKeeper EV

Use this file when completing the Data Safety section in Google Play Console.

---

## Does your app collect or share any of the required user data types?

**Yes, through Google AdMob ads.** The developer does not receive the user's vehicle profiles, range check-ins, settings, reminders, or reports. Those app-specific records remain local to the device. Google AdMob may collect or process ad-related data such as device identifiers, advertising ID, IP address, approximate location inferred from IP address, diagnostics, and ad interaction data.

---

## Is all of the user data collected by your app encrypted in transit?

**Yes for ad-related data transmitted by Google AdMob.** Locally stored range tracking data is not transmitted to the developer.

---

## Do you provide a way for users to request that their data is deleted?

**Yes.** Users can delete all app data by using "Reset All Data" in the Settings screen, or by uninstalling the app.

---

## Data collected or shared

The developer does not collect app-specific range tracking data.

Google AdMob may collect or process:

- Device or other IDs, including advertising ID
- Approximate location inferred from IP address
- App interactions related to ads
- Diagnostics and performance data related to ad delivery

---

## Data stored on device (not shared with developer)

The following app data is stored locally on the user's device only and is not shared with the developer:

- Vehicle nickname, make, model, year, rated range, and optional notes
- Range check-in entries including battery percentage, displayed range, optional odometer, temperature, driving context, and notes
- App settings (unit preference, reminder settings)

---

## Account deletion

Not applicable. The app does not require or support user accounts.

---

## Permissions used

- POST_NOTIFICATIONS: Optional local daily reminders only
- VIBRATE: For notification vibration
- RECEIVE_BOOT_COMPLETED: To reschedule reminders after device restart
- SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM: To schedule reminders at user-selected time
- INTERNET: To request and display ads from Google AdMob

No location, contacts, camera, microphone, or account permissions are used.

---

## Summary answers for Google Play Data Safety form

- Data collected by developer: No app-specific range tracking data
- Data collected/processed by third-party SDK: Yes, Google AdMob ad-related data
- Data shared with third parties: Yes for ad serving/measurement via Google AdMob
- Data encrypted in transit: Yes for transmitted ad-related data
- Users can request data deletion: Yes (via Reset All Data or uninstall)
- Account deletion: Not applicable (no accounts)
