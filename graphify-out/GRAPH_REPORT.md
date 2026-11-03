# Graph Report - MySawari  (2026-11-03)

## Corpus Check
- 229 files · ~1,345,683 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1421 nodes · 4585 edges · 72 communities (69 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95e80214`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LoginBottomSheet
- useVehicles.ts
- useDetailsPalette
- devDependencies
- ErrorBoundary.tsx
- package.json
- AddressConfirmScreen.tsx
- ExploreFilters.tsx
- BookingDetailScreen.tsx
- SearchScreen.tsx
- HomeSections.tsx
- _layout.tsx
- BottomNavigation.tsx
- LocationSearchBody.tsx
- MembershipScreen.tsx
- pricingEngine.ts
- react
- TripDetailParts.tsx
- SavedAddressesScreen.tsx
- SawariContext.tsx
- API
- dependencies
- HelpScreen.tsx
- react-native
- useHomeData.ts
- haptics.ts
- sawari.ts
- expo
- fetchWithAuth
- api.ts
- useVehicles.ts
- ManageBookingSheet.tsx
- BookingsScreen.tsx
- useSawari
- CarDetailsSections.tsx
- index.ts
- useSawari
- activity.ts
- tsconfig.json
- EditProfileScreen.tsx
- LoadingImage
- recentlyViewed.ts
- detailsPalette.ts
- BottomNavigation.tsx
- DetailsTabs.tsx
- haptics.ts
- PushNotificationHandler.tsx
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- SearchEmptyState.tsx
- android
- ConfirmationScreen.tsx
- API
- RefundsScreen.tsx
- metro.config.js
- useColors
- ScratchCard.tsx
- scripts
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
- experiments

## God Nodes (most connected - your core abstractions)
1. `react` - 176 edges
2. `useSawari()` - 133 edges
3. `react-native` - 124 edges
4. `useDetailsPalette()` - 120 edges
5. `useColors()` - 110 edges
6. `@expo/vector-icons` - 84 edges
7. `react-native-safe-area-context` - 62 edges
8. `expo-router` - 58 edges
9. `ModalBlur()` - 53 edges
10. `LoginBottomSheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `RootLayoutNav()` --calls--> `useColors()`  [EXTRACTED]
  app/_layout.tsx → hooks/useColors.ts
- `ThemedStatusBar()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx
- `OTAUpdateChecker()` --calls--> `UpdateModal()`  [EXTRACTED]
  app/_layout.tsx → components/common/UpdateModal.tsx

## Import Cycles
- None detected.

## Communities (72 total, 3 thin omitted)

### Community 0 - "LoginBottomSheet"
Cohesion: 0.06
Nodes (53): Route(), Route(), Route(), Route(), Route(), Route(), digitsOf(), extractOtpCode() (+45 more)

### Community 1 - "useVehicles.ts"
Cohesion: 0.30
Nodes (12): useTrackTripProgress(), adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch() (+4 more)

### Community 2 - "useDetailsPalette"
Cohesion: 0.20
Nodes (25): Route(), longAvail(), Benefits(), CancellationPolicy(), FeatureList(), HelpCard(), LocationCard(), MainSpecification() (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "ErrorBoundary.tsx"
Cohesion: 0.19
Nodes (7): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, expo

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): expo, install, exclude, main, name, private, version, @babel/core (+27 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.13
Nodes (27): Route(), Route(), isInNortheast(), SearchPlace, usePlaceSearch(), expo-location, AddressConfirmScreen(), mapHtml() (+19 more)

### Community 7 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (24): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+16 more)

### Community 8 - "BookingDetailScreen.tsx"
Cohesion: 0.20
Nodes (21): Route(), ExtendBookingSheet(), ManageBookingSheet(), RefundTrackingModal(), useTripColors(), ActionRow(), HelpCard(), pickupMoment() (+13 more)

### Community 9 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (24): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+16 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (49): Route(), AlertButton, AlertPayload, CustomAlert, styles, CitySheet(), styles, ArcHeadline() (+41 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.11
Nodes (16): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), RootLayoutNav(), ThemedStatusBar(), PostTripReviewPrompt() (+8 more)

### Community 12 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (17): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+9 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.16
Nodes (24): Skeleton(), SkeletonGroup(), SkeletonProps, styles, BookingSkeleton(), styles, styles, HomeCarSkeleton() (+16 more)

### Community 14 - "MembershipScreen.tsx"
Cohesion: 0.08
Nodes (31): Route(), Route(), Route(), FONT, PaymentProgress(), PaymentStep, styles, PaymentFailed() (+23 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+19 more)

### Community 16 - "react"
Cohesion: 0.14
Nodes (11): Route(), Route(), Route(), Route(), Route(), LocationSheet(), react, DriverChargesScreen() (+3 more)

### Community 17 - "TripDetailParts.tsx"
Cohesion: 0.16
Nodes (21): CancelBookingSheet(), Field(), REASONS, styles, BookingCard(), Dash(), MONTHS, placeName() (+13 more)

### Community 18 - "SavedAddressesScreen.tsx"
Cohesion: 0.30
Nodes (13): Route(), DeliveryOptions(), PhoneSheet(), SavedAddressesScreen(), styles, getSavedAddresses(), keyFor(), removeSavedAddress() (+5 more)

### Community 19 - "SawariContext.tsx"
Cohesion: 0.12
Nodes (17): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+9 more)

### Community 20 - "API"
Cohesion: 0.12
Nodes (19): ReviewModal(), styles, SORT_OPTIONS, SortKey, SortSheet(), styles, F, Photo (+11 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (52): dependencies, expo, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants, expo-device (+44 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.11
Nodes (16): Route(), Route(), Header(), OfferCard, Reveal(), useKeyboardPad(), PaymentMethodItem, PaymentsScreen() (+8 more)

### Community 23 - "react-native"
Cohesion: 0.17
Nodes (16): styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles, FloatingSupport(), FloatingSupportInner() (+8 more)

### Community 24 - "useHomeData.ts"
Cohesion: 0.24
Nodes (11): clearQueryPersistence(), hydrateUserQueries(), slot(), startQueryPersistence(), stopQueryPersistence(), timers, USER_QUERIES, HomeLoadStep (+3 more)

### Community 25 - "haptics.ts"
Cohesion: 0.13
Nodes (11): AddressPickerSheet(), styles, TOP_LOCATIONS, DRIVER_CHARGE_PER_DAY, MODES, styles, expo-haptics, PICKUP_DROP_BASE_FEE (+3 more)

### Community 26 - "sawari.ts"
Cohesion: 0.11
Nodes (31): sortCars(), CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars (+23 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "useVehicles.ts"
Cohesion: 0.17
Nodes (16): cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), VEHICLES_KEY, vehiclesQueryOptions, waitForCardImages() (+8 more)

### Community 31 - "ManageBookingSheet.tsx"
Cohesion: 0.21
Nodes (8): styles, styles, RefundTrackingModalProps, styles, FONT, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL, BookingSnapshot

### Community 32 - "BookingsScreen.tsx"
Cohesion: 0.16
Nodes (16): Route(), ReviewTrip, driverLabel(), rise(), revealedScreens, react-native-reanimated, BookingsScreen(), BookingTab (+8 more)

### Community 33 - "useSawari"
Cohesion: 0.26
Nodes (14): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, ScratchCard(), useSawari() (+6 more)

### Community 34 - "CarDetailsSections.tsx"
Cohesion: 0.12
Nodes (21): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MembershipPicker() (+13 more)

### Community 35 - "index.ts"
Cohesion: 0.22
Nodes (6): Route(), PlannerSheet(), styles, styles, TripField(), PlannerScreen()

### Community 36 - "useSawari"
Cohesion: 0.13
Nodes (23): Route(), MembershipCelebration(), MembershipSavedPopup(), Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+15 more)

### Community 37 - "activity.ts"
Cohesion: 0.25
Nodes (12): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications(), registerOnce() (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "EditProfileScreen.tsx"
Cohesion: 0.21
Nodes (9): Route(), FONT, styles, SUPPORT_EMAIL, EditProfileScreen(), Field, FONT, maskMobile() (+1 more)

### Community 40 - "LoadingImage"
Cohesion: 0.21
Nodes (13): getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles, PhotoViewer(), styles (+5 more)

### Community 41 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 42 - "detailsPalette.ts"
Cohesion: 0.24
Nodes (9): Route(), FaqList(), Faqs, dark, light, SubPageHeader(), useIsDarkMode(), FaqsScreen() (+1 more)

### Community 43 - "BottomNavigation.tsx"
Cohesion: 0.08
Nodes (33): Route(), BottomBlur(), Page(), ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps (+25 more)

### Community 44 - "DetailsTabs.tsx"
Cohesion: 0.16
Nodes (19): AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection(), getCategorizedFeatures(), ReviewsSection() (+11 more)

### Community 45 - "haptics.ts"
Cohesion: 0.07
Nodes (52): Route(), Route(), Route(), Route(), Route(), Dashes(), longStamp(), PF (+44 more)

### Community 46 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.29
Nodes (6): OTAUpdateChecker(), canCheckForUpdates(), UpdateInfo, UpdateStatus, useAppUpdates(), expo-updates

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 50 - "android"
Cohesion: 0.18
Nodes (11): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, package (+3 more)

### Community 51 - "ConfirmationScreen.tsx"
Cohesion: 0.29
Nodes (8): Route(), BlurHost(), BlurTarget(), styles, ConfirmationScreen(), FONT, NEXT, styles

### Community 52 - "API"
Cohesion: 0.22
Nodes (8): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen(), API, hasGoogleMaps

### Community 53 - "RefundsScreen.tsx"
Cohesion: 0.36
Nodes (7): Route(), bookingsQueryOptions, amountOf(), RefundsScreen(), Stage, stageOf(), styles

### Community 54 - "metro.config.js"
Cohesion: 0.29
Nodes (4): backendFolder, config, { getDefaultConfig }, path

### Community 55 - "useColors"
Cohesion: 0.07
Nodes (35): NotFoundScreen(), styles, DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles (+27 more)

### Community 56 - "ScratchCard.tsx"
Cohesion: 0.50
Nodes (3): SCRATCH_H, SCRATCH_W, styles

### Community 57 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "@expo/vector-icons"
Cohesion: 0.13
Nodes (24): Route(), Route(), DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles (+16 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.33
Nodes (6): ITSAppUsesNonExemptEncryption, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "MembershipSavedPopup.tsx"
Cohesion: 0.12
Nodes (18): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, clearMembershipPopupShown(), Layout, OTHER_LAYOUT (+10 more)

### Community 65 - "WishlistScreen.tsx"
Cohesion: 0.33
Nodes (7): Route(), CarCardSkeleton(), CarListCard, useVehicles(), styles, WishlistScreen(), byAvailability()

### Community 66 - "LocationSearchBody.tsx"
Cohesion: 0.23
Nodes (11): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+3 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

## Knowledge Gaps
- **29 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `ExploreFilters.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `TripDetailParts.tsx`, `SavedAddressesScreen.tsx`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `react-native`, `haptics.ts`, `sawari.ts`, `ManageBookingSheet.tsx`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `index.ts`, `useSawari`, `EditProfileScreen.tsx`, `LoadingImage`, `detailsPalette.ts`, `BottomNavigation.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`, `API`, `RefundsScreen.tsx`, `useColors`, `ScratchCard.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LoginBottomSheet` be split into smaller, more focused modules?**
  _Cohesion score 0.05547785547785548 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `LoginBottomSheet`, `useDetailsPalette`, `ErrorBoundary.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `ExploreFilters.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `TripDetailParts.tsx`, `SavedAddressesScreen.tsx`, `SawariContext.tsx`, `API`, `HelpScreen.tsx`, `haptics.ts`, `sawari.ts`, `fetchWithAuth`, `ManageBookingSheet.tsx`, `BookingsScreen.tsx`, `useSawari`, `CarDetailsSections.tsx`, `index.ts`, `useSawari`, `activity.ts`, `EditProfileScreen.tsx`, `LoadingImage`, `detailsPalette.ts`, `BottomNavigation.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `UpdateModal.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`, `API`, `RefundsScreen.tsx`, `useColors`, `ScratchCard.tsx`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `LoginBottomSheet`, `useVehicles.ts`, `useDetailsPalette`, `AddressConfirmScreen.tsx`, `BookingDetailScreen.tsx`, `SearchScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `BottomNavigation.tsx`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `react`, `TripDetailParts.tsx`, `SavedAddressesScreen.tsx`, `SawariContext.tsx`, `HelpScreen.tsx`, `haptics.ts`, `sawari.ts`, `ManageBookingSheet.tsx`, `BookingsScreen.tsx`, `CarDetailsSections.tsx`, `index.ts`, `useSawari`, `EditProfileScreen.tsx`, `BottomNavigation.tsx`, `DetailsTabs.tsx`, `haptics.ts`, `PushNotificationHandler.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`, `API`, `RefundsScreen.tsx`, `useColors`, `@expo/vector-icons`, `MembershipSavedPopup.tsx`, `WishlistScreen.tsx`, `LocationSearchBody.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `AddressConfirmScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13446969696969696 - nodes in this community are weakly interconnected._