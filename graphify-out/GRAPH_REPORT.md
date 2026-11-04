# Graph Report - MySawari  (2026-11-03)

## Corpus Check
- 229 files · ~1,346,079 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1422 nodes · 4597 edges · 78 communities (74 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `73f97599`
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
- ProfileScreen.tsx
- BookingDetailScreen.tsx
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- MembershipScreen.tsx
- pricingEngine.ts
- react
- formatCurrency
- LocationSheet
- SawariContext.tsx
- ExploreFilters.tsx
- dependencies
- HelpScreen.tsx
- react-native
- HomeScreen.tsx
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- react-native-safe-area-context
- BookingsScreen.tsx
- useSawari
- FloatingSupport.tsx
- LoginBottomSheet
- BookingScreen.tsx
- activity.ts
- tsconfig.json
- PaymentResult.tsx
- LoadingImage
- recentlyViewed.ts
- timedFetch
- BottomNavigation.tsx
- DetailsTabs.tsx
- haptics.ts
- haptics.ts
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- ReferEarnScreen.tsx
- android
- CarDetailsSections.tsx
- API
- RefundsScreen.tsx
- CustomAlert.tsx
- useColors
- CitySheet.tsx
- PaymentProcessingScreen.tsx
- RefundsScreen.tsx
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- WishlistScreen.tsx
- LocationSearchBody.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- CancelBookingSheet.tsx
- experiments
- Reveal.tsx
- ErrorBoundary
- scripts
- expo

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 121 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

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

## Communities (78 total, 4 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.36
Nodes (10): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), removeRecentSearch(), saveRecentSearch(), SearchBase, searchIdFor() (+2 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.19
Nodes (25): Route(), Benefits(), Bullets(), Faqs, FeatureList(), HelpCard(), Inclusions(), LocationCard() (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.15
Nodes (10): ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config, { getDefaultConfig } (+2 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.08
Nodes (50): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+42 more)

### Community 7 - "ProfileScreen.tsx"
Cohesion: 0.18
Nodes (17): Route(), Page(), useBottomNavHeight(), Dashes(), FONT, HEADER, inr0(), inr2() (+9 more)

### Community 8 - "BookingDetailScreen.tsx"
Cohesion: 0.21
Nodes (20): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+12 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (26): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+18 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.08
Nodes (23): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HomeHero() (+15 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.09
Nodes (20): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), LoginGate() (+12 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.12
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "MembershipScreen.tsx"
Cohesion: 0.18
Nodes (14): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+6 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (28): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+20 more)

### Community 16 - "react"
Cohesion: 0.12
Nodes (13): Route(), Route(), Route(), Route(), PlannerSheet(), styles, SubPageHeader(), react (+5 more)

### Community 17 - "formatCurrency"
Cohesion: 0.18
Nodes (15): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+7 more)

### Community 18 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 19 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (20): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+12 more)

### Community 20 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.12
Nodes (15): Route(), Route(), Header(), OfferCard, useKeyboardPad(), PaymentMethodItem, PaymentsScreen(), styles (+7 more)

### Community 23 - "react-native"
Cohesion: 0.20
Nodes (10): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, shadows, usePressAnimation() (+2 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (25): Route(), BenefitsGrid(), ConnectCard(), DestinationTile(), HOME_PURPLE, HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard() (+17 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.31
Nodes (9): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles, DEFAULT_FLASH_SCREEN_CONFIG, fetchRemoteFlashScreenConfig(), FlashScreenConfig (+1 more)

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (29): CarTile, styles, LuxuryCarTile, styles, AvailabilityInfo, baseCars, Block, buildBlocks() (+21 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.16
Nodes (17): HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions (+9 more)

### Community 31 - "react-native-safe-area-context"
Cohesion: 0.12
Nodes (23): styles, styles, RefundTrackingModalProps, styles, ReviewModal(), styles, SORT_OPTIONS, SortKey (+15 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.19
Nodes (13): Route(), ReviewTrip, driverLabel(), BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn() (+5 more)

### Community 33 - "useSawari"
Cohesion: 0.18
Nodes (18): Route(), PostTripReviewPrompt(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, ScratchCard() (+10 more)

### Community 34 - "FloatingSupport.tsx"
Cohesion: 0.24
Nodes (10): FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES, styles, listeners, navHelpListeners, setSupportFabHidden(), useNavHelpPresent() (+2 more)

### Community 35 - "LoginBottomSheet"
Cohesion: 0.18
Nodes (20): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+12 more)

### Community 36 - "BookingScreen.tsx"
Cohesion: 0.14
Nodes (21): Route(), Route(), BlurTargetContext, BlurTargetProvider(), DesignToggle(), useQuote(), useTrackTripProgress(), useLiveCar() (+13 more)

### Community 37 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "PaymentResult.tsx"
Cohesion: 0.24
Nodes (9): Route(), FONT, PaymentFailed(), styles, ACCOUNT_EMAIL, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL (+1 more)

### Community 40 - "LoadingImage"
Cohesion: 0.16
Nodes (16): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+8 more)

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 42 - "timedFetch"
Cohesion: 0.31
Nodes (7): expo-device, enforceHttpsUrl(), normalizeResponse(), timedFetch(), fetchChallengeNonce(), IntegrityVerdict, verifyAppIntegrity()

### Community 43 - "BottomNavigation.tsx"
Cohesion: 0.15
Nodes (14): BottomBlur(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+6 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.15
Nodes (20): AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection(), getCategorizedFeatures(), ReviewCard() (+12 more)

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (53): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+45 more)

### Community 46 - "haptics.ts"
Cohesion: 0.10
Nodes (14): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, SCRATCH_H, SCRATCH_W (+6 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.22
Nodes (7): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants, expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "ReferEarnScreen.tsx"
Cohesion: 0.24
Nodes (10): Route(), BlurHost(), BlurTarget(), styles, styles, FaqList(), expo-status-bar, Rays() (+2 more)

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "CarDetailsSections.tsx"
Cohesion: 0.15
Nodes (18): allFeatures(), CancellationPolicy(), FEATURE_LABELS, featureKey(), INCLUDED, MembershipPicker(), MembershipUpgrade(), MileageIcon() (+10 more)

### Community 52 - "API"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 53 - "RefundsScreen.tsx"
Cohesion: 0.14
Nodes (21): Route(), BookingCard(), Dash(), MONTHS, placeName(), PricingSummary(), Row(), shortDate() (+13 more)

### Community 54 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 55 - "useColors"
Cohesion: 0.10
Nodes (26): NotFoundScreen(), styles, DriverModeRow(), styles, NextTrip(), styles, styles, SearchCard() (+18 more)

### Community 56 - "CitySheet.tsx"
Cohesion: 0.50
Nodes (3): CitySheet(), styles, CITIES

### Community 57 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (11): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+3 more)

### Community 58 - "RefundsScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.16
Nodes (20): Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, SheetFrame() (+12 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.11
Nodes (19): CarListCardProps, CarListCardUI, longAvail(), MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout (+11 more)

### Community 65 - "WishlistScreen.tsx"
Cohesion: 0.39
Nodes (5): Route(), CarCardSkeleton(), CarListCard, styles, WishlistScreen()

### Community 66 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (16): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+8 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "CancelBookingSheet.tsx"
Cohesion: 0.39
Nodes (7): CancelBookingSheet(), Field(), REASONS, styles, refundQuote(), rupees(), useVehicles()

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "Reveal.tsx"
Cohesion: 0.53
Nodes (4): rise(), Reveal(), revealedScreens, react-native-reanimated

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 77 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 545 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ProfileScreen.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `formatCurrency`, `LocationSheet`, `SawariContext.tsx`, `ExploreFilters.tsx`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `useSawari`, `FloatingSupport.tsx`, `LoginBottomSheet`, `BookingScreen.tsx`, `PaymentResult.tsx`, `LoadingImage`, `BottomNavigation.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `haptics.ts`, `UpdateModal.tsx`, `ReferEarnScreen.tsx`, `CarDetailsSections.tsx`, `API`, `RefundsScreen.tsx`, `CustomAlert.tsx`, `useColors`, `CitySheet.tsx`, `PaymentProcessingScreen.tsx`, `RefundsScreen.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`, `CancelBookingSheet.tsx`, `Reveal.tsx`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `ProfileScreen.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `react`, `formatCurrency`, `SawariContext.tsx`, `ExploreFilters.tsx`, `HelpScreen.tsx`, `HomeScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `react-native-safe-area-context`, `BookingsScreen.tsx`, `useSawari`, `FloatingSupport.tsx`, `LoginBottomSheet`, `BookingScreen.tsx`, `activity.ts`, `PaymentResult.tsx`, `LoadingImage`, `timedFetch`, `BottomNavigation.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `haptics.ts`, `UpdateModal.tsx`, `ReferEarnScreen.tsx`, `CarDetailsSections.tsx`, `API`, `RefundsScreen.tsx`, `CustomAlert.tsx`, `useColors`, `CitySheet.tsx`, `PaymentProcessingScreen.tsx`, `RefundsScreen.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`, `CancelBookingSheet.tsx`, `Reveal.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07759562841530054 - nodes in this community are weakly interconnected._