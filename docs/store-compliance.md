# MySawari customer app: store compliance notes

Evidence-based; "verified" means checked in code or by running something. Dated 2026-10-30.

## Data inventory (from the models and the app code)

| Data | Where it lives | Notes |
|---|---|---|
| Name, mobile, email, date of birth, gender | MongoDB (`customers`) | Entered by the customer |
| Aadhaar number, driving-licence number | `customers.documents`, `bookings` | Typed in as text. The app uploads no document images (only review photos) |
| Referral code, signup IP, wallet / SawariCash / rewards, withdrawal payout details (UPI / bank) | `customers`, `sawaricash_transactions`, `refunds` | |
| Bookings: dates, pickup and drop addresses and coordinates, destination | `bookings` | |
| Reviews: rating, text, photos | `reviews`; photos on Cloudinary | |
| Notifications, push tokens (Expo token, guest session id) | `notifications`, `customer_devices` | |
| Activity (screens, searches, session id) | `customer_activities` | Analytics, written by the backend |
| Install id, device info, IP, security events | `security_events`, request headers | Fraud / abuse prevention |
| Abandoned-booking enquiries | `customer_app_leads` | Used for WhatsApp reminders |
| Device location (foreground only) | Not stored; sent from the device to Google Places / Geocoding | No background location (verified: no background task or permission) |

Processed by third parties: Razorpay (payment screen in a WebView; card/UPI details never reach MySawari), Google Maps Platform (place search, geocoding; the key ships in the app bundle and must be restricted in Google Cloud), Firebase Cloud Messaging / Expo push, WATI (WhatsApp login codes and booking messages), Cloudinary (review photos), Render (hosting), MongoDB Atlas (database), Expo Updates / EAS (OTA).

## Account deletion (implemented)
- In app: Profile > Settings > Delete MySawari account, with a WhatsApp code to the account's own number. Blocked while a booking is upcoming or ongoing, or a refund or withdrawal is in progress.
- Web: `GET /delete-account` on the backend (verified locally). `https://mysawari.in/delete-account` returned **404** when checked, so it is not live until you publish or redirect that page.
- Support route for web or email requests: `POST /api/customers/admin/delete-account` (admin key).
- Erased: profile and documents, sessions, devices, reviews and review photos (Cloudinary), activity, notifications, holds, leads, referral identity.
- Kept (identity details stripped): bookings, refunds, memberships, wallet entries, payment records. Retention period: **not set, owner decision**.
- Not covered by code, needs a manual step: WATI contact and conversation history, Razorpay's own records, the Operation app's `handovers` collection, and database backups.

## Google Play
- Target API: React Native template targets 36, which meets the requirement in force since 2026-08-31 (verified in `node_modules`, not from a built AAB).
- Permissions in the generated manifest (verified with `expo prebuild`): INTERNET, VIBRATE, CAMERA, ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION. READ/WRITE_EXTERNAL_STORAGE, RECORD_AUDIO and SYSTEM_ALERT_WINDOW are removed. `allowBackup=false`.
- To enter in Play Console: privacy policy URL; account deletion URL (once live); Data safety form from the inventory above (data in transit is encrypted: HTTPS enforced in production builds); App access credentials for reviewers (see below).

## Apple
- Account deletion in app: done (Guideline 5.1.1(v)).
- Info.plist (verified with `expo prebuild`): location-when-in-use, camera and photo-library strings describe the real use. The generic Always-location and Microphone strings are gone. ATS: arbitrary loads off.
- No third-party or social sign-in (phone OTP only), so Sign in with Apple is not required.
- Payments: car rentals are a real-world service paid through Razorpay. The paid **Membership** (discounts on rentals) is sold in the app through Razorpay too; confirm against Guideline 3.1.1 / 3.1.3(e) before submitting.
- App Privacy labels: from the inventory (contact info, identifiers, location, photos, user content, usage data, financial info for refund payout details, government ID numbers).

## Open items for the owner
1. Publish `/delete-account` at `https://mysawari.in/delete-account` (copy the backend page or redirect).
2. Set a real grievance officer name and number in the policy and on the website (only the contact email is in the app now).
3. Decide and publish retention periods. Update the web privacy policy at `mysawari.in/privacy` to match the in-app text.
4. Reviewer login: set `APP_REVIEW_DEMO_PHONES` and `APP_REVIEW_FIXED_OTP` on the server and give the credentials to both stores. Without them reviewers cannot sign in.
5. Rotate the MongoDB credentials found in git history (see the security audit).
