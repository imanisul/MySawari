# Graph Report - MySawari  (2026-11-17)

## Corpus Check
- 254 files · ~1,462,489 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1692 nodes · 5663 edges · 82 communities (80 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1092a0ad`
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
- BookingsScreen.tsx
- pricingEngine.ts
- SawariContext.tsx
- react
- AnimatedSplash.tsx
- ProfileScreen.tsx
- ExclusiveOfferDetailModal.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- ModalBlur
- ExploreFilters.tsx
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- LoginBottomSheet
- BottomNavigation.tsx
- useDetailsPalette
- ProfileParts.tsx
- ReferEarnScreen.tsx
- haptics.ts
- tsconfig.json
- BookingDetailScreen.tsx
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- useDealCars.ts
- recentlyViewed.ts
- index.ts
- Skeleton
- useVehicles.ts
- useSawari
- MySawari customer app: store compliance notes
- offers.ts
- android
- MyWalletScreen.tsx
- CarListCard.tsx
- recentSearches.ts
- RefundsScreen.tsx
- PaymentsListScreen.tsx
- CustomAlert.tsx
- queryPersistence.ts
- Reveal.tsx
- secureStore.web.ts
- RewardsScreen.tsx
- ios
- infoPlist
- vehicleKnowledge.ts
- scaleText.ts
- detailsPalette.ts
- TripDetailParts.tsx
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- ErrorFallback.tsx
- experiments
- useAppUpdates.ts
- WishlistScreen.tsx
- scripts
- activity.ts
- BenefitCards.tsx
- MySawari – store listing text (search)
- detailsPalette.ts
- OffersScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 200 edges
2. `useSawari()` - 150 edges
3. `react-native` - 143 edges
4. `useDetailsPalette()` - 136 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 92 edges
7. `expo-router` - 68 edges
8. `react-native-safe-area-context` - 66 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `PlannerScreen()` --calls--> `PlannerSheet()`  [EXTRACTED]
  screens/Home/PlannerScreen.tsx → components/booking/PlannerSheet.tsx
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (82 total, 2 thin omitted)

### Community 0 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 1 - "LoadingImage"
Cohesion: 0.09
Nodes (34): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+26 more)

### Community 2 - "formatCurrency"
Cohesion: 0.13
Nodes (21): WhyRent(), PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar() (+13 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.12
Nodes (31): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+23 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): expo, install, exclude, main, name, private, version, @babel/core (+27 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.06
Nodes (64): Route(), Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions() (+56 more)

### Community 7 - "sawari.ts"
Cohesion: 0.12
Nodes (15): AvailabilityInfo, baseCars, Block, CarNextBookingWindow, cars, delay(), fetchCars(), fetchResultCars() (+7 more)

### Community 8 - "BookingScreen.tsx"
Cohesion: 0.12
Nodes (24): Route(), Route(), BlurTargetContext, BlurTargetProvider(), BlurHost(), styles, styles, DesignToggle() (+16 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (40): BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide, BIKE_CATEGORIES, cardDate(), CATEGORIES (+32 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), LoginGate(), onSplashGone() (+10 more)

### Community 12 - "MembershipScreen.tsx"
Cohesion: 0.07
Nodes (36): Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed() (+28 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.23
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 14 - "BookingsScreen.tsx"
Cohesion: 0.16
Nodes (17): Route(), PostTripReviewPrompt(), ReviewModal(), ReviewTrip, driverLabel(), FONT, BlurTarget(), BookingsScreen() (+9 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+17 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.09
Nodes (20): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+12 more)

### Community 17 - "react"
Cohesion: 0.12
Nodes (10): Route(), Route(), Route(), Route(), Route(), react, DriverChargesScreen(), DriverOptionScreen() (+2 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "ProfileScreen.tsx"
Cohesion: 0.08
Nodes (32): Route(), FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles (+24 more)

### Community 20 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.17
Nodes (21): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+13 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.09
Nodes (22): Route(), Route(), Route(), FONT, styles, Header(), styles, SUPPORT_EMAIL (+14 more)

### Community 23 - "react-native"
Cohesion: 0.11
Nodes (25): styles, OfferCard, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+17 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (26): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomePromoBanner(), HomeSectionTitle(), MemberBenefitsCard() (+18 more)

### Community 25 - "ModalBlur"
Cohesion: 0.12
Nodes (26): styles, styles, RefundTrackingModalProps, styles, styles, SORT_OPTIONS, SortKey, SortSheet() (+18 more)

### Community 26 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (25): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+17 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (16): expo-device, expo-secure-store, fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh(), withInstallId() (+8 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "HomeCardsRow.tsx"
Cohesion: 0.24
Nodes (8): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), react-native-gesture-handler

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.07
Nodes (24): Route(), FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen() (+16 more)

### Community 32 - "LoginBottomSheet"
Cohesion: 0.14
Nodes (27): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+19 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.11
Nodes (19): BottomBlur(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+11 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.12
Nodes (42): Route(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList() (+34 more)

### Community 35 - "ProfileParts.tsx"
Cohesion: 0.14
Nodes (25): Route(), Route(), PF, ScreenHeader(), shortDay(), StatusTimeline(), Step, StepState (+17 more)

### Community 36 - "ReferEarnScreen.tsx"
Cohesion: 0.16
Nodes (6): Route(), expo-status-bar, Rays(), ReferEarnScreen(), styles, usePartnerQRs()

### Community 37 - "haptics.ts"
Cohesion: 0.11
Nodes (12): DriverModeRow(), styles, DropoffSheet(), Place, POPULAR, Row(), styles, expo-haptics (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "BookingDetailScreen.tsx"
Cohesion: 0.21
Nodes (21): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), refundAmountOf() (+13 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.15
Nodes (17): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+9 more)

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
Cohesion: 0.09
Nodes (15): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, SectionHeading(), styles (+7 more)

### Community 45 - "Skeleton"
Cohesion: 0.18
Nodes (23): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, HomeCarRowSkeleton(), HomeCarSkeleton() (+15 more)

### Community 46 - "useVehicles.ts"
Cohesion: 0.19
Nodes (13): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+5 more)

### Community 47 - "useSawari"
Cohesion: 0.13
Nodes (30): RootLayoutNav(), NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles (+22 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "offers.ts"
Cohesion: 0.24
Nodes (13): fetchContentVersion(), fetchExclusiveOffers(), fetchOffers(), formatExpiry(), NextFlashSale, Offer, plateSafeOfferImage(), prefetchOfferImages() (+5 more)

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "MyWalletScreen.tsx"
Cohesion: 0.29
Nodes (10): Route(), longStamp(), rupees(), MyWalletScreen(), stageOf(), styles, Tx, withdrawalSteps() (+2 more)

### Community 52 - "CarListCard.tsx"
Cohesion: 0.12
Nodes (18): CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout (+10 more)

### Community 53 - "recentSearches.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 54 - "RefundsScreen.tsx"
Cohesion: 0.15
Nodes (18): Route(), Route(), Dash(), PricingSummary(), Row(), shortDate(), tripTotal(), bookingsQueryOptions (+10 more)

### Community 55 - "PaymentsListScreen.tsx"
Cohesion: 0.33
Nodes (5): useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles, istDayMonthYear()

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "queryPersistence.ts"
Cohesion: 0.33
Nodes (8): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, loadHomeData()

### Community 58 - "Reveal.tsx"
Cohesion: 0.53
Nodes (4): rise(), Reveal(), revealedScreens, react-native-reanimated

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "RewardsScreen.tsx"
Cohesion: 0.16
Nodes (16): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+8 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "scaleText.ts"
Cohesion: 0.50
Nodes (3): createUnscaled, k, originalCreate

### Community 65 - "detailsPalette.ts"
Cohesion: 0.43
Nodes (6): Route(), FaqList(), Faqs, SubPageHeader(), FaqsScreen(), styles

### Community 66 - "TripDetailParts.tsx"
Cohesion: 0.18
Nodes (17): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), MONTHS, pickupMoment(), placeName() (+9 more)

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

### Community 77 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 78 - "BenefitCards.tsx"
Cohesion: 0.50
Nodes (3): BenefitCards(), ITEMS, styles

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "detailsPalette.ts"
Cohesion: 0.50
Nodes (3): dark, light, useIsDarkMode()

### Community 81 - "OffersScreen.tsx"
Cohesion: 0.29
Nodes (9): Route(), ListSkeleton(), Dashes(), couponTitle(), OffersScreen(), styles, until(), calculateCouponDiscount() (+1 more)

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 657 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `LocationSearchBody.tsx`, `BookingsScreen.tsx`, `SawariContext.tsx`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ModalBlur`, `ExploreFilters.tsx`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `ProfileParts.tsx`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `useDealCars.ts`, `index.ts`, `Skeleton`, `useVehicles.ts`, `useSawari`, `MyWalletScreen.tsx`, `CarListCard.tsx`, `recentSearches.ts`, `RefundsScreen.tsx`, `PaymentsListScreen.tsx`, `CustomAlert.tsx`, `Reveal.tsx`, `RewardsScreen.tsx`, `scaleText.ts`, `detailsPalette.ts`, `TripDetailParts.tsx`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `useAppUpdates.ts`, `WishlistScreen.tsx`, `BenefitCards.tsx`, `OffersScreen.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatesSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `sawari.ts`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `LocationSearchBody.tsx`, `BookingsScreen.tsx`, `SawariContext.tsx`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ModalBlur`, `ExploreFilters.tsx`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `ProfileParts.tsx`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `index.ts`, `Skeleton`, `useSawari`, `MyWalletScreen.tsx`, `CarListCard.tsx`, `RefundsScreen.tsx`, `PaymentsListScreen.tsx`, `CustomAlert.tsx`, `Reveal.tsx`, `RewardsScreen.tsx`, `scaleText.ts`, `detailsPalette.ts`, `TripDetailParts.tsx`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `useAppUpdates.ts`, `WishlistScreen.tsx`, `activity.ts`, `BenefitCards.tsx`, `OffersScreen.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `DatesSheet.tsx`, `LoadingImage`, `formatCurrency`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `MembershipScreen.tsx`, `LocationSearchBody.tsx`, `BookingsScreen.tsx`, `SawariContext.tsx`, `ProfileScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ModalBlur`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `ProfileParts.tsx`, `ReferEarnScreen.tsx`, `haptics.ts`, `BookingDetailScreen.tsx`, `useDealCars.ts`, `Skeleton`, `MyWalletScreen.tsx`, `CarListCard.tsx`, `recentSearches.ts`, `RefundsScreen.tsx`, `PaymentsListScreen.tsx`, `RewardsScreen.tsx`, `TripDetailParts.tsx`, `TopDealsScreen.tsx`, `WishlistScreen.tsx`, `OffersScreen.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._