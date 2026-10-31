# Graph Report - MySawari  (2026-10-31)

## Corpus Check
- 215 files · ~1,336,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1350 nodes · 4301 edges · 66 communities (59 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5007f6d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PolicyScreen.tsx
- useVehicles.ts
- CarDetailsSections.tsx
- devDependencies
- index.ts
- package.json
- expo-haptics
- BookingsScreen.tsx
- useColors
- sawari.ts
- HomeSections.tsx
- _layout.tsx
- API
- LocationSearchBody.tsx
- expo-haptics
- pricingEngine.ts
- TripDetailParts.tsx
- HomeScreen.tsx
- ExploreFilters.tsx
- FilterSheet.tsx
- PaymentProgress.tsx
- dependencies
- BookingScreen.tsx
- react-native
- metro.config.js
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useSawari
- react
- react-native-safe-area-context
- MembershipScreen.tsx
- DatesSheet.tsx
- recentSearches.ts
- BookingDetailScreen.tsx
- SearchScreen.tsx
- tsconfig.json
- DropoffSheet.tsx
- CarListCard.tsx
- activity.ts
- recentlyViewed.ts
- react
- PlannerScreen.tsx
- detailsPalette.ts
- formatCurrency
- useAppUpdates.ts
- MySawari customer app: store compliance notes
- EditProfileScreen.tsx
- DriverChargesScreen.tsx
- PaymentScreen.tsx
- offers.ts
- expo
- CustomAlert.tsx
- PushNotificationHandler.tsx
- ErrorBoundary
- scripts
- SawariContext.tsx
- secureStore.web.ts
- SearchEmptyState.tsx
- vehicleKnowledge.ts
- social.ts
- vehicleImages.ts
- ReferEarnScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 170 edges
2. `useSawari()` - 126 edges
3. `react-native` - 120 edges
4. `useDetailsPalette()` - 116 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 80 edges
7. `react-native-safe-area-context` - 59 edges
8. `expo-router` - 54 edges
9. `expo-haptics` - 52 edges
10. `ModalBlur()` - 49 edges

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

## Communities (66 total, 7 thin omitted)

### Community 0 - "PolicyScreen.tsx"
Cohesion: 0.08
Nodes (38): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), group() (+30 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.18
Nodes (13): HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages() (+5 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.09
Nodes (55): Route(), Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FaqList() (+47 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "index.ts"
Cohesion: 0.14
Nodes (10): ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, styles, styles, UpdateModal() (+2 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "expo-haptics"
Cohesion: 0.08
Nodes (49): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+41 more)

### Community 7 - "BookingsScreen.tsx"
Cohesion: 0.18
Nodes (14): Route(), driverLabel(), shortDate(), bookingsQueryOptions, BookingsScreen(), BookingTab, byRecent(), Empty() (+6 more)

### Community 8 - "useColors"
Cohesion: 0.09
Nodes (35): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverModeRow(), styles, DriverOptionSheet(), OptionCard() (+27 more)

### Community 9 - "sawari.ts"
Cohesion: 0.09
Nodes (35): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, rise(), PhotoViewer() (+27 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.08
Nodes (22): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE (+14 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.12
Nodes (14): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), CustomAlertProvider() (+6 more)

### Community 12 - "API"
Cohesion: 0.16
Nodes (14): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+6 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "expo-haptics"
Cohesion: 0.07
Nodes (35): Route(), Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+27 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (26): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+18 more)

### Community 16 - "TripDetailParts.tsx"
Cohesion: 0.16
Nodes (20): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), Dash(), MONTHS, placeName() (+12 more)

### Community 17 - "HomeScreen.tsx"
Cohesion: 0.14
Nodes (20): Route(), PhoneNumberSheet(), onSplashGone(), BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle() (+12 more)

### Community 18 - "ExploreFilters.tsx"
Cohesion: 0.12
Nodes (22): ALL_BUDGETS, BIKE_BUDGETS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet() (+14 more)

### Community 19 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 20 - "PaymentProgress.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+6 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "BookingScreen.tsx"
Cohesion: 0.13
Nodes (22): Route(), clearMembershipPopupShown(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, shown, STARTER_LAYOUT (+14 more)

### Community 23 - "react-native"
Cohesion: 0.17
Nodes (16): styles, OfferCard, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+8 more)

### Community 24 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 26 - "sawari.ts"
Cohesion: 0.10
Nodes (32): sortCars(), CarTile, styles, LuxuryCarTile, styles, expo-haptics, isPastSearch(), AvailabilityInfo (+24 more)

### Community 27 - "expo"
Cohesion: 0.04
Nodes (46): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+38 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.10
Nodes (16): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+8 more)

### Community 30 - "useSawari"
Cohesion: 0.22
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 31 - "react"
Cohesion: 0.10
Nodes (18): Route(), Route(), Route(), Header(), styles, useKeyboardPad(), react, DriverOptionScreen() (+10 more)

### Community 32 - "react-native-safe-area-context"
Cohesion: 0.15
Nodes (16): styles, styles, RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey, SortSheet(), styles (+8 more)

### Community 33 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+7 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 35 - "recentSearches.ts"
Cohesion: 0.33
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 36 - "BookingDetailScreen.tsx"
Cohesion: 0.21
Nodes (20): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+12 more)

