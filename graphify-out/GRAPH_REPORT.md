# Graph Report - MySawari  (2026-11-23)

## Corpus Check
- 263 files · ~1,480,175 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1756 nodes · 5836 edges · 90 communities (81 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de3bd340`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- WelcomeSheet.tsx
- ModalBlur
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- BookingScreen.tsx
- Skeleton
- MembershipFaqsScreen.tsx
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
- @expo/vector-icons
- HomeScreen.tsx
- LocationSheet
- LoadingImage
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- useVehicles.ts
- BottomNavigation.tsx
- useDetailsPalette
- MyWalletScreen.tsx
- offers.ts
- useDealCars.ts
- tsconfig.json
- useHomeData.ts
- HomeHero
- FlashSaleBanner.tsx
- MembershipScreen.tsx
- BookingDetailScreen.tsx
- timedFetch
- DatesSheet.tsx
- react-native
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- deviceScaling.test.js
- android
- PaymentsListScreen.tsx
- DriverChargesSheet
- recentSearches.ts
- metro.config.js
- StickyBookingBar.tsx
- ProfileScreen.tsx
- HeroSlideBase
- useSawari
- secureStore.web.ts
- index.ts
- ios
- infoPlist
- vehicleKnowledge.ts
- expo
- SettingsScreen.tsx
- CarListCard.tsx
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- haptics.ts
- experiments
- ErrorFallback.tsx
- splash
- scripts
- DriverOptionScreen.tsx
- DestinationCard.tsx
- 2. Apple App Store Connect Listing
- SavedAddressesScreen.tsx
- TopPickCard
- BenefitCards.tsx
- FlashSaleButton.tsx
- FloatingSupport.tsx
- useSawari
- withOptionalHardwareFeatures.js
- social.ts
- openStorePage

## God Nodes (most connected - your core abstractions)
1. `react` - 204 edges
2. `useSawari()` - 150 edges
3. `react-native` - 146 edges
4. `useDetailsPalette()` - 140 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 95 edges
7. `expo-router` - 70 edges
8. `react-native-safe-area-context` - 68 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Keywords Field (Limit: 100 characters | Strictly Valid: 99 characters)` --references--> `Car`  [INFERRED]
  docs/store-listing.md → utils/sawari.ts
- `Route()` --calls--> `TopDealsScreen()`  [EXTRACTED]
  app/top-deals.tsx → screens/TopDeals/TopDealsScreen.tsx
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `BottomNavigation()`  [EXTRACTED]
  app/_layout.tsx → components/navigation/BottomNavigation.tsx

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (90 total, 9 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.07
Nodes (46): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), extractOtpCode() (+38 more)

### Community 1 - "WelcomeSheet.tsx"
Cohesion: 0.12
Nodes (16): Chip, chipStyles, ROWS, styles, WelcomeSheet(), createUnscaled, deviceHeight, deviceWidth (+8 more)

### Community 2 - "ModalBlur"
Cohesion: 0.10
Nodes (21): defaultFilters, FilterSheet(), FilterState, styles, SetLocationSheet(), styles, BlurTargetContext, useBlurTarget() (+13 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.11
Nodes (37): Route(), FunnelIcon(), SortArrowsIcon(), brandOf(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+29 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-application, expo-build-properties (+27 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.06
Nodes (56): Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles, ChevronIcon() (+48 more)

### Community 7 - "BookingScreen.tsx"
Cohesion: 0.11
Nodes (34): Route(), Route(), Route(), CouponNotApplicableModal(), Props, styles, Reveal(), Dashes() (+26 more)

### Community 8 - "Skeleton"
Cohesion: 0.08
Nodes (50): Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles (+42 more)

### Community 9 - "MembershipFaqsScreen.tsx"
Cohesion: 0.17
Nodes (14): Route(), Route(), FaqList(), Faqs, dark, light, styles, SubPageHeader() (+6 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (16): BENEFITS, BIKE_CATEGORIES, CATEGORIES, CategoryFilter, DEFAULT_SLIDES, HERO_TOP, HeroSlide, HOME_PURPLE (+8 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (22): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar() (+14 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.11
Nodes (19): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, FONT, PaymentFailed() (+11 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (21): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, BUDGETS, Cta(), FEATURES (+13 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.19
Nodes (18): ExclusiveOffersSection(), basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal(), ExclusiveOfferDetailModalProps, formatOfferDateTime(), idOf() (+10 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.08
Nodes (35): DRIVER_CHARGE_PER_DAY, MODES, styles, buildQuoteFingerprint(), calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge() (+27 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (16): asString(), PushData, PushNotificationHandler(), AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue (+8 more)

### Community 17 - "ReferEarnScreen.tsx"
Cohesion: 0.09
Nodes (22): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, MembershipRatingModal(), MembershipRatingModalProps (+14 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.16
Nodes (21): AnimatedG, AnimatedSplash(), BACK, BRAND_SPLASH_COLORS, markSplashGone(), seg(), splashGoneListeners, SplashStep (+13 more)

### Community 19 - "activity.ts"
Cohesion: 0.21
Nodes (14): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS (+6 more)

### Community 20 - "sawari.ts"
Cohesion: 0.10
Nodes (27): Route(), CarTile, styles, LuxuryCarTile, styles, WishlistScreen(), AvailabilityInfo, baseCars (+19 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+46 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "@expo/vector-icons"
Cohesion: 0.21
Nodes (10): PrimaryButton(), styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, styles, VehicleSpecs() (+2 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.08
Nodes (37): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomePromoBanner(), HomeSectionTitle(), MemberBenefitsCard() (+29 more)

### Community 25 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 26 - "LoadingImage"
Cohesion: 0.20
Nodes (14): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+6 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "HomeCardsRow.tsx"
Cohesion: 0.23
Nodes (10): DealsCard(), FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox() (+2 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.07
Nodes (25): Route(), FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen() (+17 more)

### Community 32 - "useVehicles.ts"
Cohesion: 0.16
Nodes (14): F, styles, { width: SCREEN_WIDTH }, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+6 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (15): ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+7 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.11
Nodes (46): Route(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList() (+38 more)

### Community 35 - "MyWalletScreen.tsx"
Cohesion: 0.29
Nodes (9): Route(), longStamp(), MyWalletScreen(), stageOf(), styles, Tx, withdrawalSteps(), WithdrawSheet() (+1 more)

### Community 36 - "offers.ts"
Cohesion: 0.19
Nodes (16): styles, fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), isOfferLive(), NextFlashSale, Offer (+8 more)

### Community 37 - "useDealCars.ts"
Cohesion: 0.21
Nodes (25): carGapOn(), ceilIstHourMs(), dealDayTime(), dealWhenLabel(), istDayNum(), parseCustomDateToMs(), TOP_DEAL_END_HOUR, TOP_DEAL_START_HOUR (+17 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "useHomeData.ts"
Cohesion: 0.17
Nodes (18): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, HomeLoadStep (+10 more)

### Community 40 - "HomeHero"
Cohesion: 0.18
Nodes (11): BannerRays(), ArcHeadline(), BenefitsGrid(), HeroSearch(), HeroTabs(), HomeHero(), parseSubtitleTags(), PicIcon() (+3 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "MembershipScreen.tsx"
Cohesion: 0.14
Nodes (19): Route(), TripMilestoneCard(), styles, VehicleHeader(), ActiveMembership, activeOnly(), Dashes(), getPlanDef() (+11 more)

### Community 43 - "BookingDetailScreen.tsx"
Cohesion: 0.06
Nodes (79): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+71 more)

### Community 44 - "timedFetch"
Cohesion: 0.27
Nodes (8): expo-device, fetchContentVersion(), enforceHttpsUrl(), normalizeResponse(), timedFetch(), fetchChallengeNonce(), IntegrityVerdict, verifyAppIntegrity()

### Community 45 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 46 - "react-native"
Cohesion: 0.17
Nodes (12): ChoiceOption, styles, styles, styles, F, Photo, PhotoSourceSheet(), Star() (+4 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.22
Nodes (6): styles, UpdateModalProps, { width: SCREEN_WIDTH }, UpdateInfo, UpdateStatus, expo-constants

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "deviceScaling.test.js"
Cohesion: 0.25
Nodes (5): assert, DEVICES, scalePropStyle(), scaleStyleObject(), test

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "PaymentsListScreen.tsx"
Cohesion: 0.36
Nodes (4): useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles

### Community 53 - "recentSearches.ts"
Cohesion: 0.30
Nodes (12): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+4 more)

### Community 54 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 55 - "StickyBookingBar.tsx"
Cohesion: 0.21
Nodes (12): Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, ONE_DAY_KM, TOP_DEAL_EXTRA_KM_RATE, TOP_DEAL_KM (+4 more)

### Community 56 - "ProfileScreen.tsx"
Cohesion: 0.16
Nodes (19): Route(), Page(), HeartIcon(), useBottomNavHeight(), Dashes(), FONT, HEADER, inr0() (+11 more)

### Community 57 - "HeroSlideBase"
Cohesion: 0.33
Nodes (6): BenefitsSlide, ComboSlide, HeroSlideBase, ImageSlide, PriceSlide, TextSlide

### Community 58 - "useSawari"
Cohesion: 0.13
Nodes (21): NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles (+13 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "index.ts"
Cohesion: 0.16
Nodes (18): DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+10 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 65 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 66 - "CarListCard.tsx"
Cohesion: 0.12
Nodes (18): CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout (+10 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.09
Nodes (9): Route(), dealPricing(), pad2(), styles, VehicleCard(), VehicleCardProps, { width: SCREEN_WIDTH }, getVehicleImage() (+1 more)

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "haptics.ts"
Cohesion: 0.10
Nodes (24): AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection(), getCategorizedFeatures(), ReviewCard() (+16 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "ErrorFallback.tsx"
Cohesion: 0.19
Nodes (7): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, expo

### Community 75 - "splash"
Cohesion: 0.60
Nodes (5): splash, splash, backgroundColor, image, resizeMode

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 79 - "2. Apple App Store Connect Listing"
Cohesion: 0.15
Nodes (12): 1. Google Play Console Listing, 2. Apple App Store Connect Listing, 3. High-Converting Screenshot Framework (CTR Optimization), App Name (Limit: 30 characters), App Title (Limit: 30 characters), Full Description (Limit: 4,000 characters | Current: 3,790 characters), Keywords Field (Limit: 100 characters | Strictly Valid: 99 characters), MySawari – Complete App Store Optimization (ASO) & Store Listing Guide (+4 more)

### Community 80 - "SavedAddressesScreen.tsx"
Cohesion: 0.18
Nodes (13): Route(), ChoiceSheet(), SORT_OPTIONS, SortKey, SortSheet(), styles, BlurTargetProvider(), styles (+5 more)

### Community 81 - "TopPickCard"
Cohesion: 0.40
Nodes (5): cardDate(), TopPickCard(), TripSearchCard(), memberDayPrice(), carTitle()

### Community 82 - "BenefitCards.tsx"
Cohesion: 0.50
Nodes (3): BenefitCards(), ITEMS, styles

### Community 83 - "FlashSaleButton.tsx"
Cohesion: 0.15
Nodes (10): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles, react-native-svg (+2 more)

### Community 84 - "FloatingSupport.tsx"
Cohesion: 0.31
Nodes (7): Route(), SUPPORT_EMAIL, EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 85 - "useSawari"
Cohesion: 0.16
Nodes (16): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+8 more)

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 685 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `PaymentProcessingScreen.tsx` to `LoginBottomSheet`, `WelcomeSheet.tsx`, `ModalBlur`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `HelpScreen.tsx`, `@expo/vector-icons`, `HomeScreen.tsx`, `LocationSheet`, `LoadingImage`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `offers.ts`, `useDealCars.ts`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `DatesSheet.tsx`, `react-native`, `UpdateModal.tsx`, `PaymentsListScreen.tsx`, `DriverChargesSheet`, `recentSearches.ts`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `useSawari`, `index.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `ErrorFallback.tsx`, `DriverOptionScreen.tsx`, `DestinationCard.tsx`, `SavedAddressesScreen.tsx`, `BenefitCards.tsx`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.06623376623376623 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `WelcomeSheet.tsx`, `ModalBlur`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `activity.ts`, `sawari.ts`, `HelpScreen.tsx`, `@expo/vector-icons`, `HomeScreen.tsx`, `LoadingImage`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `offers.ts`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `timedFetch`, `DatesSheet.tsx`, `UpdateModal.tsx`, `PaymentsListScreen.tsx`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `useSawari`, `index.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `ErrorFallback.tsx`, `DestinationCard.tsx`, `SavedAddressesScreen.tsx`, `BenefitCards.tsx`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`, `social.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `WelcomeSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `LoginBottomSheet`, `ModalBlur`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `sawari.ts`, `HelpScreen.tsx`, `HomeScreen.tsx`, `LocationSheet`, `LoadingImage`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `DatesSheet.tsx`, `react-native`, `PaymentsListScreen.tsx`, `recentSearches.ts`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `index.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `SavedAddressesScreen.tsx`, `FloatingSupport.tsx`, `useSawari`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `ModalBlur` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._