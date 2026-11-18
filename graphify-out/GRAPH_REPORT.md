# Graph Report - MySawari  (2026-11-18)

## Corpus Check
- 259 files · ~1,473,768 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1716 nodes · 5784 edges · 92 communities (89 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e64e6a87`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- DetailsTabs.tsx
- useColors.ts
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- OffersScreen.tsx
- react-native
- PolicyScreen.tsx
- HomeSections.tsx
- _layout.tsx
- PaymentProcessingScreen.tsx
- ExploreFilters.tsx
- ExclusiveOfferDetailModal.tsx
- pricingEngine.ts
- SawariContext.tsx
- ReferEarnScreen.tsx
- AnimatedSplash.tsx
- activity.ts
- sawari.ts
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- react
- ConfirmationScreen.tsx
- expo
- fetchWithAuth
- api.ts
- BookingScreen.tsx
- FlashSaleScreen.tsx
- useVehicles.ts
- BottomNavigation.tsx
- useDetailsPalette
- MyWalletScreen.tsx
- offers.ts
- useDealCars.ts
- tsconfig.json
- SearchResultsScreen
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- MembershipScreen.tsx
- BookingDetailScreen.tsx
- ProfileParts.tsx
- DatesSheet.tsx
- @expo/vector-icons
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- useSawari
- android
- referrals.ts
- FilterSheet.tsx
- recentSearches.ts
- PaymentsListScreen.tsx
- MembershipSavedPopup.tsx
- ProfileScreen.tsx
- LocationSearchBody.tsx
- SearchEmptyState.tsx
- secureStore.web.ts
- index.ts
- ios
- infoPlist
- vehicleKnowledge.ts
- CustomAlert.tsx
- SettingsScreen.tsx
- formatCurrency
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- LoadingImage
- experiments
- metro.config.js
- useSawari
- scripts
- detailsPalette.ts
- RefundsScreen.tsx
- MySawari – store listing text (search)
- useVehicles
- react-native-svg
- HomeHero
- FlashSaleButton.tsx
- FloatingSupport.tsx
- RewardsScreen.tsx
- ErrorFallback.tsx
- HeroSlideBase
- formatCurrency
- TopPickCard
- BenefitsGrid
- social.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 204 edges
2. `useSawari()` - 150 edges
3. `react-native` - 146 edges
4. `useDetailsPalette()` - 140 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 95 edges
7. `expo-router` - 69 edges
8. `react-native-safe-area-context` - 68 edges
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

## Communities (92 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.14
Nodes (27): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+19 more)

### Community 1 - "DetailsTabs.tsx"
Cohesion: 0.17
Nodes (18): rise(), Reveal(), revealedScreens, AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection() (+10 more)

### Community 2 - "useColors.ts"
Cohesion: 0.11
Nodes (13): SectionHeading(), styles, styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, PriceBreakdownSheet(), ReadyPrice (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.15
Nodes (17): FunnelIcon(), SortArrowsIcon(), EMPTY_FILTERS, ExploreFilters, QuickChip, SortKey, listeners, navHelpListeners (+9 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): expo, install, exclude, main, name, private, version, @babel/core (+27 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.08
Nodes (43): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+35 more)

### Community 7 - "OffersScreen.tsx"
Cohesion: 0.19
Nodes (15): Route(), Route(), CouponNotApplicableModal(), Props, styles, ListSkeleton(), Dashes(), PF (+7 more)

### Community 8 - "react-native"
Cohesion: 0.18
Nodes (25): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, HomeCarRowSkeleton(), HomeCarSkeleton() (+17 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.08
Nodes (29): Route(), Route(), Route(), Route(), Route(), Route(), Route(), Route() (+21 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.08
Nodes (15): BENEFITS, BIKE_CATEGORIES, CATEGORIES, CategoryFilter, DEFAULT_SLIDES, HERO_TOP, HeroSlide, HOME_PURPLE (+7 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.08
Nodes (21): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), LoginGate(), onSplashGone() (+13 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.15
Nodes (14): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+6 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (25): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+17 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.18
Nodes (18): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+10 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (28): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+20 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (22): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+14 more)

### Community 17 - "ReferEarnScreen.tsx"
Cohesion: 0.15
Nodes (10): Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, FaqList(), expo-linear-gradient, Rays() (+2 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "activity.ts"
Cohesion: 0.21
Nodes (14): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS (+6 more)

### Community 20 - "sawari.ts"
Cohesion: 0.13
Nodes (22): CarTile, styles, LuxuryCarTile, styles, AvailabilityInfo, baseCars, Block, CarNextBookingWindow (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "react-native"
Cohesion: 0.10
Nodes (19): DriverModeRow(), styles, SearchCard(), styles, SearchSheet(), styles, styles, styles (+11 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (27): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+19 more)

### Community 25 - "react"
Cohesion: 0.12
Nodes (10): Route(), Route(), Route(), Route(), Route(), react, DriverChargesScreen(), DriverOptionScreen() (+2 more)

### Community 26 - "ConfirmationScreen.tsx"
Cohesion: 0.21
Nodes (12): Route(), MembershipRatingModal(), MembershipRatingModalProps, styles, ConfirmationScreen(), FONT, NEXT, styles (+4 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.16
Nodes (19): expo-device, expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed() (+11 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingScreen.tsx"
Cohesion: 0.19
Nodes (15): Route(), MembershipCelebration(), MembershipSavedPopup(), useTrackTripProgress(), useLiveCar(), BookingScreen(), dayAndTime(), FONT (+7 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.08
Nodes (24): Route(), FlashSaleHeroTitle, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen(), styles (+16 more)

### Community 32 - "useVehicles.ts"
Cohesion: 0.17
Nodes (13): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchCarGallery(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY (+5 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.11
Nodes (17): RootLayoutNav(), styles, ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps (+9 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.12
Nodes (43): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+35 more)

### Community 35 - "MyWalletScreen.tsx"
Cohesion: 0.31
Nodes (9): Route(), rupees(), MyWalletScreen(), stageOf(), styles, Tx, withdrawalSteps(), WithdrawSheet() (+1 more)

### Community 36 - "offers.ts"
Cohesion: 0.25
Nodes (14): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), isOfferLive(), NextFlashSale, Offer, plateSafeOfferImage() (+6 more)

### Community 37 - "useDealCars.ts"
Cohesion: 0.16
Nodes (21): DealsCard(), FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox() (+13 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "SearchResultsScreen"
Cohesion: 0.26
Nodes (11): Route(), Route(), chipOn(), chipsFor(), countActive(), sortCars(), toggleChip(), useVehicleRatings() (+3 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (14): Route(), MEMBERSHIP_FAQS, ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard() (+6 more)

### Community 43 - "BookingDetailScreen.tsx"
Cohesion: 0.05
Nodes (88): Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles (+80 more)

### Community 44 - "ProfileParts.tsx"
Cohesion: 0.30
Nodes (11): formatOfferDateTime(), longStamp(), Step, StepState, styles, until(), formatAvailableTill(), formatTime12() (+3 more)

### Community 45 - "DatesSheet.tsx"
Cohesion: 0.13
Nodes (22): Route(), TimesScreen(), ALL_TIMES, carGapOn(), DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES (+14 more)

### Community 46 - "@expo/vector-icons"
Cohesion: 0.08
Nodes (22): ChoiceOption, ChoiceSheet(), styles, NextTrip(), styles, SetLocationSheet(), styles, styles (+14 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "useSawari"
Cohesion: 0.21
Nodes (12): RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W, ScratchCard() (+4 more)

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "referrals.ts"
Cohesion: 0.15
Nodes (22): Route(), Route(), shortDay(), StatusTimeline(), MiniTracker(), MyReferralsScreen(), SHORT, styles (+14 more)

### Community 52 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 53 - "recentSearches.ts"
Cohesion: 0.20
Nodes (18): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem, adoptGuestSearches(), getRecentSearches() (+10 more)

### Community 54 - "PaymentsListScreen.tsx"
Cohesion: 0.36
Nodes (4): useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles

### Community 55 - "MembershipSavedPopup.tsx"
Cohesion: 0.14
Nodes (16): Layout, OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT, styles, Theme, THEMES (+8 more)

### Community 56 - "ProfileScreen.tsx"
Cohesion: 0.15
Nodes (20): Route(), Page(), RateUsCard(), DesignToggle(), useBottomNavHeight(), Dashes(), FONT, HEADER (+12 more)

### Community 57 - "LocationSearchBody.tsx"
Cohesion: 0.18
Nodes (14): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+6 more)

### Community 58 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "index.ts"
Cohesion: 0.17
Nodes (22): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet() (+14 more)

### Community 61 - "ios"
Cohesion: 0.29
Nodes (7): ios, associatedDomains, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "CustomAlert.tsx"
Cohesion: 0.19
Nodes (7): AlertButton, AlertPayload, CustomAlert, styles, createUnscaled, k, originalCreate

### Community 65 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 66 - "formatCurrency"
Cohesion: 0.22
Nodes (12): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), HeartIcon(), useFavorites() (+4 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.09
Nodes (8): useAfterSlideIn(), pad2(), styles, VehicleCardProps, { width: SCREEN_WIDTH }, MONTH_NAMES, getVehicleImage(), vehicleImages

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "LoadingImage"
Cohesion: 0.19
Nodes (15): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+7 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 75 - "useSawari"
Cohesion: 0.33
Nodes (10): AddressPickerSheet(), DeliveryOptions(), DeliveryPickupCard(), DRIVER_CHARGE_PER_DAY, DriverCard(), MODES, styles, Toggle() (+2 more)

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "detailsPalette.ts"
Cohesion: 0.50
Nodes (3): dark, light, useIsDarkMode()

### Community 78 - "RefundsScreen.tsx"
Cohesion: 0.39
Nodes (7): Route(), ScreenHeader(), amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "useVehicles"
Cohesion: 0.29
Nodes (7): Route(), CarCardSkeleton(), styles, CarListCard, useVehicles(), styles, WishlistScreen()

### Community 81 - "react-native-svg"
Cohesion: 0.25
Nodes (6): BenefitCards(), ITEMS, styles, react-native-svg, *.png, *.svg

### Community 82 - "HomeHero"
Cohesion: 0.25
Nodes (8): BannerRays(), ArcHeadline(), HeroSearch(), HeroTabs(), HomeHero(), parseSubtitleTags(), splitTitleIntoTwoLines(), splitWords()

### Community 83 - "FlashSaleButton.tsx"
Cohesion: 0.22
Nodes (7): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles

### Community 84 - "FloatingSupport.tsx"
Cohesion: 0.12
Nodes (20): Route(), Route(), FONT, PaymentFailed(), styles, FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES (+12 more)

### Community 85 - "RewardsScreen.tsx"
Cohesion: 0.38
Nodes (5): Route(), F, MILESTONE_TIERS, RewardsScreen(), styles

### Community 86 - "ErrorFallback.tsx"
Cohesion: 0.38
Nodes (5): ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles

### Community 87 - "HeroSlideBase"
Cohesion: 0.33
Nodes (6): BenefitsSlide, ComboSlide, HeroSlideBase, ImageSlide, PriceSlide, TextSlide

### Community 88 - "formatCurrency"
Cohesion: 0.29
Nodes (9): TripMilestoneCard(), Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, PlanRow(), BOOKING_ADVANCE_AMOUNT (+1 more)

### Community 89 - "TopPickCard"
Cohesion: 0.50
Nodes (4): cardDate(), TopPickCard(), memberDayPrice(), carTitle()

### Community 90 - "BenefitsGrid"
Cohesion: 0.67
Nodes (3): BenefitsGrid(), PicIcon(), ReferStrip()

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 662 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `DetailsTabs.tsx`, `useColors.ts`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `SearchResultsScreen`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `ProfileParts.tsx`, `DatesSheet.tsx`, `@expo/vector-icons`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `FilterSheet.tsx`, `recentSearches.ts`, `PaymentsListScreen.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `CustomAlert.tsx`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `LoadingImage`, `useSawari`, `RefundsScreen.tsx`, `useVehicles`, `react-native-svg`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `RewardsScreen.tsx`, `ErrorFallback.tsx`, `formatCurrency`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `DetailsTabs.tsx`, `useColors.ts`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `activity.ts`, `sawari.ts`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `fetchWithAuth`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `ProfileParts.tsx`, `DatesSheet.tsx`, `@expo/vector-icons`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `FilterSheet.tsx`, `PaymentsListScreen.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `CustomAlert.tsx`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `LoadingImage`, `useSawari`, `RefundsScreen.tsx`, `useVehicles`, `react-native-svg`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `RewardsScreen.tsx`, `ErrorFallback.tsx`, `formatCurrency`, `social.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `useColors.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `LoginBottomSheet`, `DetailsTabs.tsx`, `useColors.ts`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `sawari.ts`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `SearchResultsScreen`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `DatesSheet.tsx`, `@expo/vector-icons`, `useSawari`, `referrals.ts`, `recentSearches.ts`, `PaymentsListScreen.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `LoadingImage`, `RefundsScreen.tsx`, `useVehicles`, `FloatingSupport.tsx`, `RewardsScreen.tsx`, `formatCurrency`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `SearchScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._