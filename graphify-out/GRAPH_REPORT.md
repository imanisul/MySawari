# Graph Report - MySawari  (2026-11-04)

## Corpus Check
- 229 files · ~1,346,881 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1424 nodes · 4607 edges · 58 communities (55 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b04082e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- useVehicles.ts
- useDetailsPalette
- devDependencies
- LoginBottomSheet
- package.json
- haptics.ts
- BottomNavigation.tsx
- ProfileScreen.tsx
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- CitySheet.tsx
- LocationSearchBody.tsx
- pricingEngine.ts
- index.ts
- formatCurrency
- react
- SawariContext.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- BookingDetailScreen.tsx
- useSawari
- queryPersistence.ts
- BookingScreen.tsx
- activity.ts
- tsconfig.json
- recentlyViewed.ts
- haptics.ts
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- MembershipScreen.tsx
- android
- useColors
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- LocationSearchBody.tsx
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
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 121 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `OTAUpdateChecker()` --calls--> `UpdateModal()`  [EXTRACTED]
  app/_layout.tsx → components/common/UpdateModal.tsx

## Import Cycles
- None detected.

## Communities (58 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.29
Nodes (12): recentSearchesQueryOptions(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.09
Nodes (53): Route(), Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FaqList() (+45 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "LoginBottomSheet"
Cohesion: 0.17
Nodes (21): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+13 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.06
Nodes (59): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+51 more)

### Community 7 - "BottomNavigation.tsx"
Cohesion: 0.05
Nodes (42): Route(), Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES (+34 more)

### Community 8 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (16): Route(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+8 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.06
Nodes (66): Route(), Route(), FunnelIcon(), SortArrowsIcon(), rise(), Page(), Reveal(), revealedScreens (+58 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (27): AlertButton, AlertPayload, CustomAlert, styles, ArcHeadline(), BENEFITS, cardDate(), ComboSlide (+19 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), CustomAlertProvider() (+10 more)

### Community 12 - "CitySheet.tsx"
Cohesion: 0.50
Nodes (3): CitySheet(), styles, CITIES

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+19 more)

### Community 16 - "index.ts"
Cohesion: 0.22
Nodes (6): Route(), PlannerSheet(), styles, styles, TripField(), PlannerScreen()

### Community 17 - "formatCurrency"
Cohesion: 0.19
Nodes (14): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+6 more)

### Community 18 - "react"
Cohesion: 0.12
Nodes (13): Route(), Route(), Route(), Route(), Route(), LocationSheet(), BlurTargetContext, styles (+5 more)

### Community 19 - "SawariContext.tsx"
Cohesion: 0.09
Nodes (22): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.12
Nodes (15): Route(), Route(), Header(), OfferCard, useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 23 - "react-native"
Cohesion: 0.16
Nodes (16): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+8 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (24): Route(), BenefitsGrid(), ConnectCard(), DestinationTile(), HOME_PURPLE, HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard() (+16 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.24
Nodes (11): LoginGate(), AnimatedSplash(), markSplashGone(), onSplashGone(), splashGoneListeners, SplashStep, styles, DEFAULT_FLASH_SCREEN_CONFIG (+3 more)

### Community 26 - "sawari.ts"
Cohesion: 0.05
Nodes (70): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+62 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.16
Nodes (17): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+9 more)

### Community 31 - "BookingDetailScreen.tsx"
Cohesion: 0.05
Nodes (87): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+79 more)

### Community 33 - "useSawari"
Cohesion: 0.18
Nodes (17): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+9 more)

### Community 34 - "queryPersistence.ts"
Cohesion: 0.33
Nodes (8): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, loadHomeData()

### Community 36 - "BookingScreen.tsx"
Cohesion: 0.18
Nodes (18): Route(), Route(), DesignToggle(), useQuote(), useTrackTripProgress(), useLiveCar(), BookingScreen(), dayAndTime() (+10 more)

### Community 37 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (53): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+45 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "MembershipScreen.tsx"
Cohesion: 0.07
Nodes (43): Route(), Route(), Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep (+35 more)

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 55 - "useColors"
Cohesion: 0.08
Nodes (29): NotFoundScreen(), styles, DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles (+21 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.24
Nodes (14): DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, SheetFrame(), SheetHeader() (+6 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.17
Nodes (12): clearMembershipPopupShown(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT (+4 more)

### Community 66 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

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

### Community 77 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 547 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `LoginBottomSheet`, `package.json`, `haptics.ts`, `BottomNavigation.tsx`, `ProfileScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `CitySheet.tsx`, `LocationSearchBody.tsx`, `index.ts`, `formatCurrency`, `SawariContext.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `BookingDetailScreen.tsx`, `useSawari`, `BookingScreen.tsx`, `haptics.ts`, `UpdateModal.tsx`, `MembershipScreen.tsx`, `useColors`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `LocationSearchBody.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `LoginBottomSheet`, `package.json`, `haptics.ts`, `BottomNavigation.tsx`, `ProfileScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `CitySheet.tsx`, `LocationSearchBody.tsx`, `index.ts`, `formatCurrency`, `react`, `SawariContext.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `BookingDetailScreen.tsx`, `useSawari`, `BookingScreen.tsx`, `activity.ts`, `haptics.ts`, `UpdateModal.tsx`, `MembershipScreen.tsx`, `useColors`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `LocationSearchBody.tsx`, `ErrorFallback.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.09234365867913501 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._