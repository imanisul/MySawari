# Graph Report - MySawari  (2026-11-18)

## Corpus Check
- 256 files · ~1,472,908 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1709 nodes · 5761 edges · 89 communities (87 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f702ae97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- LoadingImage
- CarDetailsSections.tsx
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- BookingScreen.tsx
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
- @expo/vector-icons
- HomeScreen.tsx
- react
- ConfirmationScreen.tsx
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- BookingsScreen.tsx
- BottomNavigation.tsx
- useDetailsPalette
- ProfileParts.tsx
- offers.ts
- DatesSheet.tsx
- tsconfig.json
- useTripColors
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- MembershipScreen.tsx
- BookingDetailScreen.tsx
- TripReviewSheet.tsx
- DatesSheet.tsx
- react-native-safe-area-context
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- useSawari
- android
- referrals.ts
- FilterSheet.tsx
- useVehicles.ts
- PaymentsListScreen.tsx
- MembershipSavedPopup.tsx
- ProfileScreen.tsx
- LocationSearchBody.tsx
- useSawari
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
- ErrorFallback.tsx
- TripDetailParts.tsx
- scripts
- FaqsScreen.tsx
- LocationSheet
- MySawari – store listing text (search)
- useVehicles
- @react-native-async-storage/async-storage
- DropoffSheet.tsx
- FlashSaleButton.tsx
- EditProfileScreen.tsx
- expo-linear-gradient
- Page.tsx
- Reveal.tsx
- StickyBookingBar.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 202 edges
2. `useSawari()` - 150 edges
3. `react-native` - 145 edges
4. `useDetailsPalette()` - 138 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 95 edges
7. `expo-router` - 69 edges
8. `react-native-safe-area-context` - 67 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (89 total, 2 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.18
Nodes (19): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+11 more)

### Community 1 - "LoadingImage"
Cohesion: 0.11
Nodes (28): NotFoundScreen(), styles, SectionHeading(), styles, AboutSection(), DetailRow(), DetailsTab, DetailsTabs() (+20 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.12
Nodes (24): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MileageIcon() (+16 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.13
Nodes (27): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+19 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (34): expo, install, exclude, main, name, private, version, @babel/core (+26 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.09
Nodes (42): Route(), Route(), Route(), TOP_LOCATIONS, DeliveryOptions(), isInNortheast(), SearchPlace, usePlaceSearch() (+34 more)

### Community 7 - "BookingScreen.tsx"
Cohesion: 0.12
Nodes (32): Route(), Route(), Route(), ChoiceSheet(), CouponNotApplicableModal(), Props, styles, Reveal() (+24 more)

### Community 8 - "react-native"
Cohesion: 0.18
Nodes (25): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, HomeCarRowSkeleton(), HomeCarSkeleton() (+17 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (42): BenefitCards(), ITEMS, styles, BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide (+34 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (20): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), LoginGate() (+12 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.13
Nodes (16): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+8 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (25): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+17 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.15
Nodes (22): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+14 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (31): DRIVER_CHARGE_PER_DAY, MODES, styles, calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge() (+23 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.11
Nodes (16): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+8 more)

### Community 17 - "ReferEarnScreen.tsx"
Cohesion: 0.11
Nodes (18): Route(), Route(), shortDate(), tripTotal(), BlurHost(), BlurTarget(), BottomBlur(), styles (+10 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 20 - "sawari.ts"
Cohesion: 0.13
Nodes (14): AvailabilityInfo, baseCars, Block, CarNextBookingWindow, delay(), fetchCars(), fetchResultCars(), INDIA_TZ (+6 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "@expo/vector-icons"
Cohesion: 0.15
Nodes (18): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+10 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (22): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+14 more)

### Community 25 - "react"
Cohesion: 0.15
Nodes (7): Route(), Route(), react, DriverChargesScreen(), DriverOptionScreen(), *.png, *.svg

### Community 26 - "ConfirmationScreen.tsx"
Cohesion: 0.31
Nodes (7): MembershipRatingModal(), MembershipRatingModalProps, styles, hasPromptedMembershipRating(), recordMembershipRatingAction(), requestStoreReview(), shouldPromptMembershipRating()

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.16
Nodes (19): expo-device, expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed() (+11 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "HomeCardsRow.tsx"
Cohesion: 0.17
Nodes (11): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), react-native-gesture-handler (+3 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.08
Nodes (23): Route(), FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen() (+15 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.19
Nodes (13): Route(), driverLabel(), FONT, BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn() (+5 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.11
Nodes (19): RootLayoutNav(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+11 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.16
Nodes (30): Route(), Benefits(), CancellationPolicy(), FeatureList(), HelpCard(), LocationCard(), MainSpecification(), MembershipPicker() (+22 more)

### Community 35 - "ProfileParts.tsx"
Cohesion: 0.16
Nodes (21): Route(), Route(), Dashes(), longStamp(), PF, rupees(), ScreenHeader(), StatusTimeline() (+13 more)

### Community 36 - "offers.ts"
Cohesion: 0.25
Nodes (14): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), hydrateOffers(), isOfferLive(), NextFlashSale, nextFlashSaleQueryOptions (+6 more)

### Community 37 - "DatesSheet.tsx"
Cohesion: 0.18
Nodes (32): carGapOn(), DealsCard(), CarTile, LuxuryCarTile, ceilIstHourMs(), dealDayTime(), dealPricing(), dealWhenLabel() (+24 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "useTripColors"
Cohesion: 0.23
Nodes (13): CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles, ManageBookingSheet(), styles (+5 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.16
Nodes (16): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+8 more)

### Community 42 - "MembershipScreen.tsx"
Cohesion: 0.20
Nodes (14): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+6 more)

### Community 43 - "BookingDetailScreen.tsx"
Cohesion: 0.20
Nodes (17): Route(), RefundTrackingModal(), ActionRow(), pickupMoment(), refundAmountOf(), refundStage(), RefundTimeline(), rupees() (+9 more)

### Community 44 - "TripReviewSheet.tsx"
Cohesion: 0.24
Nodes (10): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+2 more)

### Community 45 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 46 - "react-native-safe-area-context"
Cohesion: 0.11
Nodes (24): ChoiceOption, styles, SetLocationSheet(), styles, SORT_OPTIONS, SortKey, SortSheet(), styles (+16 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.22
Nodes (8): styles, UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "useSawari"
Cohesion: 0.16
Nodes (16): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+8 more)

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "referrals.ts"
Cohesion: 0.18
Nodes (16): Route(), ListSkeleton(), shortDay(), MiniTracker(), MyReferralsScreen(), SHORT, styles, normalizeReferral() (+8 more)

### Community 52 - "FilterSheet.tsx"
Cohesion: 0.12
Nodes (11): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, expo-haptics, ImpactFeedbackStyle (+3 more)

### Community 53 - "useVehicles.ts"
Cohesion: 0.07
Nodes (45): Route(), clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES (+37 more)

### Community 54 - "PaymentsListScreen.tsx"
Cohesion: 0.27
Nodes (6): styles, PaymentMethodItem, PaymentsScreen(), styles, API, istDayMonthYear()

### Community 55 - "MembershipSavedPopup.tsx"
Cohesion: 0.18
Nodes (10): clearMembershipPopupShown(), Layout, OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT, styles, Theme (+2 more)

### Community 56 - "ProfileScreen.tsx"
Cohesion: 0.16
Nodes (18): Route(), RateUsCard(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+10 more)

### Community 57 - "LocationSearchBody.tsx"
Cohesion: 0.20
Nodes (13): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+5 more)

### Community 58 - "useSawari"
Cohesion: 0.13
Nodes (16): DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles (+8 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "index.ts"
Cohesion: 0.15
Nodes (19): DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+11 more)

### Community 61 - "ios"
Cohesion: 0.29
Nodes (7): ios, associatedDomains, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 65 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 66 - "formatCurrency"
Cohesion: 0.17
Nodes (17): TripMilestoneCard(), CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, styles (+9 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.10
Nodes (7): pad2(), styles, VehicleCard(), VehicleCardProps, { width: SCREEN_WIDTH }, getVehicleImage(), vehicleImages

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "LoadingImage"
Cohesion: 0.20
Nodes (14): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+6 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 75 - "TripDetailParts.tsx"
Cohesion: 0.18
Nodes (14): BookingCard(), Dash(), MONTHS, placeName(), PricingSummary(), Row(), StatusTag(), styles (+6 more)

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "FaqsScreen.tsx"
Cohesion: 0.22
Nodes (10): Route(), FaqList(), Faqs, dark, light, styles, SubPageHeader(), useIsDarkMode() (+2 more)

### Community 78 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "useVehicles"
Cohesion: 0.31
Nodes (8): Route(), CarCardSkeleton(), styles, CarListCard, useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 81 - "@react-native-async-storage/async-storage"
Cohesion: 0.29
Nodes (9): expo-application, expo-clipboard, @react-native-async-storage/async-storage, detectInstallReferrer(), extractReferralCode(), handleDeepLinkReferralUrl(), PENDING_REFERRAL_KEY, PendingReferral (+1 more)

### Community 82 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 83 - "FlashSaleButton.tsx"
Cohesion: 0.22
Nodes (7): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles

### Community 84 - "EditProfileScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 85 - "expo-linear-gradient"
Cohesion: 0.36
Nodes (6): FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, expo-linear-gradient

### Community 86 - "Page.tsx"
Cohesion: 0.43
Nodes (5): BlurTargetContext, BlurTargetProvider(), Page(), styles, useBottomNavHeight()

### Community 87 - "Reveal.tsx"
Cohesion: 0.60
Nodes (3): rise(), revealedScreens, react-native-reanimated

### Community 88 - "StickyBookingBar.tsx"
Cohesion: 0.50
Nodes (4): Breakup(), Dashes(), ReadyPrice, styles

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 661 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `LoadingImage`, `CarDetailsSections.tsx`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `react-native`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `HelpScreen.tsx`, `@expo/vector-icons`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `BookingsScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `ProfileParts.tsx`, `DatesSheet.tsx`, `useTripColors`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `TripReviewSheet.tsx`, `DatesSheet.tsx`, `react-native-safe-area-context`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `FilterSheet.tsx`, `useVehicles.ts`, `PaymentsListScreen.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `useSawari`, `index.ts`, `CustomAlert.tsx`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `LoadingImage`, `ErrorFallback.tsx`, `TripDetailParts.tsx`, `FaqsScreen.tsx`, `LocationSheet`, `useVehicles`, `DropoffSheet.tsx`, `FlashSaleButton.tsx`, `EditProfileScreen.tsx`, `expo-linear-gradient`, `Page.tsx`, `Reveal.tsx`, `StickyBookingBar.tsx`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `@expo/vector-icons` to `LoginBottomSheet`, `LoadingImage`, `CarDetailsSections.tsx`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `react-native`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `activity.ts`, `sawari.ts`, `HelpScreen.tsx`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `BookingsScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `ProfileParts.tsx`, `useTripColors`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `TripReviewSheet.tsx`, `DatesSheet.tsx`, `react-native-safe-area-context`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `FilterSheet.tsx`, `useVehicles.ts`, `PaymentsListScreen.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `useSawari`, `index.ts`, `CustomAlert.tsx`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `LoadingImage`, `ErrorFallback.tsx`, `TripDetailParts.tsx`, `FaqsScreen.tsx`, `useVehicles`, `@react-native-async-storage/async-storage`, `DropoffSheet.tsx`, `FlashSaleButton.tsx`, `EditProfileScreen.tsx`, `expo-linear-gradient`, `Page.tsx`, `Reveal.tsx`, `StickyBookingBar.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Why does `useDetailsPalette()` connect `useDetailsPalette` to `CarDetailsSections.tsx`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `react-native`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `pricingEngine.ts`, `ReferEarnScreen.tsx`, `HomeScreen.tsx`, `ConfirmationScreen.tsx`, `BookingsScreen.tsx`, `ProfileParts.tsx`, `MembershipScreen.tsx`, `TripReviewSheet.tsx`, `react-native-safe-area-context`, `useSawari`, `referrals.ts`, `useVehicles.ts`, `ProfileScreen.tsx`, `CustomAlert.tsx`, `SettingsScreen.tsx`, `formatCurrency`, `LoadingImage`, `FaqsScreen.tsx`, `useVehicles`, `DropoffSheet.tsx`, `EditProfileScreen.tsx`, `expo-linear-gradient`, `StickyBookingBar.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `SearchScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13363363363363365 - nodes in this community are weakly interconnected._