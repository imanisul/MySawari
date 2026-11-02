# Graph Report - MySawari  (2026-11-02)

## Corpus Check
- 223 files · ~1,340,162 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1388 nodes · 4462 edges · 73 communities (68 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a080bf8`
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
- ProfileScreen.tsx
- useColors
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- useSawari
- pricingEngine.ts
- index.ts
- BookingDetailScreen.tsx
- HomeScreen.tsx
- detailsPalette.ts
- ModalBlur
- dependencies
- react
- react-native
- CarListCard.tsx
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- DropoffSheet.tsx
- API
- BookingsScreen.tsx
- PaymentProcessingScreen.tsx
- LocationSheet
- RefundsScreen.tsx
- HomeHero
- ExploreFilters.tsx
- tsconfig.json
- WishlistScreen.tsx
- haptics.ts
- MembershipScreen.tsx
- VehicleHeroGallery.tsx
- DriverOptionScreen.tsx
- DetailsTabs.tsx
- detailsPalette.ts
- SawariContext.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- DriverChargesScreen.tsx
- android
- activity.ts
- metro.config.js
- expo
- react-native-safe-area-context
- CustomAlert.tsx
- scripts
- CitySheet.tsx
- secureStore.web.ts
- SearchEmptyState.tsx
- ios
- infoPlist
- vehicleKnowledge.ts
- TopPickCard
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- ConfirmationScreen.tsx
- experiments
- offers.ts
- RewardsScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 173 edges
2. `useSawari()` - 127 edges
3. `react-native` - 122 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 82 edges
7. `react-native-safe-area-context` - 60 edges
8. `expo-router` - 57 edges
9. `ModalBlur()` - 51 edges
10. `LoginBottomSheet()` - 40 edges

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

## Communities (73 total, 5 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.07
Nodes (40): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+32 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.11
Nodes (30): HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages() (+22 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.12
Nodes (44): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey() (+36 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.22
Nodes (5): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.08
Nodes (50): Route(), Route(), Route(), BlurTargetProvider(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions() (+42 more)

### Community 7 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (16): Route(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+8 more)

### Community 8 - "useColors"
Cohesion: 0.16
Nodes (22): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles (+14 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.13
Nodes (27): Route(), FunnelIcon(), SortArrowsIcon(), Page(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+19 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.08
Nodes (16): BENEFITS, ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE, ImageSlide, SHADOW (+8 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+10 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.11
Nodes (34): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+26 more)

### Community 14 - "useSawari"
Cohesion: 0.05
Nodes (58): Route(), Route(), BottomBlur(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps (+50 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (28): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+20 more)

### Community 16 - "index.ts"
Cohesion: 0.09
Nodes (14): Route(), SetLocationSheet(), styles, styles, SectionHeading(), styles, styles, styles (+6 more)

### Community 17 - "BookingDetailScreen.tsx"
Cohesion: 0.13
Nodes (38): Route(), CancelBookingSheet(), Field(), REASONS, styles, ManageBookingSheet(), styles, RefundTrackingModal() (+30 more)

### Community 18 - "HomeScreen.tsx"
Cohesion: 0.14
Nodes (20): Route(), BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard(), ReferStrip() (+12 more)

### Community 19 - "detailsPalette.ts"
Cohesion: 0.20
Nodes (11): Route(), FaqList(), Faqs, dark, DetailsPalette, light, styles, SubPageHeader() (+3 more)

### Community 20 - "ModalBlur"
Cohesion: 0.14
Nodes (18): ReviewModal(), ReviewTrip, styles, SORT_OPTIONS, SortKey, SortSheet(), styles, F (+10 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "react"
Cohesion: 0.14
Nodes (12): Route(), Header(), OfferCard, useKeyboardPad(), react, PaymentMethodItem, PaymentsScreen(), styles (+4 more)

### Community 23 - "react-native"
Cohesion: 0.15
Nodes (16): SearchCard(), styles, SearchSheet(), styles, styles, styles, styles, styles (+8 more)

### Community 24 - "CarListCard.tsx"
Cohesion: 0.27
Nodes (9): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, useFavorites(), ActivityAPI, bestFor() (+1 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (27): sortCars(), CarTile, styles, LuxuryCarTile, isPastSearch(), AvailabilityInfo, baseCars, Block (+19 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 31 - "API"
Cohesion: 0.38
Nodes (5): styles, RefundTrackingModalProps, styles, API, BookingSnapshot

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.19
Nodes (14): Route(), ExtendBookingSheet(), driverLabel(), useVehicles(), BookingsScreen(), BookingTab, byRecent(), Empty() (+6 more)

### Community 33 - "PaymentProcessingScreen.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+6 more)

### Community 34 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 35 - "RefundsScreen.tsx"
Cohesion: 0.18
Nodes (13): Route(), getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, expo-image (+5 more)

### Community 36 - "HomeHero"
Cohesion: 0.33
Nodes (6): ArcHeadline(), HomeHero(), parseSubtitleTags(), splitTitleIntoTwoLines(), splitWords(), Sunburst()

### Community 37 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "WishlistScreen.tsx"
Cohesion: 0.39
Nodes (5): Route(), CarCardSkeleton(), CarListCard, styles, WishlistScreen()

### Community 40 - "haptics.ts"
Cohesion: 0.08
Nodes (17): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, NextTrip(), styles (+9 more)

### Community 41 - "MembershipScreen.tsx"
Cohesion: 0.13
Nodes (23): Route(), Route(), BlurHost(), BlurTarget(), styles, expo-linear-gradient, ActiveMembership, activeOnly() (+15 more)

### Community 42 - "VehicleHeroGallery.tsx"
Cohesion: 0.32
Nodes (6): PhotoViewer(), styles, HEIGHT, styles, VehicleHeroGallery(), { width }

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.12
Nodes (25): rise(), Reveal(), revealedScreens, AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection() (+17 more)

### Community 45 - "detailsPalette.ts"
Cohesion: 0.07
Nodes (51): Route(), Route(), Route(), Route(), Route(), Dashes(), DesignToggle(), longStamp() (+43 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (15): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+7 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 52 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 53 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 55 - "react-native-safe-area-context"
Cohesion: 0.11
Nodes (23): Route(), Route(), FONT, styles, FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES, styles (+15 more)

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 58 - "CitySheet.tsx"
Cohesion: 0.50
Nodes (3): CitySheet(), styles, CITIES

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "SearchEmptyState.tsx"
Cohesion: 0.50
Nodes (3): Action, styles, useBrandColors()

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "TopPickCard"
Cohesion: 0.50
Nodes (4): cardDate(), TopPickCard(), memberDayPrice(), carTitle()

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ConfirmationScreen.tsx"
Cohesion: 0.24
Nodes (10): Route(), Dash(), PricingSummary(), Row(), tripTotal(), bookingsQueryOptions, ConfirmationScreen(), FONT (+2 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 75 - "RewardsScreen.tsx"
Cohesion: 0.47
Nodes (4): Route(), F, RewardsScreen(), styles

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 538 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ProfileScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `useSawari`, `index.ts`, `BookingDetailScreen.tsx`, `HomeScreen.tsx`, `detailsPalette.ts`, `ModalBlur`, `react-native`, `CarListCard.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `DropoffSheet.tsx`, `API`, `BookingsScreen.tsx`, `PaymentProcessingScreen.tsx`, `LocationSheet`, `RefundsScreen.tsx`, `ExploreFilters.tsx`, `WishlistScreen.tsx`, `haptics.ts`, `MembershipScreen.tsx`, `VehicleHeroGallery.tsx`, `DriverOptionScreen.tsx`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `DriverChargesScreen.tsx`, `react-native-safe-area-context`, `CustomAlert.tsx`, `CitySheet.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`, `RewardsScreen.tsx`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.07137254901960784 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `package.json`, `haptics.ts`, `ProfileScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `useSawari`, `index.ts`, `BookingDetailScreen.tsx`, `HomeScreen.tsx`, `detailsPalette.ts`, `ModalBlur`, `react`, `CarListCard.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `DropoffSheet.tsx`, `API`, `BookingsScreen.tsx`, `PaymentProcessingScreen.tsx`, `RefundsScreen.tsx`, `ExploreFilters.tsx`, `WishlistScreen.tsx`, `haptics.ts`, `MembershipScreen.tsx`, `VehicleHeroGallery.tsx`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `activity.ts`, `react-native-safe-area-context`, `CustomAlert.tsx`, `CitySheet.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`, `RewardsScreen.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `useVehicles.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.11748381128584644 - nodes in this community are weakly interconnected._