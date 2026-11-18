# Graph Report - MySawari  (2026-11-18)

## Corpus Check
- 255 files · ~1,470,079 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1700 nodes · 5723 edges · 78 communities (75 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a20ada8c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- LoadingImage
- FilterSheet.tsx
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- sawari.ts
- @expo/vector-icons
- PolicyScreen.tsx
- HomeSections.tsx
- _layout.tsx
- PaymentProcessingScreen.tsx
- ExploreFilters.tsx
- ExclusiveOfferDetailModal.tsx
- pricingEngine.ts
- SawariContext.tsx
- useColors
- AnimatedSplash.tsx
- activity.ts
- LoadingImage
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- react
- MembershipScreen.tsx
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- BookingsScreen.tsx
- ProfileScreen.tsx
- useDetailsPalette
- react
- offers.ts
- sawari.ts
- tsconfig.json
- ManageBookingSheet.tsx
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- CarDetailsSections.tsx
- useVehicles
- AppGate
- TripDetailParts.tsx
- react-native-safe-area-context
- useColors.ts
- MySawari customer app: store compliance notes
- queryPersistence.ts
- android
- DatesSheet.tsx
- CarListCard.tsx
- recentSearches.ts
- DriverOptionScreen.tsx
- PriceBreakdownSheet.tsx
- useVehicles.ts
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- CustomAlert.tsx
- FlashSaleButton.tsx
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- index.ts
- experiments
- metro.config.js
- scripts
- FaqsScreen.tsx
- MySawari – store listing text (search)
- TopPickCard
- recentlyViewed.ts
- WelcomeSheet.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 201 edges
2. `useSawari()` - 150 edges
3. `react-native` - 144 edges
4. `useDetailsPalette()` - 138 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 93 edges
7. `expo-router` - 69 edges
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

## Communities (78 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.16
Nodes (22): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+14 more)

### Community 1 - "LoadingImage"
Cohesion: 0.09
Nodes (29): rise(), Reveal(), revealedScreens, AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection() (+21 more)