### Community 37 - "SearchScreen.tsx"
Cohesion: 0.12
Nodes (26): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+18 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 40 - "CarListCard.tsx"
Cohesion: 0.31
Nodes (8): CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, ActivityAPI, bestFor()

### Community 41 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 42 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 43 - "react"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 45 - "detailsPalette.ts"
Cohesion: 0.05
Nodes (61): Route(), Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp() (+53 more)

### Community 46 - "formatCurrency"
Cohesion: 0.23
Nodes (11): BottomBlur(), Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, PLAN_NAMES, PLAN_RATES (+3 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "EditProfileScreen.tsx"
Cohesion: 0.19
Nodes (12): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, expo-linear-gradient, EditProfileScreen() (+4 more)

### Community 51 - "PaymentScreen.tsx"
Cohesion: 0.44
Nodes (6): Route(), useSawari(), useTrackTripProgress(), PaymentScreen(), styles, calculateCouponDiscount()

### Community 52 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

### Community 53 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 54 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 55 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 58 - "SawariContext.tsx"
Cohesion: 0.13
Nodes (15): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, expo-location (+7 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 72 - "ReferEarnScreen.tsx"
Cohesion: 0.18
Nodes (14): Route(), Route(), BlurHost(), BlurTarget(), styles, expo-clipboard, expo-status-bar, ConfirmationScreen() (+6 more)

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 521 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PolicyScreen.tsx`, `CarDetailsSections.tsx`, `index.ts`, `package.json`, `expo-haptics`, `BookingsScreen.tsx`, `useColors`, `sawari.ts`, `HomeSections.tsx`, `_layout.tsx`, `API`, `LocationSearchBody.tsx`, `expo-haptics`, `TripDetailParts.tsx`, `HomeScreen.tsx`, `ExploreFilters.tsx`, `FilterSheet.tsx`, `PaymentProgress.tsx`, `BookingScreen.tsx`, `react-native`, `AnimatedSplash.tsx`, `sawari.ts`, `useSawari`, `react-native-safe-area-context`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `DropoffSheet.tsx`, `CarListCard.tsx`, `react`, `PlannerScreen.tsx`, `detailsPalette.ts`, `formatCurrency`, `useAppUpdates.ts`, `EditProfileScreen.tsx`, `DriverChargesScreen.tsx`, `PaymentScreen.tsx`, `CustomAlert.tsx`, `PushNotificationHandler.tsx`, `SawariContext.tsx`, `SearchEmptyState.tsx`, `ReferEarnScreen.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07585568917668825 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PolicyScreen.tsx`, `CarDetailsSections.tsx`, `index.ts`, `package.json`, `expo-haptics`, `BookingsScreen.tsx`, `useColors`, `sawari.ts`, `HomeSections.tsx`, `_layout.tsx`, `API`, `LocationSearchBody.tsx`, `expo-haptics`, `TripDetailParts.tsx`, `HomeScreen.tsx`, `ExploreFilters.tsx`, `FilterSheet.tsx`, `PaymentProgress.tsx`, `BookingScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `useSawari`, `react`, `react-native-safe-area-context`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `DropoffSheet.tsx`, `CarListCard.tsx`, `activity.ts`, `detailsPalette.ts`, `formatCurrency`, `useAppUpdates.ts`, `EditProfileScreen.tsx`, `PaymentScreen.tsx`, `CustomAlert.tsx`, `PushNotificationHandler.tsx`, `SawariContext.tsx`, `SearchEmptyState.tsx`, `social.ts`, `ReferEarnScreen.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08672659968270756 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._