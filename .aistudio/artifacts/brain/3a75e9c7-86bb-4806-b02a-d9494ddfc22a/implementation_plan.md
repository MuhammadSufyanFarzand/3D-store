# SAQIB VISUALS — Mobile-First Responsive & Touch Ergonomics Plan

This plan adapts the **SAQIB VISUALS 3D Flagship Virtual Mall** for smartphone and tablet viewports (`360px–768px`) while preserving the full-width `1440px` desktop luxury experience, implementing touch-friendly swipe navigation, a centered Storefront Entrance with compact showcase windows, and a split Top-3D / Bottom-Sheet Quick View customizer.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All three mobile UX preferences confirmed during Phase 1 are incorporated into this plan:

- **Confirmed Decision 1 (3D Showroom Mobile Controls & Swipe Navigation)**: A **compact single-line bottom dock** (`Store | Clothing | Caps | Bags | Shoes`) paired with horizontal **touch-swipe navigation** to rotate across all 4 walls and cycle through pieces, plus a compact active-piece Floating Action Bar with a `44×44px` minimum touch target.
- **Confirmed Decision 2 (Mobile Quick View Layout)**: A **Top 3D Preview + Bottom Scrollable Details Sheet** layout on mobile screens (`< 1024px`), keeping the interactive 360° 3D garment/shoe/bag/cap model visible in the upper `38vh–42vh` viewport while the lower `58vh` rounded bottom sheet (`rounded-t-3xl`) houses color swatches, size selector, Add-to-Bag CTA, and fabric care accordions.
- **Confirmed Decision 3 (Mobile Storefront Welcome Door & Showcase Windows)**: A **Center Door Focus + Compact Showcase Windows** layout on mobile so visitors see the iconic gold-trimmed **SAQIB VISUALS** fascia, the interactive swinging glass door in the center, and a compact 4-wing horizontal showcase strip (`Clothing · Shoes · Bags · Caps`) right below the door before stepping inside.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms every layer of the SAQIB VISUALS experience—the Exterior Storefront Welcome Door, the 360° 4-Wall 3D WebGL Showroom, the Quick View 3D Customizer, the Top Navigation Bar, and the vertically scrollable White, Black & Gold Brand Experience sections (`About`, `FAQs`, `Contact`, `Footer`)—so they fit effortlessly on mobile portrait screens without horizontal overflow, clipped controls, or crowded text.
- **Target Audience / Persona**: Mobile luxury streetwear shoppers browsing on iOS and Android smartphones (`375px–430px` width) who expect one-handed thumb navigation, responsive 3D camera framing, and instant access to product customization and checkout.
- **Key Value**: Eliminates multi-row button wrapping, oversized desktop paddings, and off-screen 3D walls on narrow portrait viewports while maintaining 60fps WebGL rendering and scroll-based animations.

---

## 2. User Experience & Visual Design

### Key User Flows on Mobile (`375px–430px`)

1. **Welcome Storefront Entrance (Mobile Portrait Fit)**:
   - Compact overhead spotlights and gold-framed **SAQIB VISUALS** signboard with scaled typography (`clamp(1.35rem, 6vw, 3rem)`).
   - Central swinging glass door with the hanging **OPEN / Enter Store** plaque sized for effortless thumb tapping.
   - Directly beneath the door on mobile (`< 768px`), a **Compact 2×2 / Horizontal Showcase Window Strip** displaying thumbnail cards for **01 Clothing**, **02 Shoes**, **03 Bags**, and **04 Caps** so mobile users can either tap the door to enter the full store or tap any window display to jump straight to that wall.
2. **360° 3D Showroom & Portrait Camera Framing**:
   - Automatic **Portrait Aspect-Ratio FOV & Camera Distance Compensation** inside the WebGL stage so the hanging clothing rail, shoe shelves, bag cubbies, and cap pedestals fit comfortably within a narrow vertical phone screen without clipping the left/right edges.
   - Touch-drag horizontal swipe rotates smoothly between walls or slides along the rack, while vertical scroll outside the center drag zone smoothly scrolls down to the **About, FAQs, Contact & Footer** sections.
   - **Compact Bottom Dock**: Positioned in the natural thumb zone (`bottom-3`), combining a sleek active product bar (`Piece Title · $Price · Inspect ->`) and a single-line horizontally scrollable / fitted 5-tab pill switcher (`Store | Clothing | Caps | Bags | Shoes`).
3. **Mobile Top-3D + Bottom-Sheet Quick View Customizer**:
   - **Upper 38vh Stage**: Interactive 3D hanging piece / lookbook portrait / macro fabric swatch with compact floating zoom, reset-angle, and slide arrows.
   - **Lower 58vh Bottom Sheet (`rounded-t-3xl`)**: Cream luxury sheet (`#F6F2EC`) with a centered grab handle bar, sticky close button, color swatches (`44×44px` hit targets), single-line size selector (`XS–XXL`), sticky-friendly **Add to Bag + Instant Buy** buttons, and collapsible details accordions.
4. **Mobile-Optimized Scroll Sections (`About`, `FAQs`, `Contact`, `Footer`)**:
   - Responsive padding (`px-4 py-12` on mobile vs `px-12 py-24` on desktop), fluid display typography (`Cinzel` + `Cormorant Garamond` italic), horizontally scrollable category filter tabs in FAQs, full-width touch-friendly Concierge form inputs (`min-h-[44px]`), and a clean 2-column / 1-column stacked footer directory.

