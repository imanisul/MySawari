# Graph Report - MySawari  (2026-11-17)

## Corpus Check
- 254 files · ~1,466,086 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1692 nodes · 5673 edges · 76 communities (74 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4b7239f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- LoadingImage
- react-native-safe-area-context
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- sawari.ts
- BookingScreen.tsx
- PolicyScreen.tsx
- HomeSections.tsx
- _layout.tsx
- PaymentProcessingScreen.tsx
- LocationSearchBody.tsx
- ExclusiveOfferDetailModal.tsx
- pricingEngine.ts
- SawariContext.tsx
- react
- AnimatedSplash.tsx
- ProfileScreen.tsx
- EditProfileScreen.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- @expo/vector-icons
- BookingsScreen.tsx
- expo
- fetchWithAuth
- api.ts
- HomeCardsRow.tsx
- FlashSaleScreen.tsx
- LoginBottomSheet
- BottomNavigation.tsx
- useDetailsPalette
- detailsPalette.ts
- MembershipScreen.tsx
- FilterSheet.tsx
- tsconfig.json
- BookingDetailScreen.tsx
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- ConfirmationScreen.tsx
- SettingsScreen.tsx
- UpdateModal.tsx
- activity.ts
- API
- useColors
- MySawari customer app: store compliance notes
- FlashSaleButton.tsx
- android
- react-native-svg
- CarListCard.tsx
- useHomeData.ts
- Reveal.tsx
- PaymentResult.tsx
- SearchEmptyState.tsx
- haptics.ts
- location.ts
- secureStore.web.ts
- RewardsScreen.tsx
- ios
- infoPlist
- vehicleKnowledge.ts
- CustomAlert.tsx
- useSupportFab.ts
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- ErrorFallback.tsx
- experiments
- WishlistScreen.tsx
- scripts
- MySawari – store listing text (search)

## God Nodes (most connected - your core abstractions)
1. `react` - 200 edges
2. `useSawari()` - 150 edges
3. `react-native` - 143 edges
4. `useDetailsPalette()` - 136 edges
5. `useColors()` - 102 edges
6. `@expo/vector-icons` - 92 edges
7. `expo-router` - 69 edges
8. `react-native-safe-area-context` - 66 edges
9. `formatCurrency()` - 53 edges
10. `LoginBottomSheet()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `TimesScreen()` --calls--> `DatesSheet()`  [EXTRACTED]
  app/times.tsx → components/booking/DatesSheet.tsx
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

## Communities (76 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.12
Nodes (9): Route(), Route(), Route(), TimesScreen(), DriverChargesSheet(), react, DriverChargesScreen(), DriverOptionScreen() (+1 more)

### Community 1 - "LoadingImage"
Cohesion: 0.09
Nodes (34): AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+26 more)

### Community 2 - "react-native-safe-area-context"
Cohesion: 0.10
Nodes (28): styles, styles, RefundTrackingModalProps, styles, styles, SORT_OPTIONS, SortKey, SortSheet() (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.08
Nodes (52): Route(), Route(), FunnelIcon(), SortArrowsIcon(), ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES (+44 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (34): expo, install, exclude, main, name, private, version, @babel/core (+26 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.06
Nodes (54): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+46 more)

### Community 7 - "sawari.ts"
Cohesion: 0.08
Nodes (53): ALL_TIMES, carGapOn(), DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS, monthWeeks() (+45 more)

### Community 8 - "BookingScreen.tsx"
Cohesion: 0.11
Nodes (32): Route(), Route(), TripMilestoneCard(), DesignToggle(), MembershipCelebration(), MembershipSavedPopup(), Breakup(), Dashes() (+24 more)

### Community 9 - "PolicyScreen.tsx"
Cohesion: 0.09
Nodes (27): Route(), Route(), Route(), Route(), Route(), Route(), Route(), dark (+19 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (41): BenefitCards(), ITEMS, styles, BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide (+33 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.08
Nodes (23): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), CustomAlertProvider() (+15 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.14
Nodes (14): Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed(), RazorpayCheckoutWebView() (+6 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.10
Nodes (37): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+29 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (26): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+18 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (22): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+14 more)

### Community 17 - "react"
Cohesion: 0.20
Nodes (7): Route(), Route(), Route(), LocationSheet(), FlashSaleHeroTitleProps, LocationScreen(), ReturnLocationScreen()

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.18
Nodes (19): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+11 more)

### Community 19 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (18): Route(), RateUsCard(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+10 more)

### Community 20 - "EditProfileScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "react-native"
Cohesion: 0.18
Nodes (15): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+7 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.13
Nodes (20): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+12 more)

### Community 25 - "@expo/vector-icons"
Cohesion: 0.16
Nodes (18): styles, DriverOptionSheet(), OptionCard(), styles, PlannerSheet(), styles, styles, TripField() (+10 more)

### Community 26 - "BookingsScreen.tsx"
Cohesion: 0.13
Nodes (22): Route(), Route(), driverLabel(), FONT, shortDate(), tripTotal(), bookingsQueryOptions, BookingsScreen() (+14 more)

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
Cohesion: 0.17
Nodes (11): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), react-native-gesture-handler (+3 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.08
Nodes (22): Route(), FlashSaleHeroTitle, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen(), styles (+14 more)

### Community 32 - "LoginBottomSheet"
Cohesion: 0.13
Nodes (28): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+20 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.12
Nodes (17): RootLayoutNav(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+9 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.11
Nodes (47): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+39 more)

### Community 35 - "detailsPalette.ts"
Cohesion: 0.06
Nodes (66): Route(), Route(), Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps, styles (+58 more)

### Community 36 - "MembershipScreen.tsx"
Cohesion: 0.08
Nodes (31): Route(), Route(), BlurTargetProvider(), BlurHost(), BlurTarget(), BottomBlur(), styles, Page() (+23 more)

### Community 37 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "BookingDetailScreen.tsx"
Cohesion: 0.13
Nodes (40): Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal() (+32 more)

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "ConfirmationScreen.tsx"
Cohesion: 0.21
Nodes (12): Route(), MembershipRatingModal(), MembershipRatingModalProps, styles, ConfirmationScreen(), FONT, NEXT, styles (+4 more)

### Community 43 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 44 - "UpdateModal.tsx"
Cohesion: 0.40
Nodes (4): styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }

### Community 45 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 46 - "API"
Cohesion: 0.22
Nodes (11): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, F, Photo, PhotoSourceSheet(), Star(), styles (+3 more)

### Community 47 - "useColors"
Cohesion: 0.11
Nodes (23): NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles (+15 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "FlashSaleButton.tsx"
Cohesion: 0.22
Nodes (7): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "react-native-svg"
Cohesion: 0.32
Nodes (5): styles, HeartIcon(), react-native-svg, *.png, *.svg

### Community 52 - "CarListCard.tsx"
Cohesion: 0.12
Nodes (18): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout, OTHER_LAYOUT (+10 more)

### Community 53 - "useHomeData.ts"
Cohesion: 0.12
Nodes (27): hydrateUserQueries(), HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), hasLiveVehicles(), vehiclesQueryOptions, waitForCardImages() (+19 more)

### Community 54 - "Reveal.tsx"
Cohesion: 0.53
Nodes (4): rise(), Reveal(), revealedScreens, react-native-reanimated

### Community 55 - "PaymentResult.tsx"
Cohesion: 0.43
Nodes (5): FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL

### Community 56 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 57 - "haptics.ts"
Cohesion: 0.29
Nodes (3): expo-haptics, ImpactFeedbackStyle, NotificationFeedbackType

### Community 58 - "location.ts"
Cohesion: 0.33
Nodes (6): expo-location, getDevicePosition(), POSITION_FAILURE_MESSAGE, PositionFailure, PositionResult, withTimeout()

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "RewardsScreen.tsx"
Cohesion: 0.16
Nodes (19): Route(), LoginGate(), onSplashGone(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles (+11 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 65 - "useSupportFab.ts"
Cohesion: 0.50
Nodes (3): listeners, navHelpListeners, setSupportFabHidden()

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.09
Nodes (25): DealsCard(), ceilIstHourMs(), dealDayTime(), dealPricing(), dealWhenLabel(), istDayNum(), nextIstHourMs(), parseCustomDateToMs() (+17 more)

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 75 - "WishlistScreen.tsx"
Cohesion: 0.48
Nodes (5): Route(), useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 654 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoadingImage`, `react-native-safe-area-context`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `sawari.ts`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `LocationSearchBody.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `react`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `@expo/vector-icons`, `BookingsScreen.tsx`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `MembershipScreen.tsx`, `FilterSheet.tsx`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `ConfirmationScreen.tsx`, `SettingsScreen.tsx`, `UpdateModal.tsx`, `API`, `useColors`, `FlashSaleButton.tsx`, `react-native-svg`, `CarListCard.tsx`, `useHomeData.ts`, `Reveal.tsx`, `PaymentResult.tsx`, `SearchEmptyState.tsx`, `RewardsScreen.tsx`, `CustomAlert.tsx`, `useSupportFab.ts`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `react`, `LoadingImage`, `react-native-safe-area-context`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `sawari.ts`, `BookingScreen.tsx`, `PolicyScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `LocationSearchBody.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `react`, `AnimatedSplash.tsx`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `@expo/vector-icons`, `BookingsScreen.tsx`, `fetchWithAuth`, `HomeCardsRow.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `MembershipScreen.tsx`, `FilterSheet.tsx`, `BookingDetailScreen.tsx`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `ConfirmationScreen.tsx`, `SettingsScreen.tsx`, `UpdateModal.tsx`, `activity.ts`, `API`, `useColors`, `FlashSaleButton.tsx`, `react-native-svg`, `CarListCard.tsx`, `Reveal.tsx`, `PaymentResult.tsx`, `SearchEmptyState.tsx`, `RewardsScreen.tsx`, `CustomAlert.tsx`, `TopDealsScreen.tsx`, `ErrorFallback.tsx`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `LoadingImage` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `RewardsScreen.tsx` to `LoadingImage`, `react-native-safe-area-context`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `sawari.ts`, `BookingScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `LocationSearchBody.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `react`, `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `@expo/vector-icons`, `BookingsScreen.tsx`, `FlashSaleScreen.tsx`, `LoginBottomSheet`, `BottomNavigation.tsx`, `useDetailsPalette`, `detailsPalette.ts`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `ConfirmationScreen.tsx`, `SettingsScreen.tsx`, `API`, `useColors`, `react-native-svg`, `CarListCard.tsx`, `useHomeData.ts`, `SearchEmptyState.tsx`, `TopDealsScreen.tsx`, `WishlistScreen.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `react-native-safe-area-context` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._