import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { CartItem, PRODUCTS, formatCurrency } from '../data/products';
import { MiniGarmentIcon } from './MiniGarmentIcon';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  currency: 'EUR' | 'USD';
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onAddUpsell: (size: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  currency,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onAddUpsell,
  onCheckout,
}) => {
  const [upsellSize, setUpsellSize] = useState<string>('M');

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeShippingThreshold = 100.0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPct = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/55 transition-opacity"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className="dark-drawer-surface fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] border-l flex flex-col justify-between text-white"
      >
        {/* Top Header + Free Shipping Progress Bar */}
        <div className="p-6 pb-4 border-b border-white/12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold tracking-tight">Your cart</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shopping bag"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* €100 Free Shipping Threshold Bar */}
          <div>
            <p className="text-xs text-white/90 mb-2">
              {remainingForFreeShipping > 0 ? (
                <>
                  Add{' '}
                  <span className="font-semibold text-white font-mono-tech">
                    {formatCurrency(remainingForFreeShipping, currency)}
                  </span>{' '}
                  more for Free Shipping
                </>
              ) : (
                <span className="text-[#E85D2A] font-semibold">
                  Complimentary Express Shipping Unlocked
                </span>
              )}
            </p>
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Free shipping threshold progress"
              className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  remainingForFreeShipping === 0 ? 'bg-[#E85D2A]' : 'bg-white'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Middle: Cart Items + Recommended Upsell Card */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-white/60 text-xs font-mono-tech uppercase tracking-widest">
              Your bag is currently empty
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => {
                const matchedProd = PRODUCTS.find((p) => p.id === item.productId);
                const colorObj =
                  matchedProd?.colors[item.colorIndex] || matchedProd?.colors[0];

                return (
                  <div
                    key={`${item.productId}-${item.colorName}-${item.size}`}
                    className="flex items-start gap-4 pb-4 border-b border-white/10"
                  >
                    <div className="w-16 h-20 rounded bg-white/10 p-1.5 flex items-center justify-center shrink-0">
                      <MiniGarmentIcon
                        type={item.type}
                        primaryColor={item.primaryColor}
                        secondaryColor={colorObj?.secondary}
                        ribColor={colorObj?.rib}
                        photoUrl={matchedProd?.photoUrl}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </h3>
                        <span className="text-xs font-mono-tech text-white shrink-0">
                          {formatCurrency(item.price * item.qty, currency)}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono-tech text-white/65 mt-0.5">
                        {formatCurrency(item.price, currency)}
                      </div>
                      <div className="text-[11px] text-white/70 mt-0.5">
                        <span>Color: {item.colorName}</span>
                        <span aria-hidden="true"> · </span>
                        <span>Size: {item.size}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="inline-flex items-center border border-white/25 rounded px-2 py-0.5 text-xs font-mono-tech">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(idx, -1)}
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="px-1.5 py-0.5 text-white/80 hover:text-white"
                          >
                            −
                          </button>
                          <span className="px-2 text-[11px]" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(idx, 1)}
                            aria-label={`Increase quantity of ${item.title}`}
                            className="px-1.5 py-0.5 text-white/80 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          aria-label={`Remove ${item.title} from bag`}
                          className="text-white/55 hover:text-white p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommended For You Upsell Box */}
          <div className="pt-4 border-t border-white/12">
            <h3 className="text-xs font-medium text-white/85 mb-3">
              Recommended for you
            </h3>
            <div className="bg-white/[0.06] border border-white/12 rounded-lg p-3.5 flex flex-col items-center text-center">
              <div className="w-20 h-24 flex items-center justify-center mb-2">
                <MiniGarmentIcon
                  type="hoodie"
                  primaryColor="#232225"
                  secondaryColor="#171618"
                  ribColor="#1D1C1F"
                  className="w-20 h-24"
                />
              </div>
              <div className="w-full text-left mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Hail Hood</span>
                  <span className="text-xs text-white/80 font-mono-tech">
                    {formatCurrency(110.0, currency)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <label htmlFor="upsell-size-select" className="sr-only">
                    Select size for Hail Hood
                  </label>
                  <select
                    id="upsell-size-select"
                    value={upsellSize}
                    onChange={(e) => setUpsellSize(e.target.value)}
                    className="bg-black/50 border border-white/25 rounded px-2.5 py-1.5 text-[11px] text-white font-mono-tech"
                  >
                    <option value="S">Size: S</option>
                    <option value="M">Size: M</option>
                    <option value="L">Size: L</option>
                    <option value="XL">Size: XL</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onAddUpsell(upsellSize)}
                    className="flex-1 bg-white/15 hover:bg-white hover:text-black text-white border border-white/25 rounded py-1.5 px-3 text-[11px] font-mono-tech uppercase tracking-wider transition whitespace-nowrap shrink-0"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Footer: Estimated Total + CHECK OUT button */}
        <div className="p-6 pt-4 border-t border-white/12 bg-black/35">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium text-white/90">Estimated total</span>
            <span className="text-base font-semibold font-mono-tech">
              {formatCurrency(subtotal, currency)} {currency}
            </span>
          </div>
          <p className="text-[11px] text-white/60 mb-4">
            Taxes included and express shipping calculated at checkout.
          </p>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onCheckout}
            className="w-full bg-[#F6F2EC] hover:bg-white disabled:opacity-40 text-stone-950 font-mono-tech text-xs font-semibold uppercase tracking-widest py-3.5 rounded transition shadow-lg"
          >
            Check Out
          </button>
        </div>
      </aside>
    </>
  );
};
