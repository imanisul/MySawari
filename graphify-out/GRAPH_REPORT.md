# Graph Report - MySawari  (2026-11-04)

## Corpus Check
- 229 files · ~1,349,065 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1427 nodes · 4625 edges · 69 communities (66 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6fcad4ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- useVehicles.ts
- useDetailsPalette
- devDependencies
- ExploreScreen.tsx
- package.json
- haptics.ts
- DatesSheet.tsx
- LoginBottomSheet
- ExploreFilters.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- SawariContext.tsx
- BookingDetailScreen.tsx
- pricingEngine.ts
- CarDetailsSections.tsx
- BookingScreen.tsx
- AnimatedSplash.tsx
- formatCurrency
- DetailsTabs.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- ManageBookingSheet.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- TripDetailParts.tsx
- SearchScreen.tsx
- useSawari
- WishlistScreen.tsx
- DropoffSheet.tsx
- LoadingImage
- activity.ts
- tsconfig.json
- MembershipScreen.tsx
- react-native-safe-area-context
- recentlyViewed.ts
- BookingsScreen.tsx
- timedFetch
- haptics.ts
- haptics.ts
- CancelBookingSheet.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- SearchEmptyState.tsx
- android
- PushNotificationHandler.tsx
- metro.config.js
- index.ts
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- experiments
- ErrorFallback.tsx
- scripts
- expo

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 135 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 121 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `CarDetailsScreen()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (69 total, 3 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (37): Route(), Route(), Route(), Route(), Route(), Route(), Route(), Route() (+29 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.36
Nodes (10): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), removeRecentSearch(), saveRecentSearch(), SearchBase, searchIdFor() (+2 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.17
Nodes (28): Route(), longAvail(), Benefits(), CancellationPolicy(), FaqList(), Faqs, FeatureList(), HelpCard() (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ExploreScreen.tsx"
Cohesion: 0.15
Nodes (16): Route(), chipsFor(), EMPTY_FILTERS, ExploreFilters, QuickChip, SortKey, useVehicleRatings(), listeners (+8 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.08
Nodes (51): Route(), Route(), Route(), BlurTargetProvider(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions() (+43 more)

### Community 7 - "DatesSheet.tsx"
Cohesion: 0.08
Nodes (32): Route(), Route(), Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour() (+24 more)

### Community 8 - "LoginBottomSheet"
Cohesion: 0.17
Nodes (21): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+13 more)

### Community 9 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.06
Nodes (28): AlertButton, AlertPayload, CustomAlert, styles, ArcHeadline(), BENEFITS, cardDate(), ComboSlide (+20 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (17): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), LoginGate() (+9 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.08
Nodes (32): Route(), Page(), styles, ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps (+24 more)

### Community 13 - "SawariContext.tsx"
Cohesion: 0.05
Nodes (60): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+52 more)

### Community 14 - "BookingDetailScreen.tsx"
Cohesion: 0.23
Nodes (18): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+10 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.13
Nodes (22): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+14 more)

### Community 16 - "CarDetailsSections.tsx"
Cohesion: 0.13
Nodes (19): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MembershipPicker() (+11 more)

### Community 17 - "BookingScreen.tsx"
Cohesion: 0.17
Nodes (20): Route(), Route(), DesignToggle(), MembershipCelebration(), MembershipSavedPopup(), useTripPrice(), useQuote(), useTrackTripProgress() (+12 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.19
Nodes (13): AnimatedG, AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles, expo-image, react-native-svg (+5 more)

### Community 19 - "formatCurrency"
Cohesion: 0.19
Nodes (13): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+5 more)

### Community 20 - "DetailsTabs.tsx"
Cohesion: 0.16
Nodes (22): NotFoundScreen(), styles, AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection() (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "react-native"
Cohesion: 0.16
Nodes (15): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+7 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.10
Nodes (27): Route(), CitySheet(), styles, BenefitsGrid(), ConnectCard(), DestinationTile(), HOME_PURPLE, HomeSearchCard() (+19 more)

### Community 25 - "ManageBookingSheet.tsx"
Cohesion: 0.27
Nodes (6): styles, styles, RefundTrackingModalProps, styles, FONT, BookingSnapshot

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (29): sortCars(), CarTile, styles, LuxuryCarTile, isPastSearch(), AvailabilityInfo, baseCars, Block (+21 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.07
Nodes (22): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+14 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.16
Nodes (17): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+9 more)

### Community 31 - "TripDetailParts.tsx"
Cohesion: 0.18
Nodes (16): BookingCard(), Dash(), MONTHS, placeName(), PricingSummary(), refundStage(), RefundTimeline(), Row() (+8 more)

### Community 32 - "SearchScreen.tsx"
Cohesion: 0.22
Nodes (11): FunnelIcon(), SortArrowsIcon(), rise(), revealedScreens, chipOn(), countActive(), toggleChip(), react-native-reanimated (+3 more)

### Community 33 - "useSawari"
Cohesion: 0.14
Nodes (22): Route(), PostTripReviewPrompt(), Reveal(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles (+14 more)

### Community 34 - "WishlistScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), CarCardSkeleton(), CarListCard, styles, WishlistScreen(), byAvailability()

### Community 35 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 36 - "LoadingImage"
Cohesion: 0.12
Nodes (21): NextTrip(), styles, AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl() (+13 more)

### Community 37 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "MembershipScreen.tsx"
Cohesion: 0.07
Nodes (39): Route(), Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles (+31 more)

### Community 40 - "react-native-safe-area-context"
Cohesion: 0.11
Nodes (23): defaultFilters, FilterSheet(), FilterState, styles, ReviewModal(), ReviewTrip, styles, SORT_OPTIONS (+15 more)

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 42 - "BookingsScreen.tsx"
Cohesion: 0.14
Nodes (20): Route(), Route(), driverLabel(), shortDate(), bookingsQueryOptions, BookingsScreen(), BookingTab, byRecent() (+12 more)

### Community 43 - "timedFetch"
Cohesion: 0.31
Nodes (7): expo-device, enforceHttpsUrl(), normalizeResponse(), timedFetch(), fetchChallengeNonce(), IntegrityVerdict, verifyAppIntegrity()

### Community 44 - "haptics.ts"
Cohesion: 0.12
Nodes (10): CategoryTabs(), styles, SCRATCH_H, SCRATCH_W, styles, expo-haptics, ImpactFeedbackStyle, NotificationFeedbackType (+2 more)

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (54): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+46 more)

### Community 46 - "CancelBookingSheet.tsx"
Cohesion: 0.39
Nodes (7): CancelBookingSheet(), Field(), REASONS, styles, refundQuote(), rupees(), useVehicles()

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 52 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 55 - "index.ts"
Cohesion: 0.14
Nodes (16): DriverModeRow(), styles, PlannerSheet(), styles, SearchCard(), styles, SearchSheet(), styles (+8 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.21
Nodes (16): Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet(), styles (+8 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.12
Nodes (18): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout, OTHER_LAYOUT (+10 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 75 - "ErrorFallback.tsx"
Cohesion: 0.19
Nodes (7): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, expo

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 547 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useVehicles.ts`, `useDetailsPalette`, `ExploreScreen.tsx`, `package.json`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `ExploreFilters.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `CarDetailsSections.tsx`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `formatCurrency`, `DetailsTabs.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ManageBookingSheet.tsx`, `sawari.ts`, `TripDetailParts.tsx`, `SearchScreen.tsx`, `useSawari`, `WishlistScreen.tsx`, `DropoffSheet.tsx`, `LoadingImage`, `MembershipScreen.tsx`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `haptics.ts`, `haptics.ts`, `CancelBookingSheet.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `PushNotificationHandler.tsx`, `index.ts`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05478750640040963 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `react`, `useDetailsPalette`, `ExploreScreen.tsx`, `package.json`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `ExploreFilters.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `CarDetailsSections.tsx`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `formatCurrency`, `DetailsTabs.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ManageBookingSheet.tsx`, `sawari.ts`, `fetchWithAuth`, `TripDetailParts.tsx`, `SearchScreen.tsx`, `useSawari`, `WishlistScreen.tsx`, `DropoffSheet.tsx`, `LoadingImage`, `activity.ts`, `MembershipScreen.tsx`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `timedFetch`, `haptics.ts`, `haptics.ts`, `CancelBookingSheet.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `PushNotificationHandler.tsx`, `index.ts`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `useVehicles.ts`, `useDetailsPalette`, `ExploreScreen.tsx`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `CarDetailsSections.tsx`, `BookingScreen.tsx`, `formatCurrency`, `DetailsTabs.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ManageBookingSheet.tsx`, `sawari.ts`, `SearchScreen.tsx`, `WishlistScreen.tsx`, `DropoffSheet.tsx`, `LoadingImage`, `MembershipScreen.tsx`, `BookingsScreen.tsx`, `haptics.ts`, `CancelBookingSheet.tsx`, `SearchEmptyState.tsx`, `PushNotificationHandler.tsx`, `index.ts`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0750925436277102 - nodes in this community are weakly interconnected._