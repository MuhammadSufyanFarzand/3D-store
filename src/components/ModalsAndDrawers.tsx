import React, { useState } from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { CartItem, PRODUCTS, Product, formatCurrency } from '../data/products';
import { MiniGarmentIcon } from './MiniGarmentIcon';

/* ============================================================================
 * 1. LEFT NAVIGATION MENU DRAWER
 * ==========================================================================*/
interface MenuDrawerProps {
  isOpen: boolean;
  activeIndex: number;
  reducedMotion: boolean;
  onClose: () => void;
  onJumpToGarment: (index: number) => void;
  onToggleReducedMotion: () => void;
  onOpenSearch: () => void;
  onOpenSizeGuide: () => void;
  onOpenBrandHub?: (section: 'about' | 'faqs' | 'contact' | 'footer') => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  activeIndex,
  reducedMotion,
  onClose,
  onJumpToGarment,
  onToggleReducedMotion,
  onOpenSearch,
  onOpenSizeGuide,
  onOpenBrandHub,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/55"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Collection navigation menu"
        className="dark-drawer-surface fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[88vw] border-r flex flex-col justify-between p-6 sm:p-7 text-white overflow-y-auto custom-scroll"
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono-tech text-xs tracking-widest uppercase text-[#F5D77F]">
              SAQIB VISUALS · Index
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Hanging garments list" className="space-y-2 max-h-[38vh] overflow-y-auto custom-scroll pr-1">
            {PRODUCTS.map((prod, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    onJumpToGarment(idx);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-lg transition ${
                    isCurrent
                      ? 'bg-[#E85D2A] text-white font-semibold'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-sm truncate">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}. {prod.title}
                  </span>
                  <span className="text-xs font-mono-tech opacity-85 ml-2 shrink-0">
                    ${prod.price}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 pt-5 border-t border-white/12 space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="w-full text-left text-xs font-mono-tech text-white/80 hover:text-[#F5D77F] py-1.5 transition cursor-pointer"
            >
              Search &amp; Filter Collection
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSizeGuide();
              }}
              className="w-full text-left text-xs font-mono-tech text-white/80 hover:text-[#F5D77F] py-1.5 transition cursor-pointer"
            >
              Interactive Size &amp; Fit Guide
            </button>

            {onOpenBrandHub && (
              <div className="pt-3 mt-2 border-t border-[#D4AF37]/25 space-y-1.5">
                <div className="text-[10px] font-mono-tech uppercase tracking-[0.2em] text-[#D4AF37] mb-1">
                  Atelier &amp; Client Concierge
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBrandHub('about');
                  }}
                  className="w-full text-left text-xs font-mono-tech text-[#F5D77F] hover:underline py-1 transition cursor-pointer"
                >
                  01 · About SAQIB VISUALS Atelier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBrandHub('faqs');
                  }}
                  className="w-full text-left text-xs font-mono-tech text-white/85 hover:text-[#F5D77F] py-1 transition cursor-pointer"
                >
                  02 · FAQs, Shipping &amp; Garment Care
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBrandHub('contact');
                  }}
                  className="w-full text-left text-xs font-mono-tech text-white/85 hover:text-[#F5D77F] py-1 transition cursor-pointer"
                >
                  03 · Contact Private Concierge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBrandHub('footer');
                  }}
                  className="w-full text-left text-xs font-mono-tech text-white/85 hover:text-[#F5D77F] py-1 transition cursor-pointer"
                >
                  04 · Flagship Directory &amp; VIP List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Accessibility & Physics Motion Toggle */}
        <div className="border-t border-white/15 pt-5 mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80">Reduced Motion Mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={onToggleReducedMotion}
              className={`px-3 py-1 rounded text-xs font-mono-tech transition ${
                reducedMotion
                  ? 'bg-[#E85D2A] text-white'
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              }`}
            >
              {reducedMotion ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="text-[11px] text-white/55 font-mono-tech">
            SAQIB VISUALS · Flagship Virtual Mall
          </div>
        </div>
      </aside>
    </>
  );
};

