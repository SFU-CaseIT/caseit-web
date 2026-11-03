# CaseIT component catalog

This is an inventory of the reusable React components currently defined under
`components/`. Update it when adding, removing, or renaming a component.

## Shared components

| File | Components | Purpose |
| --- | --- | --- |
| [`Carousel.tsx`](./Carousel.tsx) | `Carousel` | Draggable, automatically scrolling carousel for child elements. |
| [`CaseItCountdown.tsx`](./CaseItCountdown.tsx) | `CaseItCountdown` | Countdown to a CaseIT event in a selected time zone. |
| [`ClarityAnalytics.tsx`](./ClarityAnalytics.tsx) | `ClarityAnalytics` | Consent UI and opt-in Microsoft Clarity analytics. |
| [`LoadingSpinner.tsx`](./LoadingSpinner.tsx) | `LoadingSpinner` | Accessible, reusable loading indicator with a status label. |
| [`HeroSection.tsx`](./HeroSection.tsx) | `HeroSection` | Animated home-page hero image layout. |
| [`ImgButton.tsx`](./ImgButton.tsx) | `ImgButton` | Image card linked to a page, with an overlaid label. |
| [`buttons.tsx`](./buttons.tsx) | `ActionButton`, `ImgButton`, `RoundedButton`, `SquareButton`, `PivotButton`, `ArrowButton` | Native action button, link button styles, and a scroll-to-top control. |
| [`faq.tsx`](./faq.tsx) | `DesktopFAQ`, `MobileFAQ` | Expandable desktop FAQ and static mobile FAQ presentation. |
| [`footer.tsx`](./footer.tsx) | `Footer` | Site footer, navigation links, social links, and acknowledgements. |
| [`img.tsx`](./img.tsx) | `BgImgCenter`, `BgImgLeft`, `ImgLeft`, `ImgRight`, `IconImg` | Background image sections, paired image layouts, and icon/text layout. |
| [`imgRibbons.tsx`](./imgRibbons.tsx) | `ImgRibbonLeft`, `ImgRibbonRight` | Responsive image-and-content ribbons with optional hover images. |
| [`stats.tsx`](./stats.tsx) | `StatCard` | Large numeric statistic with a label. |
| [`subpageBanner.tsx`](./subpageBanner.tsx) | `SubpageBanner`, `DiscoverITBanner` | Active subpage link and DiscoverIT section navigation. |
| [`TextBox.tsx`](./TextBox.tsx) | `TextBox` | Labeled, reusable native text input. |
| [`text.tsx`](./text.tsx) | `TextDot`, `OCText`, `BoldedText`, `NewLineText` | Reusable text treatments for profiles and formatted content. |
| [`TawkTo.tsx`](./TawkTo.tsx) | `TawkTo` | Lazy-loaded Tawk.to chat integration. |

## Navigation

| File | Components | Purpose |
| --- | --- | --- |
| [`navigation/nav.tsx`](./navigation/nav.tsx) | `NavBar` | Responsive site header and main navigation. |
| [`navigation/NavList.tsx`](./navigation/NavList.tsx) | `NavList` | Desktop navigation list with hover submenus. |
| [`navigation/NavListMobile.tsx`](./navigation/NavListMobile.tsx) | `NavListMobile` | Mobile navigation list with tap-to-open submenus. |

## Page-focused components

| File | Components | Purpose |
| --- | --- | --- |
| [`pages/DisivionTable.tsx`](./pages/DisivionTable.tsx) | `DivisionTable` (default export) | Competition division draw or winner table. |
| [`pages/discoverITItems.tsx`](./pages/discoverITItems.tsx) | `Bento`, `BentoText`, `TourBento`, `CaptureITBanner`, `CaptureITCard`, `CaptureITPosts`, `OverviewMap` | DiscoverIT content cards, banners, posts, and map embed. |
| [`pages/sponsorItems.tsx`](./pages/sponsorItems.tsx) | `MobileButtons`, `SponsorBanner`, `SponsorOverviewRibbonText`, `SponsorOpCards` | Sponsor navigation, overview, and opportunity cards. |

## Admin components

| File | Components | Purpose |
| --- | --- | --- |
| [`admin/SignInSubmitButton.tsx`](./admin/SignInSubmitButton.tsx) | `SignInSubmitButton` | Login submit button that switches to a pending spinner during form submission. |
| [`admin/AdminWorkbookEditor.tsx`](./admin/AdminWorkbookEditor.tsx) | `AdminWorkbookEditor` (default export) | Admin workbook import, editing, and export interface. |

## Replicants and consolidation notes

- **Confirmed duplicate:** `ImgButton` is defined in both [`ImgButton.tsx`](./ImgButton.tsx) and [`buttons.tsx`](./buttons.tsx). They serve the same image-link-card role but have different sizing/layout behavior and accepted image types. Prefer one canonical implementation and migrate its call sites before deleting either.
- **Related navigation variants:** `NavList` and `NavListMobile` render the same link data for desktop and mobile, but their hover/tap interaction differs. They are parallel implementations rather than exact duplicates; consider sharing their data/types and link rendering if the navigation is next to be refactored.
