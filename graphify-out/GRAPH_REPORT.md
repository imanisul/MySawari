# Graph Report - MySawari  (2026-10-29)

## Corpus Check
- 216 files · ~1,211,568 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1315 nodes · 4275 edges · 61 communities (56 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4642238e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PaymentsListScreen.tsx
- PolicyScreen.tsx
- useDetailsPalette
- devDependencies
- ErrorFallback.tsx
- package.json
- expo-haptics
- detailsPalette.ts
- useSawari
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- detailsPalette.ts
- LocationSearchBody.tsx
- LoadingImage
- pricingEngine.ts
- BottomNavigation.tsx
- BookingDetailScreen.tsx
- SearchScreen.tsx
- react-native
- expo-haptics
- dependencies
- @expo/vector-icons
- CarDetailsSections.tsx
- ReferEarnScreen.tsx
- expo-linear-gradient
- CancelBookingSheet.tsx
- expo
- fetchWithAuth
- api.ts
- react-native-safe-area-context
- BookingScreen.tsx
- MembershipScreen.tsx
- API
- DatesSheet.tsx
- PaymentProcessingScreen.tsx
- DriverChargesScreen.tsx
- DriverOptionScreen.tsx
- tsconfig.json
- android
- TripDetailParts.tsx
- activity.ts
- formatCurrency
- PaymentFailed
- react
- ios
- PlannerScreen.tsx
- useAppUpdates.ts
- recentlyViewed.ts
- SawariContext.tsx
- infoPlist
- secureStore.web.ts
- updates
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts
- expo-router

## God Nodes (most connected - your core abstractions)
1. `react` - 173 edges
2. `useSawari()` - 134 edges
3. `react-native` - 124 edges
4. `useColors()` - 122 edges
5. `useDetailsPalette()` - 114 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 61 edges
8. `expo-haptics` - 56 edges
9. `expo-router` - 56 edges
10. `ModalBlur()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (61 total, 5 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.14
Nodes (12): Route(), Route(), Header(), OfferCard, PaymentsScreen(), faqs, HelpScreen(), styles (+4 more)

### Community 1 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (20): Route(), Route(), Route(), Route(), Route(), Route(), Bullet(), CANCELLATION_CLAUSES (+12 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.14
Nodes (30): Route(), longAvail(), Benefits(), formatPlace(), HelpCard(), LocationCard(), MainSpecification(), MileageIcon() (+22 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (36): main, name, private, scripts, build, dev, typecheck, version (+28 more)

### Community 6 - "expo-haptics"
Cohesion: 0.08
Nodes (49): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+41 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.07
Nodes (50): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+42 more)

### Community 8 - "useSawari"
Cohesion: 0.10
Nodes (37): RootLayoutNav(), NotFoundScreen(), styles, styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet() (+29 more)

### Community 9 - "sawari.ts"
Cohesion: 0.07
Nodes (27): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles (+19 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.06
Nodes (50): Route(), digitsOf(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked(), OtpBoxes() (+42 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (18): AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), PostTripReviewPrompt(), UpdateModal() (+10 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.22
Nodes (10): Route(), FaqList(), Faqs, dark, DetailsPalette, light, styles, SubPageHeader() (+2 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.09
Nodes (38): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+30 more)

### Community 14 - "LoadingImage"
Cohesion: 0.12
Nodes (29): NextTrip(), styles, getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+21 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (30): Route(), PaymentScreen(), styles, calculateAdvanceAmount(), calculateBookingPrice(), calculateCouponDiscount(), calculateDistanceKm(), calculateDriverCharge() (+22 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.07
Nodes (34): Route(), Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+26 more)

### Community 17 - "BookingDetailScreen.tsx"
Cohesion: 0.22
Nodes (18): Route(), ManageBookingSheet(), useTripColors(), ActionRow(), HelpCard(), pickupMoment(), refundStage(), RefundTimeline() (+10 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.06
Nodes (69): Route(), Route(), FunnelIcon(), SortLinesIcon(), rise(), Reveal(), revealedScreens, BODY_ORDER (+61 more)

### Community 19 - "react-native"
Cohesion: 0.15
Nodes (16): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+8 more)

### Community 20 - "expo-haptics"
Cohesion: 0.14
Nodes (22): AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection(), getCategorizedFeatures(), PhotoViewer() (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "@expo/vector-icons"
Cohesion: 0.18
Nodes (10): AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }, RideJourneyCard(), styles, styles (+2 more)

### Community 23 - "CarDetailsSections.tsx"
Cohesion: 0.14
Nodes (19): allFeatures(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList(), INCLUDED, Inclusions() (+11 more)

### Community 24 - "ReferEarnScreen.tsx"
Cohesion: 0.19
Nodes (14): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, styles, ConfirmationScreen() (+6 more)

### Community 25 - "expo-linear-gradient"
Cohesion: 0.19
Nodes (12): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, expo-linear-gradient, EditProfileScreen() (+4 more)

### Community 26 - "CancelBookingSheet.tsx"
Cohesion: 0.39
Nodes (7): CancelBookingSheet(), Field(), REASONS, styles, refundQuote(), rupees(), useVehicles()

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.10
Nodes (15): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+7 more)

### Community 30 - "react-native-safe-area-context"
Cohesion: 0.17
Nodes (15): ExtendBookingSheet(), styles, styles, RefundTrackingModal(), RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey (+7 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.12
Nodes (24): Route(), BlurTargetContext, BlurTargetProvider(), DesignToggle(), ART_H, clearMembershipPopupShown(), MembershipCelebration(), MembershipSavedPopup() (+16 more)

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.19
Nodes (15): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+7 more)

### Community 33 - "API"
Cohesion: 0.13
Nodes (22): AppGate(), CustomAlertProvider(), HomeLoadStep, homeLoadSteps(), loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles() (+14 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.10
Nodes (23): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+15 more)

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (11): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+3 more)

### Community 36 - "DriverChargesScreen.tsx"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "TripDetailParts.tsx"
Cohesion: 0.14
Nodes (23): Route(), BookingCard(), Dash(), driverLabel(), MONTHS, placeName(), PricingSummary(), Row() (+15 more)

### Community 41 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 42 - "formatCurrency"
Cohesion: 0.19
Nodes (13): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+5 more)

### Community 43 - "PaymentFailed"
Cohesion: 0.70
Nodes (3): Route(), PaymentFailed(), PaymentErrorScreen()

### Community 44 - "react"
Cohesion: 0.19
Nodes (6): Route(), Route(), Route(), react, LocationScreen(), ReturnLocationScreen()

### Community 45 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.18
Nodes (9): styles, UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants (+1 more)

### Community 48 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 50 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (18): DropoffSheet(), Place, POPULAR, Row(), styles, AppCustomer, AppNotification, BookingStatus (+10 more)

### Community 55 - "infoPlist"
Cohesion: 0.40
Nodes (5): NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 64 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 65 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 66 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 67 - "notification"
Cohesion: 0.67
Nodes (3): notification, color, icon

### Community 74 - "expo-router"
Cohesion: 0.16
Nodes (14): Route(), ReviewModal(), ReviewTrip, styles, BookingsScreen(), BookingTab, byRecent(), Empty() (+6 more)

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 494 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useSawari`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `LoadingImage`, `pricingEngine.ts`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `react-native`, `expo-haptics`, `@expo/vector-icons`, `CarDetailsSections.tsx`, `ReferEarnScreen.tsx`, `expo-linear-gradient`, `CancelBookingSheet.tsx`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `DriverChargesScreen.tsx`, `DriverOptionScreen.tsx`, `TripDetailParts.tsx`, `formatCurrency`, `PaymentFailed`, `PlannerScreen.tsx`, `useAppUpdates.ts`, `SawariContext.tsx`, `expo-router`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useSawari`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `LoadingImage`, `pricingEngine.ts`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `expo-haptics`, `@expo/vector-icons`, `CarDetailsSections.tsx`, `ReferEarnScreen.tsx`, `expo-linear-gradient`, `CancelBookingSheet.tsx`, `fetchWithAuth`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `TripDetailParts.tsx`, `activity.ts`, `formatCurrency`, `useAppUpdates.ts`, `SawariContext.tsx`, `expo-router`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `PaymentsListScreen.tsx`, `useDetailsPalette`, `expo-haptics`, `detailsPalette.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `LoadingImage`, `pricingEngine.ts`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `expo-haptics`, `@expo/vector-icons`, `CarDetailsSections.tsx`, `ReferEarnScreen.tsx`, `expo-linear-gradient`, `CancelBookingSheet.tsx`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `API`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `TripDetailParts.tsx`, `formatCurrency`, `SawariContext.tsx`, `expo-router`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.14204545454545456 - nodes in this community are weakly interconnected._