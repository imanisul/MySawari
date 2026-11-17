# Graph Report - MySawari  (2026-11-17)

## Corpus Check
- 253 files · ~1,459,777 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1684 nodes · 5558 edges · 83 communities (79 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7940d113`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- LoadingImage
- CarDetailsScreen.tsx
- devDependencies
- ExploreScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- DatesSheet.tsx
- StickyBookingBar.tsx
- PolicyScreen.tsx
- HomeSections.tsx
- _layout.tsx
- ProfileScreen.tsx
- LocationSearchBody.tsx
- react-native-safe-area-context
- pricingEngine.ts
- SawariContext.tsx
- useSawari
- AnimatedSplash.tsx
- useSawari
- react
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- ModalBlur
- MembershipScreen.tsx
- expo
- fetchWithAuth
- api.ts
- DriverChargesSheet
- FlashSaleScreen.tsx
- SavedAddressesScreen.tsx
- SettingsScreen.tsx
- useColors
- PaymentProcessingScreen.tsx
- ExclusiveOfferDetailModal.tsx
- activity.ts
- tsconfig.json
- VehicleSummary.tsx
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- HomeCardsRow.tsx
- ReferEarnScreen.tsx
- index.ts
- @expo/vector-icons
- ConfirmationScreen.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- offers.ts
- android
- react-native-safe-area-context
- CarListCard.tsx
- recentSearches.ts
- offers.ts
- MembershipRatingModal.tsx
- CustomAlert.tsx
- FlashSaleButton.tsx
- react-native-svg
- secureStore.web.ts
- expo-router
- ios
- infoPlist
- vehicleKnowledge.ts
- sawari.ts
- useDetailsPalette
- AddressSearchScreen.tsx
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- ErrorFallback.tsx
- experiments
- WishlistScreen.tsx
- BenefitCards.tsx
- scripts
- SearchEmptyState.tsx
- recentlyViewed.ts
- MySawari – store listing text (search)
- @expo/vector-icons
- expo-constants
- social.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 199 edges
2. `useSawari()` - 150 edges
3. `react-native` - 143 edges
4. `useDetailsPalette()` - 130 edges
5. `useColors()` - 108 edges
6. `@expo/vector-icons` - 92 edges
7. `expo-router` - 67 edges
8. `react-native-safe-area-context` - 66 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `Route()` --calls--> `TopDealsScreen()`  [EXTRACTED]
  app/top-deals.tsx → screens/TopDeals/TopDealsScreen.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (83 total, 4 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.14
Nodes (27): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+19 more)

### Community 1 - "LoadingImage"
Cohesion: 0.08
Nodes (38): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+30 more)

### Community 2 - "CarDetailsScreen.tsx"
Cohesion: 0.12
Nodes (44): Route(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList() (+36 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ExploreScreen.tsx"
Cohesion: 0.08
Nodes (55): Route(), FunnelIcon(), SortArrowsIcon(), ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER (+47 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): expo, install, exclude, main, name, private, version, @babel/core (+27 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.17
Nodes (22): Route(), isInNortheast(), usePlaceSearch(), AddressConfirmScreen(), mapHtml(), PRESET_LABELS, styles, comp() (+14 more)

### Community 7 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 8 - "StickyBookingBar.tsx"
Cohesion: 0.22
Nodes (10): Breakup(), Dashes(), ReadyPrice, styles, ONE_DAY_KM, TOP_DEAL_EXTRA_KM_RATE, TOP_DEAL_KM, PLAN_NAMES (+2 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (20): Route(), Route(), Route(), Route(), Route(), Route(), Bullet(), CANCELLATION_CLAUSES (+12 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.06
Nodes (36): BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide, BIKE_CATEGORIES, cardDate(), CATEGORIES (+28 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (18): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), LoginGate(), onSplashGone() (+10 more)

### Community 12 - "ProfileScreen.tsx"
Cohesion: 0.16
Nodes (17): Route(), RateUsCard(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+9 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.15
Nodes (17): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+9 more)

### Community 14 - "react-native-safe-area-context"
Cohesion: 0.07
Nodes (73): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+65 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+19 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.11
Nodes (21): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+13 more)

### Community 17 - "useSawari"
Cohesion: 0.20
Nodes (17): Route(), BlurTargetProvider(), DesignToggle(), MembershipCelebration(), MembershipSavedPopup(), StickyBookingBar(), useTripPrice(), useTrackTripProgress() (+9 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "useSawari"
Cohesion: 0.08
Nodes (33): RootLayoutNav(), Route(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps (+25 more)

### Community 20 - "react"
Cohesion: 0.13
Nodes (12): Route(), Route(), Route(), Route(), useKeyboardPad(), react, DriverOptionScreen(), LocationScreen() (+4 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.13
Nodes (16): Route(), Route(), FONT, styles, Header(), OfferCard, SUPPORT_EMAIL, SUPPORT_PHONE (+8 more)

### Community 23 - "react-native"
Cohesion: 0.18
Nodes (15): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+7 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (24): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+16 more)

### Community 25 - "ModalBlur"
Cohesion: 0.14
Nodes (20): styles, SORT_OPTIONS, SortKey, SortSheet(), styles, F, Photo, PhotoSourceSheet() (+12 more)

### Community 26 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (16): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), memberPriceFor() (+8 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "DriverChargesSheet"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.08
Nodes (21): Route(), FlashSaleHeroTitle, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen(), styles (+13 more)

### Community 32 - "SavedAddressesScreen.tsx"
Cohesion: 0.30
Nodes (13): Route(), DeliveryOptions(), PhoneSheet(), SavedAddressesScreen(), styles, getSavedAddresses(), keyFor(), removeSavedAddress() (+5 more)

### Community 33 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 34 - "useColors"
Cohesion: 0.17
Nodes (18): NotFoundScreen(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet(), styles, PlannerSheet() (+10 more)

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+6 more)

### Community 36 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.15
Nodes (21): ExclusiveOffersSection(), F, MONTHS_SHORT, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft() (+13 more)

### Community 37 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), expo-device, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "VehicleSummary.tsx"
Cohesion: 0.14
Nodes (11): AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryPickupCard(), DRIVER_CHARGE_PER_DAY, MODES, styles, Toggle() (+3 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.15
Nodes (17): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+9 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "HomeCardsRow.tsx"
Cohesion: 0.18
Nodes (15): DealsCard(), FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox() (+7 more)

### Community 43 - "ReferEarnScreen.tsx"
Cohesion: 0.16
Nodes (6): Route(), BlurTarget(), expo-status-bar, Rays(), ReferEarnScreen(), styles

### Community 44 - "index.ts"
Cohesion: 0.07
Nodes (22): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, NextTrip(), styles (+14 more)

### Community 45 - "@expo/vector-icons"
Cohesion: 0.06
Nodes (70): Route(), Route(), Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps, styles (+62 more)

### Community 46 - "ConfirmationScreen.tsx"
Cohesion: 0.22
Nodes (11): Route(), BlurHost(), BottomBlur(), styles, Page(), styles, useBottomNavHeight(), ConfirmationScreen() (+3 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "offers.ts"
Cohesion: 0.31
Nodes (10): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), isOfferLive(), NextFlashSale, Offer, plateSafeOfferImage(), prefetchOfferImages() (+2 more)

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "react-native-safe-area-context"
Cohesion: 0.24
Nodes (7): DropoffSheet(), Place, POPULAR, Row(), styles, react-native-safe-area-context, DropoffScreen()

### Community 52 - "CarListCard.tsx"
Cohesion: 0.10
Nodes (22): TripMilestoneCard(), CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown() (+14 more)

### Community 53 - "recentSearches.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 54 - "offers.ts"
Cohesion: 0.19
Nodes (13): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), vehiclesQueryOptions, waitForCardImages() (+5 more)

### Community 55 - "MembershipRatingModal.tsx"
Cohesion: 0.31
Nodes (7): MembershipRatingModal(), MembershipRatingModalProps, styles, hasPromptedMembershipRating(), recordMembershipRatingAction(), requestStoreReview(), shouldPromptMembershipRating()

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "FlashSaleButton.tsx"
Cohesion: 0.22
Nodes (7): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles

### Community 58 - "react-native-svg"
Cohesion: 0.32
Nodes (5): styles, HeartIcon(), react-native-svg, *.png, *.svg

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "expo-router"
Cohesion: 0.13
Nodes (15): Route(), Route(), styles, styles, useQuote(), expo-router, PaymentScreen(), styles (+7 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "sawari.ts"
Cohesion: 0.10
Nodes (43): carGapOn(), CarTile, styles, LuxuryCarTile, styles, dealDayTime(), parseCustomDateToMs(), TOP_DEAL_END_HOUR (+35 more)

### Community 65 - "useDetailsPalette"
Cohesion: 0.20
Nodes (11): Route(), FaqList(), Faqs, dark, DetailsPalette, light, styles, SubPageHeader() (+3 more)

### Community 66 - "AddressSearchScreen.tsx"
Cohesion: 0.38
Nodes (5): Route(), SearchPlace, AddressSearchScreen(), Place, styles

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.09
Nodes (10): Route(), VEHICLES_KEY, pad2(), styles, VehicleCard(), VehicleCardProps, { width: SCREEN_WIDTH }, bestFor() (+2 more)

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "WishlistScreen.tsx"
Cohesion: 0.53
Nodes (4): Route(), styles, WishlistScreen(), byAvailability()

### Community 75 - "BenefitCards.tsx"
Cohesion: 0.50
Nodes (3): BenefitCards(), ITEMS, styles

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "SearchEmptyState.tsx"
Cohesion: 0.50
Nodes (3): Action, styles, useBrandColors()

### Community 78 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "@expo/vector-icons"
Cohesion: 0.16
Nodes (11): SearchCard(), styles, SearchSheet(), styles, styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH } (+3 more)

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 657 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `LoadingImage`, `CarDetailsScreen.tsx`, `ExploreScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `DatesSheet.tsx`, `StickyBookingBar.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `react-native-safe-area-context`, `SawariContext.tsx`, `useSawari`, `AnimatedSplash.tsx`, `useSawari`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ModalBlur`, `MembershipScreen.tsx`, `DriverChargesSheet`, `FlashSaleScreen.tsx`, `SavedAddressesScreen.tsx`, `SettingsScreen.tsx`, `useColors`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `VehicleSummary.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `HomeCardsRow.tsx`, `ReferEarnScreen.tsx`, `index.ts`, `@expo/vector-icons`, `ConfirmationScreen.tsx`, `UpdateModal.tsx`, `react-native-safe-area-context`, `CarListCard.tsx`, `recentSearches.ts`, `offers.ts`, `MembershipRatingModal.tsx`, `CustomAlert.tsx`, `FlashSaleButton.tsx`, `react-native-svg`, `expo-router`, `sawari.ts`, `useDetailsPalette`, `AddressSearchScreen.tsx`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `WishlistScreen.tsx`, `BenefitCards.tsx`, `SearchEmptyState.tsx`, `@expo/vector-icons`, `expo-constants`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `LoadingImage`, `CarDetailsScreen.tsx`, `ExploreScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `DatesSheet.tsx`, `StickyBookingBar.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `react-native-safe-area-context`, `SawariContext.tsx`, `useSawari`, `AnimatedSplash.tsx`, `useSawari`, `react`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ModalBlur`, `MembershipScreen.tsx`, `fetchWithAuth`, `FlashSaleScreen.tsx`, `SavedAddressesScreen.tsx`, `SettingsScreen.tsx`, `useColors`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `activity.ts`, `VehicleSummary.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `HomeCardsRow.tsx`, `ReferEarnScreen.tsx`, `index.ts`, `@expo/vector-icons`, `ConfirmationScreen.tsx`, `UpdateModal.tsx`, `react-native-safe-area-context`, `CarListCard.tsx`, `MembershipRatingModal.tsx`, `CustomAlert.tsx`, `FlashSaleButton.tsx`, `react-native-svg`, `expo-router`, `sawari.ts`, `useDetailsPalette`, `AddressSearchScreen.tsx`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `WishlistScreen.tsx`, `BenefitCards.tsx`, `SearchEmptyState.tsx`, `@expo/vector-icons`, `expo-constants`, `social.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.0797979797979798 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `LoginBottomSheet`, `LoadingImage`, `CarDetailsScreen.tsx`, `ExploreScreen.tsx`, `AddressConfirmScreen.tsx`, `DatesSheet.tsx`, `StickyBookingBar.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `react-native-safe-area-context`, `SawariContext.tsx`, `useSawari`, `react`, `HelpScreen.tsx`, `HomeScreen.tsx`, `MembershipScreen.tsx`, `FlashSaleScreen.tsx`, `SavedAddressesScreen.tsx`, `SettingsScreen.tsx`, `useColors`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `VehicleSummary.tsx`, `HomeCardsRow.tsx`, `ReferEarnScreen.tsx`, `index.ts`, `@expo/vector-icons`, `ConfirmationScreen.tsx`, `react-native-safe-area-context`, `CarListCard.tsx`, `recentSearches.ts`, `react-native-svg`, `expo-router`, `sawari.ts`, `AddressSearchScreen.tsx`, `TopDealsScreen.tsx`, `WishlistScreen.tsx`, `SearchEmptyState.tsx`, `@expo/vector-icons`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `CarDetailsScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11840888066604996 - nodes in this community are weakly interconnected._