### Community 2 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.11
Nodes (34): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+26 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (34): expo, install, exclude, main, name, private, version, @babel/core (+26 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.05
Nodes (65): Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles, ChevronIcon() (+57 more)

### Community 7 - "sawari.ts"
Cohesion: 0.19
Nodes (26): carGapOn(), DealsCard(), ceilIstHourMs(), dealDayTime(), dealWhenLabel(), istDayNum(), nextIstHourMs(), parseCustomDateToMs() (+18 more)

### Community 8 - "@expo/vector-icons"
Cohesion: 0.06
Nodes (70): Route(), Route(), Route(), Route(), Route(), Route(), CouponNotApplicableModal(), Props (+62 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (37): BenefitCards(), ITEMS, styles, BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide (+29 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.08
Nodes (21): AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), ErrorBoundary, asString() (+13 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), FONT, PaymentStep, styles, FONT, PaymentFailed(), styles (+3 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.17
Nodes (21): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+13 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (26): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+18 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.11
Nodes (16): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+8 more)

### Community 17 - "useColors"
Cohesion: 0.16
Nodes (21): NotFoundScreen(), styles, styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet(), styles (+13 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 20 - "LoadingImage"
Cohesion: 0.19
Nodes (15): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+7 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.14
Nodes (12): Route(), Route(), Header(), styles, OfferCard, faqs, HelpScreen(), styles (+4 more)

### Community 23 - "react-native"
Cohesion: 0.18
Nodes (15): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+7 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (23): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+15 more)

### Community 25 - "react"
Cohesion: 0.14
Nodes (9): Route(), Route(), Route(), Route(), DriverChargesSheet(), react, DriverChargesScreen(), LocationScreen() (+1 more)

### Community 26 - "MembershipScreen.tsx"
Cohesion: 0.06
Nodes (44): Route(), Route(), Route(), PaymentProgress(), BlurHost(), BlurTarget(), BottomBlur(), styles (+36 more)

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
Nodes (8): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), expo-linear-gradient

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.08
Nodes (23): Route(), FlashSaleHeroTitle, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen(), styles (+15 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.14
Nodes (19): Route(), PostTripReviewPrompt(), ReviewModal(), ReviewTrip, refundAmountOf(), refundStage(), RefundTimeline(), Timeline() (+11 more)

### Community 33 - "ProfileScreen.tsx"
Cohesion: 0.06
Nodes (40): RootLayoutNav(), Route(), Page(), RateUsCard(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon() (+32 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.14
Nodes (32): Route(), TripMilestoneCard(), Benefits(), CancellationPolicy(), formatPlace(), HelpCard(), LocationCard(), MainSpecification() (+24 more)

### Community 35 - "react"
Cohesion: 0.06
Nodes (60): Route(), Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton() (+52 more)

### Community 36 - "offers.ts"
Cohesion: 0.26
Nodes (13): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), isOfferLive(), NextFlashSale, Offer, plateSafeOfferImage() (+5 more)

### Community 37 - "sawari.ts"
Cohesion: 0.11
Nodes (28): Route(), CarTile, styles, LuxuryCarTile, styles, styles, WishlistScreen(), AvailabilityInfo (+20 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "ManageBookingSheet.tsx"
Cohesion: 0.22
Nodes (7): styles, styles, RefundTrackingModalProps, FONT, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, BookingSnapshot

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "CarDetailsSections.tsx"
Cohesion: 0.14
Nodes (21): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), FeatureList(), INCLUDED, Inclusions(), MileageIcon() (+13 more)

### Community 43 - "useVehicles"
Cohesion: 0.17
Nodes (28): Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal() (+20 more)

### Community 44 - "AppGate"
Cohesion: 0.24
Nodes (10): AppGate(), LoginGate(), onSplashGone(), CustomAlertProvider(), expo-application, expo-system-ui, detectInstallReferrer(), extractReferralCode() (+2 more)

### Community 45 - "TripDetailParts.tsx"
Cohesion: 0.15
Nodes (18): Route(), Dash(), driverLabel(), MONTHS, placeName(), PricingSummary(), Row(), styles (+10 more)

### Community 46 - "react-native-safe-area-context"
Cohesion: 0.12
Nodes (26): Route(), styles, styles, SetLocationSheet(), styles, SORT_OPTIONS, SortKey, SortSheet() (+18 more)

### Community 47 - "useColors.ts"
Cohesion: 0.13
Nodes (10): DriverModeRow(), styles, styles, SectionHeading(), styles, Action, styles, useBrandColors() (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "queryPersistence.ts"
Cohesion: 0.36
Nodes (7): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 52 - "CarListCard.tsx"
Cohesion: 0.10
Nodes (26): CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout (+18 more)

### Community 53 - "recentSearches.ts"
Cohesion: 0.33
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 55 - "PriceBreakdownSheet.tsx"
Cohesion: 0.40
Nodes (4): PriceBreakdownSheet(), ReadyPrice, styles, TripPrice

### Community 56 - "useVehicles.ts"
Cohesion: 0.21
Nodes (11): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+3 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.18
Nodes (10): SearchCard(), styles, SearchSheet(), styles, SCRATCH_H, SCRATCH_W, styles, styles (+2 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 65 - "FlashSaleButton.tsx"
Cohesion: 0.12
Nodes (10): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles, expo-haptics (+2 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.10
Nodes (8): dealPricing(), pad2(), styles, VehicleCard(), VehicleCardProps, { width: SCREEN_WIDTH }, getVehicleImage(), vehicleImages

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "index.ts"
Cohesion: 0.12
Nodes (11): ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, styles, UpdateModal(), UpdateModalProps (+3 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "FaqsScreen.tsx"
Cohesion: 0.33
Nodes (7): Route(), FaqList(), Faqs, styles, SubPageHeader(), FaqsScreen(), styles

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "TopPickCard"
Cohesion: 0.33
Nodes (6): cardDate(), TopPickCard(), TripSearchCard(), memberDayPrice(), bestFor(), carTitle()

### Community 82 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 84 - "WelcomeSheet.tsx"
Cohesion: 0.22
Nodes (8): Chip, chipStyles, ROWS, styles, WelcomeSheet(), createUnscaled, k, originalCreate

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 656 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `LoadingImage`, `FilterSheet.tsx`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `sawari.ts`, `@expo/vector-icons`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `useColors`, `AnimatedSplash.tsx`, `LoadingImage`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `MembershipScreen.tsx`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `BookingsScreen.tsx`, `ProfileScreen.tsx`, `useDetailsPalette`, `react`, `sawari.ts`, `ManageBookingSheet.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `CarDetailsSections.tsx`, `useVehicles`, `AppGate`, `TripDetailParts.tsx`, `react-native-safe-area-context`, `useColors.ts`, `DatesSheet.tsx`, `CarListCard.tsx`, `DriverOptionScreen.tsx`, `PriceBreakdownSheet.tsx`, `useVehicles.ts`, `@expo/vector-icons`, `CustomAlert.tsx`, `FlashSaleButton.tsx`, `TopDealsScreen.tsx`, `index.ts`, `FaqsScreen.tsx`, `WelcomeSheet.tsx`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `LoadingImage`, `FilterSheet.tsx`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `@expo/vector-icons`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `useColors`, `AnimatedSplash.tsx`, `activity.ts`, `LoadingImage`, `HelpScreen.tsx`, `HomeScreen.tsx`, `MembershipScreen.tsx`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `BookingsScreen.tsx`, `ProfileScreen.tsx`, `useDetailsPalette`, `react`, `sawari.ts`, `ManageBookingSheet.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `CarDetailsSections.tsx`, `useVehicles`, `TripDetailParts.tsx`, `react-native-safe-area-context`, `useColors.ts`, `DatesSheet.tsx`, `CarListCard.tsx`, `PriceBreakdownSheet.tsx`, `@expo/vector-icons`, `CustomAlert.tsx`, `FlashSaleButton.tsx`, `TopDealsScreen.tsx`, `index.ts`, `FaqsScreen.tsx`, `WelcomeSheet.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `SearchScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11212121212121212 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `@expo/vector-icons` to `LoginBottomSheet`, `LoadingImage`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `sawari.ts`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `useColors`, `LoadingImage`, `HelpScreen.tsx`, `HomeScreen.tsx`, `MembershipScreen.tsx`, `FlashSaleScreen.tsx`, `BookingsScreen.tsx`, `ProfileScreen.tsx`, `useDetailsPalette`, `react`, `sawari.ts`, `ManageBookingSheet.tsx`, `CarDetailsSections.tsx`, `useVehicles`, `AppGate`, `TripDetailParts.tsx`, `react-native-safe-area-context`, `useColors.ts`, `DatesSheet.tsx`, `CarListCard.tsx`, `@expo/vector-icons`, `TopDealsScreen.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._