# Graph Report - MySawari  (2026-10-20)

## Corpus Check
- 189 files · ~1,093,736 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1089 nodes · 3364 edges · 60 communities (54 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bab9ad4`
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
- useColors
- index.ts
- sawari.ts
- HomeScreen.tsx
- _layout.tsx
- SearchScreen.tsx
- SafetyScreen.tsx
- DatesSheet.tsx
- pricingEngine.ts
- FloatingSupport.tsx
- DatesScreen.tsx
- Header
- react-native
- ScreenSkeletons.tsx
- dependencies
- fetchWithAuth
- ExploreScreen.tsx
- LocationSearchBody.tsx
- HelpScreen.tsx
- DestinationCard.tsx
- expo
- useVehicles.ts
- api.ts
- ProfileScreen.tsx
- react-native-safe-area-context
- LocationSheet
- PaymentProcessingScreen.tsx
- ReferralScreen.tsx
- MembershipScreen.tsx
- SawariContext.tsx
- tsconfig.json
- android
- activity.ts
- LoadingImage
- PushNotificationHandler.tsx
- ios
- useAppUpdates.ts
- offers.ts
- EditProfileScreen.tsx
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
1. `useColors()` - 166 edges
2. `react` - 147 edges
3. `useSawari()` - 115 edges
4. `react-native` - 112 edges
5. `@expo/vector-icons` - 74 edges
6. `useDetailsPalette()` - 55 edges
7. `expo-router` - 50 edges
8. `react-native-safe-area-context` - 49 edges
9. `expo-haptics` - 48 edges
10. `CarDetailsScreen()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `TimesScreen()` --calls--> `DatesSheet()`  [EXTRACTED]
  app/times.tsx → components/booking/DatesSheet.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (60 total, 6 thin omitted)

### Community 0 - "BookingsScreen.tsx"
Cohesion: 0.06
Nodes (56): Route(), Route(), FIGMA, formatMobile(), LoginBottomSheet(), OtpBoxes(), otpCode(), styles (+48 more)

### Community 1 - "BottomNavigation.tsx"
Cohesion: 0.15
Nodes (13): ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS, Route, styles (+5 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.05
Nodes (81): Route(), Route(), Route(), allFeatures(), Benefits(), Bullets(), CalendarIcon(), CancellationPolicy() (+73 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.07
Nodes (20): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, downloadImage(), fetchWikiImage() (+12 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (31): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+23 more)

### Community 6 - "VehicleSummary.tsx"
Cohesion: 0.12
Nodes (26): Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), MODES, styles (+18 more)

### Community 7 - "useColors"
Cohesion: 0.10
Nodes (25): NotFoundScreen(), styles, ALL_TIMES, InlineTripEditor(), MONTHS, styles, PlannerSheet(), styles (+17 more)

### Community 8 - "index.ts"
Cohesion: 0.10
Nodes (17): Route(), Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, DropoffSheet() (+9 more)

### Community 9 - "sawari.ts"
Cohesion: 0.10
Nodes (32): CarListCardProps, CarListCardUI, Spec(), styles, CarTile, styles, LuxuryCarTile, styles (+24 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.06
Nodes (46): Route(), FIGMA, PhoneNumberSheet(), styles, AnimatedSplash(), markSplashGone(), onSplashGone(), splashGoneListeners (+38 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (16): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), CustomAlertProvider() (+8 more)

### Community 12 - "SearchScreen.tsx"
Cohesion: 0.12
Nodes (21): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors(), BIKE_FUEL, BIKE_PRICE_RANGES, BIKE_TRANSMISSION (+13 more)

### Community 13 - "SafetyScreen.tsx"
Cohesion: 0.36
Nodes (4): Route(), SUPPORT_PHONE, SafetyScreen(), styles

### Community 14 - "DatesSheet.tsx"
Cohesion: 0.18
Nodes (14): ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS, monthWeeks(), padTime() (+6 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.12
Nodes (23): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+15 more)

### Community 16 - "FloatingSupport.tsx"
Cohesion: 0.27
Nodes (9): FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES, styles, listeners, navHelpListeners, setSupportFabHidden(), useNavHelpPresent() (+1 more)

### Community 17 - "DatesScreen.tsx"
Cohesion: 0.38
Nodes (3): Route(), TimesScreen(), DatesScreen()

### Community 18 - "Header"
Cohesion: 0.16
Nodes (11): Route(), CustomAlert, Header(), useSawari(), PaymentMethodItem, PaymentsScreen(), styles, SettingsScreen() (+3 more)

### Community 19 - "react-native"
Cohesion: 0.08
Nodes (26): styles, DriverModeRow(), styles, defaultFilters, FilterState, styles, SearchCard(), styles (+18 more)

### Community 20 - "ScreenSkeletons.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+12 more)

### Community 22 - "fetchWithAuth"
Cohesion: 0.29
Nodes (6): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId()

### Community 23 - "ExploreScreen.tsx"
Cohesion: 0.17
Nodes (13): Route(), Route(), FilterSheet(), Page(), CarCardSkeleton(), CarListCard(), useBottomNavHeight(), useHideSupportWhileScrolling() (+5 more)

### Community 24 - "LocationSearchBody.tsx"
Cohesion: 0.22
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 25 - "HelpScreen.tsx"
Cohesion: 0.38
Nodes (5): Route(), SUPPORT_WHATSAPP_URL, faqs, HelpScreen(), styles

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "useVehicles.ts"
Cohesion: 0.09
Nodes (38): Route(), HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), useTrackTripProgress(), cardImagesPromise, hasLiveVehicles() (+30 more)

### Community 29 - "api.ts"
Cohesion: 0.14
Nodes (9): BASE_URL, formatPhotonAddress(), mapPhotonResponse(), PendingReview, refreshSubscribers, reverseCache, searchCache, SERVICE_AREA_BBOX (+1 more)

### Community 30 - "ProfileScreen.tsx"
Cohesion: 0.36
Nodes (5): LoginScreen(), Route(), PrimaryButton(), ProfileScreen(), styles

### Community 31 - "react-native-safe-area-context"
Cohesion: 0.31
Nodes (8): Route(), KeyboardAwareScrollViewCompat(), useVehicles(), BookingScreen(), DetailRow(), Input(), styles, checkCarAvailability()

### Community 32 - "LocationSheet"
Cohesion: 0.16
Nodes (11): Route(), Route(), Route(), Route(), Route(), LocationSheet(), react, DriverOptionScreen() (+3 more)

### Community 34 - "PaymentProcessingScreen.tsx"
Cohesion: 0.25
Nodes (7): Route(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentProcessingScreen(), styles

### Community 35 - "ReferralScreen.tsx"
Cohesion: 0.22
Nodes (11): rise(), Reveal(), revealedScreens, react-native-reanimated, formatCurrency(), formatDate(), ReferScreen(), loadData() (+3 more)

### Community 36 - "MembershipScreen.tsx"
Cohesion: 0.27
Nodes (8): Route(), getPlanDef(), MembershipScreen(), PlanDef, PlanKey, PLANS, styles, { width: SCREEN_WIDTH }

### Community 37 - "SawariContext.tsx"
Cohesion: 0.13
Nodes (15): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, expo-location (+7 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 41 - "activity.ts"
Cohesion: 0.21
Nodes (14): SawariProvider(), expo-device, ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS (+6 more)

### Community 42 - "LoadingImage"
Cohesion: 0.16
Nodes (15): Route(), Route(), NextTrip(), styles, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+7 more)

### Community 44 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 45 - "ios"
Cohesion: 0.29
Nodes (7): ios, backgroundColor, buildNumber, bundleIdentifier, googleServicesFile, icon, supportsTablet

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "offers.ts"
Cohesion: 0.36
Nodes (8): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), normalizeResponse(), plateSafeImageUrl(), timedFetch()

### Community 54 - "EditProfileScreen.tsx"
Cohesion: 0.47
Nodes (4): Route(), @react-native-community/datetimepicker, EditProfileScreen(), styles

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
  These have ≤1 connection - possible missing edges. (Counts symbols only; 437 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `LocationSheet` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `VehicleSummary.tsx`, `useColors`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `SearchScreen.tsx`, `SafetyScreen.tsx`, `DatesSheet.tsx`, `FloatingSupport.tsx`, `DatesScreen.tsx`, `Header`, `react-native`, `ScreenSkeletons.tsx`, `ExploreScreen.tsx`, `LocationSearchBody.tsx`, `HelpScreen.tsx`, `DestinationCard.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `PaymentProcessingScreen.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `SawariContext.tsx`, `LoadingImage`, `PushNotificationHandler.tsx`, `useAppUpdates.ts`, `EditProfileScreen.tsx`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BookingsScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06169772256728778 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `CarDetailsSections.tsx`, `fetch_images.js`, `package.json`, `VehicleSummary.tsx`, `useColors`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `SearchScreen.tsx`, `SafetyScreen.tsx`, `DatesSheet.tsx`, `FloatingSupport.tsx`, `Header`, `ScreenSkeletons.tsx`, `fetchWithAuth`, `ExploreScreen.tsx`, `LocationSearchBody.tsx`, `HelpScreen.tsx`, `DestinationCard.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `PaymentProcessingScreen.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `SawariContext.tsx`, `activity.ts`, `LoadingImage`, `PushNotificationHandler.tsx`, `useAppUpdates.ts`, `EditProfileScreen.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `CarDetailsSections.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05197368421052632 - nodes in this community are weakly interconnected._
- **Why does `useColors()` connect `useColors` to `BookingsScreen.tsx`, `BottomNavigation.tsx`, `CarDetailsSections.tsx`, `index.ts`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `SearchScreen.tsx`, `SafetyScreen.tsx`, `DatesSheet.tsx`, `FloatingSupport.tsx`, `Header`, `react-native`, `ScreenSkeletons.tsx`, `ExploreScreen.tsx`, `LocationSearchBody.tsx`, `HelpScreen.tsx`, `useVehicles.ts`, `ProfileScreen.tsx`, `react-native-safe-area-context`, `LocationSheet`, `PaymentProcessingScreen.tsx`, `ReferralScreen.tsx`, `MembershipScreen.tsx`, `LoadingImage`, `useAppUpdates.ts`, `EditProfileScreen.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._