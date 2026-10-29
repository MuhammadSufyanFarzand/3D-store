import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Product, formatCurrency } from '../data/products';
import {
  renderLookbookPortraitCanvas,
  renderMacroFabricCanvas,
} from '../three/proceduralTextures';

interface QuickViewOverlayProps {
  isOpen: boolean;
  product: Product;
  slideIndex: number;
  selectedColorIdx: number;
  selectedSize: string;
  selectedQty: number;
  currency: 'EUR' | 'USD';
  qvZoom: number;
  onClose: () => void;
  onSlideChange: (newSlide: number) => void;
  onSelectColor: (colorIdx: number) => void;
  onSelectSize: (size: string) => void;
  onChangeQty: (qty: number) => void;
  onAddToBag: () => void;
  onInstantBuy: () => void;
  onOpenSizeGuide: () => void;
  onResetOrbit: () => void;
  onChangeZoom: (zoom: number) => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const QuickViewOverlay: React.FC<QuickViewOverlayProps> = ({
  isOpen,
  product,
  slideIndex,
  selectedColorIdx,
  selectedSize,
  selectedQty,
  currency,
  qvZoom,
  onClose,
  onSlideChange,
  onSelectColor,
  onSelectSize,
  onChangeQty,
  onAddToBag,
  onInstantBuy,
  onOpenSizeGuide,
  onResetOrbit,
  onChangeZoom,
}) => {
  const lookbookCanvasRef = useRef<HTMLCanvasElement>(null);
  const macroCanvasRef = useRef<HTMLCanvasElement>(null);
  const [macroZoom, setMacroZoom] = useState<number>(1);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && slideIndex === 1 && lookbookCanvasRef.current) {
      renderLookbookPortraitCanvas(lookbookCanvasRef.current, product, selectedColorIdx);
    }
    if (isOpen && slideIndex === 2 && macroCanvasRef.current) {
      renderMacroFabricCanvas(macroCanvasRef.current, product, selectedColorIdx, macroZoom);
    }
  }, [isOpen, slideIndex, product, selectedColorIdx, macroZoom]);

  if (!isOpen) return null;

  const currentColor = product.colors[selectedColorIdx] || product.colors[0];

  const isAccessory = Boolean(product.isShoe || product.isBag || product.isCap);

  const slideLabels = [
    isAccessory ? '01 / 360° 3D Turntable View' : '01 / 360° 3D Hanger View',
    isAccessory ? '02 / Studio Craftsmanship Close-Up' : '02 / Studio Collar & Pocket Detail',
    `03 / ${product.gsm}`,
  ];

  const accordions = [
    { title: 'Details', content: product.details },
    { title: 'Fabric & care', content: product.fabricCare },
    { title: 'Size & fit', content: product.sizeFit },
    { title: 'Shipping & returns', content: product.shippingReturns },
  ];

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="qv-product-title"
      className="fixed inset-0 z-20 pointer-events-none flex flex-col lg:flex-row items-center justify-between px-0 sm:px-6 lg:px-14 pt-13 sm:pt-16 pb-0 lg:pb-8 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Top (Mobile 38dvh) / Left Half (Desktop): Interactive 3-Slide Product Showcase */}
      <div className="relative w-full lg:w-[50%] h-[36dvh] sm:h-[42dvh] lg:h-full flex items-center justify-center shrink-0 px-2">
        {/* Previous Media Slide Button */}
        <button
          type="button"
          onClick={() => onSlideChange((slideIndex + 2) % 3)}
          aria-label="Previous product view"
          className="hud-nav-arrow pointer-events-auto absolute left-2 sm:left-4 z-30 !w-9 !h-9 sm:!w-11 sm:!h-11"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Slide 1: High-Res Photographic Collar, Wooden Hanger, Pearl Placket & Flap Pocket Close-Up */}
        {slideIndex === 1 && (
          <div className="pointer-events-auto relative w-[180px] sm:w-[310px] lg:w-[410px] h-[200px] sm:h-[360px] lg:h-[510px] flex items-center justify-center z-20">
            <canvas
              ref={lookbookCanvasRef}
              width={640}
              height={640}
              className="w-full h-full object-contain drop-shadow-[0_24px_38px_rgba(20,8,6,0.35)]"
              aria-label={`Studio close-up of ${product.title} in ${currentColor.name}`}
            />
            <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#181716]/85 border border-white/25 px-3.5 py-1 rounded-full text-[10px] font-mono-tech uppercase tracking-widest text-white/95 whitespace-nowrap">
              Studio Close-Up · Collar, Pearl Buttons &amp; Flap Pockets
            </div>
          </div>
        )}

        {/* Slide 2: High-Detail Macro Fabric Knit Texture Swatch */}
        {slideIndex === 2 && (
          <div className="pointer-events-auto relative flex flex-col items-center justify-center z-20">
            <div className="relative w-[165px] sm:w-[260px] lg:w-[340px] h-[185px] sm:h-[300px] lg:h-[420px] rounded-sm overflow-hidden border border-white/40 shadow-2xl transition-transform duration-300 -rotate-2 hover:rotate-0">
              <canvas
                ref={macroCanvasRef}
                width={500}
                height={620}
                className="w-full h-full object-cover"
                aria-label={`${product.gsm} macro fabric knit texture in ${currentColor.name}`}
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-[#181716]/90 text-white text-[10px] sm:text-[11px] font-mono-tech px-2.5 py-1 rounded">
                <span className="truncate">{product.gsm}</span>
                <button
                  type="button"
                  onClick={() => setMacroZoom((z) => (z === 1 ? 1.6 : 1))}
                  className="underline hover:text-[#E85D2A] transition ml-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {macroZoom === 1 ? '2x Loupe' : '1x Reset'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Next Media Slide Button */}
        <button
          type="button"
          onClick={() => onSlideChange((slideIndex + 1) % 3)}
          aria-label="Next product view"
          className="hud-nav-arrow pointer-events-auto absolute right-2 sm:right-4 z-30 !w-9 !h-9 sm:!w-11 sm:!h-11"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Bottom Docked 3D Controls + Media Pagination Dots (Never overlaps the 3D shoe/garment) */}
        <div className="pointer-events-auto absolute bottom-1 sm:bottom-2 lg:bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-30 w-max max-w-[92vw]">
          {slideIndex === 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#141312]/90 backdrop-blur-md border border-[#D4AF37]/45 rounded-full px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono-tech text-[#F7F3EB] shadow-lg">
              <span className="text-[#F5D77F] font-semibold">Drag 3D to rotate</span>
              <span aria-hidden="true" className="text-white/35">
                ·
              </span>
              <button
                type="button"
                onClick={() => onChangeZoom(Math.max(0.8, Number((qvZoom - 0.15).toFixed(2))))}
                aria-label="Zoom out 3D model"
                className="p-1 hover:text-[#D4AF37] transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeZoom(Math.min(1.45, Number((qvZoom + 0.15).toFixed(2))))}
                aria-label="Zoom in 3D model"
                className="p-1 hover:text-[#D4AF37] transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onResetOrbit}
                aria-label="Reset 3D rotation"
                className="p-1 hover:text-[#D4AF37] transition cursor-pointer"
                title="Reset 3D Angle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#141312]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-md">
            <span className="hidden sm:inline text-[10px] font-mono-tech text-[#F5D77F] tracking-wider pr-1 border-r border-white/20">
              {slideLabels[slideIndex]}
            </span>
            <div role="tablist" aria-label="Product view modes" className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === idx}
                  aria-label={slideLabels[idx]}
                  onClick={() => onSlideChange(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    slideIndex === idx ? 'w-5 bg-[#D4AF37]' : 'w-2 bg-white/40 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet (Mobile 60dvh) / Right Half (Desktop): Cream Off-White Product Detail Card (#F6F2EC) */}
      <div className="pointer-events-auto w-full lg:w-[46%] max-w-[540px] h-[60dvh] sm:h-[55dvh] lg:h-[84vh] max-h-[680px] flex items-end lg:items-center justify-center shrink-0">
        <div className="product-detail-card relative w-full h-full rounded-t-3xl lg:rounded-xl px-4 pt-3 pb-7 sm:p-7 lg:p-8 overflow-y-auto custom-scroll border-t-2 border-[#D4AF37]/60 lg:border-t-0">
          {/* Mobile Bottom-Sheet Grab Handle Bar */}
          <div
            aria-hidden="true"
            className="lg:hidden w-11 h-1.5 bg-stone-300 rounded-full mx-auto mb-2.5"
          />

          {/* Close Button (X) — 44x44px Mobile Touch Target */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Quick View and return to showroom"
            className="absolute top-2.5 right-3 sm:top-4 sm:right-4 w-11 h-11 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 bg-stone-200/60 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Unboxed Metadata Breadcrumb */}
          <div className="font-mono-tech text-[10px] sm:text-[11px] tracking-wider text-stone-600 mb-0.5 pr-12">
            <span>{product.category}</span>
            <span aria-hidden="true"> · </span>
            <span>{product.fit}</span>
          </div>

          {/* Product Title & Price */}
          <h2
            id="qv-product-title"
            className="font-display text-lg sm:text-2xl font-bold tracking-tight text-stone-900 pr-12 leading-snug"
          >
            {product.title}
          </h2>
          <div className="text-sm sm:text-base font-mono-tech font-semibold text-stone-800 mt-0.5 mb-3.5 sm:mb-5">
            {formatCurrency(product.price, currency)}
          </div>

          {/* Color Swatches Row */}
          <div className="mb-4 sm:mb-5">
            <div className="text-xs font-mono-tech text-stone-600 mb-2">
              Color: <span className="text-stone-950 font-semibold">{currentColor.name}</span>
            </div>
            <div
              className="flex flex-wrap items-center gap-3"
              role="radiogroup"
              aria-label="Select garment color"
            >
              {product.colors.map((c, idx) => {
                const isSelected = idx === selectedColorIdx;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={c.name}
                    onClick={() => onSelectColor(idx)}
                    className={`w-9 h-9 rounded-full transition transform flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-stone-900 scale-105'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    } border border-black/25`}
                    style={{ backgroundColor: c.primary }}
                    title={c.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Dark Pill Size Selector Bar (#181716 with orange active button #E85D2A) */}
          <div className="mb-4 sm:mb-5">
            <div className="flex items-center justify-between text-xs font-mono-tech text-stone-600 mb-2">
              <span>Select Size</span>
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="underline text-stone-800 hover:text-[#E85D2A] transition py-0.5 cursor-pointer"
              >
                Size Chart (CM / IN)
              </button>
            </div>
            <div
              role="radiogroup"
              aria-label="Select garment size"
              className="bg-[#1A1918] text-stone-300 rounded-full p-1 sm:p-1.5 flex items-center justify-between shadow-inner"
            >
              {SIZES.map((sz) => {
                const active = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelectSize(sz)}
                    className={`flex-1 h-9 sm:w-10 sm:flex-initial rounded-full text-xs font-mono-tech font-medium flex items-center justify-center transition cursor-pointer ${
                      active
                        ? 'bg-[#E85D2A] text-white shadow'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row: Orange ADD TO BAG (- 1 +) & Dark BUY */}
          <div className="grid grid-cols-12 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
            <div className="col-span-8 bg-[#E85D2A] hover:bg-[#d6501f] text-white rounded-xl sm:rounded-md flex items-center justify-between px-3 sm:px-3.5 py-2 min-h-[44px] transition shadow-sm">
              <button
                type="button"
                onClick={onAddToBag}
                className="text-xs font-mono-tech font-semibold tracking-wider uppercase flex-1 text-left py-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Add to Bag
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/30 pl-2 sm:pl-2.5 text-xs font-mono-tech">
                <button
                  type="button"
                  onClick={() => onChangeQty(Math.max(1, selectedQty - 1))}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 flex items-center justify-center hover:bg-black/15 rounded transition cursor-pointer"
                >
                  −
                </button>
                <span className="w-4 text-center" aria-live="polite">
                  {selectedQty}
                </span>
                <button
                  type="button"
                  onClick={() => onChangeQty(selectedQty + 1)}
                  aria-label="Increase quantity"
                  className="w-7 h-7 flex items-center justify-center hover:bg-black/15 rounded transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onInstantBuy}
              className="col-span-4 bg-[#1A1918] hover:bg-stone-800 text-white rounded-xl sm:rounded-md text-xs font-mono-tech font-semibold tracking-wider uppercase py-2.5 min-h-[44px] transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buy
            </button>
          </div>

          {/* Full Details Trigger */}
          <div className="text-center mb-3">
            <button
              type="button"
              onClick={() => setOpenAccordion(openAccordion === 0 ? null : 0)}
              className="font-mono-tech text-[11px] tracking-widest uppercase text-stone-600 underline hover:text-stone-950 transition py-1 cursor-pointer"
            >
              Full Details
            </button>
          </div>

          {/* Expandable Accordion Sections */}
          <div className="border-t border-stone-300/90 divide-y divide-stone-300/90 text-xs">
            {accordions.map((acc, idx) => {
              const isOpenAcc = openAccordion === idx;
              return (
                <div key={acc.title} className="py-3">
                  <button
                    type="button"
                    aria-expanded={isOpenAcc}
                    onClick={() => setOpenAccordion(isOpenAcc ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-medium text-stone-800 hover:text-black py-0.5 cursor-pointer"
                  >
                    <span>{acc.title}</span>
                    <span className="font-mono-tech text-stone-600 text-sm">
                      {isOpenAcc ? '−' : '+'}
                    </span>
                  </button>
                  {isOpenAcc && (
                    <div className="text-stone-700 leading-relaxed pt-2.5 text-xs">
                      {acc.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
