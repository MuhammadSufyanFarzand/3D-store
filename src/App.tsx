import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { BrandExperienceHub } from './components/BrandExperienceHub';
import {
  CheckoutModal,
  MenuDrawer,
  SearchModal,
  SizeGuideModal,
} from './components/ModalsAndDrawers';
import { QuickViewOverlay } from './components/QuickViewOverlay';
import { StorefrontEntrance } from './components/StorefrontEntrance';
import {
  SceneEnvironmentMode,
  ShowroomLightingMood,
  ThreeStage,
} from './components/ThreeStage';
import { UploadPhotoModal } from './components/UploadPhotoModal';
import { CartItem, PRODUCTS, Product, formatCurrency } from './data/products';
import { ROOM_WALL_THEMES } from './three/proceduralTextures';
import { boutiqueAudio } from './utils/boutiqueAudio';

const CENTERPIECE_DROP_INDICES = [7, 3, 13, 19]; // Limited Edition Sneaker, Hoodie, Bag, Cap

const INITIAL_CART: CartItem[] = [
  {
    productId: 'midnight-navy-signature-shirt',
    title: 'Midnight Navy Utility Shirt',
    colorName: 'Midnight Navy (Original)',
    colorIndex: 0,
    size: 'M',
    price: 199.0,
    qty: 1,
    primaryColor: '#1B2952',
    type: 'hoodie-atheist',
  },
];

