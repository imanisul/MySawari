# Graph Report - MySawari  (2026-11-02)

## Corpus Check
- 227 files · ~1,343,642 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1406 nodes · 4530 edges · 70 communities (64 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d38780d0`
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
- BookingScreen.tsx
- useColors
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- BottomNavigation.tsx
- pricingEngine.ts
- react
- DriverChargesScreen.tsx
- HomeScreen.tsx
- detailsPalette.ts
- API
- dependencies
- react
- react-native
- CarListCard.tsx
- LoginBottomSheet
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- BookingDetailScreen.tsx
- ModalBlur
- BookingsScreen.tsx
- useSawari
- PaymentScreen.tsx
- PaymentProcessingScreen.tsx
- formatCurrency
- LocationSearchBody.tsx
- tsconfig.json
- DropoffSheet.tsx
- ConfirmationScreen.tsx
- MembershipScreen.tsx
- DriverOptionScreen.tsx
- PaymentFailed
- DetailsTabs.tsx
- haptics.ts
- SawariContext.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- PlannerScreen.tsx
- android
- activity.ts
- metro.config.js
- EditProfileScreen.tsx
- CustomAlert.tsx
- scripts
- secureStore.web.ts
- @expo/vector-icons
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- ConfirmationScreen.tsx
- experiments
- offers.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 61 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `Route()` --calls--> `LocationSheet()`  [EXTRACTED]
  app/dropoff.tsx → components/booking/LocationSheet.tsx
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `VehicleSpecs()` --calls--> `useColors()`  [EXTRACTED]
  components/vehicle/details/VehicleSpecs.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (70 total, 6 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.10
Nodes (31): HomeLoadStep, loadHomeData(), recentSearchesQueryOptions(), useTrackTripProgress(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages() (+23 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.11
Nodes (47): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+39 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.19
Nodes (7): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, expo

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): expo, install, exclude, main, name, private, version, @babel/core (+27 more)

### Community 6 - "haptics.ts"
Cohesion: 0.07
Nodes (51): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+43 more)

### Community 7 - "BookingScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), BlurTargetContext, BlurTargetProvider(), styles, MembershipCelebration(), MembershipSavedPopup(), expo-blur, BookingScreen() (+7 more)

### Community 8 - "useColors"
Cohesion: 0.15
Nodes (24): NotFoundScreen(), styles, DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, LocationSheet() (+16 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.06
Nodes (64): Route(), Route(), FunnelIcon(), SortArrowsIcon(), rise(), Reveal(), revealedScreens, ALL_BUDGETS (+56 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (24): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE (+16 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.09
Nodes (23): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar() (+15 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (18): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+10 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "BottomNavigation.tsx"
Cohesion: 0.09
Nodes (31): Route(), Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+23 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (25): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+17 more)

### Community 16 - "react"
Cohesion: 0.23
Nodes (6): Route(), Route(), Route(), react, LocationScreen(), ReturnLocationScreen()

### Community 18 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (24): Route(), CitySheet(), styles, BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle() (+16 more)

### Community 19 - "detailsPalette.ts"
Cohesion: 0.39
Nodes (5): Route(), styles, SubPageHeader(), FaqsScreen(), styles

### Community 20 - "API"
Cohesion: 0.17
Nodes (13): PostTripReviewPrompt(), ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star() (+5 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "react"
Cohesion: 0.09
Nodes (20): Route(), Route(), defaultFilters, FilterSheet(), FilterState, styles, Header(), OfferCard (+12 more)

### Community 23 - "react-native"
Cohesion: 0.16
Nodes (17): styles, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport() (+9 more)

### Community 24 - "CarListCard.tsx"
Cohesion: 0.18
Nodes (12): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, Photo, RATING_WORDS, styles (+4 more)

### Community 25 - "LoginBottomSheet"
Cohesion: 0.17
Nodes (21): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), LIGHT, LoginBottomSheet(), masked() (+13 more)

### Community 26 - "sawari.ts"
Cohesion: 0.10
Nodes (32): CategoryTabs(), styles, CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo (+24 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingDetailScreen.tsx"
Cohesion: 0.19
Nodes (22): Route(), CancelBookingSheet(), Field(), ExtendBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), pickupMoment() (+14 more)

### Community 31 - "ModalBlur"
Cohesion: 0.14
Nodes (19): REASONS, styles, styles, ManageBookingSheet(), styles, RefundTrackingModalProps, styles, SORT_OPTIONS (+11 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.18
Nodes (12): Route(), bookingsQueryOptions, BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn(), Kind (+4 more)

### Community 33 - "useSawari"
Cohesion: 0.19
Nodes (16): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, SCRATCH_H, SCRATCH_W (+8 more)

### Community 34 - "PaymentScreen.tsx"
Cohesion: 0.60
Nodes (3): Route(), PaymentScreen(), styles

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (11): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+3 more)

### Community 36 - "formatCurrency"
Cohesion: 0.19
Nodes (14): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+6 more)

### Community 37 - "LocationSearchBody.tsx"
Cohesion: 0.23
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 40 - "ConfirmationScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), useQuote(), ConfirmationScreen(), FONT, NEXT, styles

### Community 41 - "MembershipScreen.tsx"
Cohesion: 0.13
Nodes (25): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, FaqList(), expo-status-bar (+17 more)

### Community 43 - "PaymentFailed"
Cohesion: 0.70
Nodes (3): Route(), PaymentFailed(), PaymentErrorScreen()

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.11
Nodes (28): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+20 more)

### Community 45 - "haptics.ts"
Cohesion: 0.06
Nodes (54): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+46 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.10
Nodes (20): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+12 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.15
Nodes (10): styles, UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-constants (+2 more)

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 52 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 55 - "EditProfileScreen.tsx"
Cohesion: 0.19
Nodes (12): Route(), FONT, styles, ACCOUNT_EMAIL, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, EditProfileScreen() (+4 more)

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.10
Nodes (18): DriverModeRow(), styles, NextTrip(), styles, SearchCard(), styles, SearchSheet(), styles (+10 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.18
Nodes (10): clearMembershipPopupShown(), Layout, OTHER_LAYOUT, PRO_LAYOUT, shown, STARTER_LAYOUT, styles, Theme (+2 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "ConfirmationScreen.tsx"
Cohesion: 0.15
Nodes (21): Route(), BookingCard(), Dash(), driverLabel(), MONTHS, placeName(), PricingSummary(), Row() (+13 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "offers.ts"
Cohesion: 0.48
Nodes (6): fetchOffers(), formatExpiry(), isOfferLive(), Offer, plateSafeOfferImage(), plateSafeImageUrl()

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 545 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BookingScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `DriverChargesScreen.tsx`, `HomeScreen.tsx`, `detailsPalette.ts`, `API`, `react`, `react-native`, `CarListCard.tsx`, `LoginBottomSheet`, `sawari.ts`, `BookingDetailScreen.tsx`, `ModalBlur`, `BookingsScreen.tsx`, `useSawari`, `PaymentScreen.tsx`, `PaymentProcessingScreen.tsx`, `formatCurrency`, `LocationSearchBody.tsx`, `DropoffSheet.tsx`, `ConfirmationScreen.tsx`, `MembershipScreen.tsx`, `DriverOptionScreen.tsx`, `PaymentFailed`, `DetailsTabs.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `PlannerScreen.tsx`, `EditProfileScreen.tsx`, `CustomAlert.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `ConfirmationScreen.tsx`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BookingScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `HomeScreen.tsx`, `detailsPalette.ts`, `API`, `react`, `CarListCard.tsx`, `LoginBottomSheet`, `sawari.ts`, `fetchWithAuth`, `BookingDetailScreen.tsx`, `ModalBlur`, `BookingsScreen.tsx`, `useSawari`, `PaymentScreen.tsx`, `PaymentProcessingScreen.tsx`, `formatCurrency`, `LocationSearchBody.tsx`, `DropoffSheet.tsx`, `ConfirmationScreen.tsx`, `MembershipScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `activity.ts`, `EditProfileScreen.tsx`, `CustomAlert.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `ConfirmationScreen.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `useVehicles.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `useDetailsPalette` be split into smaller, more focused modules?**
  _Cohesion score 0.1110204081632653 - nodes in this community are weakly interconnected._