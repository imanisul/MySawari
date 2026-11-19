# Graph Report - MySawari  (2026-11-19)

## Corpus Check
- 259 files · ~1,475,282 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1718 nodes · 5791 edges · 83 communities (81 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1eb4c69b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- BookingsScreen.tsx
- react-native-safe-area-context
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- OffersScreen.tsx
- react-native
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
- SpecialDealCard.tsx
- HomeScreen.tsx
- LocationSheet
- FloatingSupport.tsx
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
- recentlyViewed.ts
- HomeTopBar.tsx
- FlashSaleBanner.tsx
- MembershipScreen.tsx
- BookingDetailScreen.tsx
- getAvailability
- DatesSheet.tsx
- TripReviewSheet.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- useSawari
- android
- referrals.ts
- DriverChargesSheet
- recentSearches.ts
- PushNotificationHandler.tsx
- MembershipSavedPopup.tsx
- ProfileScreen.tsx
- LocationSearchBody.tsx
- SearchEmptyState.tsx
- secureStore.web.ts
- index.ts
- ios
- infoPlist
- vehicleKnowledge.ts
- expo
- SettingsScreen.tsx
- formatCurrency
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- useColors
- experiments
- ErrorFallback.tsx
- scripts
- RefundsScreen.tsx
- MySawari – store listing text (search)
- react-native
- react
- FlashSaleButton.tsx
- FloatingSupport.tsx
- useSawari

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
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `RootLayout()` --calls--> `ErrorBoundary`  [EXTRACTED]
  app/_layout.tsx → components/common/ErrorBoundary.tsx
- `RootLayout()` --calls--> `PushNotificationHandler()`  [EXTRACTED]
  app/_layout.tsx → components/notifications/PushNotificationHandler.tsx

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (83 total, 2 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.06
Nodes (48): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), extractOtpCode() (+40 more)

### Community 1 - "BookingsScreen.tsx"
Cohesion: 0.20
Nodes (12): Route(), rise(), revealedScreens, react-native-reanimated, BookingsScreen(), BookingTab, byRecent(), Empty() (+4 more)

### Community 2 - "react-native-safe-area-context"
Cohesion: 0.09
Nodes (30): ChoiceOption, styles, styles, defaultFilters, FilterSheet(), FilterState, styles, styles (+22 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (28): Route(), Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS (+20 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (31): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+23 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.07
Nodes (51): Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles, AddressPickerSheet() (+43 more)

### Community 7 - "OffersScreen.tsx"
Cohesion: 0.22
Nodes (12): Route(), Route(), CouponNotApplicableModal(), DesignToggle(), couponTitle(), OffersScreen(), until(), PaymentScreen() (+4 more)

### Community 8 - "react-native"
Cohesion: 0.19
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, HomeCarSkeleton(), styles (+16 more)

### Community 9 - "MembershipFaqsScreen.tsx"
Cohesion: 0.21
Nodes (11): Route(), Route(), FaqList(), Faqs, styles, SubPageHeader(), MEMBERSHIP_FAQS, MembershipFaqsScreen() (+3 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (41): BenefitCards(), ITEMS, styles, BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide (+33 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.13
Nodes (11): AppGate(), AppStatus, queryClient, LoginGate(), CustomAlertProvider(), @expo-google-fonts/anton, @expo-google-fonts/inter, @expo-google-fonts/plus-jakarta-sans (+3 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (12): Route(), Route(), PaymentFailed(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentErrorScreen() (+4 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.17
Nodes (21): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+13 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): buildQuoteFingerprint(), calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate() (+19 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (25): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+17 more)

### Community 17 - "ReferEarnScreen.tsx"
Cohesion: 0.12
Nodes (11): Route(), Route(), BlurTarget(), BottomBlur(), styles, expo-status-bar, react-native-qrcode-svg, ConfirmationScreen() (+3 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.17
Nodes (20): AnimatedG, AnimatedSplash(), BACK, markSplashGone(), seg(), splashGoneListeners, SplashStep, styles (+12 more)

### Community 19 - "activity.ts"
Cohesion: 0.16
Nodes (14): expo-constants, expo-device, @react-native-async-storage/async-storage, ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL (+6 more)

### Community 20 - "sawari.ts"
Cohesion: 0.10
Nodes (20): CategoryTabs(), styles, AvailabilityInfo, baseCars, Block, CarNextBookingWindow, categories, Category (+12 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+45 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.13
Nodes (15): Route(), Route(), Header(), Reveal(), @expo/vector-icons, PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 23 - "SpecialDealCard.tsx"
Cohesion: 0.20
Nodes (10): styles, OfferCard, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, shadows (+2 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.08
Nodes (34): Route(), onSplashGone(), AlertButton, AlertPayload, CustomAlert, styles, CitySheet(), styles (+26 more)

### Community 25 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 26 - "FloatingSupport.tsx"
Cohesion: 0.27
Nodes (9): FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES, styles, listeners, navHelpListeners, setSupportFabHidden(), useNavHelpPresent() (+1 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingScreen.tsx"
Cohesion: 0.17
Nodes (17): Route(), ChoiceSheet(), BlurTargetContext, BlurTargetProvider(), BlurHost(), Page(), styles, expo-blur (+9 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.07
Nodes (29): Route(), FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen() (+21 more)

### Community 32 - "useVehicles.ts"
Cohesion: 0.21
Nodes (12): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), vehiclesQueryOptions, waitForCardImages() (+4 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (15): ALL_ITEMS, FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route, styles (+7 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.11
Nodes (45): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey() (+37 more)

### Community 35 - "MyWalletScreen.tsx"
Cohesion: 0.27
Nodes (11): Route(), Dashes(), longStamp(), rupees(), MyWalletScreen(), stageOf(), styles, Tx (+3 more)

### Community 36 - "offers.ts"
Cohesion: 0.27
Nodes (13): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), isOfferLive(), NextFlashSale, plateSafeOfferImage(), prefetchOfferImages() (+5 more)

### Community 37 - "useDealCars.ts"
Cohesion: 0.14
Nodes (28): DealsCard(), FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox() (+20 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 40 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "MembershipScreen.tsx"
Cohesion: 0.10
Nodes (25): Route(), FONT, PaymentProgress(), PaymentStep, styles, MembershipRatingModal(), MembershipRatingModalProps, styles (+17 more)

### Community 43 - "BookingDetailScreen.tsx"
Cohesion: 0.12
Nodes (41): Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal() (+33 more)

### Community 44 - "getAvailability"
Cohesion: 0.39
Nodes (10): CarTile, styles, LuxuryCarTile, styles, Car, dayNumToLabel(), getAvailability(), getCarNextBookingWindow() (+2 more)

### Community 45 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (20): Route(), TimesScreen(), ALL_TIMES, carGapOn(), DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES (+12 more)

### Community 46 - "TripReviewSheet.tsx"
Cohesion: 0.23
Nodes (10): ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star(), styles (+2 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "useSawari"
Cohesion: 0.22
Nodes (8): CONFETTI, F, styles, SCRATCH_H, SCRATCH_W, ScratchCard(), styles, react-native-confetti-cannon

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "referrals.ts"
Cohesion: 0.13
Nodes (24): Route(), Route(), ListSkeleton(), shortDay(), StatusTimeline(), Step, MiniTracker(), MyReferralsScreen() (+16 more)

### Community 52 - "DriverChargesSheet"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 53 - "recentSearches.ts"
Cohesion: 0.28
Nodes (13): useTrackTripProgress(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+5 more)

### Community 54 - "PushNotificationHandler.tsx"
Cohesion: 0.40
Nodes (4): asString(), PushData, PushNotificationHandler(), mockNotifications

### Community 55 - "MembershipSavedPopup.tsx"
Cohesion: 0.10
Nodes (28): MembershipPicker(), MembershipUpgrade(), PlanOptions(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, PRO_LAYOUT (+20 more)

### Community 56 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (17): Route(), RateUsCard(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile() (+9 more)

### Community 57 - "LocationSearchBody.tsx"
Cohesion: 0.17
Nodes (15): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+7 more)

### Community 58 - "SearchEmptyState.tsx"
Cohesion: 0.40
Nodes (4): Action, EmptyKind, styles, useBrandColors()

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "index.ts"
Cohesion: 0.12
Nodes (22): Route(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+14 more)

### Community 61 - "ios"
Cohesion: 0.29
Nodes (7): ios, associatedDomains, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 65 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 66 - "formatCurrency"
Cohesion: 0.20
Nodes (14): CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), styles (+6 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.10
Nodes (7): VEHICLES_KEY, pad2(), styles, VehicleCardProps, { width: SCREEN_WIDTH }, getVehicleImage(), vehicleImages

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "useColors"
Cohesion: 0.06
Nodes (48): NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles (+40 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 78 - "RefundsScreen.tsx"
Cohesion: 0.20
Nodes (14): Route(), driverLabel(), shortDate(), tripTotal(), bookingsQueryOptions, useVehicles(), FONT, NEXT (+6 more)

### Community 79 - "MySawari – store listing text (search)"
Cohesion: 0.50
Nodes (3): App Store, Google Play, MySawari – store listing text (search)

### Community 80 - "react-native"
Cohesion: 0.12
Nodes (19): Route(), Route(), Props, styles, styles, PF, ScreenHeader(), StepState (+11 more)

### Community 81 - "react"
Cohesion: 0.25
Nodes (3): react, *.png, *.svg

### Community 83 - "FlashSaleButton.tsx"
Cohesion: 0.12
Nodes (10): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles, expo-haptics (+2 more)

### Community 84 - "FloatingSupport.tsx"
Cohesion: 0.21
Nodes (11): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, EditProfileScreen(), Field (+3 more)

### Community 85 - "useSawari"
Cohesion: 0.22
Nodes (16): LocationTracker(), RootLayout(), RootLayoutNav(), ThemedStatusBar(), Route(), PostTripReviewPrompt(), BottomNavigation(), RewardCardGate() (+8 more)

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 662 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `BookingsScreen.tsx`, `react-native-safe-area-context`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `HelpScreen.tsx`, `SpecialDealCard.tsx`, `HomeScreen.tsx`, `LocationSheet`, `FloatingSupport.tsx`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `getAvailability`, `DatesSheet.tsx`, `TripReviewSheet.tsx`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `DriverChargesSheet`, `recentSearches.ts`, `PushNotificationHandler.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `useColors`, `ErrorFallback.tsx`, `RefundsScreen.tsx`, `react-native`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.06253652834599649 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `BookingsScreen.tsx`, `react-native-safe-area-context`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `activity.ts`, `sawari.ts`, `HelpScreen.tsx`, `SpecialDealCard.tsx`, `HomeScreen.tsx`, `FloatingSupport.tsx`, `fetchWithAuth`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `HomeTopBar.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `getAvailability`, `DatesSheet.tsx`, `TripReviewSheet.tsx`, `UpdateModal.tsx`, `useSawari`, `referrals.ts`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `useColors`, `ErrorFallback.tsx`, `RefundsScreen.tsx`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `react-native-safe-area-context` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `LoginBottomSheet`, `BookingsScreen.tsx`, `react-native-safe-area-context`, `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `OffersScreen.tsx`, `react-native`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `LocationSheet`, `BookingScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `MyWalletScreen.tsx`, `useDealCars.ts`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `getAvailability`, `DatesSheet.tsx`, `TripReviewSheet.tsx`, `useSawari`, `referrals.ts`, `recentSearches.ts`, `PushNotificationHandler.tsx`, `MembershipSavedPopup.tsx`, `ProfileScreen.tsx`, `LocationSearchBody.tsx`, `SearchEmptyState.tsx`, `index.ts`, `SettingsScreen.tsx`, `formatCurrency`, `TopDealsScreen.tsx`, `useColors`, `RefundsScreen.tsx`, `react-native`, `FloatingSupport.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `SearchScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13513513513513514 - nodes in this community are weakly interconnected._