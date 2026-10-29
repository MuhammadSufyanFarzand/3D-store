import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Crown,
  Footprints,
  ShoppingBag,
  Shirt,
  Sparkles,
} from 'lucide-react';
import {
  BAG_PRODUCTS,
  CAP_PRODUCTS,
  CLOTHING_PRODUCTS,
  Product,
  SHOE_PRODUCTS,
  formatCurrency,
} from '../data/products';

interface StorefrontEntranceProps {
  isVisible: boolean;
  currency: 'EUR' | 'USD';
  onEnterStore: (targetWallIndex?: number, overviewMode?: boolean) => void;
}

export const StorefrontEntrance: React.FC<StorefrontEntranceProps> = ({
  isVisible,
  currency,
  onEnterStore,
}) => {
  const [isDoorSwinging, setIsDoorSwinging] = useState(false);
  const [isWalkingIn, setIsWalkingIn] = useState(false);
  const [hoveredDoor, setHoveredDoor] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsDoorSwinging(false);
      setIsWalkingIn(false);
    }
  }, [isVisible]);

  const triggerEnter = (targetWallIndex?: number, overviewMode = true) => {
    if (isDoorSwinging) return;
    setIsDoorSwinging(true);
    setTimeout(() => {
      setIsWalkingIn(true);
    }, 240);
    setTimeout(() => {
      onEnterStore(targetWallIndex, overviewMode);
    }, 1150);
  };

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerEnter(0, true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isDoorSwinging]);

  if (!isVisible) return null;

  // Featured items for the Left & Right Storefront Display Windows
  const featuredClothing: Product = CLOTHING_PRODUCTS[3] || CLOTHING_PRODUCTS[0];
  const secondaryClothing: Product = CLOTHING_PRODUCTS[4] || CLOTHING_PRODUCTS[1];
  const featuredShoe: Product = SHOE_PRODUCTS[0] || SHOE_PRODUCTS[1];
  const secondaryShoe: Product = SHOE_PRODUCTS[5] || SHOE_PRODUCTS[2];
  const featuredBag: Product = BAG_PRODUCTS[0] || BAG_PRODUCTS[1];
  const secondaryBag: Product = BAG_PRODUCTS[1] || BAG_PRODUCTS[2];
  const featuredCap: Product = CAP_PRODUCTS[1] || CAP_PRODUCTS[0];
  const secondaryCap: Product = CAP_PRODUCTS[3] || CAP_PRODUCTS[2];

  const mobileShowcaseWings = [
    {
      wall: 0,
      code: '01 · CLOTHING',
      item: featuredClothing,
      img: featuredClothing.customFrontImage || featuredClothing.photoUrl,
      bg: '#F3EFE6',
    },
    {
      wall: 1,
      code: '02 · SHOES',
      item: featuredShoe,
      img: featuredShoe.photoUrl,
      bg: '#ECE7DF',
    },
    {
      wall: 2,
      code: '03 · BAGS',
      item: featuredBag,
      img: featuredBag.photoUrl,
      bg: '#F4EFE8',
    },
    {
      wall: 3,
      code: '04 · CAPS',
      item: featuredCap,
      img: featuredCap.photoUrl,
      bg: '#EFECE6',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SAQIB VISUALS Flagship Storefront Welcome Entrance"
      className="fixed inset-0 z-50 overflow-hidden select-none flex flex-col justify-between bg-[#090A0D]/78 backdrop-blur-[2px]"
      style={{
        perspective: '1600px',
        height: '100dvh',
      }}
    >
      {/* 3D Camera Walk-In Wrapper */}
      <div
        className="relative w-full h-full flex flex-col justify-between transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transitionDuration: isWalkingIn ? '920ms' : '400ms',
          transform: isWalkingIn
            ? 'scale3d(2.45, 2.45, 1) translate3d(0, 6%, 0)'
            : 'scale3d(1, 1, 1) translate3d(0, 0, 0)',
          opacity: isWalkingIn ? 0 : 1,
        }}
      >
        {/* Ambient Night Sky & Warm Facade Vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 18%, rgba(212,175,55,0.16) 0%, rgba(12,13,16,0.68) 55%, rgba(7,8,10,0.94) 100%)',
          }}
        />

        {/* ==================== 1. UPPER ARCHITECTURAL FACADE & SIGNBOARD ==================== */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto pt-1.5 sm:pt-4 px-2.5 sm:px-8 shrink-0">
          {/* Top Architectural Cornice Bar with 4 Overhead Gooseneck Spotlights */}
          <div className="relative w-full h-4 sm:h-8 bg-gradient-to-b from-[#23252C] via-[#15171C] to-[#0D0E12] border-t border-x border-[#D4AF37]/35 rounded-t-lg shadow-2xl flex items-center justify-around px-4 sm:px-20">
            {[0, 1, 2, 3].map((lampIdx) => (
              <div key={lampIdx} className="relative flex flex-col items-center">
                <div className="w-2.5 sm:w-3 h-1.5 sm:h-2 bg-[#2B2D35] border border-[#D4AF37]/50 rounded-t-sm" />
                <div className="w-6 sm:w-11 h-2 sm:h-3 bg-gradient-to-b from-[#2A2C32] to-[#121317] border border-[#D4AF37]/60 rounded-b-full shadow-[0_4px_16px_rgba(255,214,130,0.85)] flex items-end justify-center">
                  <div className="w-4 sm:w-7 h-1 bg-[#FFF3C4] rounded-full shadow-[0_0_18px_6px_rgba(255,220,130,0.95)]" />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 sm:top-4 w-24 sm:w-56 h-20 sm:h-36 -z-10"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 0%, rgba(255,228,158,0.42) 0%, rgba(212,175,55,0.14) 48%, rgba(0,0,0,0) 78%)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main Gold-Trimmed "SAQIB VISUALS" Storefront Fascia Board */}
          <div className="relative w-full bg-gradient-to-b from-[#14161B] via-[#0E1014] to-[#121419] border-2 border-[#D4AF37]/80 shadow-[0_18px_50px_rgba(0,0,0,0.85)] px-2.5 sm:px-8 py-2 sm:py-4">
            <div className="border border-[#D4AF37]/35 px-2.5 sm:px-6 py-1.5 sm:py-3 flex flex-row items-center justify-between gap-2 sm:gap-6 relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 15% 0%, rgba(255,226,150,0.16), transparent 35%), radial-gradient(circle at 38% 0%, rgba(255,226,150,0.16), transparent 35%), radial-gradient(circle at 62% 0%, rgba(255,226,150,0.16), transparent 35%), radial-gradient(circle at 85% 0%, rgba(255,226,150,0.16), transparent 35%)',
                }}
              />

              {/* Left: Circular SV Luxury Crest Emblem */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 z-10">
                <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#231F16] via-[#121317] to-[#292212] border-2 border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.3)] flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-xs sm:text-base tracking-tighter text-[#F5D77F] leading-none">
                    SV
                  </span>
                  <span className="text-[6px] sm:text-[7px] font-mono-tech uppercase tracking-[0.18em] text-[#D4AF37]/90 mt-0.5">
                    2027
                  </span>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[9px] font-mono-tech uppercase tracking-[0.26em] text-[#D4AF37]">
                    ARCHITECTURAL RETAIL
                  </span>
                  <span className="text-xs text-stone-300 font-medium">
                    360° 4-Wall Flagship
                  </span>
                </div>
              </div>

              {/* Center: Bold "SAQIB VISUALS" Storefront Brand Title */}
              <div className="text-center z-10 flex flex-col items-center min-w-0 flex-1">
                <h1 className="font-display font-bold text-lg sm:text-4xl lg:text-5xl tracking-[0.12em] sm:tracking-[0.14em] text-white drop-shadow-[0_2px_18px_rgba(212,175,55,0.35)] truncate">
                  SAQIB VISUALS
                </h1>
                <p className="text-[7px] sm:text-[11px] font-mono-tech uppercase tracking-[0.16em] sm:tracking-[0.28em] text-[#E6C665] mt-0.5 truncate max-w-full">
                  CLOTHING · FOOTWEAR · BAGS · HEADWEAR
                </p>
              </div>

              {/* Right: Quick Enter Button on Mobile / 4 Department Emblems on Desktop */}
              <button
                type="button"
                onClick={() => triggerEnter(0, true)}
                className="lg:hidden z-10 shrink-0 px-2.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#111111] font-mono-tech font-bold text-[9px] uppercase tracking-wider shadow-md cursor-pointer"
              >
                Enter &rarr;
              </button>

              <div className="hidden lg:flex items-center gap-2.5 shrink-0 z-10">
                {[
                  { label: 'Clothing', icon: Shirt, wall: 0 },
                  { label: 'Shoes', icon: Footprints, wall: 1 },
                  { label: 'Bags', icon: ShoppingBag, wall: 2 },
                  { label: 'Caps', icon: Crown, wall: 3 },
                ].map((dept) => {
                  const Icon = dept.icon;
                  return (
                    <button
                      key={dept.label}
                      type="button"
                      onClick={() => triggerEnter(dept.wall, false)}
                      title={`Enter directly to ${dept.label} Wall`}
                      className="group flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#181A20]/90 border border-[#D4AF37]/45 hover:border-[#F5D77F] hover:bg-[#22252E] transition cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-[#E6C665] group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-mono-tech uppercase tracking-wider text-stone-300 mt-1">
                        {dept.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 2. MAIN STOREFRONT BODY (CENTER DOOR + COMPACT MOBILE SHOWCASE WINDOWS) ==================== */}
        <div className="relative z-10 flex-1 w-full max-w-[1380px] mx-auto px-2.5 sm:px-8 flex flex-col md:flex-row items-stretch justify-between gap-1.5 md:gap-0 min-h-0">
          {/* Left Fluted Obsidian Pillar (Tablet/Desktop) */}
          <div className="hidden sm:flex w-5 lg:w-7 bg-gradient-to-r from-[#0B0C0F] via-[#1B1D24] to-[#0E1014] border-l border-r border-[#D4AF37]/30 flex-col justify-between py-4 items-center shrink-0">
            <div className="w-1.5 h-full border-x border-white/10" />
          </div>

          {/* ---------- LEFT GLASS SHOWCASE WINDOW (DESKTOP/TABLET md+) ---------- */}
          <div className="hidden md:flex flex-1 bg-[#12141A]/95 border-y-4 border-l-4 border-[#1F222B] p-2.5 lg:p-3.5 flex-col justify-between relative overflow-hidden shadow-inner">
            <div className="relative flex-1 border border-[#D4AF37]/45 bg-gradient-to-b from-[#231F1A]/95 via-[#17181E]/95 to-[#121317]/95 p-3 lg:p-4 flex flex-col justify-between overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 28% 0%, rgba(255,220,145,0.26) 0%, transparent 60%), radial-gradient(ellipse at 74% 0%, rgba(255,220,145,0.24) 0%, transparent 60%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-y-10 -left-1/4 w-1/2 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent rotate-12"
              />

              <div className="relative z-10 flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
                <span className="text-[10px] font-mono-tech uppercase tracking-[0.22em] text-[#E6C665]">
                  WINDOW I &nbsp;·&nbsp; APPAREL &amp; FOOTWEAR
                </span>
                <span className="text-[10px] font-mono-tech text-stone-400">
                  WALL 01 &amp; 02
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 my-auto py-2">
                <button
                  type="button"
                  onClick={() => triggerEnter(0, false)}
                  className="group relative bg-gradient-to-b from-[#2B2620] to-[#17181D] border border-[#D4AF37]/40 hover:border-[#F5D77F] rounded-lg p-2.5 flex flex-col items-center text-left transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer shadow-lg"
                >
                  <div className="w-full aspect-[4/4.2] rounded bg-[#F3EFE6] relative overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={featuredClothing.customFrontImage || featuredClothing.photoUrl}
                      alt={featuredClothing.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={secondaryClothing.customFrontImage || secondaryClothing.photoUrl}
                      alt={secondaryClothing.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain absolute bottom-1.5 right-1.5 bg-white/90 rounded p-0.5 border border-stone-300 shadow-sm"
                    />
                  </div>
                  <div className="w-full mt-2">
                    <div className="text-[9px] font-mono-tech uppercase tracking-wider text-[#E6C665]">
                      01 · CLOTHING RAIL
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5">
                      {featuredClothing.shortLabel}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono-tech text-stone-300">
                      <span>{formatCurrency(featuredClothing.price, currency)}</span>
                      <span className="text-[#E6C665] group-hover:translate-x-0.5 transition-transform">
                        Enter &rarr;
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerEnter(1, false)}
                  className="group relative bg-gradient-to-b from-[#2B2620] to-[#17181D] border border-[#D4AF37]/40 hover:border-[#F5D77F] rounded-lg p-2.5 flex flex-col items-center text-left transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer shadow-lg"
                >
                  <div className="w-full aspect-[4/4.2] rounded bg-[#ECE7DF] relative overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={featuredShoe.photoUrl}
                      alt={featuredShoe.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain -rotate-12 scale-110 drop-shadow-[0_10px_14px_rgba(0,0,0,0.3)] group-hover:scale-115 transition-transform duration-300"
                    />
                    <img
                      src={secondaryShoe.photoUrl}
                      alt={secondaryShoe.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain absolute bottom-1.5 right-1.5 bg-white/90 rounded p-0.5 border border-stone-300 shadow-sm"
                    />
                  </div>
                  <div className="w-full mt-2">
                    <div className="text-[9px] font-mono-tech uppercase tracking-wider text-[#E6C665]">
                      02 · FOOTWEAR WALL
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5">
                      {featuredShoe.shortLabel}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono-tech text-stone-300">
                      <span>{formatCurrency(featuredShoe.price, currency)}</span>
                      <span className="text-[#E6C665] group-hover:translate-x-0.5 transition-transform">
                        Enter &rarr;
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative z-10 border-t border-[#D4AF37]/25 pt-2 flex items-center justify-between text-[10px] font-mono-tech text-stone-400">
                <span>HEAVYWEIGHT FLEECE &amp; NITRO RUNNERS</span>
                <span className="text-[#D4AF37]">7 GARMENTS · 6 SHOES</span>
              </div>
            </div>
          </div>

          {/* ---------- CENTER ARCHITECTURAL ENTRANCE DOORWAY ---------- */}
          <div className="w-full md:w-[360px] lg:w-[420px] flex-1 md:flex-initial shrink-0 bg-[#14161D] border-x-4 border-t-4 border-[#232730] px-2.5 sm:px-3 pt-1.5 sm:pt-2.5 flex flex-col justify-between relative shadow-[0_0_60px_rgba(0,0,0,0.9)] min-h-0">
            {/* Transom Window Above Door */}
            <div className="w-full py-1 sm:py-1.5 px-2.5 sm:px-3 bg-[#0E1015] border border-[#D4AF37]/50 flex items-center justify-between text-[8px] sm:text-[10px] font-mono-tech uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#E6C665] mb-1.5 sm:mb-2 shrink-0">
              <span>NO. 01 STUDIO</span>
              <span>SAQIB VISUALS</span>
              <span>OPEN 24/7</span>
            </div>

            {/* Door Frame Opening — Live 3D Store Room Shines Through From Behind */}
            <div
              className="relative flex-1 w-full border-x-2 border-t-2 border-[#D4AF37]/75 overflow-hidden flex flex-col min-h-0"
              style={{
                perspective: '1400px',
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                  background: isDoorSwinging
                    ? 'radial-gradient(circle at 50% 45%, rgba(255,244,214,0.45) 0%, rgba(212,175,55,0.18) 55%, rgba(0,0,0,0.1) 100%)'
                    : 'radial-gradient(circle at 50% 45%, rgba(255,235,180,0.22) 0%, rgba(15,17,22,0.42) 85%)',
                }}
              />

              {/* SWINGING GLASS DOOR LEAF */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Tap glass door to open and enter SAQIB VISUALS 3D Store"
                onClick={() => triggerEnter(0, true)}
                onMouseEnter={() => setHoveredDoor(true)}
                onMouseLeave={() => setHoveredDoor(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerEnter(0, true);
                  }
                }}
                style={{
                  transformOrigin: 'left center',
                  transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: isDoorSwinging
                    ? 'rotateY(-82deg)'
                    : hoveredDoor
                      ? 'rotateY(-7deg)'
                      : 'rotateY(0deg)',
                }}
                className="relative w-full h-full border-[5px] sm:border-[6px] border-[#1B1E26] bg-gradient-to-br from-white/[0.10] via-[#12141A]/35 to-black/45 backdrop-blur-[1.5px] flex flex-col justify-between p-3 sm:p-5 cursor-pointer group"
              >
                {/* Inner Gold Door Trim */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1.5 border border-[#D4AF37]/45"
                />

                {/* Glass Specular Sheen */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-y-6 left-6 w-20 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 group-hover:translate-x-16 transition-transform duration-700"
                />

                {/* Left Door Hinges */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-10 sm:top-12 w-2 h-6 sm:h-7 bg-gradient-to-b from-[#F5D77F] to-[#9E7B22] rounded-r-xs"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 bottom-12 sm:bottom-16 w-2 h-6 sm:h-7 bg-gradient-to-b from-[#F5D77F] to-[#9E7B22] rounded-r-xs"
                />

                {/* Right Vertical Brushed Brass Pull Handle */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <div className="w-2.5 sm:w-3 h-1.5 bg-[#D4AF37] rounded-xs" />
                  <div className="w-1.5 sm:w-2 h-24 sm:h-44 rounded-full bg-gradient-to-r from-[#FFF0B8] via-[#D4AF37] to-[#8F6F1A] shadow-[0_0_16px_rgba(212,175,55,0.65)] border border-[#FFF5D6]/50" />
                  <div className="w-2.5 sm:w-3 h-1.5 bg-[#D4AF37] rounded-xs" />
                </div>

                {/* Top of Glass Door: Etched Monogram Decal */}
                <div className="relative z-10 text-center pt-0.5 sm:pt-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded bg-[#0E1015]/85 border border-[#D4AF37]/50 text-[8px] sm:text-[10px] font-mono-tech uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#F5D77F]">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4AF37]" />
                    <span>3D INTERACTIVE SHOWROOM</span>
                  </div>
                </div>

                {/* Center of Glass Door: Hanging "OPEN" Plaque & Enter Store CTA */}
                <div className="relative z-10 my-auto flex flex-col items-center text-center px-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-l-2 border-[#D4AF37]/80 rotate-45 -mb-2 sm:-mb-2.5" />
                  <div className="w-full max-w-[215px] sm:max-w-[230px] bg-gradient-to-b from-[#171920]/95 to-[#0E1015]/95 border-2 border-[#D4AF37] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:border-[#FFF0B8] group-hover:scale-[1.03] transition-all">
                    <div className="text-[8px] sm:text-[9px] font-mono-tech uppercase tracking-[0.24em] text-[#D4AF37]">
                      WELCOME TO SAQIB VISUALS
                    </div>
                    <div className="font-display font-bold text-xl sm:text-3xl tracking-[0.18em] text-white mt-0.5">
                      OPEN
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent my-1.5 sm:my-2" />
                    <div className="inline-flex items-center justify-center gap-2 w-full min-h-[40px] py-2 px-3 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#F2D16B] to-[#C99E2C] text-[#111215] font-mono-tech font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-md">
                      <span>{isDoorSwinging ? 'Opening Door...' : 'Enter Store'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <span className="mt-1.5 sm:mt-2.5 text-[9px] sm:text-[10px] font-mono-tech uppercase tracking-[0.18em] text-white/90 bg-black/65 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded border border-white/15">
                    Tap Door to Walk Inside
                  </span>
                </div>

                {/* Bottom Kickplate of Glass Door */}
                <div className="relative z-10 w-full h-6 sm:h-10 bg-gradient-to-r from-[#8F6F1A] via-[#D4AF37] to-[#8F6F1A] border-t border-[#FFF3C4]/60 rounded-xs flex items-center justify-center shadow-inner">
                  <span className="text-[8px] sm:text-[9px] font-mono-tech font-semibold uppercase tracking-[0.24em] text-[#141518]">
                    SAQIB VISUALS &nbsp;·&nbsp; FLAGSHIP MALL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- COMPACT MOBILE 4-WING GLASS SHOWCASE STRIP (< md) ---------- */}
          <div className="md:hidden shrink-0 bg-[#12141A]/95 border-2 border-[#D4AF37]/55 rounded-xl p-2 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-[#D4AF37]/25">
              <span className="text-[8px] font-mono-tech uppercase tracking-[0.2em] text-[#F5D77F] font-semibold">
                STOREFRONT SHOWCASE WINDOWS · TAP ANY WING
              </span>
              <span className="text-[8px] font-mono-tech text-stone-400">4 WALLS</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {mobileShowcaseWings.map((w) => (
                <button
                  key={w.code}
                  type="button"
                  onClick={() => triggerEnter(w.wall, false)}
                  className="bg-gradient-to-b from-[#25211B] to-[#15161B] border border-[#D4AF37]/45 active:border-[#F5D77F] rounded-lg p-1.5 flex flex-col items-center text-center cursor-pointer"
                >
                  <div
                    className="w-full h-11 rounded flex items-center justify-center p-1 overflow-hidden"
                    style={{ backgroundColor: w.bg }}
                  >
                    <img
                      src={w.img}
                      alt={w.item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[7px] font-mono-tech font-bold uppercase tracking-wider text-[#F5D77F] mt-1 truncate w-full">
                    {w.code}
                  </span>
                  <span className="text-[8px] font-mono-tech text-stone-300">
                    {formatCurrency(w.item.price, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ---------- RIGHT GLASS SHOWCASE WINDOW (DESKTOP/TABLET md+) ---------- */}
          <div className="hidden md:flex flex-1 bg-[#12141A]/95 border-y-4 border-r-4 border-[#1F222B] p-2.5 lg:p-3.5 flex-col justify-between relative overflow-hidden shadow-inner">
            <div className="relative flex-1 border border-[#D4AF37]/45 bg-gradient-to-b from-[#231F1A]/95 via-[#17181E]/95 to-[#121317]/95 p-3 lg:p-4 flex flex-col justify-between overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 26% 0%, rgba(255,220,145,0.24) 0%, transparent 60%), radial-gradient(ellipse at 72% 0%, rgba(255,220,145,0.26) 0%, transparent 60%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-y-10 left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent rotate-12"
              />

              <div className="relative z-10 flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
                <span className="text-[10px] font-mono-tech uppercase tracking-[0.22em] text-[#E6C665]">
                  WINDOW II &nbsp;·&nbsp; BAGS &amp; HEADWEAR
                </span>
                <span className="text-[10px] font-mono-tech text-stone-400">
                  WALL 03 &amp; 04
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 my-auto py-2">
                <button
                  type="button"
                  onClick={() => triggerEnter(2, false)}
                  className="group relative bg-gradient-to-b from-[#2B2620] to-[#17181D] border border-[#D4AF37]/40 hover:border-[#F5D77F] rounded-lg p-2.5 flex flex-col items-center text-left transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer shadow-lg"
                >
                  <div className="w-full aspect-[4/4.2] rounded bg-[#F4EFE8] relative overflow-hidden flex items-center justify-center p-2.5">
                    <img
                      src={featuredBag.photoUrl}
                      alt={featuredBag.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.28)] group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={secondaryBag.photoUrl}
                      alt={secondaryBag.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain absolute bottom-1.5 right-1.5 bg-white/90 rounded p-0.5 border border-stone-300 shadow-sm"
                    />
                  </div>
                  <div className="w-full mt-2">
                    <div className="text-[9px] font-mono-tech uppercase tracking-wider text-[#E6C665]">
                      03 · LUXURY BAGS
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5">
                      {featuredBag.shortLabel}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono-tech text-stone-300">
                      <span>{formatCurrency(featuredBag.price, currency)}</span>
                      <span className="text-[#E6C665] group-hover:translate-x-0.5 transition-transform">
                        Enter &rarr;
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerEnter(3, false)}
                  className="group relative bg-gradient-to-b from-[#2B2620] to-[#17181D] border border-[#D4AF37]/40 hover:border-[#F5D77F] rounded-lg p-2.5 flex flex-col items-center text-left transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer shadow-lg"
                >
                  <div className="w-full aspect-[4/4.2] rounded bg-[#EFECE6] relative overflow-hidden flex items-center justify-center p-2.5">
                    <img
                      src={featuredCap.photoUrl}
                      alt={featuredCap.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.28)] group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={secondaryCap.photoUrl}
                      alt={secondaryCap.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain absolute bottom-1.5 right-1.5 bg-white/90 rounded p-0.5 border border-stone-300 shadow-sm"
                    />
                  </div>
                  <div className="w-full mt-2">
                    <div className="text-[9px] font-mono-tech uppercase tracking-wider text-[#E6C665]">
                      04 · HEADWEAR CAPS
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5">
                      {featuredCap.shortLabel}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono-tech text-stone-300">
                      <span>{formatCurrency(featuredCap.price, currency)}</span>
                      <span className="text-[#E6C665] group-hover:translate-x-0.5 transition-transform">
                        Enter &rarr;
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative z-10 border-t border-[#D4AF37]/25 pt-2 flex items-center justify-between text-[10px] font-mono-tech text-stone-400">
                <span>ITALIAN CALFSKIN &amp; STUDIO CAPS</span>
                <span className="text-[#D4AF37]">6 BAGS · 4 CAPS</span>
              </div>
            </div>
          </div>

          {/* Right Fluted Obsidian Pillar (Tablet/Desktop) */}
          <div className="hidden sm:flex w-5 lg:w-7 bg-gradient-to-l from-[#0B0C0F] via-[#1B1D24] to-[#0E1014] border-l border-r border-[#D4AF37]/30 flex-col justify-between py-4 items-center shrink-0">
            <div className="w-1.5 h-full border-x border-white/10" />
          </div>
        </div>

        {/* ==================== 3. SIDEWALK PAVEMENT APRON & POTTED PLANTERS ==================== */}
        <div className="relative z-20 w-full max-w-[1380px] mx-auto px-2 sm:px-6 shrink-0">
          <div
            aria-hidden="true"
            className="pointer-events-none hidden sm:flex items-end justify-between px-4 -mb-2 relative z-30"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-10 rounded-full bg-gradient-to-b from-[#3A5A36] via-[#274024] to-[#192B17] border border-[#527A4D]/50 shadow-lg -mb-2" />
              <div className="w-24 h-8 bg-gradient-to-b from-[#2A2C33] to-[#17181D] border-t-2 border-[#D4AF37]/50 rounded-b-md shadow-xl" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-10 rounded-full bg-gradient-to-b from-[#3A5A36] via-[#274024] to-[#192B17] border border-[#527A4D]/50 shadow-lg -mb-2" />
              <div className="w-24 h-8 bg-gradient-to-b from-[#2A2C33] to-[#17181D] border-t-2 border-[#D4AF37]/50 rounded-b-md shadow-xl" />
            </div>
          </div>

          {/* Stone Sidewalk Threshold */}
          <div className="w-full h-7 sm:h-11 bg-gradient-to-b from-[#282624] via-[#1C1B1A] to-[#121212] border-t-2 border-[#D4AF37]/60 flex items-center justify-between px-3 sm:px-10 text-[8px] sm:text-[10px] font-mono-tech text-stone-400 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(255,220,145,0.28) 0%, transparent 70%)',
              }}
            />
            <span className="relative z-10 hidden sm:inline">
              SAQIB VISUALS FLAGSHIP EXTERIOR
            </span>
            <span className="relative z-10 mx-auto sm:mx-0 text-[#E6C665] truncate">
              TAP CENTRAL DOOR OR ANY SHOWCASE WINDOW TO ENTER
            </span>
            <span className="relative z-10 hidden sm:inline">
              4 WALLS &nbsp;·&nbsp; 23 ARCHIVE PIECES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