### Visual Identity & Theme
- **Aesthetic Direction**: High-Fashion Architectural Virtual Flagship (`Obsidian #111111`, `Warm Alabaster #FAF8F4`, `Brushed Gold #D4AF37 / #F5D77F`, and `Cream #F6F2EC` product sheets).
- **15% Sticky Viewport Budget**: Compact `52px` mobile top header (`SAQIB VISUALS` wordmark + `Exterior` door icon + `Search` icon + `Bag (N)` pill) so fixed chrome never crowds the 3D viewport.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Portrait WebGL Camera FOV & Zoom Adaptation**
  - *Chosen Approach*: Dynamically widen effective horizontal visibility on portrait viewports (`aspect < 1`) by adjusting camera distance/zoom multiplier inside the 3D render loop when `window.innerWidth < 768`.
  - *Why*: Standard desktop FOV (`36°`) crops the left and right sides of a 4-wall showroom on a `375×812` phone screen. Widening the portrait camera framing ensures all hanging garments and shelf columns remain visible.
- **Decision 2: Compact Storefront Showcase Strip on Mobile**
  - *Chosen Approach*: Keep the full Left & Right architectural glass windows on `md+` screens, and render a dedicated compact 4-card glass showcase grid on `< md` screens right below the central swinging door.
  - *Why*: Squeezing 3 columns (Left Window + Door + Right Window) side-by-side into `375px` would make the door microscopic. Stacking the compact showcase windows under the centered door preserves both the dramatic door swing and direct 4-wall product previews.
- **Decision 3: Bottom-Sheet Quick View on Mobile**
  - *Chosen Approach*: Convert the side-by-side split Quick View into a stacked Top-3D Viewport (`38vh`) + Bottom Scrollable Sheet (`58vh`, `rounded-t-3xl`) on `< lg` viewports.
  - *Why*: Eliminates full-page scrolling overlap while inspecting 3D garments on mobile and places size/color/cart controls directly in the natural thumb zone.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Responsive Component & Viewport Hierarchy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    SAQIB VISUALS — RESPONSIVE VIEWPORT                    │
├───────────────────────────────────────────────────────────────────────────┤
│  [Fixed Top Gold Scroll Bar (3px)]                                        │
│  [Compact Mobile Top Bar (52px): Menu+Brand | Door Icon | Search | Bag]   │
├───────────────────────────────────────────────────────────────────────────┤
│  0. STOREFRONT ENTRANCE OVERLAY (StorefrontEntrance)                      │
│     ├─ Desktop (md+): [Left Glass Window] [Center Door] [Right Window]    │
│     └─ Mobile (<md):  [Compact Fascia] -> [Center Swinging Glass Door]    │
│                       -> [Compact 4-Wing Product Showcase Strip]          │
├───────────────────────────────────────────────────────────────────────────┤
│  1. 100dvh 3D SHOWROOM STAGE (ThreeStage + Mobile HUD)                    │
│     ├─ Portrait Camera Adapter: Auto-scales zoom/distance when aspect < 1 │
│     ├─ Touch Gesture Handler: Horizontal drag = 3D Wall/Rack rotation     │
│     └─ Mobile Bottom Thumb Dock:                                          │
│        ├─ Compact Active Piece Pill (Title · Price · Inspect CTA)         │
│        ├─ Single-Line 5-Tab Switcher (Store|Clothing|Caps|Bags|Shoes)     │
│        └─ Quick Scroll-Down Pill ("About, FAQs & Concierge ↓")            │
├───────────────────────────────────────────────────────────────────────────┤
│  2. QUICK VIEW CUSTOMIZER (QuickViewOverlay)                              │
│     ├─ Top 38vh (Mobile): 3D Garment / Lookbook / Macro + Compact Orbit   │
│     └─ Bottom 58vh Sheet (Mobile): Grab Handle + Swatches + Sizes + Buy   │
├───────────────────────────────────────────────────────────────────────────┤
│  3. SCROLLABLE BRAND EXPERIENCE HUB (BrandExperienceHub)                  │
│     ├─ Kinetic Scroll-Linked Marquee Ribbon                               │
│     ├─ 01 About: Responsive Editorial Grid + 2×2 Mobile Metric Cards      │
│     ├─ 02 FAQs: Horizontal Scrollable Filter Tabs + Touch Accordions      │
│     ├─ 03 Concierge: Stacked Direct Channels + 44px Touch Form Inputs     │
│     └─ 04 Footer: 2-Col Mobile Directory + Fluid SAQIB VISUALS Wordmark   │
└───────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Portrait 3D Camera Scaling (`ThreeStage`)**: Reads `mount.clientWidth / mount.clientHeight` on resize and inside the animation loop; applies a responsive portrait zoom multiplier (`portraitFactor = Math.min(1, aspect * 1.35)`) so both `roomOverview`, `wallFocus`, and `quickView` modes frame products cleanly on narrow screens.
- **Mobile Storefront Window Strip (`StorefrontEntrance`)**: Tapping any of the 4 compact mobile showcase cards (`Clothing`, `Shoes`, `Bags`, `Caps`) triggers `triggerEnter(wallIndex, false)`—swinging the central glass door open and flying the 3D camera directly to that wall.
- **Mobile Bottom-Sheet Quick View (`QuickViewOverlay`)**: Locks background page scroll while open on mobile, supports 1-tap slide switching (`3D View`, `Collar Detail`, `Macro Knit`), and provides full-height internal scrolling inside the `#F6F2EC` bottom sheet.