/* ============================================================================
 * 2. SEARCH & FILTER ARCHIVE MODAL
 * ==========================================================================*/
interface SearchModalProps {
  isOpen: boolean;
  currency: 'EUR' | 'USD';
  onClose: () => void;
  onSelectGarment: (index: number, openQuickViewImmediately: boolean) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  currency,
  onClose,
  onSelectGarment,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = PRODUCTS.map((product, index) => ({ product, index })).filter(
    ({ product }) => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'hoodie' &&
          (product.type === 'hoodie' ||
            product.type === 'hoodie-weirdo' ||
            product.type === 'hoodie-atheist')) ||
        product.type === filterType;

      const matchesQuery =
        query.trim() === '' ||
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.details.toLowerCase().includes(query.toLowerCase());

      return matchesType && matchesQuery;
    }
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search streetwear archive"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-[#F6F2EC] text-stone-900 rounded-xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[86vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
            Search Archive
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input + Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hoodies, crewnecks, jerseys, 480GSM..."
              aria-label="Search pieces by name or fabric"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
          <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-lg">
            {[
              { id: 'all', label: `All (${PRODUCTS.length})` },
              { id: 'hoodie', label: 'Sweats' },
              { id: 'crewneck', label: 'Shirts' },
              { id: 'blazer', label: 'Jackets' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-tech transition whitespace-nowrap shrink-0 ${
                  filterType === tab.id
                    ? 'bg-[#181716] text-white'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="overflow-y-auto custom-scroll grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-10 text-center text-xs text-stone-500 font-mono-tech">
              No archive pieces match "{query}".
            </div>
          ) : (
            filtered.map(({ product, index }) => (
              <div
                key={product.id}
                className="bg-white border border-stone-200/90 rounded-lg p-3.5 flex items-center gap-3.5 hover:border-stone-400 transition"
              >
                <div className="w-14 h-16 rounded bg-stone-100 flex items-center justify-center shrink-0">
                  <MiniGarmentIcon
                    type={product.type}
                    primaryColor={product.colors[0].primary}
                    secondaryColor={product.colors[0].secondary}
                    ribColor={product.colors[0].rib}
                    photoUrl={product.photoUrl}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono-tech text-stone-500 truncate">
                    {product.category}
                  </div>
                  <div className="text-xs font-semibold text-stone-900 truncate">
                    {product.title}
                  </div>
                  <div className="text-xs font-mono-tech text-stone-700 mt-0.5">
                    {formatCurrency(product.price, currency)} · {product.gsm}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGarment(index, false);
                        onClose();
                      }}
                      className="text-[11px] font-mono-tech text-stone-700 hover:text-stone-950 underline"
                    >
                      View on Wire
                    </button>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGarment(index, true);
                        onClose();
                      }}
                      className="text-[11px] font-mono-tech text-[#E85D2A] font-medium hover:underline"
                    >
                      Inspect 3D
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. INTERACTIVE SIZE & FIT GUIDE MODAL (CM / IN Toggle)
 * ==========================================================================*/
interface SizeGuideModalProps {
  isOpen: boolean;
  product: Product;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  product,
  selectedSize,
  onSelectSize,
  onClose,
}) => {
  const [unit, setUnit] = useState<'CM' | 'IN'>('CM');

  if (!isOpen) return null;

  const formatVal = (cm: number) =>
    unit === 'CM' ? `${cm} cm` : `${(cm / 2.54).toFixed(1)} in`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Size guide for ${product.title}`}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-[#F6F2EC] text-stone-900 rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[11px] font-mono-tech text-stone-500">
              {product.fit} · {product.gsm}
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900">
              {product.title} — Size Chart
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between my-4">
          <p className="text-xs text-stone-600">
            Click a row to select your size. Model is 186cm / 6'1" wearing Size L.
          </p>
          <div className="inline-flex bg-stone-200 p-0.5 rounded-md">
            {(['CM', 'IN'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-2.5 py-1 rounded text-xs font-mono-tech transition ${
                  unit === u ? 'bg-[#181716] text-white' : 'text-stone-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-stone-300 rounded-lg bg-white">
          <table className="w-full text-left border-collapse text-xs font-mono-tech">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100 text-stone-600">
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Chest</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">Shoulder</th>
                <th className="py-2.5 px-3">Sleeve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {product.measurements.map((row) => {
                const isSelected = row.size === selectedSize;
                return (
                  <tr
                    key={row.size}
                    onClick={() => onSelectSize(row.size)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#E85D2A]/15 font-semibold text-stone-950'
                        : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold">
                      {row.size} {isSelected && '✓'}
                    </td>
                    <td className="py-2.5 px-3">{formatVal(row.chestCm)}</td>
                    <td className="py-2.5 px-3">{formatVal(row.lengthCm)}</td>
                    <td className="py-2.5 px-3">{formatVal(row.shoulderCm)}</td>
                    <td className="py-2.5 px-3">{formatVal(row.sleeveCm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#181716] hover:bg-stone-800 text-white text-xs font-mono-tech uppercase tracking-wider px-5 py-2.5 rounded-md transition"
          >
            Confirm Size ({selectedSize})
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. EXPRESS CHECKOUT MODAL
 * ==========================================================================*/
interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  currency: 'EUR' | 'USD';
  onClose: () => void;
  onCompleteOrder: (email: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  currency,
  onClose,
  onCompleteOrder,
}) => {
  const [email, setEmail] = useState('collector@saqibvisuals.studio');
  const [name, setName] = useState('Julian Vermeer');
  const [address, setAddress] = useState('Keizersgracht 482, 1017 EG Amsterdam');
  const [orderCompletedId, setOrderCompletedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost = subtotal >= 100 || subtotal === 0 ? 0 : 12;
  const total = subtotal + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNum = `SQB-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderCompletedId(orderNum);
    setTimeout(() => {
      onCompleteOrder(email);
      setOrderCompletedId(null);
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SAQIB VISUALS Express Checkout"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-[#F6F2EC] text-stone-900 rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-600"
        >
          <X className="w-4 h-4" />
        </button>

        {orderCompletedId ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#E85D2A] mx-auto" />
            <div className="font-mono-tech text-xs text-stone-500">
              Order #{orderCompletedId} Confirmed
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900">
              Preparing Studio Dispatch
            </h3>
            <p className="text-xs text-stone-600 max-w-xs mx-auto">
              Receipt and DHL Express tracking link sent to {email}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="font-mono-tech text-[11px] uppercase tracking-widest text-[#E85D2A] mb-1">
              SAQIB VISUALS Express Checkout
            </div>
            <h2 className="font-display text-xl font-bold mb-1">Order Summary</h2>
            <p className="text-xs text-stone-600 mb-4">
              {cart.reduce((s, i) => s + i.qty, 0)} piece(s) reserved ·{' '}
              {shippingCost === 0 ? 'Free DHL Express Shipping' : `Shipping: ${formatCurrency(shippingCost, currency)}`}
            </p>

            <div className="bg-white border border-stone-200 rounded-lg p-3 mb-4 space-y-1.5 text-xs font-mono-tech">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Express Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost, currency)}</span>
              </div>
              <div className="flex justify-between text-stone-950 font-semibold pt-1.5 border-t border-stone-200">
                <span>Total ({currency})</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label htmlFor="checkout-name" className="block text-stone-600 mb-1 font-medium">
                  Full Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <label htmlFor="checkout-email" className="block text-stone-600 mb-1 font-medium">
                  Email Address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <label htmlFor="checkout-address" className="block text-stone-600 mb-1 font-medium">
                  Delivery Address
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded border border-stone-300 bg-white text-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E85D2A] hover:bg-[#d44e1d] text-white font-mono-tech text-xs font-semibold uppercase tracking-widest py-3.5 rounded transition"
            >
              Complete Order · {formatCurrency(total, currency)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
