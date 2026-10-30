# Graph Report - MySawari  (2026-10-30)

## Corpus Check
- 210 files · ~1,268,382 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1302 nodes · 4218 edges · 51 communities (47 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `241188c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PaymentsListScreen.tsx
- PolicyScreen.tsx
- useDetailsPalette
- devDependencies
- ErrorFallback.tsx
- package.json
- expo-haptics
- ExploreFilters.tsx
- useColors
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- recentSearches.ts
- LocationSearchBody.tsx
- DropoffSheet.tsx
- pricingEngine.ts
- BottomNavigation.tsx
- BookingDetailScreen.tsx
- SearchScreen.tsx
- react-native
- DetailsTabs.tsx
- dependencies
- @expo/vector-icons
- timedFetch
- FilterSheet.tsx
- EditProfileScreen.tsx
- WishlistScreen.tsx
- expo
- fetchWithAuth
- api.ts
- SearchEmptyState.tsx
- PlannerScreen.tsx
- MembershipScreen.tsx
- API
- DatesSheet.tsx
- SawariContext.tsx
- index.ts
- tsconfig.json
- activity.ts
- react
- MyWalletScreen.tsx
- useAppUpdates.ts
- recentlyViewed.ts
- offers.ts
- expo-linear-gradient
- AnimatedSplash.tsx
- scripts
- secureStore.web.ts
- vehicleKnowledge.ts
- vehicleImages.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 167 edges
2. `useSawari()` - 126 edges
3. `react-native` - 118 edges
4. `useDetailsPalette()` - 114 edges
5. `useColors()` - 112 edges
6. `@expo/vector-icons` - 81 edges
7. `react-native-safe-area-context` - 59 edges
8. `expo-router` - 56 edges
9. `expo-haptics` - 52 edges
10. `ModalBlur()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (51 total, 4 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.15
Nodes (10): Route(), Route(), Header(), faqs, HelpScreen(), styles, SafetyScreen(), styles (+2 more)

### Community 1 - "PolicyScreen.tsx"
Cohesion: 0.08
Nodes (30): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+22 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.06
Nodes (78): Route(), Route(), F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet() (+70 more)

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
Cohesion: 0.09
Nodes (41): Route(), Route(), Route(), styles, TOP_LOCATIONS, isInNortheast(), SearchPlace, usePlaceSearch() (+33 more)

### Community 7 - "ExploreFilters.tsx"
Cohesion: 0.14
Nodes (20): BODY_ORDER, brandOf(), BUDGETS, Cta(), EMPTY_FILTERS, ExploreFilterSheet(), FEATURES, FUELS (+12 more)

### Community 8 - "useColors"
Cohesion: 0.22
Nodes (17): NotFoundScreen(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet(), styles, PlannerSheet() (+9 more)

### Community 9 - "sawari.ts"
Cohesion: 0.10
Nodes (30): sortCars(), CarTile, styles, LuxuryCarTile, isPastSearch(), AvailabilityInfo, baseCars, Block (+22 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.06
Nodes (50): Route(), onSplashGone(), AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }, ArcHeadline() (+42 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.12
Nodes (20): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+12 more)

### Community 12 - "recentSearches.ts"
Cohesion: 0.30
Nodes (12): useTrackTripProgress(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.09
Nodes (39): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+31 more)

### Community 14 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 15 - "pricingEngine.ts"
Cohesion: 0.13
Nodes (21): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+13 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.05
Nodes (51): Route(), Route(), Route(), DesignToggle(), ART_H, clearMembershipPopupShown(), MembershipCelebration(), MembershipSavedPopup() (+43 more)

### Community 17 - "BookingDetailScreen.tsx"
Cohesion: 0.06
Nodes (80): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+72 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.15
Nodes (23): Route(), FunnelIcon(), SortLinesIcon(), rise(), chipFor(), countActive(), ExploreFilters, QUICK_CHIPS (+15 more)

### Community 19 - "react-native"
Cohesion: 0.16
Nodes (17): styles, OfferCard, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+9 more)

### Community 20 - "DetailsTabs.tsx"
Cohesion: 0.07
Nodes (42): Route(), getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, Reveal() (+34 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "@expo/vector-icons"
Cohesion: 0.10
Nodes (20): DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles (+12 more)

### Community 23 - "timedFetch"
Cohesion: 0.31
Nodes (7): expo-device, enforceHttpsUrl(), normalizeResponse(), timedFetch(), fetchChallengeNonce(), IntegrityVerdict, verifyAppIntegrity()

### Community 24 - "FilterSheet.tsx"
Cohesion: 0.22
Nodes (7): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, Category

### Community 25 - "EditProfileScreen.tsx"
Cohesion: 0.31
Nodes (7): Route(), SUPPORT_EMAIL, EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 26 - "WishlistScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), CarCardSkeleton(), CarListCard, useVehicles(), styles, WishlistScreen()

### Community 27 - "expo"
Cohesion: 0.04
Nodes (46): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+38 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (19): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+11 more)

### Community 30 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.05
Nodes (58): Route(), Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles (+50 more)

### Community 33 - "API"
Cohesion: 0.19
Nodes (13): HomeLoadStep, loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+5 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 36 - "SawariContext.tsx"
Cohesion: 0.18
Nodes (10): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, @react-native-async-storage/async-storage (+2 more)

### Community 37 - "index.ts"
Cohesion: 0.14
Nodes (8): SetLocationSheet(), styles, SectionHeading(), styles, styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 41 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 44 - "react"
Cohesion: 0.12
Nodes (12): Route(), Route(), Route(), Route(), Route(), DriverChargesSheet(), styles, react (+4 more)

### Community 45 - "MyWalletScreen.tsx"
Cohesion: 0.09
Nodes (40): Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF, rupees() (+32 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.18
Nodes (8): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants, expo-updates, mockNotifications

### Community 48 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 52 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 53 - "expo-linear-gradient"
Cohesion: 0.33
Nodes (6): Route(), FONT, PaymentFailed(), styles, expo-linear-gradient, PaymentErrorScreen()

### Community 55 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 487 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `ExploreFilters.tsx`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `recentSearches.ts`, `LocationSearchBody.tsx`, `DropoffSheet.tsx`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `react-native`, `DetailsTabs.tsx`, `@expo/vector-icons`, `FilterSheet.tsx`, `EditProfileScreen.tsx`, `WishlistScreen.tsx`, `SearchEmptyState.tsx`, `PlannerScreen.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `SawariContext.tsx`, `index.ts`, `MyWalletScreen.tsx`, `useAppUpdates.ts`, `expo-linear-gradient`, `AnimatedSplash.tsx`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08367071524966262 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `ErrorFallback.tsx`, `package.json`, `expo-haptics`, `ExploreFilters.tsx`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `LocationSearchBody.tsx`, `DropoffSheet.tsx`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `DetailsTabs.tsx`, `@expo/vector-icons`, `timedFetch`, `FilterSheet.tsx`, `EditProfileScreen.tsx`, `WishlistScreen.tsx`, `fetchWithAuth`, `SearchEmptyState.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `SawariContext.tsx`, `index.ts`, `activity.ts`, `react`, `MyWalletScreen.tsx`, `useAppUpdates.ts`, `expo-linear-gradient`, `AnimatedSplash.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.0559244126659857 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `_layout.tsx` to `PaymentsListScreen.tsx`, `PolicyScreen.tsx`, `useDetailsPalette`, `expo-haptics`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `recentSearches.ts`, `LocationSearchBody.tsx`, `DropoffSheet.tsx`, `BottomNavigation.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `DetailsTabs.tsx`, `@expo/vector-icons`, `EditProfileScreen.tsx`, `WishlistScreen.tsx`, `SearchEmptyState.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `SawariContext.tsx`, `index.ts`, `MyWalletScreen.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._