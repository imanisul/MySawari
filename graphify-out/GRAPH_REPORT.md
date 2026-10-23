# Graph Report - MySawari  (2026-10-21)

## Corpus Check
- 190 files · ~1,095,649 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1098 nodes · 3388 edges · 68 communities (63 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `374a8c29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BookingsScreen.tsx
- BottomNavigation.tsx
- CarDetailsSections.tsx
- devDependencies
- fetch_images.js
- package.json
- VehicleSummary.tsx
- InlineTripEditor.tsx
- index.ts
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- PaymentProcessingScreen.tsx
- WishlistScreen.tsx
- DatesSheet.tsx
- pricingEngine.ts
- PhoneNumberSheet.tsx
- detailsPalette.ts
- Header
- react-native
- LocationSearchBody.tsx
- dependencies
- fetchWithAuth
- ExploreScreen.tsx
- formatCurrency
- react
- DestinationCard.tsx
- expo
- useVehicles.ts
- api.ts
- ProfileScreen.tsx
- react-native-safe-area-context
- LocationSheet
- AppGate
- DetailsTabs.tsx
- ReferralScreen.tsx
- MembershipScreen.tsx
- SawariContext.tsx
- tsconfig.json
- android
- PushNotificationHandler.tsx
- activity.ts
- CarListCard.tsx
- NotificationsScreen.tsx
- useColors
- ios
- PaymentErrorScreen.tsx
- useAppUpdates.ts
- offers.ts
- AnimatedSplash.tsx
- DatesScreen.tsx
- DriverOptionSheet
- DriverChargesScreen.tsx
- SocialLinks.tsx
- infoPlist
- test.js
- secureStore.web.ts
- updates
- scripts
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 164 edges
2. `react` - 148 edges
3. `useSawari()` - 115 edges
4. `react-native` - 113 edges
5. `@expo/vector-icons` - 74 edges
6. `useDetailsPalette()` - 55 edges
7. `expo-router` - 50 edges
8. `react-native-safe-area-context` - 50 edges
9. `expo-haptics` - 49 edges
10. `LoadingImage()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `TimesScreen()` --calls--> `DatesSheet()`  [EXTRACTED]
  app/times.tsx → components/booking/DatesSheet.tsx
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- None detected.

## Communities (68 total, 5 thin omitted)

### Community 0 - "BookingsScreen.tsx"
Cohesion: 0.06
Nodes (50): Route(), Route(), FIGMA, formatMobile(), LoginBottomSheet(), OtpBoxes(), otpCode(), styles (+42 more)

### Community 1 - "BottomNavigation.tsx"
Cohesion: 0.07
Nodes (31): Route(), Route(), ALL_ITEMS, HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route (+23 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.13
Nodes (39): Route(), allFeatures(), Benefits(), Bullets(), CalendarIcon(), CancellationPolicy(), featureKey(), FeatureList() (+31 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.07
Nodes (20): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, downloadImage(), fetchWikiImage() (+12 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (30): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+22 more)

### Community 6 - "VehicleSummary.tsx"
Cohesion: 0.11
Nodes (27): Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), MODES, styles (+19 more)

### Community 7 - "InlineTripEditor.tsx"
Cohesion: 0.32
Nodes (6): ALL_TIMES, InlineTripEditor(), MONTHS, styles, styles, TripEditorModal()

### Community 8 - "index.ts"
Cohesion: 0.11
Nodes (23): NotFoundScreen(), styles, styles, styles, DropoffSheet(), MAJOR_DESTINATIONS, styles, styles (+15 more)

### Community 9 - "sawari.ts"
Cohesion: 0.09
Nodes (25): styles, styles, isPastSearch(), AvailabilityInfo, baseCars, Block, buildBlocks(), cars (+17 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.10
Nodes (32): Route(), PhoneNumberSheet(), onSplashGone(), ARC_LINES, ArcHeadline(), BENEFITS, BenefitsGrid(), cardDate() (+24 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (14): AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), UpdateModal(), HomeLoadStep (+6 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.25
Nodes (7): Route(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentProcessingScreen(), styles

### Community 13 - "WishlistScreen.tsx"
Cohesion: 0.33
Nodes (7): Route(), CarCardSkeleton(), styles, CarListCard(), useVehicles(), styles, WishlistScreen()

### Community 14 - "DatesSheet.tsx"
Cohesion: 0.20
Nodes (13): ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS, monthWeeks(), padTime() (+5 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.13
Nodes (22): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+14 more)

### Community 16 - "PhoneNumberSheet.tsx"
Cohesion: 0.25
Nodes (7): FIGMA, styles, AlertButton, AlertPayload, CustomAlert, styles, { width: SCREEN_WIDTH }

### Community 17 - "detailsPalette.ts"
Cohesion: 0.13
Nodes (19): Route(), Route(), FaqList(), Faqs, dark, DetailsPalette, light, styles (+11 more)

### Community 18 - "Header"
Cohesion: 0.14
Nodes (10): Route(), Header(), OfferCard, PaymentMethodItem, PaymentsScreen(), styles, SettingsScreen(), styles (+2 more)

### Community 19 - "react-native"
Cohesion: 0.14
Nodes (15): styles, SearchCard(), styles, SearchSheet(), styles, styles, HEIGHT, styles (+7 more)

### Community 20 - "LocationSearchBody.tsx"
Cohesion: 0.08
Nodes (42): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+34 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+12 more)

### Community 22 - "fetchWithAuth"
Cohesion: 0.23
Nodes (9): expo-secure-store, fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), postAuth(), subscribeTokenRefresh(), timedFetch() (+1 more)

### Community 23 - "ExploreScreen.tsx"
Cohesion: 0.15
Nodes (13): Route(), defaultFilters, FilterSheet(), FilterState, SORT_OPTIONS, SortKey, SortSheet(), styles (+5 more)

### Community 24 - "formatCurrency"
Cohesion: 0.14
Nodes (20): GemBadge(), MembershipSavedPopup(), RAYS, ShieldBadge(), shown, styles, Theme, THEMES (+12 more)

### Community 25 - "react"
Cohesion: 0.36
Nodes (3): Route(), react, PlannerScreen()

### Community 26 - "DestinationCard.tsx"
Cohesion: 0.23
Nodes (9): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, shadows, usePressAnimation() (+1 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "useVehicles.ts"
Cohesion: 0.07
Nodes (43): Route(), Action, EmptyKind, SearchEmptyState(), styles, useBrandColors(), useTrackTripProgress(), BIKE_FUEL (+35 more)

### Community 29 - "api.ts"
Cohesion: 0.14
Nodes (9): BASE_URL, formatPhotonAddress(), mapPhotonResponse(), PendingReview, refreshSubscribers, reverseCache, searchCache, SERVICE_AREA_BBOX (+1 more)

### Community 30 - "ProfileScreen.tsx"
Cohesion: 0.27
Nodes (7): Route(), Page(), styles, BottomNavigation(), useBottomNavHeight(), ProfileScreen(), styles

### Community 31 - "react-native-safe-area-context"
Cohesion: 0.21
Nodes (12): Route(), KeyboardAwareScrollViewCompat(), rise(), Reveal(), revealedScreens, StatusBarScrim(), react-native-reanimated, BookingScreen() (+4 more)

### Community 32 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 33 - "AppGate"
Cohesion: 0.33
Nodes (6): AppGate(), CustomAlertProvider(), homeLoadSteps(), loadHomeData(), recentSearchesQueryOptions(), expo-system-ui

### Community 34 - "DetailsTabs.tsx"
Cohesion: 0.15
Nodes (22): styles, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, AboutSection(), DetailRow(), DetailsTab (+14 more)

### Community 35 - "ReferralScreen.tsx"
Cohesion: 0.22
Nodes (9): expo-clipboard, react-native-qrcode-svg, formatCurrency(), formatDate(), ReferScreen(), loadData(), styles, WithdrawalRecord (+1 more)

### Community 36 - "MembershipScreen.tsx"
Cohesion: 0.27
Nodes (8): Route(), getPlanDef(), MembershipScreen(), PlanDef, PlanKey, PLANS, styles, { width: SCREEN_WIDTH }

### Community 37 - "SawariContext.tsx"
Cohesion: 0.20
Nodes (9): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, PricingQuote (+1 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 41 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), expo-device, ActivityAPI, getSessionId(), NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 42 - "CarListCard.tsx"
Cohesion: 0.30
Nodes (12): CarListCardProps, CarListCardUI, Spec(), styles, CarTile, styles, LuxuryCarTile, styles (+4 more)

### Community 43 - "NotificationsScreen.tsx"
Cohesion: 0.47
Nodes (4): Route(), NotificationsScreen(), styles, BackendNotification

### Community 44 - "useColors"
Cohesion: 0.17
Nodes (16): Route(), Route(), RootLayoutNav(), DriverModeRow(), NextTrip(), CategoryTabs(), PrivacyBanner(), styles (+8 more)

### Community 45 - "ios"
Cohesion: 0.29
Nodes (7): ios, backgroundColor, buildNumber, bundleIdentifier, googleServicesFile, icon, supportsTablet

### Community 46 - "PaymentErrorScreen.tsx"
Cohesion: 0.47
Nodes (3): Route(), PaymentErrorScreen(), styles

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.22
Nodes (8): styles, UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "offers.ts"
Cohesion: 0.39
Nodes (7): fetchOffers(), formatExpiry(), isOfferLive(), Offer, offersQueryOptions, plateSafeOfferImage(), plateSafeImageUrl()

### Community 49 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 50 - "DatesScreen.tsx"
Cohesion: 0.38
Nodes (3): Route(), TimesScreen(), DatesScreen()

### Community 51 - "DriverOptionSheet"
Cohesion: 0.43
Nodes (4): Route(), DriverOptionSheet(), OptionCard(), DriverOptionScreen()

### Community 52 - "DriverChargesScreen.tsx"
Cohesion: 0.53
Nodes (3): Route(), DriverChargesSheet(), DriverChargesScreen()

### Community 53 - "SocialLinks.tsx"
Cohesion: 0.47
Nodes (4): SocialLinks(), styles, SOCIAL_LINKS, SocialLink

### Community 55 - "infoPlist"
Cohesion: 0.40
Nodes (5): NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 58 - "test.js"
Cohesion: 0.40
Nodes (3): b, pickup, returnDt

### Community 59 - "secureStore.web.ts"
Cohesion: 0.70
Nodes (4): deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 62 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

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
- **26 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+21 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 440 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `VehicleSummary.tsx`, `InlineTripEditor.tsx`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `WishlistScreen.tsx`, `DatesSheet.tsx`, `PhoneNumberSheet.tsx`, `detailsPalette.ts`, `Header`, `react-native`, `LocationSearchBody.tsx`, `ExploreScreen.tsx`, `formatCurrency`, `DestinationCard.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `LocationSheet`, `DetailsTabs.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `SawariContext.tsx`, `PushNotificationHandler.tsx`, `CarListCard.tsx`, `NotificationsScreen.tsx`, `useColors`, `PaymentErrorScreen.tsx`, `useAppUpdates.ts`, `AnimatedSplash.tsx`, `DatesScreen.tsx`, `DriverOptionSheet`, `DriverChargesScreen.tsx`, `SocialLinks.tsx`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BookingsScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06498015873015874 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `VehicleSummary.tsx`, `InlineTripEditor.tsx`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `WishlistScreen.tsx`, `DatesSheet.tsx`, `PhoneNumberSheet.tsx`, `detailsPalette.ts`, `Header`, `LocationSearchBody.tsx`, `fetchWithAuth`, `ExploreScreen.tsx`, `formatCurrency`, `DestinationCard.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `DetailsTabs.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `SawariContext.tsx`, `PushNotificationHandler.tsx`, `activity.ts`, `CarListCard.tsx`, `NotificationsScreen.tsx`, `useColors`, `PaymentErrorScreen.tsx`, `useAppUpdates.ts`, `AnimatedSplash.tsx`, `SocialLinks.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `BottomNavigation.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
- **Why does `useColors()` connect `useColors` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `InlineTripEditor.tsx`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `WishlistScreen.tsx`, `DatesSheet.tsx`, `PhoneNumberSheet.tsx`, `Header`, `react-native`, `LocationSearchBody.tsx`, `ExploreScreen.tsx`, `formatCurrency`, `DestinationCard.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `LocationSheet`, `AppGate`, `DetailsTabs.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `CarListCard.tsx`, `NotificationsScreen.tsx`, `PaymentErrorScreen.tsx`, `useAppUpdates.ts`, `AnimatedSplash.tsx`, `DriverOptionSheet`, `DriverChargesScreen.tsx`, `SocialLinks.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13178294573643412 - nodes in this community are weakly interconnected._