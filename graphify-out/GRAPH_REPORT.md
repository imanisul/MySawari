# Graph Report - MySawari  (2026-11-02)

## Corpus Check
- 223 files · ~1,341,908 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1391 nodes · 4470 edges · 70 communities (67 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50ec1360`
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
- index.ts
- HomeScreen.tsx
- detailsPalette.ts
- API
- dependencies
- react
- react-native
- CarListCard.tsx
- AnimatedSplash.tsx
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- BookingDetailScreen.tsx
- ModalBlur
- BookingsScreen.tsx
- CarDetailsSections.tsx
- PaymentsListScreen.tsx
- formatCurrency
- ExploreFilters.tsx
- tsconfig.json
- FilterSheet.tsx
- MembershipScreen.tsx
- SettingsScreen.tsx
- DetailsTabs.tsx
- haptics.ts
- SawariContext.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- recentSearches.ts
- android
- activity.ts
- metro.config.js
- expo
- EditProfileScreen.tsx
- CustomAlert.tsx
- scripts
- secureStore.web.ts
- useSawari
- ios
- infoPlist
- vehicleKnowledge.ts
- MembershipSavedPopup.tsx
- PushNotificationHandler.tsx
- updates
- androidStatusBar
- vehicleImages.ts
- extra
- ConfirmationScreen.tsx
- experiments
- offers.ts
- Reveal.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 173 edges
2. `useSawari()` - 127 edges
3. `react-native` - 122 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 82 edges
7. `react-native-safe-area-context` - 61 edges
8. `expo-router` - 57 edges
9. `ModalBlur()` - 51 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `OTAUpdateChecker()` --calls--> `UpdateModal()`  [EXTRACTED]
  app/_layout.tsx → components/common/UpdateModal.tsx

## Import Cycles
- None detected.

## Communities (70 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.07
Nodes (43): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), extractOtpCode() (+35 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.15
Nodes (19): HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages() (+11 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.18
Nodes (27): Route(), longAvail(), Benefits(), CancellationPolicy(), FeatureList(), HelpCard(), LocationCard(), MainSpecification() (+19 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.21
Nodes (6): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "haptics.ts"
Cohesion: 0.06
Nodes (56): Route(), Route(), Route(), DropoffSheet(), Place, POPULAR, Row(), styles (+48 more)

### Community 7 - "BookingScreen.tsx"
Cohesion: 0.18
Nodes (15): Route(), BlurTargetProvider(), DesignToggle(), useTrackTripProgress(), expo-blur, expo-image, BookingScreen(), dayAndTime() (+7 more)

### Community 8 - "useColors"
Cohesion: 0.17
Nodes (18): styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles, styles (+10 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.13
Nodes (27): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+19 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.07
Nodes (25): ArcHeadline(), BENEFITS, cardDate(), ComboSlide, DEFAULT_SLIDES, HeroSlide, HeroSlideBase, HOME_PURPLE (+17 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.12
Nodes (14): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), PostTripReviewPrompt(), CustomAlertProvider() (+6 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.09
Nodes (38): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+30 more)

### Community 14 - "BottomNavigation.tsx"
Cohesion: 0.08
Nodes (32): Route(), Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+24 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.09
Nodes (29): calculateAdvanceAmount(), calculateBookingPrice(), calculateCouponDiscount(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate() (+21 more)

### Community 16 - "react"
Cohesion: 0.16
Nodes (11): Route(), Route(), Route(), Route(), Route(), LocationSheet(), react, DriverOptionScreen() (+3 more)

### Community 17 - "index.ts"
Cohesion: 0.11
Nodes (12): Route(), DriverChargesSheet(), DriverModeRow(), styles, styles, styles, styles, UpdateModal() (+4 more)

### Community 18 - "HomeScreen.tsx"
Cohesion: 0.13
Nodes (22): Route(), CitySheet(), styles, BenefitsGrid(), ConnectCard(), DestinationTile(), HomeSearchCard(), HomeSectionTitle() (+14 more)

### Community 19 - "detailsPalette.ts"
Cohesion: 0.43
Nodes (6): Route(), FaqList(), Faqs, SubPageHeader(), FaqsScreen(), styles

### Community 20 - "API"
Cohesion: 0.17
Nodes (12): ReviewModal(), ReviewTrip, styles, F, Photo, PhotoSourceSheet(), Star(), styles (+4 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "react"
Cohesion: 0.16
Nodes (11): Route(), Route(), Header(), OfferCard, faqs, HelpScreen(), styles, SafetyScreen() (+3 more)

### Community 23 - "react-native"
Cohesion: 0.18
Nodes (15): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+7 more)

### Community 24 - "CarListCard.tsx"
Cohesion: 0.27
Nodes (9): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), useFavorites(), ActivityAPI (+1 more)

### Community 25 - "AnimatedSplash.tsx"
Cohesion: 0.40
Nodes (5): AnimatedSplash(), markSplashGone(), splashGoneListeners, SplashStep, styles

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (30): sortCars(), CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars (+22 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.29
Nodes (11): expo-secure-store, fetchWithAuth(), getInstallId(), onRefreshed(), subscribeTokenRefresh(), withInstallId(), AUTH_KEYS, clearAuthCredentials() (+3 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingDetailScreen.tsx"
Cohesion: 0.15
Nodes (29): Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), ManageBookingSheet(), styles (+21 more)

### Community 31 - "ModalBlur"
Cohesion: 0.16
Nodes (14): styles, RefundTrackingModal(), RefundTrackingModalProps, styles, SORT_OPTIONS, SortKey, SortSheet(), styles (+6 more)

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.20
Nodes (12): Route(), FONT, BookingsScreen(), BookingTab, byRecent(), Empty(), endsIn(), Kind (+4 more)

### Community 33 - "CarDetailsSections.tsx"
Cohesion: 0.16
Nodes (15): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MileageIcon() (+7 more)

### Community 34 - "PaymentsListScreen.tsx"
Cohesion: 0.22
Nodes (8): Route(), Reveal(), useKeyboardPad(), PaymentScreen(), styles, PaymentMethodItem, PaymentsScreen(), styles

### Community 36 - "formatCurrency"
Cohesion: 0.17
Nodes (16): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+8 more)

### Community 37 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 40 - "FilterSheet.tsx"
Cohesion: 0.20
Nodes (8): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, categories, Category

### Community 41 - "MembershipScreen.tsx"
Cohesion: 0.07
Nodes (39): Route(), Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles (+31 more)

### Community 42 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.10
Nodes (32): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+24 more)

### Community 45 - "haptics.ts"
Cohesion: 0.05
Nodes (58): Route(), Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp() (+50 more)

### Community 46 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (15): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+7 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "recentSearches.ts"
Cohesion: 0.32
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 52 - "metro.config.js"
Cohesion: 0.25
Nodes (5): backendFolder, config, { getDefaultConfig }, path, expo

### Community 53 - "expo"
Cohesion: 0.67
Nodes (3): expo, install, exclude

### Community 55 - "EditProfileScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 56 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "useSawari"
Cohesion: 0.12
Nodes (22): RootLayoutNav(), NotFoundScreen(), styles, NextTrip(), styles, SearchCard(), SearchSheet(), styles (+14 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.14
Nodes (14): MembershipPicker(), MembershipUpgrade(), PlanOptions(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, PRO_LAYOUT (+6 more)

### Community 66 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

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
Cohesion: 0.12
Nodes (25): Route(), Route(), BookingCard(), Dash(), driverLabel(), MONTHS, placeName(), PricingSummary() (+17 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "offers.ts"
Cohesion: 0.21
Nodes (12): expo-device, fetchOffers(), formatExpiry(), isOfferLive(), plateSafeOfferImage(), enforceHttpsUrl(), normalizeResponse(), plateSafeImageUrl() (+4 more)

### Community 77 - "Reveal.tsx"
Cohesion: 0.60
Nodes (3): rise(), revealedScreens, react-native-reanimated

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 539 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BookingScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `index.ts`, `HomeScreen.tsx`, `detailsPalette.ts`, `API`, `react`, `react-native`, `CarListCard.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `BookingDetailScreen.tsx`, `ModalBlur`, `BookingsScreen.tsx`, `CarDetailsSections.tsx`, `PaymentsListScreen.tsx`, `formatCurrency`, `ExploreFilters.tsx`, `FilterSheet.tsx`, `MembershipScreen.tsx`, `SettingsScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `recentSearches.ts`, `EditProfileScreen.tsx`, `CustomAlert.tsx`, `useSawari`, `MembershipSavedPopup.tsx`, `PushNotificationHandler.tsx`, `ConfirmationScreen.tsx`, `Reveal.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.06778476589797344 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `haptics.ts`, `BookingScreen.tsx`, `useColors`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `BottomNavigation.tsx`, `index.ts`, `HomeScreen.tsx`, `detailsPalette.ts`, `API`, `react`, `CarListCard.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `fetchWithAuth`, `BookingDetailScreen.tsx`, `ModalBlur`, `BookingsScreen.tsx`, `CarDetailsSections.tsx`, `PaymentsListScreen.tsx`, `formatCurrency`, `ExploreFilters.tsx`, `FilterSheet.tsx`, `MembershipScreen.tsx`, `SettingsScreen.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `SawariContext.tsx`, `UpdateModal.tsx`, `activity.ts`, `EditProfileScreen.tsx`, `CustomAlert.tsx`, `useSawari`, `MembershipSavedPopup.tsx`, `PushNotificationHandler.tsx`, `ConfirmationScreen.tsx`, `offers.ts`, `Reveal.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06335403726708075 - nodes in this community are weakly interconnected._