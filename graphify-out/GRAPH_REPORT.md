# Graph Report - MySawari  (2026-10-31)

## Corpus Check
- 214 files · ~1,320,317 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1335 nodes · 4277 edges · 61 communities (58 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6ab082a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- VehicleSummary.tsx
- PolicyScreen.tsx
- useDetailsPalette
- devDependencies
- ErrorFallback.tsx
- package.json
- expo-haptics
- MembershipScreen.tsx
- index.ts
- sawari.ts
- HomeSections.tsx
- _layout.tsx
- useVehicles.ts
- LocationSearchBody.tsx
- react-native
- pricingEngine.ts
- BookingScreen.tsx
- BookingDetailScreen.tsx
- SearchScreen.tsx
- AddressSearchScreen.tsx
- DetailsTabs.tsx
- dependencies
- ConfirmationScreen.tsx
- SearchEmptyState.tsx
- useColors
- EditProfileScreen.tsx
- formatCurrency
- expo
- fetchWithAuth
- api.ts
- useSawari
- BottomNavigation.tsx
- CarListCard.tsx
- DatesSheet.tsx
- SawariContext.tsx
- SearchScreen.tsx
- tsconfig.json
- react-native-safe-area-context
- PushNotificationHandler.tsx
- activity.ts
- metro.config.js
- react-native-safe-area-context
- SettingsScreen.tsx
- AnimatedSplash.tsx
- useAppUpdates.ts
- MySawari customer app: store compliance notes
- DriverChargesScreen.tsx
- offers.ts
- PaymentFailed
- expo
- scripts
- secureStore.web.ts
- recentSearches.ts
- detailsPalette.ts
- react
- vehicleKnowledge.ts
- WishlistScreen.tsx
- PaymentScreen.tsx
- recentlyViewed.ts
- vehicleImages.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 169 edges
2. `useSawari()` - 126 edges
3. `react-native` - 119 edges
4. `useDetailsPalette()` - 114 edges
5. `useColors()` - 112 edges
6. `@expo/vector-icons` - 81 edges
7. `react-native-safe-area-context` - 59 edges
8. `expo-router` - 56 edges
9. `expo-haptics` - 52 edges
10. `ModalBlur()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `RootLayout()` --calls--> `ErrorBoundary`  [EXTRACTED]
  app/_layout.tsx → components/common/ErrorBoundary.tsx
- `RootLayout()` --calls--> `PushNotificationHandler()`  [EXTRACTED]
  app/_layout.tsx → components/notifications/PushNotificationHandler.tsx
- `RootLayout()` --calls--> `SawariProvider()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (61 total, 3 thin omitted)

### Community 0 - "VehicleSummary.tsx"
Cohesion: 0.14
Nodes (25): Route(), AddressPickerSheet(), styles, DeliveryOptions(), DeliveryPickupCard(), DRIVER_CHARGE_PER_DAY, DriverCard(), MODES (+17 more)

### Community 1 - "PolicyScreen.tsx"
Cohesion: 0.07
Nodes (39): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+31 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.13
Nodes (39): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey() (+31 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorFallback.tsx"
Cohesion: 0.22
Nodes (5): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (38): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+30 more)

### Community 6 - "expo-haptics"
Cohesion: 0.11
Nodes (29): Route(), DropoffSheet(), Place, POPULAR, Row(), styles, isInNortheast(), SearchPlace (+21 more)

### Community 7 - "MembershipScreen.tsx"
Cohesion: 0.17
Nodes (15): Route(), expo-status-bar, ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard() (+7 more)

### Community 8 - "index.ts"
Cohesion: 0.12
Nodes (21): Route(), Route(), Route(), Route(), styles, DriverOptionSheet(), OptionCard(), styles (+13 more)

### Community 9 - "sawari.ts"
Cohesion: 0.11
Nodes (29): sortCars(), CarTile, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars, Block (+21 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (47): Route(), onSplashGone(), AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }, ArcHeadline() (+39 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.18
Nodes (12): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+4 more)

### Community 12 - "useVehicles.ts"
Cohesion: 0.18
Nodes (14): bookingsQueryOptions, HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages (+6 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "react-native"
Cohesion: 0.15
Nodes (16): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupportInner() (+8 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+17 more)

### Community 16 - "BookingScreen.tsx"
Cohesion: 0.14
Nodes (19): Route(), ART_H, clearMembershipPopupShown(), MembershipCelebration(), MembershipSavedPopup(), shown, styles, Theme (+11 more)

### Community 17 - "BookingDetailScreen.tsx"
Cohesion: 0.06
Nodes (73): Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles (+65 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.15
Nodes (19): BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet(), FEATURES, FUELS, matchesFilters() (+11 more)

### Community 19 - "AddressSearchScreen.tsx"
Cohesion: 0.38
Nodes (5): Route(), TOP_LOCATIONS, AddressSearchScreen(), Place, styles

### Community 20 - "DetailsTabs.tsx"
Cohesion: 0.11
Nodes (28): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, AboutSection(), DetailRow() (+20 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "ConfirmationScreen.tsx"
Cohesion: 0.29
Nodes (8): Route(), BlurHost(), BlurTarget(), styles, ConfirmationScreen(), FONT, NEXT, styles

### Community 23 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 24 - "useColors"
Cohesion: 0.09
Nodes (28): NotFoundScreen(), styles, DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles (+20 more)

### Community 25 - "EditProfileScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 26 - "formatCurrency"
Cohesion: 0.18
Nodes (14): BottomBlur(), PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar() (+6 more)

### Community 27 - "expo"
Cohesion: 0.04
Nodes (45): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+37 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.10
Nodes (15): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+7 more)

### Community 30 - "useSawari"
Cohesion: 0.24
Nodes (10): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+2 more)

### Community 32 - "BottomNavigation.tsx"
Cohesion: 0.06
Nodes (46): Route(), Route(), BlurTargetContext, BlurTargetProvider(), Page(), styles, ALL_ITEMS, BottomNavigation() (+38 more)

### Community 33 - "CarListCard.tsx"
Cohesion: 0.31
Nodes (8): CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, bestFor(), Car

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.13
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 36 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (16): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, expo-constants (+8 more)

### Community 37 - "SearchScreen.tsx"
Cohesion: 0.15
Nodes (22): Route(), FunnelIcon(), SortLinesIcon(), chipFor(), countActive(), EMPTY_FILTERS, ExploreFilters, QUICK_CHIPS (+14 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "react-native-safe-area-context"
Cohesion: 0.17
Nodes (11): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+3 more)

### Community 40 - "PushNotificationHandler.tsx"
Cohesion: 0.40
Nodes (4): asString(), PushData, PushNotificationHandler(), mockNotifications

### Community 41 - "activity.ts"
Cohesion: 0.21
Nodes (14): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS (+6 more)

### Community 43 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 44 - "react-native-safe-area-context"
Cohesion: 0.12
Nodes (17): styles, F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet(), styles (+9 more)

### Community 45 - "SettingsScreen.tsx"
Cohesion: 0.07
Nodes (48): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+40 more)

### Community 46 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 50 - "DriverChargesScreen.tsx"
Cohesion: 0.25
Nodes (5): Route(), Route(), DriverChargesSheet(), DriverChargesScreen(), DriverOptionScreen()

### Community 52 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 53 - "PaymentFailed"
Cohesion: 0.33
Nodes (6): Route(), FONT, PaymentFailed(), styles, SUPPORT_EMAIL, PaymentErrorScreen()

### Community 54 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "recentSearches.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 61 - "detailsPalette.ts"
Cohesion: 0.18
Nodes (13): Route(), Route(), FaqList(), Faqs, dark, light, styles, SubPageHeader() (+5 more)

### Community 62 - "react"
Cohesion: 0.10
Nodes (17): Route(), Route(), Header(), styles, OfferCard, useKeyboardPad(), react, PaymentMethodItem (+9 more)

### Community 64 - "WishlistScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), CarCardSkeleton(), useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 65 - "PaymentScreen.tsx"
Cohesion: 0.48
Nodes (5): Route(), Reveal(), useTrackTripProgress(), PaymentScreen(), styles

### Community 66 - "recentlyViewed.ts"
Cohesion: 0.50
Nodes (7): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem, LocationResult

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 507 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `VehicleSummary.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `MembershipScreen.tsx`, `index.ts`, `sawari.ts`, `HomeSections.tsx`, `_layout.tsx`, `LocationSearchBody.tsx`, `react-native`, `BookingScreen.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `AddressSearchScreen.tsx`, `DetailsTabs.tsx`, `ConfirmationScreen.tsx`, `SearchEmptyState.tsx`, `useColors`, `EditProfileScreen.tsx`, `formatCurrency`, `useSawari`, `BottomNavigation.tsx`, `CarListCard.tsx`, `DatesSheet.tsx`, `SawariContext.tsx`, `SearchScreen.tsx`, `react-native-safe-area-context`, `PushNotificationHandler.tsx`, `react-native-safe-area-context`, `SettingsScreen.tsx`, `AnimatedSplash.tsx`, `useAppUpdates.ts`, `DriverChargesScreen.tsx`, `PaymentFailed`, `recentSearches.ts`, `detailsPalette.ts`, `WishlistScreen.tsx`, `PaymentScreen.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `VehicleSummary.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14482758620689656 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `VehicleSummary.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `package.json`, `expo-haptics`, `MembershipScreen.tsx`, `index.ts`, `sawari.ts`, `HomeSections.tsx`, `_layout.tsx`, `LocationSearchBody.tsx`, `BookingScreen.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `AddressSearchScreen.tsx`, `DetailsTabs.tsx`, `ConfirmationScreen.tsx`, `SearchEmptyState.tsx`, `useColors`, `EditProfileScreen.tsx`, `formatCurrency`, `fetchWithAuth`, `useSawari`, `BottomNavigation.tsx`, `CarListCard.tsx`, `DatesSheet.tsx`, `SawariContext.tsx`, `SearchScreen.tsx`, `react-native-safe-area-context`, `activity.ts`, `react-native-safe-area-context`, `SettingsScreen.tsx`, `AnimatedSplash.tsx`, `useAppUpdates.ts`, `PaymentFailed`, `detailsPalette.ts`, `react`, `WishlistScreen.tsx`, `PaymentScreen.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.13240418118466898 - nodes in this community are weakly interconnected._