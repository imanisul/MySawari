# Graph Report - MySawari  (2026-11-23)

## Corpus Check
- 263 files · ~1,480,311 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 1758 nodes · 5838 edges · 91 communities (85 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89210d74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PolicyScreen.tsx
- WelcomeSheet.tsx
- haptics.ts
- devDependencies
- SearchScreen.tsx
- package.json
- AddressConfirmScreen.tsx
- BookingScreen.tsx
- Skeleton
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
- react-native
- HomeScreen.tsx
- LocationSheet
- LoadingImage
- expo
- fetchWithAuth
- api.ts
- BookingsScreen.tsx
- FlashSaleScreen.tsx
- useVehicles.ts
- BottomNavigation.tsx
- useDetailsPalette
- HomeTopBar.tsx
- offers.ts
- LocationSearchBody.tsx
- tsconfig.json
- recentlyViewed.ts
- TripDetailParts.tsx
- FlashSaleBanner.tsx
- MembershipScreen.tsx
- BookingDetailScreen.tsx
- AddressSearchScreen.tsx
- DatesSheet.tsx
- react-native-safe-area-context
- UpdateModal.tsx
- MySawari customer app: store compliance notes
- deviceScaling.test.js
- android
- LoginBottomSheet
- DriverChargesSheet
- recentSearches.ts
- react
- StickyBookingBar.tsx
- ProfileScreen.tsx
- CarListCard.tsx
- useSawari
- secureStore.web.ts
- index.ts
- ios
- infoPlist
- vehicleKnowledge.ts
- referralLinkHandler.ts
- SettingsScreen.tsx
- CarListCard.tsx
- updates
- androidStatusBar
- TopDealsScreen.tsx
- extra
- haptics.ts
- experiments
- ErrorFallback.tsx
- splash
- scripts
- DriverOptionScreen.tsx
- DropoffSheet.tsx
- 2. Apple App Store Connect Listing
- VehicleSummary.tsx
- MembershipRatingModal.tsx
- PaymentResult.tsx
- FlashSaleButton.tsx
- FloatingSupport.tsx
- useSawari
- withOptionalHardwareFeatures.js
- SearchEmptyState.tsx
- CustomAlert.tsx
- ConfirmationScreen.tsx

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
- `Keywords Field (Limit: 100 characters | Strictly Valid: 99 characters)` --references--> `Car`  [INFERRED]
  docs/store-listing.md → utils/sawari.ts
- `TimesScreen()` --calls--> `DatesSheet()`  [EXTRACTED]
  app/times.tsx → components/booking/DatesSheet.tsx
- `CategoryTabs()` --calls--> `useColors()`  [EXTRACTED]
  components/common/CategoryTabs.tsx → hooks/useColors.ts
- `NotFoundScreen()` --calls--> `useColors()`  [EXTRACTED]
  app/+not-found.tsx → hooks/useColors.ts
- `RootLayoutNav()` --calls--> `useSawari()`  [EXTRACTED]
  app/_layout.tsx → context/SawariContext.tsx

## Import Cycles
- 3-file cycle: `components/index.ts -> components/vehicle/CarListCard.tsx -> screens/Membership/MembershipScreen.tsx -> components/index.ts`

## Communities (91 total, 6 thin omitted)

### Community 0 - "PolicyScreen.tsx"
Cohesion: 0.11
Nodes (21): Route(), Route(), Route(), Route(), Route(), Route(), DetailsPalette, Bullet() (+13 more)

### Community 1 - "WelcomeSheet.tsx"
Cohesion: 0.11
Nodes (19): FindCard(), HomeCardsRow(), pad2(), PriceCard(), styles, TILES, TimerBox(), react-native-gesture-handler (+11 more)

### Community 2 - "haptics.ts"
Cohesion: 0.10
Nodes (14): defaultFilters, FilterSheet(), FilterState, styles, CategoryTabs(), styles, SCRATCH_H, SCRATCH_W (+6 more)

### Community 3 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @babel/core, babel-plugin-react-compiler, @expo/cli, @expo/ngrok, react-native-svg-transformer, @types/react, typescript

### Community 4 - "SearchScreen.tsx"
Cohesion: 0.14
Nodes (29): Route(), FunnelIcon(), SortArrowsIcon(), chipOn(), chipsFor(), countActive(), EMPTY_FILTERS, ExploreFilters (+21 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (34): expo, install, exclude, main, name, private, version, @babel/core (+26 more)

### Community 6 - "AddressConfirmScreen.tsx"
Cohesion: 0.20
Nodes (15): Route(), AddressConfirmScreen(), mapHtml(), PRESET_LABELS, styles, comp(), getJson(), GOOGLE_MAPS_KEY (+7 more)

### Community 7 - "BookingScreen.tsx"
Cohesion: 0.12
Nodes (28): Route(), Route(), CouponNotApplicableModal(), Props, styles, DesignToggle(), useQuote(), useTrackTripProgress() (+20 more)

### Community 8 - "Skeleton"
Cohesion: 0.05
Nodes (77): Route(), Route(), Route(), Route(), Route(), Skeleton(), SkeletonGroup(), SkeletonProps (+69 more)

### Community 9 - "MembershipFaqsScreen.tsx"
Cohesion: 0.23
Nodes (10): Route(), Route(), FaqList(), styles, SubPageHeader(), MEMBERSHIP_FAQS, MembershipFaqsScreen(), styles (+2 more)

### Community 10 - "HomeSections.tsx"
Cohesion: 0.05
Nodes (39): BannerRays(), ArcHeadline(), BENEFITS, BenefitsGrid(), BenefitsSlide, BIKE_CATEGORIES, cardDate(), CATEGORIES (+31 more)

### Community 11 - "_layout.tsx"
Cohesion: 0.08
Nodes (23): AppGate(), AppStatus, LocationTracker(), OTAUpdateChecker(), queryClient, RootLayout(), ThemedStatusBar(), CustomAlertProvider() (+15 more)

### Community 12 - "PaymentProcessingScreen.tsx"
Cohesion: 0.17
Nodes (12): Route(), Route(), PaymentFailed(), RazorpayCheckoutWebView(), RazorpayCheckoutWebViewProps, styles, react-native-webview, PaymentErrorScreen() (+4 more)

### Community 13 - "ExploreFilters.tsx"
Cohesion: 0.11
Nodes (23): ALL_BUDGETS, BIKE_BUDGETS, BIKE_CHIPS, BIKE_FEATURES, BODY_ORDER, brandOf(), BUDGETS, Cta() (+15 more)

### Community 14 - "ExclusiveOfferDetailModal.tsx"
Cohesion: 0.16
Nodes (23): ExclusiveOffersSection(), F, styles, { width: SCREEN_WIDTH }, basePriceOf(), computeDealPrice(), describeTimeLeft(), ExclusiveOfferDetailModal() (+15 more)

### Community 15 - "pricingEngine.ts"
Cohesion: 0.10
Nodes (27): buildQuoteFingerprint(), calculateAdvanceAmount(), calculateBookingPrice(), calculateDistanceKm(), calculateDriverCharge(), calculateDropCharge(), calculateFuelCost(), calculateFuelEstimate() (+19 more)

### Community 16 - "SawariContext.tsx"
Cohesion: 0.11
Nodes (20): AppCustomer, AppNotification, BookingStatus, FavoritesContext, FavoritesValue, Membership, PaymentMethod, QuoteContext (+12 more)

### Community 17 - "ReferEarnScreen.tsx"
Cohesion: 0.11
Nodes (16): Route(), Route(), BlurTargetProvider(), BlurHost(), BlurTarget(), BottomBlur(), styles, Page() (+8 more)

### Community 18 - "AnimatedSplash.tsx"
Cohesion: 0.14
Nodes (23): AnimatedG, AnimatedSplash(), BACK, BRAND_SPLASH_COLORS, markSplashGone(), OUT, seg(), splashGoneListeners (+15 more)

### Community 19 - "activity.ts"
Cohesion: 0.23
Nodes (13): SawariProvider(), getSessionId(), BackendNotification, NotificationsAPI, BACKEND_URL, invalidateWalletCache(), REGISTER_RETRY_DELAYS_MS, registerDeviceForPushNotifications() (+5 more)

### Community 20 - "sawari.ts"
Cohesion: 0.11
Nodes (29): CarTile, styles, LuxuryCarTile, styles, isPastSearch(), AvailabilityInfo, baseCars, Block (+21 more)

### Community 21 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, expo, expo-application, expo-blur, expo-build-properties, expo-camera, expo-clipboard, expo-constants (+46 more)

### Community 22 - "HelpScreen.tsx"
Cohesion: 0.17
Nodes (10): Route(), Route(), Header(), faqs, HelpScreen(), styles, SafetyScreen(), styles (+2 more)

### Community 23 - "react-native"
Cohesion: 0.13
Nodes (19): styles, OfferCard, styles, styles, getTimeRemaining(), SpecialDeal, SpecialDealCard, styles (+11 more)

### Community 24 - "HomeScreen.tsx"
Cohesion: 0.12
Nodes (23): Route(), CitySheet(), styles, ConnectCard(), DestinationTile(), HomeCategories(), HomePromoBanner(), HomeSectionTitle() (+15 more)

### Community 25 - "LocationSheet"
Cohesion: 0.30
Nodes (6): Route(), Route(), Route(), LocationSheet(), LocationScreen(), ReturnLocationScreen()

### Community 26 - "LoadingImage"
Cohesion: 0.17
Nodes (15): NextTrip(), styles, AnimatedVehiclePlaceholder(), getSourceKey(), isValidImageSource(), loadedUris, LoadingImage(), optimizeCloudinaryUrl() (+7 more)

### Community 27 - "expo"
Cohesion: 0.13
Nodes (14): expo, icon, name, orientation, owner, plugins, runtimeVersion, scheme (+6 more)

### Community 28 - "fetchWithAuth"
Cohesion: 0.16
Nodes (19): expo-device, expo-secure-store, fetchContentVersion(), enforceHttpsUrl(), fetchWithAuth(), getInstallId(), normalizeResponse(), onRefreshed() (+11 more)

### Community 29 - "api.ts"
Cohesion: 0.09
Nodes (17): activeSubmissionLocks, BASE_URL, formatPhotonAddress(), HOLD_STATUSES, inFlightGetRequests, isUnpaidHold(), mapPhotonResponse(), normalizeBookingStatus() (+9 more)

### Community 30 - "BookingsScreen.tsx"
Cohesion: 0.14
Nodes (19): Route(), PostTripReviewPrompt(), ReviewModal(), ReviewTrip, driverLabel(), rise(), Reveal(), revealedScreens (+11 more)

### Community 31 - "FlashSaleScreen.tsx"
Cohesion: 0.07
Nodes (27): Route(), FlashSaleHeroTitle, FlashSaleHeroTitleProps, FlashSaleScheduledHeader(), SCHEDULED_HEADER_VIEW, FlashSaleSwipeCoach(), hasSeenSwipeCoach(), markSwipeCoachSeen() (+19 more)

### Community 32 - "useVehicles.ts"
Cohesion: 0.19
Nodes (12): bookingsQueryOptions, HomeLoadStep, cardImagesPromise, hasLiveVehicles(), prefetchedImages, prefetchVehicleImages(), primeVehicles(), vehiclesQueryOptions (+4 more)

### Community 33 - "BottomNavigation.tsx"
Cohesion: 0.13
Nodes (16): RootLayoutNav(), ALL_ITEMS, BottomNavigation(), FlashBadge(), HeadsetIcon(), HelpButton(), IconProps, PROFILE_PATHS (+8 more)

### Community 34 - "useDetailsPalette"
Cohesion: 0.11
Nodes (46): Route(), longAvail(), allFeatures(), Benefits(), Bullets(), CancellationPolicy(), Faqs, FEATURE_LABELS (+38 more)

### Community 35 - "HomeTopBar.tsx"
Cohesion: 0.13
Nodes (19): BikeCategoryTiles(), BikeLabel(), CAR_CATEGORIES, CategoryTile, CategoryTiles(), DateSearchBox(), F, FadeOutline() (+11 more)

### Community 36 - "offers.ts"
Cohesion: 0.29
Nodes (12): fetchExclusiveOffers(), fetchOffers(), formatExpiry(), hydrateExclusiveOffers(), isOfferLive(), NextFlashSale, plateSafeOfferImage(), prefetchOfferImages() (+4 more)

### Community 37 - "LocationSearchBody.tsx"
Cohesion: 0.15
Nodes (17): ChevronIcon(), LocationSearchBody(), LocationSearchMode, PinIcon(), POPULAR_DESTINATIONS, POPULAR_PICKUP_POINTS, SearchIcon(), styles (+9 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): expo/tsconfig.base, compilerOptions, baseUrl, ignoreDeprecations, paths, strict, exclude, extends (+1 more)

### Community 39 - "recentlyViewed.ts"
Cohesion: 0.62
Nodes (6): addRecentlyViewed(), adoptGuestViewed(), getRecentlyViewed(), keyFor(), oldKeyFor(), RecentlyViewedItem

### Community 40 - "TripDetailParts.tsx"
Cohesion: 0.17
Nodes (19): BookingCard(), Dash(), MONTHS, placeName(), PricingSummary(), refundAmountOf(), refundStage(), RefundTimeline() (+11 more)

### Community 41 - "FlashSaleBanner.tsx"
Cohesion: 0.15
Nodes (17): BannerArt(), BOLT_SHADOWS, DEFAULT_WHEN, FlashSaleBanner(), Lettering(), LINE2_SHADOWS, LINE2_TEXT, Line2Text() (+9 more)

### Community 42 - "MembershipScreen.tsx"
Cohesion: 0.13
Nodes (22): Route(), FONT, PaymentProgress(), PaymentStep, styles, TripMilestoneCard(), styles, VehicleHeader() (+14 more)

### Community 43 - "BookingDetailScreen.tsx"
Cohesion: 0.15
Nodes (27): Route(), CancelBookingSheet(), Field(), REASONS, styles, ExtendBookingSheet(), styles, ManageBookingSheet() (+19 more)

### Community 44 - "AddressSearchScreen.tsx"
Cohesion: 0.27
Nodes (11): Route(), isInNortheast(), SearchPlace, usePlaceSearch(), AddressSearchScreen(), Place, styles, googleAutocomplete() (+3 more)

### Community 45 - "DatesSheet.tsx"
Cohesion: 0.18
Nodes (19): ALL_TIMES, carGapOn(), DatesSheet(), hourLabel(), isWholeHour(), MONTH_NAMES, MONTHS, monthWeeks() (+11 more)

### Community 46 - "react-native-safe-area-context"
Cohesion: 0.09
Nodes (33): ChoiceOption, ChoiceSheet(), styles, RefundTrackingModal(), styles, styles, SORT_OPTIONS, SortKey (+25 more)

### Community 47 - "UpdateModal.tsx"
Cohesion: 0.40
Nodes (4): styles, UpdateModalProps, { width: SCREEN_WIDTH }, UpdateStatus

### Community 48 - "MySawari customer app: store compliance notes"
Cohesion: 0.29
Nodes (6): Account deletion (implemented), Apple, Data inventory (from the models and the app code), Google Play, MySawari customer app: store compliance notes, Open items for the owner

### Community 49 - "deviceScaling.test.js"
Cohesion: 0.25
Nodes (5): assert, DEVICES, scalePropStyle(), scaleStyleObject(), test

### Community 50 - "android"
Cohesion: 0.17
Nodes (12): backgroundColor, foregroundImage, adaptiveIcon, allowBackup, backgroundColor, blockedPermissions, googleServicesFile, intentFilters (+4 more)

### Community 51 - "LoginBottomSheet"
Cohesion: 0.17
Nodes (18): digitsOf(), extractOtpCode(), formatAuthError(), group(), isOtpError(), lastSends, LIGHT, LoginBottomSheet() (+10 more)

### Community 53 - "recentSearches.ts"
Cohesion: 0.33
Nodes (11): adoptGuestSearches(), getRecentSearches(), keyFor(), markSearchProgress(), RecentSearch, removeRecentSearch(), saveRecentSearch(), SearchBase (+3 more)

### Community 54 - "react"
Cohesion: 0.23
Nodes (4): Route(), TimesScreen(), react, DatesScreen()

### Community 55 - "StickyBookingBar.tsx"
Cohesion: 0.21
Nodes (13): Breakup(), Dashes(), ReadyPrice, StickyBookingBar(), styles, ONE_DAY_KM, TOP_DEAL_EXTRA_KM_RATE, TOP_DEAL_KM (+5 more)

### Community 56 - "ProfileScreen.tsx"
Cohesion: 0.15
Nodes (18): Route(), RateUsCard(), expo-status-bar, Dashes(), FONT, HEADER, inr0(), inr2() (+10 more)

### Community 57 - "CarListCard.tsx"
Cohesion: 0.29
Nodes (9): CarListCardProps, CarListCardUI, MONTH_FULL, shortAvail(), styles, HeartIcon(), useFavorites(), memberPriceFor() (+1 more)

### Community 58 - "useSawari"
Cohesion: 0.12
Nodes (20): NotFoundScreen(), styles, DriverModeRow(), styles, SearchCard(), styles, SearchSheet(), styles (+12 more)

### Community 59 - "secureStore.web.ts"
Cohesion: 0.60
Nodes (5): clearAuthCredentials(), deleteItemAsync(), getItemAsync(), setItemAsync(), storage()

### Community 60 - "index.ts"
Cohesion: 0.16
Nodes (18): DriverChargesSheet(), styles, DriverOptionSheet(), OptionCard(), styles, styles, PlannerSheet(), styles (+10 more)

### Community 61 - "ios"
Cohesion: 0.33
Nodes (6): ios, backgroundColor, buildNumber, bundleIdentifier, icon, supportsTablet

### Community 62 - "infoPlist"
Cohesion: 0.29
Nodes (7): ITSAppUsesNonExemptEncryption, LSApplicationQueriesSchemes, NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, UIBackgroundModes, infoPlist

### Community 64 - "referralLinkHandler.ts"
Cohesion: 0.33
Nodes (10): expo-application, clearPendingReferral(), detectInstallReferrer(), detectReferralFromClipboard(), extractReferralCode(), getPendingReferral(), handleDeepLinkReferralUrl(), PENDING_REFERRAL_KEY (+2 more)

### Community 65 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (11): Route(), ACCOUNT_EMAIL, DeletionOtpBoxes(), FONT, SettingsScreen(), styles, ContactPrefs, DEFAULTS (+3 more)

### Community 66 - "CarListCard.tsx"
Cohesion: 0.14
Nodes (15): Route(), clearMembershipPopupShown(), Layout, MembershipCelebration(), MembershipSavedPopup(), OTHER_LAYOUT, PRO_LAYOUT, shown (+7 more)

### Community 67 - "updates"
Cohesion: 0.50
Nodes (4): updates, checkAutomatically, fallbackToCacheTimeout, url

### Community 68 - "androidStatusBar"
Cohesion: 0.67
Nodes (3): backgroundColor, translucent, androidStatusBar

### Community 69 - "TopDealsScreen.tsx"
Cohesion: 0.09
Nodes (28): Route(), DealsCard(), useAfterSlideIn(), ceilIstHourMs(), dealDayTime(), dealPricing(), dealWhenLabel(), istDayNum() (+20 more)

### Community 70 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 72 - "haptics.ts"
Cohesion: 0.14
Nodes (22): PhotoViewer(), AboutSection(), DetailRow(), DetailsTab, DetailsTabs(), FeaturesSection(), GallerySection(), getCategorizedFeatures() (+14 more)

### Community 73 - "experiments"
Cohesion: 0.67
Nodes (3): reactCompiler, typedRoutes, experiments

### Community 74 - "ErrorFallback.tsx"
Cohesion: 0.12
Nodes (11): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ErrorFallback(), ErrorFallbackProps, styles, backendFolder, config (+3 more)

### Community 75 - "splash"
Cohesion: 0.60
Nodes (5): splash, splash, backgroundColor, image, resizeMode

### Community 76 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 78 - "DropoffSheet.tsx"
Cohesion: 0.24
Nodes (7): DropoffSheet(), Place, POPULAR, Row(), styles, DropoffScreen(), hasGoogleMaps

### Community 79 - "2. Apple App Store Connect Listing"
Cohesion: 0.15
Nodes (12): 1. Google Play Console Listing, 2. Apple App Store Connect Listing, 3. High-Converting Screenshot Framework (CTR Optimization), App Name (Limit: 30 characters), App Title (Limit: 30 characters), Full Description (Limit: 4,000 characters | Current: 3,790 characters), Keywords Field (Limit: 100 characters | Strictly Valid: 99 characters), MySawari – Complete App Store Optimization (ASO) & Store Listing Guide (+4 more)

### Community 80 - "VehicleSummary.tsx"
Cohesion: 0.17
Nodes (21): Route(), AddressPickerSheet(), styles, TOP_LOCATIONS, DeliveryOptions(), DRIVER_CHARGE_PER_DAY, MODES, styles (+13 more)

### Community 81 - "MembershipRatingModal.tsx"
Cohesion: 0.31
Nodes (7): MembershipRatingModal(), MembershipRatingModalProps, styles, hasPromptedMembershipRating(), recordMembershipRatingAction(), requestStoreReview(), shouldPromptMembershipRating()

### Community 82 - "PaymentResult.tsx"
Cohesion: 0.43
Nodes (5): FONT, styles, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL

### Community 83 - "FlashSaleButton.tsx"
Cohesion: 0.12
Nodes (13): FLASH_PINK, FLASH_PURPLE, FLASH_PURPLE_DARK, FlashSaleButtonProps, FlashSaleButtonSize, SIZE_CONFIGS, styles, BenefitCards() (+5 more)

### Community 84 - "FloatingSupport.tsx"
Cohesion: 0.36
Nodes (6): Route(), EditProfileScreen(), Field, FONT, maskMobile(), styles

### Community 85 - "useSawari"
Cohesion: 0.24
Nodes (14): Route(), RewardCardGate(), CONFETTI, F, RewardScratchModal(), styles, ScratchCard(), useSawari() (+6 more)

### Community 87 - "SearchEmptyState.tsx"
Cohesion: 0.38
Nodes (5): Action, EmptyKind, SearchEmptyState(), styles, useBrandColors()

### Community 88 - "CustomAlert.tsx"
Cohesion: 0.40
Nodes (4): AlertButton, AlertPayload, CustomAlert, styles

### Community 90 - "ConfirmationScreen.tsx"
Cohesion: 0.50
Nodes (3): FONT, NEXT, styles

## Knowledge Gaps
- **28 isolated node(s):** `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `expo-build-properties` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 687 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PolicyScreen.tsx`, `WelcomeSheet.tsx`, `haptics.ts`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `sawari.ts`, `HelpScreen.tsx`, `react-native`, `HomeScreen.tsx`, `LocationSheet`, `LoadingImage`, `BookingsScreen.tsx`, `FlashSaleScreen.tsx`, `useVehicles.ts`, `BottomNavigation.tsx`, `useDetailsPalette`, `HomeTopBar.tsx`, `LocationSearchBody.tsx`, `TripDetailParts.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `AddressSearchScreen.tsx`, `DatesSheet.tsx`, `react-native-safe-area-context`, `UpdateModal.tsx`, `LoginBottomSheet`, `DriverChargesSheet`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `CarListCard.tsx`, `useSawari`, `index.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `ErrorFallback.tsx`, `DriverOptionScreen.tsx`, `DropoffSheet.tsx`, `VehicleSummary.tsx`, `MembershipRatingModal.tsx`, `PaymentResult.tsx`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`, `SearchEmptyState.tsx`, `CustomAlert.tsx`, `ConfirmationScreen.tsx`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **What connects `@react-native-community/datetimepicker`, `@react-navigation/native`, `@stardazed/streams-text-encoding` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PolicyScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react-native` to `PolicyScreen.tsx`, `WelcomeSheet.tsx`, `haptics.ts`, `SearchScreen.tsx`, `package.json`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `MembershipFaqsScreen.tsx`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExploreFilters.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `AnimatedSplash.tsx`, `activity.ts`, `sawari.ts`, `HelpScreen.tsx`, `HomeScreen.tsx`, `LoadingImage`, `fetchWithAuth`, `BookingsScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `HomeTopBar.tsx`, `LocationSearchBody.tsx`, `TripDetailParts.tsx`, `FlashSaleBanner.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `AddressSearchScreen.tsx`, `DatesSheet.tsx`, `react-native-safe-area-context`, `UpdateModal.tsx`, `LoginBottomSheet`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `CarListCard.tsx`, `useSawari`, `index.ts`, `referralLinkHandler.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `ErrorFallback.tsx`, `DropoffSheet.tsx`, `VehicleSummary.tsx`, `MembershipRatingModal.tsx`, `PaymentResult.tsx`, `FlashSaleButton.tsx`, `FloatingSupport.tsx`, `useSawari`, `SearchEmptyState.tsx`, `CustomAlert.tsx`, `ConfirmationScreen.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `WelcomeSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._
- **Why does `useSawari()` connect `useSawari` to `SearchScreen.tsx`, `AddressConfirmScreen.tsx`, `BookingScreen.tsx`, `Skeleton`, `HomeSections.tsx`, `_layout.tsx`, `PaymentProcessingScreen.tsx`, `ExclusiveOfferDetailModal.tsx`, `SawariContext.tsx`, `ReferEarnScreen.tsx`, `sawari.ts`, `HelpScreen.tsx`, `HomeScreen.tsx`, `LocationSheet`, `LoadingImage`, `BookingsScreen.tsx`, `FlashSaleScreen.tsx`, `BottomNavigation.tsx`, `useDetailsPalette`, `LocationSearchBody.tsx`, `MembershipScreen.tsx`, `BookingDetailScreen.tsx`, `AddressSearchScreen.tsx`, `DatesSheet.tsx`, `react-native-safe-area-context`, `LoginBottomSheet`, `StickyBookingBar.tsx`, `ProfileScreen.tsx`, `CarListCard.tsx`, `useSawari`, `index.ts`, `SettingsScreen.tsx`, `CarListCard.tsx`, `TopDealsScreen.tsx`, `haptics.ts`, `DropoffSheet.tsx`, `VehicleSummary.tsx`, `FloatingSupport.tsx`, `SearchEmptyState.tsx`, `ConfirmationScreen.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._