export default function App() {
  // Catalog state (supports live custom uploaded garment photos)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [customPhotoVersion, setCustomPhotoVersion] = useState<number>(0);

  // Active & Hovered Garment State (Default to index 3: "Sweatshirt Plus WEIRDO ORIGINAL")
  const [activeIndex, setActiveIndex] = useState<number>(3);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isQuickView, setIsQuickView] = useState<boolean>(false);
  const [qvSlideIndex, setQvSlideIndex] = useState<number>(0);
  const [selectedColors, setSelectedColors] = useState<number[]>(() =>
    PRODUCTS.map((p) => p.defaultColor)
  );
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('USD');

  // Default to 'room' (360° 4-Wall Virtual Store Room with Clothing Wall + 3 Empty Product Tables)
  const [sceneMode, setSceneMode] = useState<SceneEnvironmentMode>('room');
  // 4-Wall Switcher: 0 = Clothing (North), 1 = Shoes (East), 2 = Bags (South), 3 = Caps (West)
  const [activeWallIndex, setActiveWallIndex] = useState<number>(0);
  const [isStoreOverview, setIsStoreOverview] = useState<boolean>(true);
  // Luxury Exterior Storefront Welcome Door State (Opens on every page load + Navbar Exterior button)
  const [isStorefrontOpen, setIsStorefrontOpen] = useState<boolean>(true);
  // Day / Night Luxury Chandelier & Spotlight Mood ('atelier-day' vs 'obsidian-night')
  const [lightingMood, setLightingMood] = useState<ShowroomLightingMood>('atelier-day');
  // Center Luxury Marble & Gold Glass Case ("Drop of the Week") Featured Product Index
  const [centerpieceIndex, setCenterpieceIndex] = useState<number>(7);
  // Ambient Boutique Sound & Door SFX Mute State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  const [windIntensity, setWindIntensity] = useState<number>(38);
  const [wireTension] = useState<number>(75);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [isPhysicsOpen, setIsPhysicsOpen] = useState<boolean>(false);
  const [orbitResetTrigger, setOrbitResetTrigger] = useState<number>(0);
  const [qvZoom, setQvZoom] = useState<number>(1);

  // Projected 2D coordinates for the floating "$199" hanger price tags on the wire
  const [tagPositions, setTagPositions] = useState<
    { x: number; y: number; visible: boolean }[]
  >([]);

  // Drawers, Modals & Toast State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_cart_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return INITIAL_CART;
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>(
    'Virtual 3D Store Room. Drag horizontally to look around all 4 walls, or select Store, Clothing, Caps, Bags, or Shoes.'
  );

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_cart_v2', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setAriaAnnouncement(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const displayedIndex =
    hoveredIndex !== null && !isQuickView ? hoveredIndex : activeIndex;
  const activeProduct = products[activeIndex] || products[0];
  const hoveredOrActiveProduct = products[displayedIndex] || activeProduct;
  const activeColorIdx = selectedColors[activeIndex] ?? activeProduct.defaultColor;
  const totalBagCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const isLightSceneText =
    (sceneMode === 'white-studio' || sceneMode === 'room') &&
    lightingMood !== 'obsidian-night';

  const handleToggleSound = useCallback(() => {
    setIsSoundMuted((prev) => {
      const next = !prev;
      boutiqueAudio.setMuted(next);
      triggerToast(
        next
          ? 'Boutique Ambient Sound & SFX Muted'
          : 'Boutique Ambient Sound & Door Chime Active'
      );
      return next;
    });
  }, [triggerToast]);

  const handleToggleLightingMood = useCallback(() => {
    setLightingMood((prev) => {
      const next = prev === 'atelier-day' ? 'obsidian-night' : 'atelier-day';
      boutiqueAudio.playLightingToggleSfx(next === 'obsidian-night');
      triggerToast(
        next === 'obsidian-night'
          ? 'Lighting Mood: Obsidian Night Runway'
          : 'Lighting Mood: Warm Gold Atelier'
      );
      return next;
    });
  }, [triggerToast]);

  const handleCycleCenterpiece = useCallback(() => {
    setCenterpieceIndex((prev) => {
      const curPos = CENTERPIECE_DROP_INDICES.indexOf(prev);
      const nextIdx =
        CENTERPIECE_DROP_INDICES[(curPos + 1) % CENTERPIECE_DROP_INDICES.length];
      boutiqueAudio.playHangerSlideSfx(1.15);
      const nextProd = products[nextIdx];
      if (nextProd) {
        triggerToast(`Center Pedestal Drop: ${nextProd.title}`);
      }
      return nextIdx;
    });
  }, [products, triggerToast]);

  const handleSelectWall = useCallback(
    (wallIdx: number, overviewMode = false) => {
      const normalized = ((wallIdx % 4) + 4) % 4;
      boutiqueAudio.playWallRotateSfx();
      setActiveWallIndex(normalized);
      setIsStoreOverview(overviewMode);
      setHoveredIndex(null);
      if (normalized === 1) {
        setActiveIndex((prev) => (prev >= 7 && prev < 13 ? prev : 7));
      } else if (normalized === 2) {
        setActiveIndex((prev) => (prev >= 13 && prev < 19 ? prev : 13));
      } else if (normalized === 3) {
        setActiveIndex((prev) => (prev >= 19 ? prev : 19));
      } else if (normalized === 0) {
        setActiveIndex((prev) => (prev < 7 ? prev : 3));
      }
      const wallObj = ROOM_WALL_THEMES[normalized];
      setAriaAnnouncement(
        overviewMode
          ? 'Store 360° Overview — drag left or right to rotate across all 4 walls.'
          : `Moved to ${wallObj.label} (${wallObj.subtitle}).`
      );
    },
    []
  );

  const goToGarment = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(products.length - 1, index));
      boutiqueAudio.playHangerSlideSfx(0.95 + (clamped % 5) * 0.04);
      setActiveIndex(clamped);
      const prod = products[clamped];
      if (prod?.isCap) {
        setActiveWallIndex(3);
        setIsStoreOverview(false);
      } else if (prod?.isBag) {
        setActiveWallIndex(2);
        setIsStoreOverview(false);
      } else if (prod?.isShoe) {
        setActiveWallIndex(1);
        setIsStoreOverview(false);
      } else {
        setActiveWallIndex(0);
      }
      setAriaAnnouncement(
        `Selected ${prod.title}, ${formatCurrency(prod.price, currency)}. Piece ${
          clamped + 1
        } of ${products.length}.`
      );
    },
    [products, currency]
  );

  const handleOpenQuickView = useCallback(
    (overrideIdx?: number) => {
      const targetIdx = typeof overrideIdx === 'number' ? overrideIdx : activeIndex;
      setActiveIndex(targetIdx);
      setIsQuickView(true);
      setQvSlideIndex(0);
      setSelectedQty(1);
      setQvZoom(1);
      setAriaAnnouncement(`Opened Quick View for ${products[targetIdx].title}.`);
    },
    [activeIndex, products]
  );

  const handleCloseQuickView = useCallback(() => {
    setIsQuickView(false);
    setQvSlideIndex(0);
    setQvZoom(1);
    setAriaAnnouncement('Returned to hanging rail.');
  }, []);

  const handleSelectColor = useCallback(
    (colorIdx: number) => {
      setSelectedColors((prev) => {
        const next = [...prev];
        next[activeIndex] = colorIdx;
        return next;
      });
      const colorName = products[activeIndex].colors[colorIdx]?.name || '';
      setAriaAnnouncement(
        `Selected color ${colorName} for ${products[activeIndex].title}.`
      );
    },
    [activeIndex, products]
  );

  const handleUploadProductPhoto = useCallback(
    (productId: string, dataUrl: string | undefined) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, customFrontImage: dataUrl } : p
        )
      );
      setCustomPhotoVersion((v) => v + 1);
      triggerToast(
        dataUrl
          ? 'Custom garment photo applied to 3D hanger!'
          : 'Restored original studio garment'
      );
    },
    [triggerToast]
  );

  const handleAddToBag = useCallback(() => {
    const prod = products[activeIndex];
    const cIdx = selectedColors[activeIndex] ?? prod.defaultColor;
    const colorObj = prod.colors[cIdx] || prod.colors[0];

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === prod.id &&
          item.colorName === colorObj.name &&
          item.size === selectedSize
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + selectedQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          title: prod.title,
          colorName: colorObj.name,
          colorIndex: cIdx,
          size: selectedSize,
          price: prod.price,
          qty: selectedQty,
          primaryColor: colorObj.primary,
          photoUrl: prod.customFrontImage || prod.photoUrl,
          type: prod.type,
        },
      ];
    });

    setIsCartOpen(true);
    triggerToast(`Added ${prod.title} (${selectedSize}) to cart`);
  }, [activeIndex, products, selectedColors, selectedSize, selectedQty, triggerToast]);

  const handleAddUpsell = useCallback(
    (size: string) => {
      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.productId === 'field-notes-black' && item.size === size
        );
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            qty: updated[existingIdx].qty + 1,
          };
          return updated;
        }
        return [
          ...prev,
          {
            productId: 'field-notes-black',
            title: 'Field Notes Hood',
            colorName: 'Washed Black',
            colorIndex: 0,
            size,
            price: 199.0,
            qty: 1,
            primaryColor: '#1E1E21',
            type: 'hoodie',
          },
        ];
      });
      triggerToast(`Field Notes Hood (${size}) added to cart`);
    },
    [triggerToast]
  );

  const handleUpdateCartQty = useCallback((idx: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].qty + delta;
      if (newQty <= 0) {
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...updated[idx], qty: newQty };
      }
      return updated;
    });
  }, []);

  const handleRemoveCartItem = useCallback((idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Global Keyboard Shortcuts (Vertical scrolling is left 100% natural for the webpage)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isStorefrontOpen) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (isUploadModalOpen) setIsUploadModalOpen(false);
        else if (isSizeGuideOpen) setIsSizeGuideOpen(false);
        else if (isSearchOpen) setIsSearchOpen(false);
        else if (isCheckoutOpen) setIsCheckoutOpen(false);
        else if (isCartOpen) setIsCartOpen(false);
        else if (isMenuOpen) setIsMenuOpen(false);
        else if (isQuickView) handleCloseQuickView();
      } else if (e.key === 'ArrowLeft') {
        if (isQuickView) {
          setQvSlideIndex((s) => (s + 2) % 3);
        } else {
          const prev = Math.max(0, activeIndex - 1);
          goToGarment(prev);
          setHoveredIndex(prev);
        }
      } else if (e.key === 'ArrowRight') {
        if (isQuickView) {
          setQvSlideIndex((s) => (s + 1) % 3);
        } else {
          const next = Math.min(products.length - 1, activeIndex + 1);
          goToGarment(next);
          setHoveredIndex(next);
        }
      } else if (
        sceneMode === 'room' &&
        !isQuickView &&
        ['1', '2', '3', '4'].includes(e.key)
      ) {
        handleSelectWall(Number(e.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isStorefrontOpen,
    activeIndex,
    products.length,
    isQuickView,
    isCartOpen,
    isMenuOpen,
    isSearchOpen,
    isSizeGuideOpen,
    isCheckoutOpen,
    isUploadModalOpen,
    sceneMode,
    goToGarment,
    handleCloseQuickView,
    handleSelectWall,
  ]);

  return (
    <div
      className={`relative w-full min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isLightSceneText ? 'bg-[#0A0908] text-stone-900' : 'bg-[#0A0908] text-white'
      }`}
    >
      {/* Screen-Reader Polite Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* ================= 0. LUXURY STOREFRONT DOOR WELCOME ANIMATION ================= */}
      <StorefrontEntrance
        isVisible={isStorefrontOpen}
        currency={currency}
        onEnterStore={(targetWallIdx, overviewMode = true) => {
          setSceneMode('room');
          if (typeof targetWallIdx === 'number') {
            handleSelectWall(targetWallIdx, overviewMode);
          } else {
            handleSelectWall(0, true);
          }
          setIsStorefrontOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          triggerToast('Welcome inside SAQIB VISUALS Flagship Store');
        }}
      />

      {/* ================= 1. TOP NAVIGATION BAR (Clean Luxury Header) ================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 sm:gap-8 px-2.5 sm:px-10 py-2.5 sm:py-3.5 pointer-events-auto transition-colors ${
          isLightSceneText
            ? 'text-stone-900 bg-[#f5f1ea]/88 backdrop-blur-md border-b border-stone-900/10'
            : 'text-white bg-[#0A0908]/88 backdrop-blur-md border-b border-[#D4AF37]/20'
        }`}
      >
        {/* Zone 1: Brand Mark / Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open collection menu"
            className={`flex items-center gap-1.5 py-1 px-2 sm:py-1.5 sm:px-2.5 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              isLightSceneText ? 'hover:bg-stone-200/70' : 'hover:bg-black/25'
            }`}
          >
            <div className="flex flex-col items-start leading-none">
              <span className="font-display font-bold text-xs sm:text-base tracking-tight">
                SAQIB VISUALS
              </span>
              <span className="text-[7px] sm:text-[8px] font-mono-tech uppercase tracking-[0.18em] sm:tracking-[0.22em] opacity-70 mt-0.5">
                FLAGSHIP VIRTUAL MALL
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean Luxury Navigation Links (Showroom · About · FAQs · Contact · Exterior Door) */}
        <nav
          aria-label="Primary store navigation"
          className="hidden md:flex items-center gap-7 text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => {
              setSceneMode('room');
              if (isQuickView) handleCloseQuickView();
              scrollToSection('top');
            }}
            className="py-1 font-semibold underline underline-offset-4 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            3D Showroom
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-about')}
            className="py-1 opacity-80 hover:opacity-100 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-faqs')}
            className="py-1 opacity-80 hover:opacity-100 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            FAQs
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-contact')}
            className="py-1 opacity-80 hover:opacity-100 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => {
              if (isQuickView) handleCloseQuickView();
              setIsStorefrontOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#0A0908] text-[#F5D77F] border border-[#D4AF37]/60 text-[11px] font-mono-tech hover:bg-[#1C1813] transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Exterior Door</span>
          </button>
        </nav>

        {/* Zone 3: Lighting Mood, Boutique Sound, Exterior Door (Mobile), Search & Primary Cart Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Exterior Door Icon Button */}
          <button
            type="button"
            onClick={() => {
              if (isQuickView) handleCloseQuickView();
              setIsStorefrontOpen(true);
            }}
            aria-label="Open Exterior Storefront Door"
            title="Exterior Storefront Door"
            className="md:hidden w-8 h-8 rounded-full bg-[#111111] text-[#F5D77F] border border-[#D4AF37]/70 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <DoorOpen className="w-3.5 h-3.5" />
          </button>

          {/* Day / Night Luxury Chandelier Lighting Toggle */}
          <button
            type="button"
            onClick={handleToggleLightingMood}
            aria-label="Toggle Day or Night Showroom Lighting Mood"
            title={
              lightingMood === 'obsidian-night'
                ? 'Switch to Warm Gold Atelier (Day Lighting)'
                : 'Switch to Obsidian Night Runway Lighting'
            }
            className="inline-flex items-center justify-center gap-1.5 w-8 h-8 lg:w-auto lg:h-auto lg:px-3 lg:py-1.5 rounded-full bg-[#111111] text-[#F5D77F] border border-[#D4AF37]/70 hover:bg-[#D4AF37] hover:text-[#111111] text-[11px] font-mono-tech font-semibold transition whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            {lightingMood === 'obsidian-night' ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Obsidian Night</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Gold Atelier</span>
              </>
            )}
          </button>

          {/* Ambient Boutique Sound & Door Chime Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isSoundMuted ? 'Unmute Boutique Sound' : 'Mute Boutique Sound'}
            title={
              isSoundMuted
                ? 'Unmute Boutique Sound & Door Chime'
                : 'Boutique Sound & SFX Active (Click to Mute)'
            }
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer ${
              isSoundMuted
                ? 'bg-stone-200/80 border-stone-300 text-stone-500 hover:text-stone-900'
                : 'bg-[#111111] border-[#D4AF37]/70 text-[#F5D77F] hover:bg-[#D4AF37] hover:text-[#111111]'
            }`}
          >
            {isSoundMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search Archive"
            className={`w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full border text-xs flex items-center justify-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
              isLightSceneText
                ? 'bg-stone-100 border-stone-200 text-stone-700 hover:border-stone-400'
                : 'bg-black/35 border-[#D4AF37]/40 text-white hover:bg-black/55'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping bag with ${totalBagCount} items`}
            className={`rounded-full py-1.5 px-2.5 sm:px-4 flex items-center gap-1 text-[11px] sm:text-xs font-mono-tech uppercase tracking-wider transition whitespace-nowrap shrink-0 cursor-pointer ${
              isLightSceneText
                ? 'bg-[#181716] text-white hover:bg-stone-800'
                : 'hud-surface-pill text-white border-[#D4AF37]/60'
            }`}
          >
            <span>Bag</span>
            <span>({totalBagCount})</span>
          </button>
        </div>
      </header>

      {/* ================= 2. 100DVH INTERACTIVE 3D VIRTUAL STORE HERO SECTION ================= */}
      <section
        id="showroom-hero"
        aria-label="SAQIB VISUALS 3D Flagship Virtual Showroom"
        className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#FAFAFA]"
      >
        <ThreeStage
          products={products}
          activeIndex={activeIndex}
          hoveredIndex={hoveredIndex}
          isQuickView={isQuickView}
          qvSlideIndex={qvSlideIndex}
          selectedColors={selectedColors}
          windIntensity={windIntensity}
          wireTension={wireTension}
          reducedMotion={reducedMotion}
          sceneMode={sceneMode}
          activeWallIndex={activeWallIndex}
          isStoreOverview={isStoreOverview}
          lightingMood={lightingMood}
          centerpieceIndex={centerpieceIndex}
          orbitResetTrigger={orbitResetTrigger}
          qvZoom={qvZoom}
          customPhotoVersion={customPhotoVersion}
          onSelectGarment={goToGarment}
          onHoverGarment={(idx) => {
            if (idx !== null && idx !== hoveredIndex) {
              boutiqueAudio.playHangerSlideSfx(1.0 + (idx % 6) * 0.03);
            }
            setHoveredIndex(idx);
          }}
          onOpenQuickView={handleOpenQuickView}
          onChangeWallIndex={(wIdx, exitOverview) =>
            handleSelectWall(wIdx, exitOverview ? false : isStoreOverview)
          }
          onUpdateTagPositions={setTagPositions}
        />

        {/* Floating "$199" Price Tag Pills on Each Hanger Hook */}
        {!isQuickView &&
          !isStorefrontOpen &&
          tagPositions.map((pos, idx) => {
            if (!pos.visible) return null;
            const prod = products[idx];
            if (!prod) return null;
            const isHovered = hoveredIndex === idx;
            return (
              <button
                key={prod.id}
                type="button"
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => handleOpenQuickView(idx)}
                style={{
                  transform: `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0) translate(-50%, -50%)`,
                }}
                aria-label={`Inspect ${prod.title}, ${formatCurrency(prod.price, currency)}`}
                className={`absolute top-0 left-0 z-10 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono-tech font-medium transition-colors shadow-xs cursor-pointer ${
                  isHovered
                    ? 'bg-[#181716] text-white scale-110'
                    : 'bg-white/95 text-stone-900 border border-stone-200/90 hover:bg-stone-900 hover:text-white'
                }`}
              >
                {currency === 'USD' ? `$${prod.price}` : `€${prod.price}`}
              </button>
            );
          })}

        {/* Left / Right Wall Rotation Arrows */}
        {!isQuickView && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between px-1.5 sm:px-6">
            <button
              type="button"
              onClick={() => handleSelectWall(activeWallIndex - 1, isStoreOverview)}
              aria-label="Rotate to previous room wall"
              className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition cursor-pointer bg-white/90 border-stone-200 text-stone-800 hover:bg-stone-900 hover:text-white shadow-sm"
              title="Turn Left to Previous Wall"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectWall(activeWallIndex + 1, isStoreOverview)}
              aria-label="Rotate to next room wall"
              className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition cursor-pointer bg-white/90 border-stone-200 text-stone-800 hover:bg-stone-900 hover:text-white shadow-sm"
              title="Turn Right to Next Wall"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Architectural Dock Inside 3D Store ("Store | Clothing | Caps | Bags | Shoes") */}
        {!isQuickView && (
          <div className="absolute bottom-2.5 sm:bottom-6 inset-x-0 z-20 px-2.5 sm:px-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2 sm:gap-4 pointer-events-none">
            {/* Mobile Compact Active Piece + Scroll Info Bar (< sm) / Desktop Left Info (sm+) */}
            <div className="pointer-events-auto w-full sm:w-auto flex items-center justify-between sm:flex-col sm:items-start gap-2 bg-white/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-stone-200/80 sm:border-0 rounded-full sm:rounded-none px-3 py-1 sm:p-0 shadow-sm sm:shadow-none">
              <div className="flex items-center sm:flex-col sm:items-start gap-2 sm:gap-0.5 min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold text-stone-900 truncate max-w-[135px] sm:max-w-none">
                  {hoveredOrActiveProduct.shortLabel}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] sm:text-xs font-mono-tech font-medium text-stone-800">
                    {formatCurrency(hoveredOrActiveProduct.price, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickView(displayedIndex)}
                    className="text-[10px] sm:text-[11px] font-semibold underline underline-offset-4 text-[#E85D2A] sm:text-stone-600 hover:text-[#E85D2A] transition cursor-pointer whitespace-nowrap"
                  >
                    Inspect &rarr;
                  </button>
                </div>
              </div>

              {/* Mobile Quick Scroll-Down Trigger inside the same compact row */}
              <button
                type="button"
                onClick={() => scrollToSection('section-about')}
                className="sm:hidden inline-flex items-center gap-1 bg-[#111111] text-[#F5D77F] border border-[#D4AF37]/70 rounded-full px-2.5 py-0.5 text-[9px] font-mono-tech uppercase tracking-wider shrink-0 cursor-pointer"
              >
                <span>About &amp; Info</span>
                <span>&darr;</span>
              </button>
            </div>

            {/* Center: Compact Single-Line 4-Wall Pill Switcher */}
            <div className="pointer-events-auto w-full sm:w-auto flex flex-col items-center gap-1.5 sm:gap-2">
              {isPhysicsOpen && (
                <div className="bg-[#181716]/95 border border-[#D4AF37]/50 rounded-xl px-3.5 py-2 mb-0.5 flex flex-wrap items-center justify-center gap-3 text-xs font-mono-tech text-white shadow-xl">
                  <label htmlFor="wind-slider" className="text-white/75 whitespace-nowrap">
                    Showroom Breeze: {windIntensity}%
                  </label>
                  <input
                    id="wind-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={windIntensity}
                    onChange={(e) => setWindIntensity(Number(e.target.value))}
                    className="w-24 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              )}

              {/* Compact Single-Line Bottom Dock ("Store | Clothing | Caps | Bags | Shoes") */}
              <div className="w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-full p-1 sm:p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between sm:justify-center gap-0.5 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectWall(activeWallIndex, true)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isStoreOverview
                      ? 'bg-[#181716] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Store
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWall(0, false)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    !isStoreOverview && activeWallIndex === 0
                      ? 'bg-[#181716] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Clothing
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWall(3, false)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    !isStoreOverview && activeWallIndex === 3
                      ? 'bg-[#181716] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Caps
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWall(2, false)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    !isStoreOverview && activeWallIndex === 2
                      ? 'bg-[#181716] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Bags
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWall(1, false)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    !isStoreOverview && activeWallIndex === 1
                      ? 'bg-[#181716] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Shoes
                </button>

                <button
                  type="button"
                  onClick={handleToggleLightingMood}
                  aria-label="Toggle Day/Night Showroom Lighting"
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ml-0.5 ${
                    lightingMood === 'obsidian-night'
                      ? 'bg-[#111111] border-[#D4AF37] text-[#F5D77F]'
                      : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  title={
                    lightingMood === 'obsidian-night'
                      ? 'Switch to Warm Gold Atelier Lighting'
                      : 'Switch to Obsidian Night Runway Lighting'
                  }
                >
                  {lightingMood === 'obsidian-night' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPhysicsOpen((o) => !o)}
                  aria-expanded={isPhysicsOpen}
                  aria-label="Toggle 3D store breeze settings"
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer shrink-0"
                  title="Breeze Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom-Right (Desktop/Tablet sm+): Scroll Down Indicator for About, FAQs, Contact & Footer */}
            <div className="hidden sm:flex pointer-events-auto flex-col items-end text-right gap-1.5">
              <button
                type="button"
                onClick={() => scrollToSection('section-about')}
                className="inline-flex items-center gap-2 bg-[#0A0908]/95 hover:bg-[#1C1813] text-[#F5D77F] border border-[#D4AF37]/60 rounded-full px-3.5 py-1.5 text-[10px] font-mono-tech uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                <span>Scroll Down · About, FAQs &amp; Contact</span>
                <span>&darr;</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="text-xs font-medium text-stone-900 underline underline-offset-4 hover:text-[#E85D2A] transition cursor-pointer"
              >
                Shop Full Archive &rarr;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================= 3. VERTICALLY SCROLLABLE ABOUT, FAQS, CONTACT & FOOTER SECTIONS ================= */}
      <BrandExperienceHub
        currency={currency}
        onChangeCurrency={setCurrency}
        onNavigateWall={(wallIdx, overviewMode = false) => {
          setSceneMode('room');
          if (isQuickView) handleCloseQuickView();
          handleSelectWall(wallIdx, overviewMode);
        }}
        onOpenStorefrontDoor={() => {
          if (isQuickView) handleCloseQuickView();
          setIsStorefrontOpen(true);
        }}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onTriggerToast={triggerToast}
      />

      {/* ================= 6. SPLIT QUICK-VIEW / PRODUCT DETAIL OVERLAY ================= */}
      <QuickViewOverlay
        isOpen={isQuickView}
        product={activeProduct}
        slideIndex={qvSlideIndex}
        selectedColorIdx={activeColorIdx}
        selectedSize={selectedSize}
        selectedQty={selectedQty}
        currency={currency}
        qvZoom={qvZoom}
        onClose={handleCloseQuickView}
        onSlideChange={setQvSlideIndex}
        onSelectColor={handleSelectColor}
        onSelectSize={setSelectedSize}
        onChangeQty={setSelectedQty}
        onAddToBag={handleAddToBag}
        onInstantBuy={handleAddToBag}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onResetOrbit={() => setOrbitResetTrigger((c) => c + 1)}
        onChangeZoom={setQvZoom}
      />

      {/* ================= 7. SLIDE-OUT CART DRAWER ================= */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        currency={currency}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onAddUpsell={handleAddUpsell}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* ================= 8. MENU, SEARCH, SIZE GUIDE, UPLOAD PHOTO & CHECKOUT MODALS ================= */}
      <MenuDrawer
        isOpen={isMenuOpen}
        activeIndex={activeIndex}
        reducedMotion={reducedMotion}
        onClose={() => setIsMenuOpen(false)}
        onJumpToGarment={(idx) => {
          if (isQuickView) setIsQuickView(false);
          goToGarment(idx);
          setHoveredIndex(idx);
          scrollToSection('top');
        }}
        onToggleReducedMotion={() => setReducedMotion((rm) => !rm)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onOpenBrandHub={(sec) => scrollToSection(`section-${sec}`)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        currency={currency}
        onClose={() => setIsSearchOpen(false)}
        onSelectGarment={(idx, openQv) => {
          goToGarment(idx);
          setHoveredIndex(idx);
          scrollToSection('top');
          if (openQv) {
            setIsQuickView(true);
            setQvSlideIndex(0);
          } else {
            setIsQuickView(false);
          }
        }}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        product={activeProduct}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        products={products}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadProductPhoto={handleUploadProductPhoto}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={cart}
        currency={currency}
        onClose={() => setIsCheckoutOpen(false)}
        onCompleteOrder={() => {
          setIsCheckoutOpen(false);
          setCart([]);
          triggerToast('Order confirmed — dispatching from studio');
        }}
      />

      {/* ================= 9. ACCESSIBLE TOAST NOTIFICATION ================= */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-[#181716] text-white border border-white/20 px-4 py-2.5 rounded-full text-xs font-mono-tech shadow-xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
