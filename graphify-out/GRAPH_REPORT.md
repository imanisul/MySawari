# Graph Report - MySawari  (2026-11-17)

## Corpus Check
- 254 files · ~1,463,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1692 nodes · 5667 edges · 73 communities (71 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f49bf142`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatesSheet.tsx
- LoadingImage
- formatCurrency
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- sawari.ts
- BookingScreen.tsx
- PolicyScreen.tsx
- HomeSections.tsx
- _layout.tsx
- MembershipScreen.tsx
- LocationSearchBody.tsx
- ExclusiveOfferDetailModal.tsx
- pricingEngine.ts
- SawariContext.tsx
- react
- AnimatedSplash.tsx
- ProfileScreen.tsx
- EditProfileScreen.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- @expo/vector-icons
- ExploreFilters.tsx
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- LoginBottomSheet
- BottomNavigation.tsx
- useDetailsPalette
- detailsPalette.ts
- ReferEarnScreen.tsx
- haptics.ts
- tsconfig.json
- BookingDetailScreen.tsx
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- useDealCars.ts
- recentlyViewed.ts
- index.ts
- activity.ts
- useVehicles.ts
- useSawari
- MySawari customer app: store compliance notes
- FlashSaleScreen
- android
- queryPersistence.ts
- CarDetailsScreen.tsx
- recentSearches.ts
- Reveal.tsx
- scaleText.ts
- secureStore.web.ts
- RewardsScreen.tsx
- ios
- infoPlist
- vehicleKnowledge.ts
- detailsPalette.ts
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- ErrorFallback.tsx
- experiments
- useAppUpdates.ts
- WishlistScreen.tsx
- scripts
- MySawari – store listing text (search)

## God Nodes (most connected - your core abstractions)
1. `react` - 200 edges
2. `useSawari()` - 150 edges
3. `react-native` - 143 edges
4. `useDetailsPalette()` - 136 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 92 edges
7. `expo-router` - 69 edges
8. `react-native-safe-area-context` - 66 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `PlannerScreen()` --calls--> `PlannerSheet()`  [EXTRACTED]
  screens/Home/PlannerScreen.tsx → components/booking/PlannerSheet.tsx
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (73 total, 2 thin omitted)

### Community 0 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 1 - "LoadingImage"
Cohesion: 0.09
Nodes (34): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+26 more)

### Community 2 - "formatCurrency"
Cohesion: 0.13
Nodes (19): WhyRent(), PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, styles (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.12
Nodes (31): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+23 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (34): expo, install, exclude, main, name, private, version, @babel/core (+26 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.06
Nodes (63): Route(), Route(), Route(), Route(), AddressPickerSheet(), TOP_LOCATIONS, DeliveryOptions(), DeliveryPickupCard() (+55 more)

### Community 7 - "sawari.ts"
Cohesion: 0.12
Nodes (15): AvailabilityInfo, baseCars, Block, CarNextBookingWindow, cars, delay(), fetchCars(), fetchResultCars() (+7 more)

### Community 8 - "BookingScreen.tsx"
Cohesion: 0.10
Nodes (29): Route(), Route(), DesignToggle(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, PRO_LAYOUT (+21 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (42): BenefitCards(), ITEMS, styles, BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide (+34 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), LoginGate(), onSplashGone() (+10 more)

### Community 12 - "MembershipScreen.tsx"
Cohesion: 0.07
Nodes (36): Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed() (+28 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (13): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+5 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.17
Nodes (22): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+14 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (26): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+18 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.09
Nodes (21): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+13 more)

### Community 17 - "react"
Cohesion: 0.16
Nodes (11): Route(), Route(), Route(), Route(), Route(), LocationSheet(), react, DriverChargesScreen() (+3 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "ProfileScreen.tsx"
Cohesion: 0.08
Nodes (31): Route(), FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles (+23 more)

### Community 20 - "EditProfileScreen.tsx"
Cohesion: 0.21
Nodes (11): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, EditProfileScreen(), Field (+3 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.11
Nodes (16): Route(), Route(), Header(), OfferCard, useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles (+8 more)

### Community 23 - "react-native"
Cohesion: 0.14
Nodes (18): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+10 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.09
Nodes (28): Route(), AlertButton, AlertPayload, CustomAlert, styles, CitySheet(), styles, ConnectCard() (+20 more)

### Community 25 - "@expo/vector-icons"
Cohesion: 0.15
Nodes (7): styles, styles, styles, VehicleSpecs(), styles, expo-router, @expo/vector-icons

### Community 26 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (25): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+17 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.16
Nodes (19): expo-device, expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed() (+11 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (16): activeSubmissionLocks, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus(), PendingReview (+8 more)

### Community 30 - "HomeCardsRow.tsx"
Cohesion: 0.24
Nodes (8): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), react-native-gesture-handler

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.09
Nodes (12): FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, APPEAR, ARC_SLOTS, GHOST, MONTHS_SHORT (+4 more)

### Community 32 - "LoginBottomSheet"
Cohesion: 0.14
Nodes (27): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+19 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.12
Nodes (17): RootLayoutNav(), BottomBlur(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps (+9 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.12
Nodes (38): Route(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList() (+30 more)

### Community 35 - "detailsPalette.ts"
Cohesion: 0.05
Nodes (77): Route(), Route(), Route(), Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps (+69 more)

### Community 36 - "ReferEarnScreen.tsx"
Cohesion: 0.14
Nodes (7): Route(), expo-status-bar, react-native-qrcode-svg, Rays(), ReferEarnScreen(), styles, BASE_URL

### Community 37 - "haptics.ts"
Cohesion: 0.08
Nodes (18): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles (+10 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "BookingDetailScreen.tsx"
Cohesion: 0.05
Nodes (93): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+85 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "useDealCars.ts"
Cohesion: 0.19
Nodes (31): carGapOn(), DealsCard(), CarTile, LuxuryCarTile, ceilIstHourMs(), dealDayTime(), dealPricing(), dealWhenLabel() (+23 more)

### Community 43 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 44 - "index.ts"
Cohesion: 0.12
Nodes (11): DropoffSheet(), Place, POPULAR, Row(), styles, styles, UpdateModal(), UpdateModalProps (+3 more)

### Community 45 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 46 - "useVehicles.ts"
Cohesion: 0.14
Nodes (22): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+14 more)

### Community 47 - "useSawari"
Cohesion: 0.11
Nodes (30): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, NextTrip() (+22 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "FlashSaleScreen"
Cohesion: 0.18
Nodes (12): Route(), FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen(), styles, FlashSaleScreen(), indiaDayOrdinal(), LiveCountdownHeader() (+4 more)

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "queryPersistence.ts"
Cohesion: 0.33
Nodes (8): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, loadHomeData()

### Community 52 - "CarDetailsScreen.tsx"
Cohesion: 0.12
Nodes (19): BlurTargetContext, BlurTargetProvider(), BlurHost(), styles, styles, CarListCardProps, CarListCardUI, longAvail() (+11 more)

### Community 53 - "recentSearches.ts"
Cohesion: 0.29
Nodes (12): recentSearchesQueryOptions(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 54 - "Reveal.tsx"
Cohesion: 0.53
Nodes (4): rise(), Reveal(), revealedScreens, react-native-reanimated

### Community 55 - "scaleText.ts"
Cohesion: 0.50
Nodes (3): createUnscaled, k, originalCreate

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "RewardsScreen.tsx"
Cohesion: 0.22
Nodes (13): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, ScratchCard(), PendingCard (+5 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 65 - "detailsPalette.ts"
Cohesion: 0.43
Nodes (6): Route(), FaqList(), Faqs, SubPageHeader(), FaqsScreen(), styles

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.11
Nodes (7): styles, VehicleCard(), VehicleCardProps, { width: SCREEN_WIDTH }, bestFor(), getVehicleImage(), vehicleImages

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "useAppUpdates.ts"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 75 - "WishlistScreen.tsx"
Cohesion: 0.39
Nodes (5): Route(), CarListCard, styles, WishlistScreen(), byAvailability()

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 655 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `LocationSearchBody.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `@expo/vector-icons`, `ExploreFilters.tsx`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `useDealCars.ts`, `index.ts`, `useVehicles.ts`, `useSawari`, `FlashSaleScreen`, `CarDetailsScreen.tsx`, `recentSearches.ts`, `Reveal.tsx`, `scaleText.ts`, `RewardsScreen.tsx`, `detailsPalette.ts`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `useAppUpdates.ts`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatesSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `LocationSearchBody.tsx` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `sawari.ts`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `@expo/vector-icons`, `ExploreFilters.tsx`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `index.ts`, `activity.ts`, `useSawari`, `FlashSaleScreen`, `CarDetailsScreen.tsx`, `Reveal.tsx`, `scaleText.ts`, `RewardsScreen.tsx`, `detailsPalette.ts`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `useAppUpdates.ts`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `LocationSearchBody.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `react`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `@expo/vector-icons`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `useDealCars.ts`, `index.ts`, `FlashSaleScreen`, `CarDetailsScreen.tsx`, `recentSearches.ts`, `RewardsScreen.tsx`, `TopDealsScreen.tsx`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._