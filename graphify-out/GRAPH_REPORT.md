# Graph Report - MySawari  (2026-11-04)

## Corpus Check
- 229 files · ~1,349,382 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1428 nodes · 4631 edges · 72 communities (69 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `11f4b0cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PolicyScreen.tsx
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
- useColors.ts
- BookingScreen.tsx
- AnimatedSplash.tsx
- formatCurrency
- react
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- ModalBlur
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- TripDetailParts.tsx
- ProfileScreen.tsx
- useSawari
- useVehicles
- MembershipScreen.tsx
- react-native-safe-area-context
- activity.ts
- tsconfig.json
- ReferEarnScreen.tsx
- API
- recentlyViewed.ts
- BookingsScreen.tsx
- index.ts
- FilterSheet.tsx
- haptics.ts
- SawariContext.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- SearchEmptyState.tsx
- android
- RefundsScreen.tsx
- MembershipSavedPopup.tsx
- PaymentScreen.tsx
- offers.ts
- useColors
- CustomAlert.tsx
- CitySheet.tsx
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- CarListCard.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- experiments
- ErrorFallback.tsx
- scripts

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

## Communities (72 total, 3 thin omitted)

### Community 0 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.36
Nodes (10): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), removeRecentSearch(), saveRecentSearch(), SearchBase, searchIdFor() (+2 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.05
Nodes (87): Route(), Route(), AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl() (+79 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ExploreScreen.tsx"
Cohesion: 0.14
Nodes (24): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, QuickChip (+16 more)

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (36): expo, install, exclude, main, name, private, version, @babel/core (+28 more)

### Community 6 - "haptics.ts"
Cohesion: 0.06
Nodes (58): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+50 more)

### Community 7 - "DatesSheet.tsx"
Cohesion: 0.07
Nodes (33): Route(), Route(), Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour() (+25 more)

### Community 8 - "LoginBottomSheet"
Cohesion: 0.18
Nodes (20): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+12 more)

### Community 9 - "ExploreFilters.tsx"
Cohesion: 0.10
Nodes (25): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+17 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (24): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HomeHero() (+16 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (19): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar() (+11 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (17): Page(), styles, ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+9 more)

### Community 13 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (32): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+24 more)

### Community 14 - "BookingDetailScreen.tsx"
Cohesion: 0.16
Nodes (24): Route(), CancelBookingSheet(), Field(), REASONS, styles, ManageBookingSheet(), styles, useTripColors() (+16 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+17 more)

### Community 16 - "useColors.ts"
Cohesion: 0.12
Nodes (13): SkeletonProps, styles, styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, styles, styles (+5 more)

### Community 17 - "BookingScreen.tsx"
Cohesion: 0.22
Nodes (13): Route(), MembershipCelebration(), MembershipSavedPopup(), useLiveCar(), BookingScreen(), dayAndTime(), FONT, longWhen() (+5 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.19
Nodes (14): LoginGate(), AnimatedG, AnimatedSplash(), markSplashGone(), onSplashGone(), splashGoneListeners, SplashStep, styles (+6 more)

### Community 19 - "formatCurrency"
Cohesion: 0.23
Nodes (12): Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, PLAN_NAMES, PLAN_RATES, TripPrice (+4 more)

### Community 20 - "react"
Cohesion: 0.18
Nodes (9): Route(), Route(), Route(), Route(), LocationSheet(), react, DriverChargesScreen(), LocationScreen() (+1 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.12
Nodes (15): Route(), Route(), Header(), OfferCard, useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 23 - "react-native"
Cohesion: 0.15
Nodes (18): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+10 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (27): Route(), BenefitsGrid(), ConnectCard(), DestinationTile(), HOME_PURPLE, HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard() (+19 more)

### Community 25 - "ModalBlur"
Cohesion: 0.18
Nodes (13): ExtendBookingSheet(), styles, RefundTrackingModal(), RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey, SortSheet() (+5 more)

### Community 26 - "sawari.ts"
Cohesion: 0.12
Nodes (26): sortCars(), CarTile, styles, LuxuryCarTile, AvailabilityInfo, baseCars, Block, buildBlocks() (+18 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (18): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+10 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.14
Nodes (19): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, HomeLoadStep (+11 more)

### Community 31 - "TripDetailParts.tsx"
Cohesion: 0.17
Nodes (19): BookingCard(), Dash(), MONTHS, placeName(), PricingSummary(), refundStage(), RefundTimeline(), Row() (+11 more)

### Community 32 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (16): Route(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+8 more)

### Community 33 - "useSawari"
Cohesion: 0.18
Nodes (17): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+9 more)

### Community 34 - "useVehicles"
Cohesion: 0.50
Nodes (4): Route(), CarCardSkeleton(), useVehicles(), WishlistScreen()

### Community 35 - "MembershipScreen.tsx"
Cohesion: 0.19
Nodes (15): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+7 more)

### Community 36 - "react-native-safe-area-context"
Cohesion: 0.17
Nodes (12): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+4 more)

### Community 37 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "ReferEarnScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, react-native-svg, ConfirmationScreen() (+7 more)

### Community 40 - "API"
Cohesion: 0.21
Nodes (12): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+4 more)

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 42 - "BookingsScreen.tsx"
Cohesion: 0.16
Nodes (16): Route(), driverLabel(), rise(), Reveal(), revealedScreens, react-native-reanimated, BookingsScreen(), BookingTab (+8 more)

### Community 43 - "index.ts"
Cohesion: 0.22
Nodes (6): Route(), PlannerSheet(), styles, styles, TripField(), PlannerScreen()

### Community 44 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (54): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+46 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.15
Nodes (12): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+4 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.25
Nodes (6): canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants, expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "SearchEmptyState.tsx"
Cohesion: 0.50
Nodes (3): Action, styles, useBrandColors()

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "RefundsScreen.tsx"
Cohesion: 0.31
Nodes (7): Route(), bookingsQueryOptions, amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 52 - "MembershipSavedPopup.tsx"
Cohesion: 0.22
Nodes (8): Layout, OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT, styles, Theme, THEMES

### Community 53 - "PaymentScreen.tsx"
Cohesion: 0.43
Nodes (6): Route(), DesignToggle(), useTrackTripProgress(), PaymentScreen(), styles, calculateCouponDiscount()

### Community 54 - "offers.ts"
Cohesion: 0.43
Nodes (7): fetchOffers(), formatExpiry(), hydrateOffers(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 55 - "useColors"
Cohesion: 0.11
Nodes (20): NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles (+12 more)

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "CitySheet.tsx"
Cohesion: 0.50
Nodes (3): CitySheet(), styles, CITIES

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.17
Nodes (17): Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, styles (+9 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "CarListCard.tsx"
Cohesion: 0.24
Nodes (11): CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), useFavorites() (+3 more)

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
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 548 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PolicyScreen.tsx`, `useVehicles.ts`, `useDetailsPalette`, `ExploreScreen.tsx`, `package.json`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `ExploreFilters.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `useColors.ts`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `formatCurrency`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ModalBlur`, `sawari.ts`, `TripDetailParts.tsx`, `ProfileScreen.tsx`, `useSawari`, `useVehicles`, `MembershipScreen.tsx`, `react-native-safe-area-context`, `ReferEarnScreen.tsx`, `API`, `BookingsScreen.tsx`, `index.ts`, `FilterSheet.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `RefundsScreen.tsx`, `MembershipSavedPopup.tsx`, `PaymentScreen.tsx`, `useColors`, `CustomAlert.tsx`, `CitySheet.tsx`, `@expo/vector-icons`, `CarListCard.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PolicyScreen.tsx`, `useDetailsPalette`, `ExploreScreen.tsx`, `package.json`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `ExploreFilters.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `useColors.ts`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `formatCurrency`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ModalBlur`, `sawari.ts`, `fetchWithAuth`, `TripDetailParts.tsx`, `ProfileScreen.tsx`, `useSawari`, `MembershipScreen.tsx`, `react-native-safe-area-context`, `activity.ts`, `ReferEarnScreen.tsx`, `API`, `BookingsScreen.tsx`, `index.ts`, `FilterSheet.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `RefundsScreen.tsx`, `MembershipSavedPopup.tsx`, `PaymentScreen.tsx`, `useColors`, `CustomAlert.tsx`, `CitySheet.tsx`, `@expo/vector-icons`, `CarListCard.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.05133599831685252 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `useVehicles.ts`, `useDetailsPalette`, `ExploreScreen.tsx`, `haptics.ts`, `DatesSheet.tsx`, `LoginBottomSheet`, `_layout.tsx`, `BottomNavigation.tsx`, `SawariContext.tsx`, `BookingDetailScreen.tsx`, `useColors.ts`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `formatCurrency`, `react`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ModalBlur`, `sawari.ts`, `ProfileScreen.tsx`, `useVehicles`, `MembershipScreen.tsx`, `react-native-safe-area-context`, `ReferEarnScreen.tsx`, `API`, `BookingsScreen.tsx`, `index.ts`, `haptics.ts`, `SawariContext.tsx`, `SearchEmptyState.tsx`, `RefundsScreen.tsx`, `MembershipSavedPopup.tsx`, `PaymentScreen.tsx`, `useColors`, `@expo/vector-icons`, `CarListCard.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `ExploreScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._