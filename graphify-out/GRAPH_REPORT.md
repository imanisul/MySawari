# Graph Report - MySawari  (2026-10-26)

## Corpus Check
- 219 files · ~1,215,359 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1342 nodes · 4307 edges · 70 communities (65 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd837efe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PaymentsListScreen.tsx
- ReferEarnScreen.tsx
- CarDetailsSections.tsx
- devDependencies
- fetch_images.js
- package.json
- expo-haptics
- detailsPalette.ts
- useColors
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- detailsPalette.ts
- LocationSearchBody.tsx
- DatesSheet.tsx
- pricingEngine.ts
- BottomNavigation.tsx
- useVehicles.ts
- SearchScreen.tsx
- useColors
- ReferralScreen.tsx
- dependencies
- TripDetailParts.tsx
- ExploreScreen.tsx
- BookingDetailScreen.tsx
- ExploreFilters.tsx
- react-native
- expo
- SawariContext.tsx
- api.ts
- DetailsTabs.tsx
- BookingScreen.tsx
- PaymentProcessingScreen.tsx
- API
- ReviewModal.tsx
- pushNotification.ts
- DropoffSheet.tsx
- CarListCard.tsx
- tsconfig.json
- android
- react-native-safe-area-context
- activity.ts
- expo-linear-gradient
- getAvailability
- react
- ios
- map/google.ts
- useAppUpdates.ts
- offers.ts
- BookingsScreen.tsx
- RefundsScreen.tsx
- scripts
- detailsPalette.ts
- DriverChargesScreen.tsx
- AnimatedSplash.tsx
- infoPlist
- RideJourneyCard.tsx
- test.js
- secureStore.web.ts
- updates
- useSupportFab.ts
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 171 edges
2. `useSawari()` - 136 edges
3. `useColors()` - 128 edges
4. `react-native` - 126 edges
5. `useDetailsPalette()` - 115 edges
6. `@expo/vector-icons` - 86 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-haptics` - 58 edges
9. `expo-router` - 57 edges
10. `ModalBlur()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (70 total, 5 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.11
Nodes (14): Route(), Route(), Header(), Reveal(), PaymentMethodItem, PaymentsScreen(), styles, faqs (+6 more)

### Community 1 - "ReferEarnScreen.tsx"
Cohesion: 0.10
Nodes (32): Route(), Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, Page() (+24 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.11
Nodes (47): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+39 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.07
Nodes (20): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, downloadImage(), fetchWikiImage() (+12 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (33): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+25 more)

### Community 6 - "expo-haptics"
Cohesion: 0.08
Nodes (48): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+40 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.07
Nodes (51): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+43 more)

### Community 8 - "useColors"
Cohesion: 0.14
Nodes (19): Route(), styles, DriverOptionSheet(), OptionCard(), styles, NextTrip(), styles, PlannerSheet() (+11 more)

### Community 9 - "sawari.ts"
Cohesion: 0.10
Nodes (21): CategoryTabs(), styles, AvailabilityInfo, baseCars, Block, buildBlocks(), cars, categories (+13 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.06
Nodes (51): Route(), digitsOf(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked(), OtpBoxes() (+43 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), CustomAlertProvider() (+10 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.24
Nodes (9): Route(), Bullet(), Clause, Point, POLICIES, Policy, PolicyScreen(), RENTAL_CLAUSES (+1 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.19
Nodes (15): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+7 more)

### Community 14 - "DatesSheet.tsx"
Cohesion: 0.13
Nodes (17): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (26): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+18 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.05
Nodes (47): Route(), KeyboardAwareScrollViewCompat(), ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+39 more)

### Community 17 - "useVehicles.ts"
Cohesion: 0.15
Nodes (22): Route(), useTrackTripProgress(), PaymentScreen(), styles, calculateCouponDiscount(), addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed() (+14 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.16
Nodes (16): FunnelIcon(), SortLinesIcon(), rise(), revealedScreens, EMPTY_FILTERS, ExploreFilters, QUICK_CHIPS, SortKey (+8 more)

### Community 19 - "useColors"
Cohesion: 0.10
Nodes (26): NotFoundScreen(), styles, DriverModeRow(), styles, ALL_TIMES, InlineTripEditor(), MONTHS, styles (+18 more)

### Community 20 - "ReferralScreen.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "TripDetailParts.tsx"
Cohesion: 0.18
Nodes (18): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), Dash(), MONTHS, PricingSummary() (+10 more)

### Community 23 - "ExploreScreen.tsx"
Cohesion: 0.18
Nodes (12): Route(), Route(), chipFor(), countActive(), useVehicleRatings(), CarCardSkeleton(), useVehicles(), ExploreScreen() (+4 more)

### Community 24 - "BookingDetailScreen.tsx"
Cohesion: 0.21
Nodes (19): Route(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment(), refundStage() (+11 more)

### Community 25 - "ExploreFilters.tsx"
Cohesion: 0.14
Nodes (20): BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet(), FEATURES, FUELS, matchesFilters() (+12 more)

### Community 26 - "react-native"
Cohesion: 0.16
Nodes (17): styles, OfferCard, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+9 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (16): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, expo-constants (+8 more)

### Community 29 - "api.ts"
Cohesion: 0.13
Nodes (12): BASE_URL, formatPhotonAddress(), HOLD_STATUSES, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus(), PendingReview, refreshSubscribers (+4 more)

### Community 30 - "DetailsTabs.tsx"
Cohesion: 0.11
Nodes (28): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, AboutSection(), DetailRow() (+20 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.10
Nodes (33): Route(), DesignToggle(), ART_H, MembershipCelebration(), MembershipSavedPopup(), shown, styles, Theme (+25 more)

### Community 32 - "PaymentProcessingScreen.tsx"
Cohesion: 0.19
Nodes (10): Route(), Route(), PaymentFailed(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentErrorScreen() (+2 more)

### Community 33 - "API"
Cohesion: 0.19
Nodes (14): HomeLoadStep, loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+6 more)

### Community 34 - "ReviewModal.tsx"
Cohesion: 0.24
Nodes (9): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, styles, TripReviewSheet() (+1 more)

### Community 35 - "pushNotification.ts"
Cohesion: 0.16
Nodes (15): expo-device, expo-secure-store, fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh(), timedFetch() (+7 more)

### Community 36 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 37 - "CarListCard.tsx"
Cohesion: 0.31
Nodes (8): bestFor(), CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, ActivityAPI

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "react-native-safe-area-context"
Cohesion: 0.14
Nodes (17): ExtendBookingSheet(), styles, defaultFilters, FilterSheet(), FilterState, styles, styles, RefundTrackingModalProps (+9 more)

### Community 41 - "activity.ts"
Cohesion: 0.39
Nodes (6): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, unregisterDeviceForPushNotifications()

### Community 42 - "expo-linear-gradient"
Cohesion: 0.19
Nodes (12): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, expo-linear-gradient, EditProfileScreen() (+4 more)

### Community 43 - "getAvailability"
Cohesion: 0.25
Nodes (14): sortCars(), CarTile, styles, LuxuryCarTile, styles, isPastSearch(), Car, dayNumToLabel() (+6 more)

### Community 44 - "react"
Cohesion: 0.11
Nodes (13): Route(), Route(), Route(), Route(), Route(), styles, SubPageHeader(), react (+5 more)

### Community 45 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 46 - "map/google.ts"
Cohesion: 0.21
Nodes (9): getJson(), GOOGLE_MAPS_KEY, googleAutocomplete(), GooglePlace, googlePlaceDetails(), GooglePrediction, googleReverseGeocode(), hasGoogleMaps (+1 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 49 - "BookingsScreen.tsx"
Cohesion: 0.21
Nodes (12): Route(), driverLabel(), BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn(), Kind (+4 more)

### Community 50 - "RefundsScreen.tsx"
Cohesion: 0.26
Nodes (10): Route(), placeName(), shortDate(), TripTimeline(), bookingsQueryOptions, amountOf(), RefundsScreen(), Stage (+2 more)

### Community 51 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 52 - "detailsPalette.ts"
Cohesion: 0.22
Nodes (7): FONT, PaymentProgress(), PaymentStep, styles, dark, DetailsPalette, light

### Community 53 - "DriverChargesScreen.tsx"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 54 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 55 - "infoPlist"
Cohesion: 0.40
Nodes (5): NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 57 - "RideJourneyCard.tsx"
Cohesion: 0.25
Nodes (7): AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }, RideJourneyCard(), styles

### Community 58 - "test.js"
Cohesion: 0.40
Nodes (3): b, pickup, returnDt

### Community 59 - "secureStore.web.ts"
Cohesion: 0.70
Nodes (4): deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 61 - "useSupportFab.ts"
Cohesion: 0.50
Nodes (4): listeners, navHelpListeners, setSupportFabHidden(), useHideSupportWhileScrolling()

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

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 514 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `ReferEarnScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `DatesSheet.tsx`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `ReferralScreen.tsx`, `TripDetailParts.tsx`, `ExploreScreen.tsx`, `BookingDetailScreen.tsx`, `ExploreFilters.tsx`, `react-native`, `SawariContext.tsx`, `DetailsTabs.tsx`, `BookingScreen.tsx`, `PaymentProcessingScreen.tsx`, `ReviewModal.tsx`, `DropoffSheet.tsx`, `CarListCard.tsx`, `react-native-safe-area-context`, `expo-linear-gradient`, `getAvailability`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `RefundsScreen.tsx`, `detailsPalette.ts`, `DriverChargesScreen.tsx`, `AnimatedSplash.tsx`, `RideJourneyCard.tsx`, `useSupportFab.ts`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `ReferEarnScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `DatesSheet.tsx`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `ReferralScreen.tsx`, `TripDetailParts.tsx`, `BookingDetailScreen.tsx`, `ExploreFilters.tsx`, `SawariContext.tsx`, `DetailsTabs.tsx`, `BookingScreen.tsx`, `PaymentProcessingScreen.tsx`, `ReviewModal.tsx`, `pushNotification.ts`, `DropoffSheet.tsx`, `CarListCard.tsx`, `react-native-safe-area-context`, `activity.ts`, `expo-linear-gradient`, `getAvailability`, `react`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `RefundsScreen.tsx`, `detailsPalette.ts`, `AnimatedSplash.tsx`, `RideJourneyCard.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `ReferEarnScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1024390243902439 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `LocationSearchBody.tsx` to `PaymentsListScreen.tsx`, `ReferEarnScreen.tsx`, `CarDetailsSections.tsx`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `HomeScreen.tsx`, `_layout.tsx`, `DatesSheet.tsx`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `ReferralScreen.tsx`, `TripDetailParts.tsx`, `ExploreScreen.tsx`, `BookingDetailScreen.tsx`, `SawariContext.tsx`, `DetailsTabs.tsx`, `BookingScreen.tsx`, `PaymentProcessingScreen.tsx`, `ReviewModal.tsx`, `DropoffSheet.tsx`, `CarListCard.tsx`, `react-native-safe-area-context`, `expo-linear-gradient`, `getAvailability`, `BookingsScreen.tsx`, `RefundsScreen.tsx`, `detailsPalette.ts`, `RideJourneyCard.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10823529411764705 - nodes in this community are weakly interconnected._