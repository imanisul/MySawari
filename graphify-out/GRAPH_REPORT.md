# Graph Report - MySawari  (2026-11-03)

## Corpus Check
- 229 files · ~1,344,043 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1417 nodes · 4570 edges · 68 communities (65 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `14be86dd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- useVehicles.ts
- useDetailsPalette
- devDependencies
- ErrorBoundary.tsx
- package.json
- haptics.ts
- ExploreFilters.tsx
- HomeScreen.tsx
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- MembershipScreen.tsx
- pricingEngine.ts
- react
- BookingDetailScreen.tsx
- LoginBottomSheet
- SawariContext.tsx
- API
- dependencies
- HelpScreen.tsx
- react-native
- useHomeData.ts
- VehicleSummary.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- react-native-safe-area-context
- BookingsScreen.tsx
- useSawari
- CarDetailsSections.tsx
- formatCurrency
- useSawari
- activity.ts
- tsconfig.json
- LocationSheet
- detailsPalette.ts
- recentlyViewed.ts
- CustomAlert.tsx
- ProfileScreen.tsx
- DetailsTabs.tsx
- haptics.ts
- PushNotificationHandler.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- SearchScreen.tsx
- android
- FilterSheet.tsx
- scripts
- expo
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- WishlistScreen.tsx
- LocationSearchBody.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- experiments

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 83 edges
7. `react-native-safe-area-context` - 61 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (68 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.09
Nodes (26): Route(), Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette (+18 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.18
Nodes (26): Route(), longAvail(), Benefits(), CancellationPolicy(), Faqs, FeatureList(), HelpCard(), LocationCard() (+18 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.06
Nodes (52): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+44 more)

### Community 7 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 8 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (21): Route(), CitySheet(), styles, BenefitsGrid(), ConnectCard(), DestinationTile(), HOME_PURPLE, HomeSearchCard() (+13 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.13
Nodes (20): Route(), FunnelIcon(), SortArrowsIcon(), Page(), chipsFor(), EMPTY_FILTERS, ExploreFilters, QuickChip (+12 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.08
Nodes (23): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HomeHero() (+15 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (16): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), LoginGate() (+8 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.08
Nodes (30): Route(), Route(), Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour() (+22 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "MembershipScreen.tsx"
Cohesion: 0.05
Nodes (55): Route(), Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles (+47 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (28): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+20 more)

### Community 16 - "react"
Cohesion: 0.12
Nodes (13): Route(), Route(), Route(), Reveal(), useKeyboardPad(), react, DriverChargesScreen(), DriverOptionScreen() (+5 more)

### Community 17 - "BookingDetailScreen.tsx"
Cohesion: 0.12
Nodes (38): Route(), CancelBookingSheet(), Field(), REASONS, styles, ManageBookingSheet(), useTripColors(), ActionRow() (+30 more)

### Community 18 - "LoginBottomSheet"
Cohesion: 0.17
Nodes (21): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+13 more)

### Community 19 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (19): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+11 more)

### Community 20 - "API"
Cohesion: 0.16
Nodes (14): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+6 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "react-native"
Cohesion: 0.14
Nodes (16): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+8 more)

### Community 24 - "useHomeData.ts"
Cohesion: 0.16
Nodes (15): Photo, RATING_WORDS, styles, clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence() (+7 more)

### Community 25 - "VehicleSummary.tsx"
Cohesion: 0.31
Nodes (8): AddressPickerSheet(), DeliveryOptions(), DeliveryPickupCard(), DRIVER_CHARGE_PER_DAY, MODES, styles, Toggle(), MIN_PUBLIC_REVIEW_RATING

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (30): sortCars(), CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars (+22 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.12
Nodes (22): expo-device, expo-secure-store, DEFAULT_FLASH_SCREEN_CONFIG, fetchRemoteFlashScreenConfig(), FlashScreenConfig, enforceHttpsUrl(), fetchWithAuth(), getInstallId() (+14 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.17
Nodes (16): cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions, waitForCardImages() (+8 more)

### Community 31 - "react-native-safe-area-context"
Cohesion: 0.15
Nodes (16): styles, styles, RefundTrackingModal(), RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey, SortSheet() (+8 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.14
Nodes (22): Route(), Route(), ExtendBookingSheet(), driverLabel(), shortDate(), tripTotal(), useVehicles(), BookingsScreen() (+14 more)

### Community 33 - "useSawari"
Cohesion: 0.16
Nodes (16): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+8 more)

### Community 34 - "CarDetailsSections.tsx"
Cohesion: 0.12
Nodes (20): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MembershipPicker() (+12 more)

### Community 35 - "formatCurrency"
Cohesion: 0.29
Nodes (7): TripMilestoneCard(), PriceBreakdownSheet(), ReadyPrice, styles, TripPrice, PlanRow(), formatCurrency()

### Community 36 - "useSawari"
Cohesion: 0.14
Nodes (27): Route(), BlurTargetProvider(), DesignToggle(), MembershipCelebration(), MembershipSavedPopup(), Breakup(), Dashes(), ReadyPrice (+19 more)

### Community 37 - "activity.ts"
Cohesion: 0.26
Nodes (11): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+3 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 40 - "detailsPalette.ts"
Cohesion: 0.22
Nodes (8): PhotoViewer(), dark, light, HEIGHT, styles, VehicleHeroGallery(), { width }, useIsDarkMode()

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 42 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 43 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (16): Route(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+8 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.10
Nodes (33): NotFoundScreen(), styles, NextTrip(), styles, AnimatedSplash(), getSourceKey(), loadedUris, LoadingImage() (+25 more)

### Community 45 - "haptics.ts"
Cohesion: 0.07
Nodes (52): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+44 more)

### Community 46 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "SearchScreen.tsx"
Cohesion: 0.17
Nodes (15): rise(), revealedScreens, chipOn(), countActive(), toggleChip(), Action, EmptyKind, SearchEmptyState() (+7 more)

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 55 - "FilterSheet.tsx"
Cohesion: 0.13
Nodes (12): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles (+4 more)

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 58 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.13
Nodes (25): Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet() (+17 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.13
Nodes (17): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout, OTHER_LAYOUT (+9 more)

### Community 65 - "WishlistScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), CarCardSkeleton(), CarListCard, styles, WishlistScreen(), byAvailability()

### Community 66 - "LocationSearchBody.tsx"
Cohesion: 0.24
Nodes (10): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+2 more)

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

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ExploreFilters.tsx`, `HomeScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `react-native`, `useHomeData.ts`, `VehicleSummary.tsx`, `sawari.ts`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `formatCurrency`, `useSawari`, `LocationSheet`, `detailsPalette.ts`, `CustomAlert.tsx`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `UpdateModal.tsx`, `SearchScreen.tsx`, `FilterSheet.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.0873015873015873 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ExploreFilters.tsx`, `HomeScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `react`, `BookingDetailScreen.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `useHomeData.ts`, `VehicleSummary.tsx`, `sawari.ts`, `fetchWithAuth`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `formatCurrency`, `useSawari`, `activity.ts`, `detailsPalette.ts`, `CustomAlert.tsx`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `UpdateModal.tsx`, `SearchScreen.tsx`, `FilterSheet.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `ErrorBoundary.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11578947368421053 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `useVehicles.ts`, `useDetailsPalette`, `haptics.ts`, `HomeScreen.tsx`, `SearchScreen.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `react`, `BookingDetailScreen.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `VehicleSummary.tsx`, `sawari.ts`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `LocationSheet`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `SearchScreen.tsx`, `FilterSheet.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._