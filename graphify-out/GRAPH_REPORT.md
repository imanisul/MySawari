# Graph Report - MySawari  (2026-10-28)

## Corpus Check
- 219 files · ~1,217,352 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1345 nodes · 4316 edges · 73 communities (68 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46ebc01d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PaymentsListScreen.tsx
- ReferralScreen.tsx
- CarDetailsSections.tsx
- devDependencies
- fetch_images.js
- package.json
- expo-haptics
- detailsPalette.ts
- useColors
- sawari.ts
- useDetailsPalette
- _layout.tsx
- detailsPalette.ts
- LocationSearchBody.tsx
- DatesSheet.tsx
- pricingEngine.ts
- BottomNavigation.tsx
- useVehicles.ts
- SearchScreen.tsx
- useColors
- DetailsTabs.tsx
- dependencies
- useSawari
- WishlistScreen.tsx
- react-native-safe-area-context
- ExploreFilters.tsx
- react-native
- expo
- SawariContext.tsx
- api.ts
- expo-haptics
- BookingScreen.tsx
- MembershipScreen.tsx
- API
- TripReviewSheet.tsx
- fetchWithAuth
- DropoffSheet.tsx
- CarListCard.tsx
- tsconfig.json
- android
- FilterSheet.tsx
- activity.ts
- formatCurrency
- useColors.ts
- react
- ios
- map/google.ts
- useAppUpdates.ts
- offers.ts
- BookingsScreen.tsx
- HomeSections.tsx
- scripts
- LoginBottomSheet
- DriverChargesScreen.tsx
- AnimatedSplash.tsx
- infoPlist
- FaqsScreen.tsx
- RideJourneyCard.tsx
- test.js
- secureStore.web.ts
- updates
- API
- SocialLinks.tsx
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts
- PushNotificationHandler.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 171 edges
2. `useSawari()` - 136 edges
3. `useColors()` - 128 edges
4. `react-native` - 126 edges
5. `useDetailsPalette()` - 114 edges
6. `@expo/vector-icons` - 86 edges
7. `react-native-safe-area-context` - 63 edges
8. `expo-haptics` - 58 edges
9. `expo-router` - 57 edges
10. `ModalBlur()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (73 total, 5 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.15
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 1 - "ReferralScreen.tsx"
Cohesion: 0.11
Nodes (23): Route(), KeyboardAwareScrollViewCompat(), expo-clipboard, expo-status-bar, Rays(), ReferEarnScreen(), styles, Avatar() (+15 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.12
Nodes (37): Route(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), FEATURE_LABELS, featureKey(), FeatureList() (+29 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.07
Nodes (20): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, downloadImage(), fetchWikiImage() (+12 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (31): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+23 more)

### Community 6 - "expo-haptics"
Cohesion: 0.07
Nodes (53): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DeliveryPickupCard() (+45 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.09
Nodes (40): Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF, rupees() (+32 more)

### Community 8 - "useColors"
Cohesion: 0.15
Nodes (16): Route(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+8 more)

### Community 9 - "sawari.ts"
Cohesion: 0.10
Nodes (22): longAvail(), isPastSearch(), AvailabilityInfo, baseCars, Block, buildBlocks(), cars, delay() (+14 more)

### Community 10 - "useDetailsPalette"
Cohesion: 0.18
Nodes (19): Route(), onSplashGone(), BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle(), MemberBenefitsCard() (+11 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.12
Nodes (15): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), PostTripReviewPrompt(), CustomAlertProvider() (+7 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.17
Nodes (12): Route(), dark, DetailsPalette, light, Bullet(), Clause, Point, POLICIES (+4 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (16): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+8 more)

### Community 14 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+17 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.05
Nodes (50): Route(), Route(), ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+42 more)

### Community 17 - "useVehicles.ts"
Cohesion: 0.20
Nodes (18): useTrackTripProgress(), addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem, adoptGuestSearches() (+10 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.16
Nodes (24): Route(), FunnelIcon(), SortLinesIcon(), chipFor(), countActive(), EMPTY_FILTERS, ExploreFilters, matchesFilters() (+16 more)

### Community 19 - "useColors"
Cohesion: 0.11
Nodes (18): NotFoundScreen(), styles, DriverModeRow(), styles, InlineTripEditor(), SectionHeading(), styles, StatusBarScrim() (+10 more)

### Community 20 - "DetailsTabs.tsx"
Cohesion: 0.09
Nodes (41): Route(), Reveal(), Skeleton(), SkeletonGroup(), BookingSkeleton(), HomeCarSkeleton(), OfferCardSkeleton(), BookingDetailSkeleton() (+33 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "useSawari"
Cohesion: 0.13
Nodes (18): RootLayoutNav(), NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles, PrivacyBanner() (+10 more)

### Community 23 - "WishlistScreen.tsx"
Cohesion: 0.39
Nodes (5): Route(), useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 24 - "react-native-safe-area-context"
Cohesion: 0.06
Nodes (80): Route(), Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles (+72 more)

### Community 25 - "ExploreFilters.tsx"
Cohesion: 0.14
Nodes (19): BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet(), FEATURES, FUELS, Option (+11 more)

### Community 26 - "react-native"
Cohesion: 0.15
Nodes (14): ALL_TIMES, MONTHS, styles, styles, styles, PrimaryButton(), styles, getTimeRemaining() (+6 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "SawariContext.tsx"
Cohesion: 0.17
Nodes (10): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, expo-constants (+2 more)

### Community 29 - "api.ts"
Cohesion: 0.13
Nodes (12): BASE_URL, formatPhotonAddress(), HOLD_STATUSES, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus(), PendingReview, refreshSubscribers (+4 more)

### Community 30 - "expo-haptics"
Cohesion: 0.17
Nodes (20): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, CarTile, styles (+12 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.12
Nodes (24): Route(), BlurHost(), BlurTarget(), styles, Page(), styles, ART_H, MembershipCelebration() (+16 more)

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.09
Nodes (28): Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed() (+20 more)

### Community 33 - "API"
Cohesion: 0.21
Nodes (12): HomeLoadStep, loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles() (+4 more)

### Community 34 - "TripReviewSheet.tsx"
Cohesion: 0.32
Nodes (7): F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet(), react-native-svg

### Community 35 - "fetchWithAuth"
Cohesion: 0.29
Nodes (6): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId()

### Community 36 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 37 - "CarListCard.tsx"
Cohesion: 0.21
Nodes (14): TopPickCard(), CarListCard, CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown() (+6 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 41 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), expo-device, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 42 - "formatCurrency"
Cohesion: 0.18
Nodes (14): BottomBlur(), PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar() (+6 more)

### Community 43 - "useColors.ts"
Cohesion: 0.17
Nodes (9): SkeletonProps, styles, styles, styles, HomeCarSkeletonProps, styles, OfferCardSkeletonProps, styles (+1 more)

### Community 44 - "react"
Cohesion: 0.16
Nodes (9): Route(), Route(), Route(), Route(), LocationSheet(), react, DriverOptionScreen(), LocationScreen() (+1 more)

### Community 45 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 46 - "map/google.ts"
Cohesion: 0.21
Nodes (9): getJson(), GOOGLE_MAPS_KEY, googleAutocomplete(), GooglePlace, googlePlaceDetails(), GooglePrediction, googleReverseGeocode(), hasGoogleMaps (+1 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "offers.ts"
Cohesion: 0.36
Nodes (8): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), normalizeResponse(), plateSafeImageUrl(), timedFetch()

### Community 49 - "BookingsScreen.tsx"
Cohesion: 0.16
Nodes (15): Route(), rise(), revealedScreens, BottomNavigation(), react-native-reanimated, BookingsScreen(), BookingTab, byRecent() (+7 more)

### Community 50 - "HomeSections.tsx"
Cohesion: 0.16
Nodes (13): ARC_LINES, ArcHeadline(), BENEFITS, cardDate(), HOME_PURPLE, HomeHero(), SHADOW, SHADOW_TAPS (+5 more)

### Community 51 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 52 - "LoginBottomSheet"
Cohesion: 0.31
Nodes (9): digitsOf(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked(), OtpBoxes(), styles (+1 more)

### Community 53 - "DriverChargesScreen.tsx"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 54 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 55 - "infoPlist"
Cohesion: 0.40
Nodes (5): NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 56 - "FaqsScreen.tsx"
Cohesion: 0.33
Nodes (7): Route(), FaqList(), Faqs, styles, SubPageHeader(), FaqsScreen(), styles

### Community 57 - "RideJourneyCard.tsx"
Cohesion: 0.25
Nodes (7): AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }, RideJourneyCard(), styles

### Community 58 - "test.js"
Cohesion: 0.40
Nodes (3): b, pickup, returnDt

### Community 59 - "secureStore.web.ts"
Cohesion: 0.70
Nodes (4): deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 61 - "API"
Cohesion: 0.25
Nodes (7): ReviewTrip, Photo, RATING_WORDS, styles, expo-image-picker, @tanstack/react-query, API

### Community 62 - "SocialLinks.tsx"
Cohesion: 0.47
Nodes (4): SocialLinks(), styles, SOCIAL_LINKS, SocialLink

### Community 64 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 65 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 66 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 67 - "notification"
Cohesion: 0.67
Nodes (3): notification, color, icon

### Community 72 - "PushNotificationHandler.tsx"
Cohesion: 0.67
Nodes (3): asString(), PushData, PushNotificationHandler()

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 514 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `useDetailsPalette`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `DatesSheet.tsx`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `DetailsTabs.tsx`, `useSawari`, `WishlistScreen.tsx`, `react-native-safe-area-context`, `ExploreFilters.tsx`, `react-native`, `SawariContext.tsx`, `expo-haptics`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `TripReviewSheet.tsx`, `DropoffSheet.tsx`, `CarListCard.tsx`, `FilterSheet.tsx`, `formatCurrency`, `useColors.ts`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `HomeSections.tsx`, `LoginBottomSheet`, `DriverChargesScreen.tsx`, `AnimatedSplash.tsx`, `FaqsScreen.tsx`, `RideJourneyCard.tsx`, `API`, `SocialLinks.tsx`, `PushNotificationHandler.tsx`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14761904761904762 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `useDetailsPalette`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `DatesSheet.tsx`, `BottomNavigation.tsx`, `SearchScreen.tsx`, `useColors`, `DetailsTabs.tsx`, `useSawari`, `WishlistScreen.tsx`, `react-native-safe-area-context`, `ExploreFilters.tsx`, `SawariContext.tsx`, `expo-haptics`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `TripReviewSheet.tsx`, `fetchWithAuth`, `DropoffSheet.tsx`, `CarListCard.tsx`, `FilterSheet.tsx`, `activity.ts`, `formatCurrency`, `useColors.ts`, `react`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `HomeSections.tsx`, `LoginBottomSheet`, `AnimatedSplash.tsx`, `FaqsScreen.tsx`, `RideJourneyCard.tsx`, `API`, `SocialLinks.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Should `ReferralScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11923076923076924 - nodes in this community are weakly interconnected._