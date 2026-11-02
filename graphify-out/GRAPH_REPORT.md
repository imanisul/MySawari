# Graph Report - MySawari  (2026-11-02)

## Corpus Check
- 223 files · ~1,339,723 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1387 nodes · 4460 edges · 74 communities (70 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7481652e`
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
- BottomNavigation.tsx
- useColors
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- BookingScreen.tsx
- pricingEngine.ts
- useColors.ts
- TripDetailParts.tsx
- HomeScreen.tsx
- BookingDetailScreen.tsx
- ModalBlur
- dependencies
- react
- react-native
- recentSearches.ts
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useSawari
- react-native-safe-area-context
- BookingsScreen.tsx
- PaymentProcessingScreen.tsx
- LocationSheet
- RefundsScreen.tsx
- HomeHero
- ExploreFilters.tsx
- tsconfig.json
- WishlistScreen.tsx
- index.ts
- MembershipScreen.tsx
- recentlyViewed.ts
- DriverOptionScreen.tsx
- DetailsTabs.tsx
- detailsPalette.ts
- SawariContext.tsx
- useAppUpdates.ts
- MySawari customer app: store compliance notes
- DriverChargesScreen.tsx
- android
- activity.ts
- Reveal.tsx
- expo
- PushNotificationHandler.tsx
- PaymentResult.tsx
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
- ReferEarnScreen.tsx
- experiments
- offers.ts
- API

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
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (74 total, 4 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.07
Nodes (41): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+33 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.20
Nodes (11): bookingsQueryOptions, HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY (+3 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.10
Nodes (49): Route(), Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs (+41 more)

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
Cohesion: 0.07
Nodes (54): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+46 more)

### Community 7 - "BottomNavigation.tsx"
Cohesion: 0.07
Nodes (32): Route(), ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route, styles (+24 more)

### Community 8 - "useColors"
Cohesion: 0.16
Nodes (22): DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, PlannerSheet(), styles, SearchCard() (+14 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (25): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+17 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.09
Nodes (15): BENEFITS, ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE, ImageSlide, SHADOW (+7 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (18): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar() (+10 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "BookingScreen.tsx"
Cohesion: 0.10
Nodes (31): Route(), DesignToggle(), clearMembershipPopupShown(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, shown (+23 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (28): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+20 more)

### Community 16 - "useColors.ts"
Cohesion: 0.12
Nodes (12): NotFoundScreen(), styles, DriverModeRow(), styles, SectionHeading(), styles, PriceBreakdownSheet(), ReadyPrice (+4 more)

### Community 17 - "TripDetailParts.tsx"
Cohesion: 0.15
Nodes (21): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), Dash(), MONTHS, placeName() (+13 more)

### Community 18 - "HomeScreen.tsx"
Cohesion: 0.14
Nodes (20): Route(), Reveal(), BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard() (+12 more)

### Community 19 - "BookingDetailScreen.tsx"
Cohesion: 0.22
Nodes (19): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+11 more)

### Community 20 - "ModalBlur"
Cohesion: 0.14
Nodes (19): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, SORT_OPTIONS, SortKey, SortSheet(), styles (+11 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "react"
Cohesion: 0.12
Nodes (17): Route(), Route(), Header(), styles, OfferCard, useKeyboardPad(), react, PaymentMethodItem (+9 more)

### Community 23 - "react-native"
Cohesion: 0.17
Nodes (16): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+8 more)

### Community 24 - "recentSearches.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (30): sortCars(), CarTile, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars, Block (+22 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.18
Nodes (17): expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh(), timedFetch() (+9 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useSawari"
Cohesion: 0.15
Nodes (18): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+10 more)

### Community 31 - "react-native-safe-area-context"
Cohesion: 0.20
Nodes (10): styles, styles, RefundTrackingModalProps, styles, FONT, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, react-native-safe-area-context (+2 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.22
Nodes (11): Route(), BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn(), Kind, kindOf() (+3 more)

### Community 33 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (12): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+4 more)

### Community 34 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 35 - "RefundsScreen.tsx"
Cohesion: 0.33
Nodes (9): Route(), driverLabel(), shortDate(), tripTotal(), amountOf(), RefundsScreen(), Stage, stageOf() (+1 more)

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
Cohesion: 0.33
Nodes (7): Route(), CarCardSkeleton(), CarListCard, useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 40 - "index.ts"
Cohesion: 0.11
Nodes (13): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, styles, styles (+5 more)

### Community 41 - "MembershipScreen.tsx"
Cohesion: 0.16
Nodes (18): Route(), Page(), BottomNavigation(), expo-status-bar, ActiveMembership, activeOnly(), Dashes(), getPlanDef() (+10 more)

### Community 42 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.06
Nodes (47): NextTrip(), styles, getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+39 more)

### Community 45 - "detailsPalette.ts"
Cohesion: 0.07
Nodes (50): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+42 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (15): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+7 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.40
Nodes (4): canCheckForUpdates(), UpdateInfo, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "DriverChargesScreen.tsx"
Cohesion: 0.27
Nodes (4): Route(), Route(), DriverChargesScreen(), PlannerScreen()

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), expo-device, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 52 - "Reveal.tsx"
Cohesion: 0.60
Nodes (3): rise(), revealedScreens, react-native-reanimated

### Community 53 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 54 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 55 - "PaymentResult.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentFailed(), styles, dark, light, SUPPORT_EMAIL (+6 more)

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

### Community 72 - "ReferEarnScreen.tsx"
Cohesion: 0.21
Nodes (14): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, FaqList(), ConfirmationScreen() (+6 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 75 - "API"
Cohesion: 0.17
Nodes (14): Route(), Route(), styles, useSawari(), useTrackTripProgress(), expo-router, PaymentScreen(), styles (+6 more)

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 538 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BottomNavigation.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BookingScreen.tsx`, `useColors.ts`, `TripDetailParts.tsx`, `HomeScreen.tsx`, `BookingDetailScreen.tsx`, `ModalBlur`, `react-native`, `recentSearches.ts`, `AnimatedSplash.tsx`, `sawari.ts`, `useSawari`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `PaymentProcessingScreen.tsx`, `LocationSheet`, `RefundsScreen.tsx`, `ExploreFilters.tsx`, `WishlistScreen.tsx`, `index.ts`, `MembershipScreen.tsx`, `DriverOptionScreen.tsx`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `useAppUpdates.ts`, `DriverChargesScreen.tsx`, `Reveal.tsx`, `PushNotificationHandler.tsx`, `PaymentResult.tsx`, `CustomAlert.tsx`, `CitySheet.tsx`, `SearchEmptyState.tsx`, `ReferEarnScreen.tsx`, `API`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.06862745098039216 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BottomNavigation.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BookingScreen.tsx`, `useColors.ts`, `TripDetailParts.tsx`, `HomeScreen.tsx`, `BookingDetailScreen.tsx`, `ModalBlur`, `react`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `useSawari`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `PaymentProcessingScreen.tsx`, `RefundsScreen.tsx`, `ExploreFilters.tsx`, `WishlistScreen.tsx`, `index.ts`, `MembershipScreen.tsx`, `DetailsTabs.tsx`, `detailsPalette.ts`, `SawariContext.tsx`, `useAppUpdates.ts`, `activity.ts`, `Reveal.tsx`, `PushNotificationHandler.tsx`, `PaymentResult.tsx`, `CustomAlert.tsx`, `CitySheet.tsx`, `SearchEmptyState.tsx`, `ReferEarnScreen.tsx`, `API`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.09831649831649832 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `ErrorBoundary.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11578947368421053 - nodes in this community are weakly interconnected._