# Graph Report - MySawari  (2026-10-28)

## Corpus Check
- 219 files · ~1,217,330 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1346 nodes · 4318 edges · 65 communities (60 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31b40e24`
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
- HomeScreen.tsx
- _layout.tsx
- detailsPalette.ts
- LocationSearchBody.tsx
- react-native-safe-area-context
- pricingEngine.ts
- BottomNavigation.tsx
- useVehicles.ts
- SearchScreen.tsx
- useColors
- expo-haptics
- dependencies
- useSawari
- WishlistScreen.tsx
- TripDetailParts.tsx
- ExploreFilters.tsx
- react-native
- expo
- ReferEarnScreen.tsx
- api.ts
- BookingDetailScreen.tsx
- BookingScreen.tsx
- MembershipScreen.tsx
- API
- TripReviewSheet.tsx
- PaymentProcessingScreen.tsx
- SawariContext.tsx
- EditProfileScreen.tsx
- tsconfig.json
- android
- FilterSheet.tsx
- activity.ts
- useColors.ts
- react
- ios
- map/google.ts
- useAppUpdates.ts
- BookingsScreen.tsx
- LoginBottomSheet
- DriverChargesScreen.tsx
- AnimatedSplash.tsx
- infoPlist
- RideJourneyCard.tsx
- test.js
- secureStore.web.ts
- updates
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts

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
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (65 total, 5 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.11
Nodes (14): Route(), Route(), Header(), Reveal(), PaymentMethodItem, PaymentsScreen(), styles, faqs (+6 more)

### Community 1 - "ReferralScreen.tsx"
Cohesion: 0.11
Nodes (34): KeyboardAwareScrollViewCompat(), Skeleton(), SkeletonGroup(), BookingSkeleton(), HomeCarSkeleton(), OfferCardSkeleton(), BookingDetailSkeleton(), LoyaltySkeleton() (+26 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.11
Nodes (45): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+37 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.07
Nodes (20): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, downloadImage(), fetchWikiImage() (+12 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): main, name, private, scripts, build, dev, typecheck, version (+27 more)

### Community 6 - "expo-haptics"
Cohesion: 0.07
Nodes (51): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DeliveryPickupCard() (+43 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.07
Nodes (52): Route(), Route(), Route(), Route(), Route(), Dashes(), DesignToggle(), longStamp() (+44 more)

### Community 8 - "useColors"
Cohesion: 0.16
Nodes (16): Route(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+8 more)

### Community 9 - "sawari.ts"
Cohesion: 0.11
Nodes (28): sortCars(), CarTile, styles, LuxuryCarTile, isPastSearch(), AvailabilityInfo, baseCars, Block (+20 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.08
Nodes (38): Route(), onSplashGone(), SocialLinks(), styles, ARC_LINES, ArcHeadline(), BENEFITS, BenefitsGrid() (+30 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.10
Nodes (18): AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+10 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.13
Nodes (18): Route(), Route(), FaqList(), dark, DetailsPalette, light, styles, SubPageHeader() (+10 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.15
Nodes (17): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+9 more)

### Community 14 - "react-native-safe-area-context"
Cohesion: 0.22
Nodes (17): CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles, ManageBookingSheet(), styles (+9 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.06
Nodes (42): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+34 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.09
Nodes (30): Route(), Page(), ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+22 more)

### Community 17 - "useVehicles.ts"
Cohesion: 0.16
Nodes (21): Route(), useTrackTripProgress(), PaymentScreen(), styles, addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor() (+13 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.12
Nodes (27): Route(), FunnelIcon(), SortLinesIcon(), rise(), revealedScreens, chipFor(), countActive(), EMPTY_FILTERS (+19 more)

### Community 19 - "useColors"
Cohesion: 0.10
Nodes (20): NotFoundScreen(), styles, DriverModeRow(), styles, ALL_TIMES, InlineTripEditor(), MONTHS, styles (+12 more)

### Community 20 - "expo-haptics"
Cohesion: 0.07
Nodes (46): SORT_OPTIONS, SortKey, SortSheet(), styles, getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl() (+38 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "useSawari"
Cohesion: 0.12
Nodes (18): NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles, styles, PrivacyBanner() (+10 more)

### Community 23 - "WishlistScreen.tsx"
Cohesion: 0.39
Nodes (7): Route(), CarCardSkeleton(), CarListCard, useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 24 - "TripDetailParts.tsx"
Cohesion: 0.14
Nodes (24): Route(), BookingCard(), Dash(), driverLabel(), MONTHS, placeName(), PricingSummary(), Row() (+16 more)

### Community 25 - "ExploreFilters.tsx"
Cohesion: 0.14
Nodes (20): BODY_ORDER, brandOf(), BUDGETS, Cta(), ExploreFilterSheet(), FEATURES, FUELS, matchesFilters() (+12 more)

### Community 26 - "react-native"
Cohesion: 0.14
Nodes (19): styles, OfferCard, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+11 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "ReferEarnScreen.tsx"
Cohesion: 0.18
Nodes (13): Route(), Route(), BlurHost(), BlurTarget(), styles, expo-clipboard, ConfirmationScreen(), FONT (+5 more)

### Community 29 - "api.ts"
Cohesion: 0.11
Nodes (19): fetchOffers(), formatExpiry(), isOfferLive(), plateSafeOfferImage(), BASE_URL, formatPhotonAddress(), HOLD_STATUSES, isUnpaidHold() (+11 more)

### Community 30 - "BookingDetailScreen.tsx"
Cohesion: 0.20
Nodes (15): Route(), ActionRow(), pickupMoment(), refundStage(), RefundTimeline(), SectionTitle(), Timeline(), Banner() (+7 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.11
Nodes (31): Route(), BottomBlur(), ART_H, clearMembershipPopupShown(), MembershipCelebration(), MembershipSavedPopup(), shown, styles (+23 more)

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.15
Nodes (18): Route(), FONT, PaymentProgress(), PaymentStep, styles, ActiveMembership, activeOnly(), Dashes() (+10 more)

### Community 33 - "API"
Cohesion: 0.16
Nodes (16): AppGate(), CustomAlertProvider(), HomeLoadStep, homeLoadSteps(), loadHomeData(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles() (+8 more)

### Community 34 - "TripReviewSheet.tsx"
Cohesion: 0.24
Nodes (9): ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet() (+1 more)

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.19
Nodes (10): Route(), Route(), PaymentFailed(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentErrorScreen() (+2 more)

### Community 36 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (17): DropoffSheet(), Place, POPULAR, Row(), styles, AppCustomer, AppNotification, BookingStatus (+9 more)

### Community 37 - "EditProfileScreen.tsx"
Cohesion: 0.21
Nodes (11): Route(), FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, EditProfileScreen(), Field (+3 more)

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
Cohesion: 0.14
Nodes (19): SawariProvider(), expo-device, expo-secure-store, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, fetchWithAuth() (+11 more)

### Community 43 - "useColors.ts"
Cohesion: 0.13
Nodes (12): SkeletonProps, styles, styles, UpdateModalProps, { width: SCREEN_WIDTH }, styles, styles, HomeCarSkeletonProps (+4 more)

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
Cohesion: 0.25
Nodes (6): canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants, expo-updates

### Community 49 - "BookingsScreen.tsx"
Cohesion: 0.19
Nodes (13): Route(), ReviewModal(), FONT, BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn() (+5 more)

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

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 514 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `react-native-safe-area-context`, `pricingEngine.ts`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `expo-haptics`, `useSawari`, `WishlistScreen.tsx`, `TripDetailParts.tsx`, `ExploreFilters.tsx`, `react-native`, `ReferEarnScreen.tsx`, `BookingDetailScreen.tsx`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `TripReviewSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `EditProfileScreen.tsx`, `FilterSheet.tsx`, `useColors.ts`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `LoginBottomSheet`, `DriverChargesScreen.tsx`, `AnimatedSplash.tsx`, `RideJourneyCard.tsx`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `react-native-safe-area-context`, `pricingEngine.ts`, `BottomNavigation.tsx`, `useVehicles.ts`, `SearchScreen.tsx`, `useColors`, `expo-haptics`, `useSawari`, `WishlistScreen.tsx`, `TripDetailParts.tsx`, `ExploreFilters.tsx`, `ReferEarnScreen.tsx`, `BookingDetailScreen.tsx`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `TripReviewSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `EditProfileScreen.tsx`, `FilterSheet.tsx`, `activity.ts`, `useColors.ts`, `react`, `useAppUpdates.ts`, `BookingsScreen.tsx`, `LoginBottomSheet`, `AnimatedSplash.tsx`, `RideJourneyCard.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `ReferralScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10931174089068826 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11394557823129252 - nodes in this community are weakly interconnected._