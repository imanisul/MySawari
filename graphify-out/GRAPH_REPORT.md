# Graph Report - MySawari  (2026-11-01)

## Corpus Check
- 221 files · ~1,338,814 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1375 nodes · 4377 edges · 64 communities (61 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6109a3ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PolicyScreen.tsx
- RefundsScreen.tsx
- useDetailsPalette
- devDependencies
- ErrorBoundary.tsx
- package.json
- haptics.ts
- CarDetailsSections.tsx
- useSawari
- Page.tsx
- HomeSections.tsx
- _layout.tsx
- ProfileScreen.tsx
- LocationSearchBody.tsx
- BookingScreen.tsx
- pricingEngine.ts
- BookingDetailScreen.tsx
- CarListCard.tsx
- HomeScreen.tsx
- FilterSheet.tsx
- dependencies
- useSawari
- react-native
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useSawari
- PaymentsListScreen.tsx
- DatesSheet.tsx
- MembershipScreen.tsx
- DatesSheet.tsx
- FaqsScreen.tsx
- SearchScreen.tsx
- tsconfig.json
- metro.config.js
- BottomNavigation.tsx
- ModalBlur
- DetailsTabs.tsx
- detailsPalette.ts
- SawariContext.tsx
- useAppUpdates.ts
- MySawari customer app: store compliance notes
- BookingsScreen.tsx
- android
- activity.ts
- expo
- recentSearches.ts
- scripts
- secureStore.web.ts
- ios
- infoPlist
- vehicleKnowledge.ts
- ModalBlur
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- ReferEarnScreen.tsx
- experiments
- offers.ts
- CustomAlert.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 172 edges
2. `useSawari()` - 128 edges
3. `react-native` - 122 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 82 edges
7. `react-native-safe-area-context` - 60 edges
8. `expo-router` - 55 edges
9. `ModalBlur()` - 51 edges
10. `CarDetailsScreen()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `OTAUpdateChecker()` --calls--> `UpdateModal()`  [EXTRACTED]
  app/_layout.tsx → components/common/UpdateModal.tsx
- `RootLayout()` --calls--> `PostTripReviewPrompt()`  [EXTRACTED]
  app/_layout.tsx → components/booking/PostTripReviewPrompt.tsx

## Import Cycles
- None detected.

## Communities (64 total, 3 thin omitted)

### Community 0 - "PolicyScreen.tsx"
Cohesion: 0.07
Nodes (40): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+32 more)

### Community 1 - "RefundsScreen.tsx"
Cohesion: 0.19
Nodes (12): HomeLoadStep, loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+4 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.13
Nodes (32): Route(), CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, Benefits() (+24 more)

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
Cohesion: 0.06
Nodes (59): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+51 more)

### Community 7 - "CarDetailsSections.tsx"
Cohesion: 0.13
Nodes (21): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MembershipPicker() (+13 more)

### Community 8 - "useSawari"
Cohesion: 0.17
Nodes (16): Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet(), styles (+8 more)

### Community 9 - "Page.tsx"
Cohesion: 0.36
Nodes (7): BlurTargetContext, BlurTargetProvider(), Page(), styles, BottomNavigation(), bottomNavOffset(), useBottomNavHeight()

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (25): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE (+17 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (16): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), CustomAlertProvider(), asString() (+8 more)

### Community 12 - "ProfileScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile(), PlanKey (+7 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.18
Nodes (23): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, HomeCarSkeleton(), HomeCarSkeletonProps (+15 more)

### Community 14 - "BookingScreen.tsx"
Cohesion: 0.11
Nodes (28): Route(), MembershipCelebration(), MembershipSavedPopup(), PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes() (+20 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired(), calculatePickupCharge() (+17 more)

### Community 16 - "BookingDetailScreen.tsx"
Cohesion: 0.11
Nodes (42): Route(), CancelBookingSheet(), Field(), REASONS, styles, ManageBookingSheet(), styles, RefundTrackingModal() (+34 more)

### Community 17 - "CarListCard.tsx"
Cohesion: 0.20
Nodes (9): clearMembershipPopupShown(), Layout, OTHER_LAYOUT, shown, STARTER_LAYOUT, styles, Theme, THEMES (+1 more)

### Community 18 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (23): Route(), onSplashGone(), CitySheet(), styles, BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard() (+15 more)

### Community 19 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "useSawari"
Cohesion: 0.11
Nodes (25): RootLayoutNav(), NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, SearchCard() (+17 more)

### Community 23 - "react-native"
Cohesion: 0.14
Nodes (17): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+9 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (30): CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars, Block (+22 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useSawari"
Cohesion: 0.24
Nodes (10): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+2 more)

### Community 31 - "PaymentsListScreen.tsx"
Cohesion: 0.11
Nodes (15): Route(), Route(), Header(), styles, OfferCard, PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 32 - "DatesSheet.tsx"
Cohesion: 0.13
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 33 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), expo-status-bar, ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard() (+7 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.06
Nodes (33): Route(), Route(), Route(), Route(), Route(), Route(), Route(), Route() (+25 more)

### Community 35 - "FaqsScreen.tsx"
Cohesion: 0.33
Nodes (7): Route(), FaqList(), Faqs, styles, SubPageHeader(), FaqsScreen(), styles

### Community 37 - "SearchScreen.tsx"
Cohesion: 0.06
Nodes (63): Route(), Route(), FunnelIcon(), SortArrowsIcon(), rise(), Reveal(), revealedScreens, ALL_BUDGETS (+55 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 40 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 41 - "BottomNavigation.tsx"
Cohesion: 0.15
Nodes (12): ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route, styles, BOTTOM_NAV_CONTENT_HEIGHT (+4 more)

### Community 42 - "ModalBlur"
Cohesion: 0.16
Nodes (14): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+6 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.10
Nodes (32): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+24 more)

### Community 45 - "detailsPalette.ts"
Cohesion: 0.06
Nodes (59): Route(), Route(), Route(), Route(), Route(), Route(), Dashes(), DesignToggle() (+51 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (22): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, SawariProvider() (+14 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "BookingsScreen.tsx"
Cohesion: 0.13
Nodes (21): Route(), Route(), driverLabel(), shortDate(), tripTotal(), bookingsQueryOptions, BookingsScreen(), BookingTab (+13 more)

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "activity.ts"
Cohesion: 0.29
Nodes (9): getSessionId(), BackendNotification, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce(), registrationQueue, sendRegistration() (+1 more)

### Community 53 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 55 - "recentSearches.ts"
Cohesion: 0.15
Nodes (22): Route(), useTrackTripProgress(), PaymentScreen(), styles, calculateCouponDiscount(), addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed() (+14 more)

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 66 - "ModalBlur"
Cohesion: 0.19
Nodes (12): ExtendBookingSheet(), styles, RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey, SortSheet(), styles (+4 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ReferEarnScreen.tsx"
Cohesion: 0.21
Nodes (14): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, expo-linear-gradient, ConfirmationScreen() (+6 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), offersQueryOptions, plateSafeOfferImage(), plateSafeImageUrl()

### Community 75 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 533 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `DatesSheet.tsx` to `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `CarDetailsSections.tsx`, `useSawari`, `Page.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `BookingScreen.tsx`, `BookingDetailScreen.tsx`, `CarListCard.tsx`, `HomeScreen.tsx`, `FilterSheet.tsx`, `useSawari`, `react-native`, `AnimatedSplash.tsx`, `sawari.ts`, `useSawari`, `PaymentsListScreen.tsx`, `DatesSheet.tsx`, `MembershipScreen.tsx`, `FaqsScreen.tsx`, `SearchScreen.tsx`, `BottomNavigation.tsx`, `ModalBlur`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `recentSearches.ts`, `ModalBlur`, `ReferEarnScreen.tsx`, `CustomAlert.tsx`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07058823529411765 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `CarDetailsSections.tsx`, `useSawari`, `Page.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `BookingScreen.tsx`, `BookingDetailScreen.tsx`, `CarListCard.tsx`, `HomeScreen.tsx`, `FilterSheet.tsx`, `useSawari`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `useSawari`, `PaymentsListScreen.tsx`, `DatesSheet.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `FaqsScreen.tsx`, `SearchScreen.tsx`, `BottomNavigation.tsx`, `ModalBlur`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `activity.ts`, `recentSearches.ts`, `ModalBlur`, `ReferEarnScreen.tsx`, `CustomAlert.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.13015873015873017 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._