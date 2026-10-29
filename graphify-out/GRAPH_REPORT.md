# Graph Report - MySawari  (2026-10-29)

## Corpus Check
- 211 files · ~1,207,619 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1299 nodes · 4237 edges · 67 communities (64 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eeb9b717`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PaymentsListScreen.tsx
- ExploreFilters.tsx
- useDetailsPalette
- devDependencies
- ErrorFallback.tsx
- package.json
- expo-haptics
- detailsPalette.ts
- useColors
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- detailsPalette.ts
- LocationSearchBody.tsx
- CarListCard.tsx
- pricingEngine.ts
- BottomNavigation.tsx
- PaymentScreen.tsx
- SearchScreen.tsx
- index.ts
- expo-haptics
- dependencies
- useSawari
- WishlistScreen.tsx
- ReferEarnScreen.tsx
- ProfileScreen.tsx
- react-native
- expo
- fetchWithAuth
- api.ts
- react-native-safe-area-context
- BookingScreen.tsx
- MembershipScreen.tsx
- API
- DatesSheet.tsx
- PaymentProcessingScreen.tsx
- SawariContext.tsx
- LocationSearchBody.tsx
- tsconfig.json
- android
- RefundsScreen.tsx
- activity.ts
- formatCurrency
- CarListCard.tsx
- react
- ios
- FilterSheet.tsx
- useAppUpdates.ts
- recentlyViewed.ts
- location.ts
- DropoffSheet.tsx
- LoginBottomSheet
- AnimatedSplash.tsx
- infoPlist
- TripReviewSheet.tsx
- secureStore.web.ts
- updates
- offers.ts
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts
- scripts
- expo-router

## God Nodes (most connected - your core abstractions)
1. `react` - 168 edges
2. `useSawari()` - 132 edges
3. `react-native` - 124 edges
4. `useColors()` - 122 edges
5. `useDetailsPalette()` - 114 edges
6. `@expo/vector-icons` - 83 edges
7. `react-native-safe-area-context` - 61 edges
8. `expo-haptics` - 56 edges
9. `expo-router` - 55 edges
10. `ModalBlur()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (67 total, 3 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.15
Nodes (10): Route(), Header(), PaymentMethodItem, PaymentsScreen(), styles, faqs, HelpScreen(), styles (+2 more)

### Community 1 - "ExploreFilters.tsx"
Cohesion: 0.15
Nodes (18): BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet(), FEATURES, FUELS, Option (+10 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.12
Nodes (43): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey() (+35 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (31): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+23 more)

### Community 6 - "expo-haptics"
Cohesion: 0.08
Nodes (53): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DeliveryPickupCard() (+45 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.09
Nodes (41): Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF, rupees() (+33 more)

### Community 8 - "useColors"
Cohesion: 0.18
Nodes (18): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, PlannerSheet() (+10 more)

### Community 9 - "sawari.ts"
Cohesion: 0.11
Nodes (29): CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars, Block (+21 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (28): Route(), onSplashGone(), ARC_LINES, ArcHeadline(), BENEFITS, BenefitsGrid(), ConnectCard(), DestinationTile() (+20 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (19): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar() (+11 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.13
Nodes (19): Route(), Route(), FaqList(), Faqs, dark, DetailsPalette, light, styles (+11 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "CarListCard.tsx"
Cohesion: 0.15
Nodes (17): cardDate(), TopPickCard(), CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, HEIGHT (+9 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (24): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+16 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.08
Nodes (35): OfferCard, styles, Page(), styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+27 more)

### Community 17 - "PaymentScreen.tsx"
Cohesion: 0.30
Nodes (12): useTrackTripProgress(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.16
Nodes (23): Route(), FunnelIcon(), SortLinesIcon(), chipFor(), countActive(), EMPTY_FILTERS, ExploreFilters, matchesFilters() (+15 more)

### Community 19 - "index.ts"
Cohesion: 0.12
Nodes (9): DriverModeRow(), styles, styles, SectionHeading(), styles, styles, UpdateModalProps, { width: SCREEN_WIDTH } (+1 more)

### Community 20 - "expo-haptics"
Cohesion: 0.11
Nodes (28): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, AboutSection(), DetailRow() (+20 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "useSawari"
Cohesion: 0.10
Nodes (24): NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles, AlertButton, AlertPayload (+16 more)

### Community 23 - "WishlistScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), CarCardSkeleton(), CarListCard, styles, WishlistScreen(), byAvailability()

### Community 24 - "ReferEarnScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, expo-clipboard, expo-status-bar (+7 more)

### Community 25 - "ProfileScreen.tsx"
Cohesion: 0.10
Nodes (26): Route(), Route(), DesignToggle(), ACCOUNT_EMAIL, Dashes(), FONT, HEADER, inr0() (+18 more)

### Community 26 - "react-native"
Cohesion: 0.17
Nodes (10): Route(), SocialLinks(), styles, styles, VehicleSpecs(), SOCIAL_LINKS, SocialLink, react-native (+2 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.16
Nodes (19): expo-device, expo-secure-store, @react-native-async-storage/async-storage, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed() (+11 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (18): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+10 more)

### Community 30 - "react-native-safe-area-context"
Cohesion: 0.06
Nodes (72): Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles (+64 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.19
Nodes (19): Route(), MembershipCelebration(), MembershipSavedPopup(), Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+11 more)

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.20
Nodes (14): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+6 more)

### Community 33 - "API"
Cohesion: 0.19
Nodes (14): loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+6 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+6 more)

### Community 36 - "SawariContext.tsx"
Cohesion: 0.13
Nodes (14): asString(), PushData, PushNotificationHandler(), AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod (+6 more)

### Community 37 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "RefundsScreen.tsx"
Cohesion: 0.33
Nodes (8): Route(), bookingsQueryOptions, useVehicles(), amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 41 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 42 - "formatCurrency"
Cohesion: 0.25
Nodes (7): PriceBreakdownSheet(), ReadyPrice, styles, PLAN_NAMES, PLAN_RATES, TripPrice, BOOKING_ADVANCE_AMOUNT

### Community 43 - "CarListCard.tsx"
Cohesion: 0.25
Nodes (7): ART_H, clearMembershipPopupShown(), shown, styles, Theme, THEMES, react-native-confetti-cannon

### Community 44 - "react"
Cohesion: 0.13
Nodes (13): Route(), Route(), Route(), Route(), Route(), Route(), LocationSheet(), react (+5 more)

### Community 45 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 46 - "FilterSheet.tsx"
Cohesion: 0.22
Nodes (7): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, Category

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.33
Nodes (5): canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 49 - "location.ts"
Cohesion: 0.40
Nodes (5): getDevicePosition(), POSITION_FAILURE_MESSAGE, PositionFailure, PositionResult, withTimeout()

### Community 50 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 52 - "LoginBottomSheet"
Cohesion: 0.31
Nodes (9): digitsOf(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked(), OtpBoxes(), styles (+1 more)

### Community 54 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 55 - "infoPlist"
Cohesion: 0.40
Nodes (5): NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 57 - "TripReviewSheet.tsx"
Cohesion: 0.32
Nodes (7): F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet(), react-native-svg

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 61 - "offers.ts"
Cohesion: 0.60
Nodes (5): fetchOffers(), formatExpiry(), isOfferLive(), plateSafeOfferImage(), plateSafeImageUrl()

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

### Community 72 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 74 - "expo-router"
Cohesion: 0.12
Nodes (20): Route(), Route(), ReviewTrip, rise(), Reveal(), revealedScreens, expo-router, react-native-reanimated (+12 more)

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 489 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `ExploreFilters.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `CarListCard.tsx`, `BottomNavigation.tsx`, `PaymentScreen.tsx`, `SearchScreen.tsx`, `index.ts`, `expo-haptics`, `useSawari`, `WishlistScreen.tsx`, `ReferEarnScreen.tsx`, `ProfileScreen.tsx`, `react-native`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `API`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`, `formatCurrency`, `CarListCard.tsx`, `FilterSheet.tsx`, `useAppUpdates.ts`, `DropoffSheet.tsx`, `LoginBottomSheet`, `AnimatedSplash.tsx`, `TripReviewSheet.tsx`, `expo-router`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `ExploreFilters.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `CarListCard.tsx`, `BottomNavigation.tsx`, `SearchScreen.tsx`, `index.ts`, `expo-haptics`, `useSawari`, `WishlistScreen.tsx`, `ReferEarnScreen.tsx`, `ProfileScreen.tsx`, `fetchWithAuth`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `API`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`, `activity.ts`, `formatCurrency`, `CarListCard.tsx`, `FilterSheet.tsx`, `useAppUpdates.ts`, `DropoffSheet.tsx`, `LoginBottomSheet`, `AnimatedSplash.tsx`, `TripReviewSheet.tsx`, `expo-router`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.11563367252543941 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `PaymentsListScreen.tsx`, `useDetailsPalette`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `CarListCard.tsx`, `BottomNavigation.tsx`, `PaymentScreen.tsx`, `SearchScreen.tsx`, `expo-haptics`, `WishlistScreen.tsx`, `ReferEarnScreen.tsx`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `API`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `LocationSearchBody.tsx`, `RefundsScreen.tsx`, `formatCurrency`, `react`, `DropoffSheet.tsx`, `LoginBottomSheet`, `expo-router`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._