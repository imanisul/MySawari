# Graph Report - MySawari  (2026-10-29)

## Corpus Check
- 220 files · ~1,219,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1359 nodes · 4351 edges · 76 communities (70 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69b22006`
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
- LoadingImage
- pricingEngine.ts
- BottomNavigation.tsx
- PaymentScreen.tsx
- SearchScreen.tsx
- index.ts
- expo-haptics
- dependencies
- useSawari
- parseDayLabel
- ReferEarnScreen.tsx
- ProfileScreen.tsx
- react-native
- expo
- fetchWithAuth
- api.ts
- react-native-safe-area-context
- BookingScreen.tsx
- MembershipScreen.tsx
- API
- DatesSheet.tsx
- PaymentProcessingScreen.tsx
- SawariContext.tsx
- EditProfileScreen.tsx
- tsconfig.json
- android
- CarDetailsSections.tsx
- activity.ts
- formatCurrency
- CarListCard.tsx
- react
- ios
- map/google.ts
- useAppUpdates.ts
- react
- FloatingSupport.tsx
- DropoffSheet.tsx
- PushNotificationHandler.tsx
- LoginBottomSheet
- DriverChargesScreen.tsx
- AnimatedSplash.tsx
- infoPlist
- FaqsScreen.tsx
- TripReviewSheet.tsx
- test.js
- secureStore.web.ts
- updates
- offers.ts
- PaymentFailed
- vehicleKnowledge.ts
- androidStatusBar
- extra
- experiments
- notification
- vehicleImages.ts
- scripts
- ErrorBoundary
- Reveal.tsx
- VehicleHeroGallery.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 171 edges
2. `useSawari()` - 136 edges
3. `useColors()` - 128 edges
4. `react-native` - 127 edges
5. `useDetailsPalette()` - 114 edges
6. `@expo/vector-icons` - 86 edges
7. `react-native-safe-area-context` - 63 edges
8. `expo-haptics` - 58 edges
9. `expo-router` - 57 edges
10. `ModalBlur()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `DriverModeRow()` --calls--> `useColors()`  [EXTRACTED]
  components/booking/DriverModeRow.tsx → hooks/useColors.ts
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `SectionHeading()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SectionHeading.tsx → hooks/useColors.ts
- `SocialLinks()` --calls--> `useColors()`  [EXTRACTED]
  components/common/SocialLinks.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (76 total, 6 thin omitted)

### Community 0 - "PaymentsListScreen.tsx"
Cohesion: 0.14
Nodes (12): Route(), Route(), Header(), OfferCard, PaymentsScreen(), faqs, HelpScreen(), styles (+4 more)

### Community 1 - "ReferralScreen.tsx"
Cohesion: 0.15
Nodes (18): KeyboardAwareScrollViewCompat(), expo-status-bar, Avatar(), AVATARS, C, Empty(), F, formatCurrency() (+10 more)

### Community 2 - "CarDetailsSections.tsx"
Cohesion: 0.19
Nodes (26): Route(), Benefits(), CancellationPolicy(), Faqs, FeatureList(), HelpCard(), LocationCard(), MainSpecification() (+18 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, @babel/core, babel-plugin-react-compiler, expo, expo-blur, @expo/cli, expo-constants, expo-font (+31 more)

### Community 4 - "fetch_images.js"
Cohesion: 0.11
Nodes (14): downloadImage(), fetchWikiImage(), fs, https, main(), path, safeName(), TARGET_DIR (+6 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, babel-plugin-react-compiler, expo-build-properties, expo-camera (+24 more)

### Community 6 - "expo-haptics"
Cohesion: 0.08
Nodes (49): Route(), Route(), Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY (+41 more)

### Community 7 - "detailsPalette.ts"
Cohesion: 0.06
Nodes (54): Route(), Route(), Route(), Route(), Route(), Dashes(), DesignToggle(), longStamp() (+46 more)

### Community 8 - "useColors"
Cohesion: 0.14
Nodes (21): styles, DriverOptionSheet(), OptionCard(), styles, ALL_TIMES, InlineTripEditor(), MONTHS, styles (+13 more)

### Community 9 - "sawari.ts"
Cohesion: 0.07
Nodes (27): DriverModeRow(), styles, defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles (+19 more)

### Community 10 - "HomeScreen.tsx"
Cohesion: 0.10
Nodes (32): Route(), onSplashGone(), ARC_LINES, ArcHeadline(), BENEFITS, BenefitsGrid(), cardDate(), ConnectCard() (+24 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.12
Nodes (15): AppGate(), AppStatus, LocationTracker(), queryClient, RootLayout(), ThemedStatusBar(), PostTripReviewPrompt(), CustomAlertProvider() (+7 more)

### Community 12 - "detailsPalette.ts"
Cohesion: 0.21
Nodes (10): Route(), DetailsPalette, Bullet(), Clause, Point, POLICIES, Policy, PolicyScreen() (+2 more)

### Community 13 - "LocationSearchBody.tsx"
Cohesion: 0.09
Nodes (41): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+33 more)

### Community 14 - "LoadingImage"
Cohesion: 0.15
Nodes (24): NextTrip(), styles, getSourceKey(), loadedUris, LoadingImage(), optimizeCloudinaryUrl(), RETRY_DELAYS_MS, styles (+16 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.11
Nodes (24): calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate(), calculateFuelRequired() (+16 more)

### Community 16 - "BottomNavigation.tsx"
Cohesion: 0.14
Nodes (17): Page(), styles, ALL_ITEMS, BottomNavigation(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+9 more)

### Community 17 - "PaymentScreen.tsx"
Cohesion: 0.15
Nodes (22): Route(), Reveal(), useTrackTripProgress(), PaymentScreen(), styles, addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed() (+14 more)

### Community 18 - "SearchScreen.tsx"
Cohesion: 0.07
Nodes (53): Route(), Route(), FunnelIcon(), SortLinesIcon(), BODY_ORDER, brandOf(), BUDGETS, chipFor() (+45 more)

### Community 19 - "index.ts"
Cohesion: 0.15
Nodes (9): Route(), ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, SectionHeading(), styles (+1 more)

### Community 20 - "expo-haptics"
Cohesion: 0.12
Nodes (27): NotFoundScreen(), styles, StatusBarScrim(), AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection() (+19 more)

### Community 21 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-device, @expo-google-fonts/anton, @expo-google-fonts/plus-jakarta-sans (+13 more)

### Community 22 - "useSawari"
Cohesion: 0.10
Nodes (23): RootLayoutNav(), SearchCard(), styles, SearchSheet(), styles, AlertButton, AlertPayload, CustomAlert (+15 more)

### Community 23 - "parseDayLabel"
Cohesion: 0.29
Nodes (7): longAvail(), isPastSearch(), byAvailability(), isRealDate(), parseDayLabel(), splitDateRange(), toDayNum()

### Community 24 - "ReferEarnScreen.tsx"
Cohesion: 0.21
Nodes (14): Route(), Route(), BlurHost(), BlurTarget(), BottomBlur(), styles, FaqList(), ConfirmationScreen() (+6 more)

### Community 25 - "ProfileScreen.tsx"
Cohesion: 0.17
Nodes (15): Route(), Dashes(), FONT, HEADER, inr0(), inr2(), maskMobile(), PlanKey (+7 more)

### Community 26 - "react-native"
Cohesion: 0.17
Nodes (13): styles, styles, SocialLinks(), styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+5 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.17
Nodes (18): expo-device, expo-secure-store, enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed(), subscribeTokenRefresh() (+10 more)

### Community 29 - "api.ts"
Cohesion: 0.10
Nodes (15): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+7 more)

### Community 30 - "react-native-safe-area-context"
Cohesion: 0.06
Nodes (80): Route(), Route(), Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet() (+72 more)

### Community 31 - "BookingScreen.tsx"
Cohesion: 0.24
Nodes (12): Route(), MembershipCelebration(), MembershipSavedPopup(), BookingScreen(), dayAndTime(), FONT, longWhen(), MONTHS (+4 more)

### Community 32 - "MembershipScreen.tsx"
Cohesion: 0.20
Nodes (14): Route(), ActiveMembership, activeOnly(), Dashes(), getPlanDef(), HOW_IT_WORKS, MemberCard(), MembershipScreen() (+6 more)

### Community 33 - "API"
Cohesion: 0.17
Nodes (15): bookingsQueryOptions, HomeLoadStep, loadHomeData(), recentlyViewedQueryOptions(), recentSearchesQueryOptions(), cardImagesPromise, hasLiveVehicles(), prefetchedImages (+7 more)

### Community 34 - "DatesSheet.tsx"
Cohesion: 0.14
Nodes (16): Route(), TimesScreen(), ALL_TIMES, Chevron(), DatesSheet(), isWholeHour(), MONTH_NAMES, MONTHS (+8 more)

### Community 35 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (11): Route(), FONT, PaymentProgress(), PaymentStep, styles, RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles (+3 more)

### Community 36 - "SawariContext.tsx"
Cohesion: 0.16
Nodes (14): AppCustomer, AppNotification, BookingStatus, Membership, PaymentMethod, SawariContext, SawariContextValue, @react-native-async-storage/async-storage (+6 more)

### Community 37 - "EditProfileScreen.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "android"
Cohesion: 0.22
Nodes (9): backgroundColor, foregroundImage, adaptiveIcon, backgroundColor, googleServicesFile, package, permissions, versionCode (+1 more)

### Community 40 - "CarDetailsSections.tsx"
Cohesion: 0.13
Nodes (19): allFeatures(), Bullets(), FEATURE_LABELS, featureKey(), formatPlace(), INCLUDED, Inclusions(), MembershipPicker() (+11 more)

### Community 41 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), ActivityAPI, getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 42 - "formatCurrency"
Cohesion: 0.19
Nodes (14): PriceBreakdownSheet(), ReadyPrice, styles, Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles (+6 more)

### Community 43 - "CarListCard.tsx"
Cohesion: 0.25
Nodes (7): ART_H, clearMembershipPopupShown(), shown, styles, Theme, THEMES, react-native-confetti-cannon

### Community 44 - "react"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 45 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 46 - "map/google.ts"
Cohesion: 0.21
Nodes (9): getJson(), GOOGLE_MAPS_KEY, googleAutocomplete(), GooglePlace, googlePlaceDetails(), GooglePrediction, googleReverseGeocode(), hasGoogleMaps (+1 more)

### Community 47 - "useAppUpdates.ts"
Cohesion: 0.19
Nodes (10): OTAUpdateChecker(), styles, UpdateModal(), UpdateModalProps, { width: SCREEN_WIDTH }, canCheckForUpdates(), UpdateInfo, UpdateStatus (+2 more)

### Community 48 - "react"
Cohesion: 0.21
Nodes (3): Route(), react, DriverOptionScreen()

### Community 49 - "FloatingSupport.tsx"
Cohesion: 0.24
Nodes (8): styles, FloatingSupport(), FloatingSupportInner(), HIDDEN_ROUTES, styles, shadows, useNavHelpPresent(), useSupportFabHidden()

### Community 50 - "DropoffSheet.tsx"
Cohesion: 0.28
Nodes (6): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen()

### Community 51 - "PushNotificationHandler.tsx"
Cohesion: 0.29
Nodes (5): asString(), PushData, PushNotificationHandler(), expo-constants, mockNotifications

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
Cohesion: 0.39
Nodes (5): Route(), styles, SubPageHeader(), FaqsScreen(), styles

### Community 57 - "TripReviewSheet.tsx"
Cohesion: 0.32
Nodes (7): F, Photo, PhotoSourceSheet(), Star(), styles, TripReviewSheet(), react-native-svg

### Community 58 - "test.js"
Cohesion: 0.40
Nodes (3): b, pickup, returnDt

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 61 - "offers.ts"
Cohesion: 0.60
Nodes (5): fetchOffers(), formatExpiry(), isOfferLive(), plateSafeOfferImage(), plateSafeImageUrl()

### Community 62 - "PaymentFailed"
Cohesion: 0.70
Nodes (3): Route(), PaymentFailed(), PaymentErrorScreen()

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

### Community 72 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 74 - "Reveal.tsx"
Cohesion: 0.60
Nodes (3): rise(), revealedScreens, react-native-reanimated

### Community 75 - "VehicleHeroGallery.tsx"
Cohesion: 0.50
Nodes (3): HEIGHT, styles, { width }

## Knowledge Gaps
- **28 isolated node(s):** `@babel/core`, `@expo/cli`, `@expo/ngrok`, `@stardazed/streams-text-encoding`, `@types/react` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 520 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `LoadingImage`, `BottomNavigation.tsx`, `PaymentScreen.tsx`, `SearchScreen.tsx`, `index.ts`, `expo-haptics`, `useSawari`, `ReferEarnScreen.tsx`, `ProfileScreen.tsx`, `react-native`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `EditProfileScreen.tsx`, `CarDetailsSections.tsx`, `formatCurrency`, `CarListCard.tsx`, `react`, `useAppUpdates.ts`, `FloatingSupport.tsx`, `DropoffSheet.tsx`, `PushNotificationHandler.tsx`, `LoginBottomSheet`, `DriverChargesScreen.tsx`, `AnimatedSplash.tsx`, `FaqsScreen.tsx`, `TripReviewSheet.tsx`, `PaymentFailed`, `Reveal.tsx`, `VehicleHeroGallery.tsx`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **What connects `@babel/core`, `@expo/cli`, `@expo/ngrok` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PaymentsListScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PaymentsListScreen.tsx`, `ReferralScreen.tsx`, `CarDetailsSections.tsx`, `package.json`, `expo-haptics`, `detailsPalette.ts`, `useColors`, `sawari.ts`, `HomeScreen.tsx`, `_layout.tsx`, `detailsPalette.ts`, `LocationSearchBody.tsx`, `LoadingImage`, `BottomNavigation.tsx`, `PaymentScreen.tsx`, `SearchScreen.tsx`, `index.ts`, `expo-haptics`, `useSawari`, `ReferEarnScreen.tsx`, `ProfileScreen.tsx`, `fetchWithAuth`, `react-native-safe-area-context`, `BookingScreen.tsx`, `MembershipScreen.tsx`, `DatesSheet.tsx`, `PaymentProcessingScreen.tsx`, `SawariContext.tsx`, `EditProfileScreen.tsx`, `CarDetailsSections.tsx`, `activity.ts`, `formatCurrency`, `CarListCard.tsx`, `useAppUpdates.ts`, `react`, `FloatingSupport.tsx`, `DropoffSheet.tsx`, `PushNotificationHandler.tsx`, `LoginBottomSheet`, `AnimatedSplash.tsx`, `FaqsScreen.tsx`, `TripReviewSheet.tsx`, `Reveal.tsx`, `VehicleHeroGallery.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `fetch_images.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._