# Google Play Data Safety Notes - RangeKeeper EV

Use this file when completing the Data Safety section in Google Play Console.

---

## Does your app collect or share any of the required user data types?

**No.** The developer does not collect or share any user data. All data entered by the user is stored locally on the user's device only.

---

## Is all of the user data collected by your app encrypted in transit?

**Not applicable.** The app does not transmit any data. All data stays on the device.

---

## Do you provide a way for users to request that their data is deleted?

**Yes.** Users can delete all app data by using "Reset All Data" in the Settings screen, or by uninstalling the app.

---

## Data collected or shared

None. The developer does not collect any data from users.

---

## Data stored on device (not shared with developer)

The following data is stored locally on the user's device only and is not shared with the developer or any third party:

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

No location, contacts, camera, microphone, or account permissions are used.

---

## Summary answers for Google Play Data Safety form

- Data collected by developer: No
- Data shared with third parties: No
- Data encrypted in transit: Not applicable
- Users can request data deletion: Yes (via Reset All Data or uninstall)
- Account deletion: Not applicable (no accounts)
