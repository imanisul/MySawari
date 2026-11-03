# Graph Report - MySawari  (2026-11-03)

## Corpus Check
- 229 files · ~1,345,470 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1421 nodes · 4587 edges · 75 communities (72 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef76a7df`
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
- useColors
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- BottomNavigation.tsx
- pricingEngine.ts
- react
- TripDetailParts.tsx
- LoginBottomSheet
- SawariContext.tsx
- API
- dependencies
- HelpScreen.tsx
- react-native
- CarListCard.tsx
- haptics.ts
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- BookingDetailScreen.tsx
- API
- BookingsScreen.tsx
- useSawari
- CarDetailsSections.tsx
- MembershipScreen.tsx
- BookingScreen.tsx
- DropoffSheet.tsx
- tsconfig.json
- AnimatedSplash.tsx
- ReferEarnScreen.tsx
- FaqsScreen.tsx
- formatCurrency
- ProfileScreen.tsx
- DetailsTabs.tsx
- haptics.ts
- PushNotificationHandler.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- SearchEmptyState.tsx
- android
- SavedAddressesScreen.tsx
- PaymentProcessingScreen.tsx
- timedFetch
- metro.config.js
- FilterSheet.tsx
- PaymentFailed
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
- RefundsScreen.tsx
- experiments
- ScratchCard.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (75 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.30
Nodes (12): useTrackTripProgress(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.21
Nodes (19): Route(), longAvail(), Bullets(), HelpCard(), Inclusions(), LocationCard(), SectionPills(), WhyRent() (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.19
Nodes (7): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, expo

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.13
Nodes (27): Route(), Route(), isInNortheast(), SearchPlace, usePlaceSearch(), expo-location, AddressConfirmScreen(), mapHtml() (+19 more)

### Community 7 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 8 - "useColors"
Cohesion: 0.11
Nodes (24): Route(), Route(), styles, FONT, styles, styles, Reveal(), styles (+16 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (24): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+16 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (49): Route(), AlertButton, AlertPayload, CustomAlert, styles, CitySheet(), styles, ArcHeadline() (+41 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (16): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+8 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (16): Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+8 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+19 more)

### Community 16 - "react"
Cohesion: 0.11
Nodes (14): Route(), Route(), Route(), Route(), Route(), Route(), DriverChargesSheet(), LocationSheet() (+6 more)

### Community 17 - "TripDetailParts.tsx"
Cohesion: 0.16
Nodes (21): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), Dash(), MONTHS, placeName() (+13 more)

### Community 18 - "LoginBottomSheet"
Cohesion: 0.18
Nodes (20): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+12 more)

### Community 19 - "SawariContext.tsx"
Cohesion: 0.05
Nodes (62): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+54 more)

### Community 20 - "API"
Cohesion: 0.12
Nodes (19): ReviewModal(), styles, SORT_OPTIONS, SortKey, SortSheet(), styles, F, Photo (+11 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.12
Nodes (15): Route(), Route(), Header(), OfferCard, useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 23 - "react-native"
Cohesion: 0.15
Nodes (16): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+8 more)

### Community 24 - "CarListCard.tsx"
Cohesion: 0.29
Nodes (9): CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, useFavorites(), ActivityAPI (+1 more)

### Community 25 - "haptics.ts"
Cohesion: 0.13
Nodes (11): AddressPickerSheet(), styles, TOP_LOCATIONS, DRIVER_CHARGE_PER_DAY, MODES, styles, expo-haptics, PICKUP_DROP_BASE_FEE (+3 more)

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (31): sortCars(), CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars (+23 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingDetailScreen.tsx"
Cohesion: 0.20
Nodes (21): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+13 more)

### Community 31 - "API"
Cohesion: 0.21
Nodes (8): styles, styles, RefundTrackingModalProps, styles, FONT, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, BookingSnapshot

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.16
Nodes (16): Route(), ReviewTrip, driverLabel(), rise(), revealedScreens, react-native-reanimated, BookingsScreen(), BookingTab (+8 more)

### Community 33 - "useSawari"
Cohesion: 0.24
Nodes (15): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, ScratchCard(), useSawari() (+7 more)

### Community 34 - "CarDetailsSections.tsx"
Cohesion: 0.14
Nodes (23): allFeatures(), Benefits(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList(), formatPlace(), INCLUDED (+15 more)

### Community 35 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+7 more)

### Community 36 - "BookingScreen.tsx"
Cohesion: 0.16
Nodes (17): Route(), MembershipPicker(), MembershipUpgrade(), PlanOptions(), MembershipCelebration(), MembershipSavedPopup(), useLiveCar(), expo-blur (+9 more)

### Community 37 - "DropoffSheet.tsx"
Cohesion: 0.22
Nodes (8): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen(), API, hasGoogleMaps

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "AnimatedSplash.tsx"
Cohesion: 0.24
Nodes (11): LoginGate(), AnimatedSplash(), markSplashGone(), onSplashGone(), splashGoneListeners, SplashStep, styles, DEFAULT_FLASH_SCREEN_CONFIG (+3 more)

### Community 40 - "ReferEarnScreen.tsx"
Cohesion: 0.29
Nodes (8): Route(), BlurHost(), BlurTarget(), styles, ConfirmationScreen(), FONT, NEXT, styles

### Community 41 - "FaqsScreen.tsx"
Cohesion: 0.26
Nodes (9): Route(), Route(), FaqList(), Faqs, SubPageHeader(), Rays(), ReferEarnScreen(), FaqsScreen() (+1 more)

### Community 42 - "formatCurrency"
Cohesion: 0.23
Nodes (11): BottomBlur(), Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, PLAN_NAMES, PLAN_RATES (+3 more)

### Community 43 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (17): Route(), DesignToggle(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2() (+9 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.10
Nodes (32): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+24 more)

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (55): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+47 more)

### Community 46 - "PushNotificationHandler.tsx"
Cohesion: 0.40
Nodes (4): asString(), PushData, PushNotificationHandler(), mockNotifications

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.22
Nodes (7): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants, expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "SavedAddressesScreen.tsx"
Cohesion: 0.30
Nodes (13): Route(), DeliveryOptions(), PhoneSheet(), SavedAddressesScreen(), styles, getSavedAddresses(), keyFor(), removeSavedAddress() (+5 more)

### Community 52 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (12): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+4 more)

### Community 53 - "timedFetch"
Cohesion: 0.31
Nodes (7): expo-device, enforceHttpsUrl(), normalizeResponse(), timedFetch(), fetchChallengeNonce(), IntegrityVerdict, verifyAppIntegrity()

### Community 54 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 55 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 56 - "PaymentFailed"
Cohesion: 0.70
Nodes (3): Route(), PaymentFailed(), PaymentErrorScreen()

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
Cohesion: 0.08
Nodes (36): NotFoundScreen(), styles, DriverModeRow(), styles, DriverOptionSheet(), OptionCard(), styles, NextTrip() (+28 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.18
Nodes (10): clearMembershipPopupShown(), Layout, OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT, styles, Theme (+2 more)

### Community 65 - "WishlistScreen.tsx"
Cohesion: 0.31
Nodes (6): Route(), CarCardSkeleton(), useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 66 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (12): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+4 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "RefundsScreen.tsx"
Cohesion: 0.36
Nodes (7): Route(), bookingsQueryOptions, amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "ScratchCard.tsx"
Cohesion: 0.50
Nodes (3): SCRATCH_H, SCRATCH_W, styles

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ExploreFilters.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `TripDetailParts.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `react-native`, `CarListCard.tsx`, `haptics.ts`, `sawari.ts`, `BookingDetailScreen.tsx`, `API`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `MembershipScreen.tsx`, `BookingScreen.tsx`, `DropoffSheet.tsx`, `AnimatedSplash.tsx`, `ReferEarnScreen.tsx`, `FaqsScreen.tsx`, `formatCurrency`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `SavedAddressesScreen.tsx`, `PaymentProcessingScreen.tsx`, `FilterSheet.tsx`, `PaymentFailed`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`, `ScratchCard.tsx`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ExploreFilters.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `TripDetailParts.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `CarListCard.tsx`, `haptics.ts`, `sawari.ts`, `fetchWithAuth`, `BookingDetailScreen.tsx`, `API`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `MembershipScreen.tsx`, `BookingScreen.tsx`, `DropoffSheet.tsx`, `AnimatedSplash.tsx`, `ReferEarnScreen.tsx`, `FaqsScreen.tsx`, `formatCurrency`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `SavedAddressesScreen.tsx`, `PaymentProcessingScreen.tsx`, `timedFetch`, `FilterSheet.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`, `ScratchCard.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `useVehicles.ts`, `useDetailsPalette`, `haptics.ts`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `react`, `TripDetailParts.tsx`, `LoginBottomSheet`, `SawariContext.tsx`, `HelpScreen.tsx`, `CarListCard.tsx`, `haptics.ts`, `sawari.ts`, `BookingDetailScreen.tsx`, `API`, `BookingsScreen.tsx`, `CarDetailsSections.tsx`, `MembershipScreen.tsx`, `BookingScreen.tsx`, `DropoffSheet.tsx`, `AnimatedSplash.tsx`, `ReferEarnScreen.tsx`, `FaqsScreen.tsx`, `formatCurrency`, `ProfileScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `SearchEmptyState.tsx`, `SavedAddressesScreen.tsx`, `PaymentProcessingScreen.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13446969696969696 - nodes in this community are weakly interconnected._