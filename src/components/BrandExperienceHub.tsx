import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  DoorOpen,
  Globe,
  HelpCircle,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export type BrandHubSection = 'about' | 'faqs' | 'contact' | 'footer';

interface BrandExperienceHubProps {
  currency: 'USD' | 'EUR';
  onChangeCurrency: (currency: 'USD' | 'EUR') => void;
  onNavigateWall: (wallIndex: number, overviewMode?: boolean) => void;
  onOpenStorefrontDoor: () => void;
  onOpenSizeGuide: () => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onTriggerToast: (msg: string) => void;
}

interface FaqItem {
  id: string;
  category: 'store' | 'shipping' | 'craft' | 'returns';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'store',
    question: 'How do I navigate the SAQIB VISUALS 3D Flagship Virtual Mall?',
    answer:
      'Use the bottom architectural dock ("Store | Clothing | Caps | Bags | Shoes") or your Left/Right keyboard arrows to rotate smoothly across all 4 walls of the showroom. Click any hanging garment, sneaker, luxury bag, or cap (or its floating price tag) to open the interactive 3D Quick View & Color Customizer.',
  },
  {
    id: 'faq-2',
    category: 'store',
    question: 'How can I inspect 3D garments up close and switch colorways?',
    answer:
      'Click on any item on the hanging rail, shoe shelves, bag cubbies, or cap pedestals to launch the Split Quick-View studio. Inside Quick View, you can rotate the 3D piece 360°, zoom into fabric textures, switch studio colorways in real time, and select your size.',
  },
  {
    id: 'faq-3',
    category: 'craft',
    question: 'What fabrics and materials are used in SAQIB VISUALS pieces?',
    answer:
      'Every garment is crafted from heavyweight 460–480GSM combed organic cotton fleece and structured Japanese technical twill. Our footwear and bags feature full-grain Italian calfskin leather, brushed brass hardware, and reinforced architectural stitching built to last a decade.',
  },
  {
    id: 'faq-4',
    category: 'craft',
    question: 'How do SAQIB VISUALS garments fit, and which size should I choose?',
    answer:
      'Our signature silhouettes feature a relaxed, architectural drop-shoulder cut. For an authentic boxy streetwear drape, take your true size. If you prefer a closer tailored fit, size down one level. You can also launch our interactive Size & Fit Guide anytime.',
  },
  {
    id: 'faq-5',
    category: 'shipping',
    question: 'What are your global delivery timelines and packaging standards?',
    answer:
      'All orders dispatch from our flagship studio within 24–48 hours via DHL Express & FedEx Priority. Domestic orders arrive in 2–3 business days, while international express delivery takes 3–5 business days. Each piece arrives in a collector box with a numbered authenticity card.',
  },
  {
    id: 'faq-6',
    category: 'shipping',
    question: 'Are customs duties and import taxes included in my order?',
    answer:
      'Yes. All orders placed through the SAQIB VISUALS Flagship Virtual Mall ship on a DDP (Delivered Duty Paid) basis to the US, UK, EU, UAE, and Pakistan—meaning there are no surprise customs fees upon arrival.',
  },
  {
    id: 'faq-7',
    category: 'returns',
    question: 'What is your return, exchange, and garment guarantee policy?',
    answer:
      'We offer a complimentary 14-day return and size exchange service on all unworn pieces with original metallic security tags attached. Simply contact our Private Client Concierge below with your order number to receive a prepaid express return label.',
  },
];

const SHOWROOM_WALLS = [
  {
    wallIndex: 0,
    code: 'WALL 01 · NORTH WING',
    title: 'Ready-to-Wear Clothing',
    subtitle: 'Heavyweight 480GSM Hoodies, Structured Shirts & Utility Outerwear',
  },
  {
    wallIndex: 1,
    code: 'WALL 02 · EAST WING',
    title: 'Artisanal Footwear',
    subtitle: 'Sculpted Low-Tops, Vulcanized Suede Runners & Monolith Boots',
  },
  {
    wallIndex: 2,
    code: 'WALL 03 · SOUTH WING',
    title: 'Luxury Leather Bags',
    subtitle: 'Full-Grain Calfskin Totes, Crossbody Satchels & Weekender Duffels',
  },
  {
    wallIndex: 3,
    code: 'WALL 04 · WEST WING',
    title: 'Signature Headwear',
    subtitle: '3D Embroidered Twill Caps, Vintage Washed Crowns & Studio Beanies',
  },
];

const KINETIC_RIBBON_ITEMS = [
  'SAQIB VISUALS ATELIER',
  '3D FLAGSHIP VIRTUAL MALL',
  '480GSM HEAVYWEIGHT FLEECE',
  'ARTISANAL FOOTWEAR',
  'FULL-GRAIN CALFSKIN BAGS',
  'SIGNATURE EMBROIDERED CAPS',
  'WORLDWIDE DDP CONCIERGE',
];

export const BrandExperienceHub: React.FC<BrandExperienceHubProps> = ({
  currency,
  onChangeCurrency,
  onNavigateWall,
  onOpenStorefrontDoor,
  onOpenSizeGuide,
  onOpenCart,
  onOpenSearch,
  onTriggerToast,
}) => {
  const hubRootRef = useRef<HTMLDivElement | null>(null);

  const [faqCategory, setFaqCategory] = useState<
    'all' | 'store' | 'shipping' | 'craft' | 'returns'
  >('all');
  const [openFaqId, setOpenFaqId] = useState<string>('faq-1');

  // Scroll Progress, Parallax Offset & Active Section Spy
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [scrollYOffset, setScrollYOffset] = useState<number>(0);
  const [showSectionSpy, setShowSectionSpy] = useState<boolean>(false);
  const [activeSpySection, setActiveSpySection] = useState<BrandHubSection>('about');

  // Contact Concierge Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('Private Client Styling & Sizing');
  const [contactOrderRef, setContactOrderRef] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Newsletter VIP State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // 1. Live Scroll Progress Bar, Kinetic Marquee Parallax & Active Section Spy
  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const currentY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const pct = Math.min(100, Math.max(0, (currentY / maxScroll) * 100));
        setScrollProgress(pct);
        setScrollYOffset(currentY);
        setShowSectionSpy(currentY > window.innerHeight * 0.45);

        // Determine active section in viewport
        const sectionOrder: { id: string; key: BrandHubSection }[] = [
          { id: 'section-about', key: 'about' },
          { id: 'section-faqs', key: 'faqs' },
          { id: 'section-contact', key: 'contact' },
          { id: 'section-footer', key: 'footer' },
        ];
        const triggerLine = window.innerHeight * 0.42;
        for (let i = sectionOrder.length - 1; i >= 0; i--) {
          const el = document.getElementById(sectionOrder[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerLine) {
              setActiveSpySection(sectionOrder[i].key);
              break;
            }
          }
        }
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // 2. IntersectionObserver for 3D Scroll-Reveal Elements & Gold Line Draws
  useEffect(() => {
    const rootEl = hubRootRef.current;
    if (!rootEl) return;

    const revealTargets = rootEl.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    const goldLines = rootEl.querySelectorAll<HTMLElement>('[data-scroll-line]');

    if (typeof IntersectionObserver === 'undefined') {
      revealTargets.forEach((el) => el.classList.add('scroll-reveal-visible'));
      goldLines.forEach((el) => el.classList.add('scroll-gold-line-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.hasAttribute('data-scroll-reveal')) {
              target.classList.add('scroll-reveal-visible');
            }
            if (target.hasAttribute('data-scroll-line')) {
              target.classList.add('scroll-gold-line-visible');
            }
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealTargets.forEach((el) => observer.observe(el));
    goldLines.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [faqCategory]);

  const scrollToTopShowroom = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPageSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) => faqCategory === 'all' || item.category === faqCategory
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    const randomCode = `SV-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedTicket(randomCode);
    onTriggerToast(`Concierge Inquiry ${randomCode} received by SAQIB VISUALS`);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    onTriggerToast('Welcome to the SAQIB VISUALS Inner Circle');
  };

  // Subtle scroll-linked horizontal shift for the kinetic marquee ribbon & footer wordmark
  const ribbonShiftPx = -((scrollYOffset * 0.22) % 640);
  const blueprintParallaxPx = Math.max(-18, Math.min(18, (scrollYOffset - 700) * -0.03));

  return (
    <div
      ref={hubRootRef}
      id="brand-experience-sections"
      className="relative z-20 w-full bg-[#FAF8F4] text-[#111111] border-t-2 border-[#D4AF37] select-text overflow-hidden"
    >
      {/* =====================================================================
       * TOP FIXED BRUSHED-GOLD SCROLL PROGRESS BAR
       * ===================================================================== */}
      <div
        aria-hidden="true"
        className={`fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none transition-opacity duration-300 ${
          scrollProgress > 2 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-gradient-to-r from-[#8A6414] via-[#F5D77F] to-[#D4AF37] shadow-[0_0_14px_rgba(212,175,55,0.85)] transition-[width] duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* =====================================================================
       * FLOATING RIGHT-EDGE SCROLL SPY NAVIGATION RAIL (DESKTOP)
       * ===================================================================== */}
      <aside
        aria-label="Section Scroll Navigation"
        className={`hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-2 transition-all duration-500 ${
          showSectionSpy
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 translate-x-8 pointer-events-none'
        }`}
      >
        <div className="bg-[#111111]/95 border border-[#D4AF37]/70 rounded-2xl p-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={scrollToTopShowroom}
            className="px-2.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#111111] text-[9px] font-mono-tech font-bold uppercase tracking-widest flex items-center justify-between gap-1.5 hover:brightness-110 transition cursor-pointer"
            title="Return to 3D Showroom"
          >
            <span>3D Store</span>
            <ArrowUp className="w-3 h-3" />
          </button>

          {(
            [
              { key: 'about', num: '01', label: 'About' },
              { key: 'faqs', num: '02', label: 'FAQs' },
              { key: 'contact', num: '03', label: 'Concierge' },
              { key: 'footer', num: '04', label: 'Atelier' },
            ] as const
          ).map((item) => {
            const active = activeSpySection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollToPageSection(`section-${item.key}`)}
                className={`px-2.5 py-1.5 rounded-xl text-left text-[9px] font-mono-tech uppercase tracking-widest flex items-center justify-between gap-2.5 transition cursor-pointer ${
                  active
                    ? 'bg-white/15 text-[#F5D77F] border border-[#D4AF37]/70 font-bold'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.num}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* =====================================================================
       * SCROLL-LINKED KINETIC OBSIDIAN & GOLD ARCHITECTURAL RIBBON
       * ===================================================================== */}
      <div className="relative bg-[#111111] border-b border-[#D4AF37]/65 py-3 overflow-hidden select-none">
        <div
          className="flex items-center gap-8 whitespace-nowrap will-change-transform transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${ribbonShiftPx}px, 0, 0)` }}
        >
          {[...KINETIC_RIBBON_ITEMS, ...KINETIC_RIBBON_ITEMS, ...KINETIC_RIBBON_ITEMS].map(
            (text, idx) => (
              <div key={`${text}-${idx}`} className="inline-flex items-center gap-8 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-mono-tech font-bold uppercase tracking-[0.28em] text-[#F5D77F]">
                  {text}
                </span>
                <span className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37] inline-block" />
              </div>
            )
          )}
        </div>
      </div>

      {/* Subtle Brushed Gold Top Shimmer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-11 inset-x-0 h-36 bg-gradient-to-b from-[#D4AF37]/15 to-transparent"
      />

      <div className="max-w-[1380px] mx-auto px-4 sm:px-12 py-12 sm:py-24 space-y-16 sm:space-y-32">
        {/* ===================================================================
         * SECTION 1: ABOUT SAQIB VISUALS (WHITE, BLACK & GOLD EDITORIAL)
         * =================================================================== */}
        <section id="section-about" className="scroll-mt-20 sm:scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
            {/* Left 7 Columns: Editorial Story & Manifesto */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div
                data-scroll-reveal
                className="scroll-reveal-up inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#D4AF37] text-[#F5D77F] text-[9px] sm:text-[10px] font-mono-tech uppercase tracking-[0.2em] sm:tracking-[0.24em] shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>01 · ABOUT SAQIB VISUALS ATELIER</span>
              </div>

              <h2
                data-scroll-reveal
                style={{ transitionDelay: '90ms' }}
                className="scroll-reveal-up font-display text-2xl sm:text-5xl font-bold tracking-wide text-[#111111] leading-[1.15]"
              >
                Where Heavyweight Craftsmanship Meets{' '}
                <span className="font-editorial italic font-semibold text-3xl sm:text-[54px] bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#8A6414] bg-clip-text text-transparent gold-shimmer-text">
                  3D Spatial Architecture.
                </span>
              </h2>

              {/* Animated Gold Underline Draw */}
              <div
                data-scroll-line
                className="scroll-gold-line h-[2px] w-36 bg-gradient-to-r from-[#111111] via-[#D4AF37] to-transparent"
              />

              <p
                data-scroll-reveal
                style={{ transitionDelay: '160ms' }}
                className="scroll-reveal-up text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl"
              >
                Founded as a multidisciplinary design house and flagship atelier,{' '}
                <strong className="text-[#111111] font-bold border-b border-[#D4AF37]">
                  SAQIB VISUALS
                </strong>{' '}
                reimagines how luxury streetwear is experienced online. Instead of flat, lifeless
                product grids, our Flagship Virtual Mall invites you to step through our
                brass-trimmed entrance door into a four-wall architectural showroom.
              </p>

              <p
                data-scroll-reveal
                style={{ transitionDelay: '220ms' }}
                className="scroll-reveal-up text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl"
              >
                Every garment on our kinetic steel rail, every sculpted sneaker on our illuminated
                east shelves, and every full-grain leather bag in our oak cubbies is engineered with
                obsessive material density—from 480GSM combed organic fleece to brushed brass
                hardware.
              </p>

              {/* 4 Pillar Metrics (Staggered 3D Scroll Reveal + Hover Lift) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                {[
                  { value: '480 GSM', label: 'Heavyweight Fleece' },
                  { value: '4 WINGS', label: '360° Spatial Showroom' },
                  { value: '100%', label: 'Artisanal Craft' },
                  { value: 'DDP GLOBAL', label: 'Express Concierge' },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    data-scroll-reveal
                    style={{ transitionDelay: `${260 + idx * 100}ms` }}
                    className="scroll-reveal-scale luxury-card-hover bg-white border border-[#D4AF37]/55 rounded-xl p-4 shadow-[0_6px_24px_rgba(17,17,17,0.05)] hover:border-[#111111]"
                  >
                    <div className="font-display text-xl sm:text-2xl font-bold text-[#111111]">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-wider text-[#9A741C] font-semibold mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: White, Black & Gold Architectural Blueprint Card with Scroll Parallax */}
            <div
              data-scroll-reveal
              style={{
                transitionDelay: '180ms',
                transform: undefined,
              }}
              className="scroll-reveal-right lg:col-span-5"
            >
              <div
                className="bg-white border-2 border-[#D4AF37]/70 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(17,17,17,0.08)] transition-transform duration-200 ease-out"
                style={{ transform: `translate3d(0, ${blueprintParallaxPx}px, 0)` }}
              >
                <div className="flex items-center justify-between border-b border-[#D4AF37]/35 pb-4">
                  <div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-[0.22em] text-[#9A741C] font-semibold">
                      ARCHITECTURAL BLUEPRINT
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#111111] mt-0.5">
                      Explore All 4 Showroom Wings
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#111111] text-[#F5D77F] border border-[#D4AF37] flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Click any wing below to scroll back up and rotate the 3D showroom camera directly
                  to that collection wall:
                </p>

                <div className="space-y-3">
                  {SHOWROOM_WALLS.map((wall, idx) => (
                    <button
                      key={wall.code}
                      type="button"
                      data-scroll-reveal
                      style={{ transitionDelay: `${260 + idx * 90}ms` }}
                      onClick={() => {
                        onNavigateWall(wall.wallIndex, false);
                        scrollToTopShowroom();
                      }}
                      className="scroll-reveal-up w-full text-left group bg-[#FAF8F4] hover:bg-[#111111] border border-[#D4AF37]/45 hover:border-[#D4AF37] rounded-xl p-3.5 transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <div className="text-[9px] font-mono-tech uppercase tracking-[0.2em] text-[#9A741C] group-hover:text-[#F5D77F] font-semibold">
                          {wall.code}
                        </div>
                        <div className="font-display text-sm font-bold text-[#111111] group-hover:text-white transition">
                          {wall.title}
                        </div>
                        <div className="text-[11px] text-stone-500 group-hover:text-stone-300 mt-0.5">
                          {wall.subtitle}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#111111] group-hover:bg-[#D4AF37] text-[#F5D77F] group-hover:text-[#111111] flex items-center justify-center shrink-0 transition">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#D4AF37]/30">
                  <button
                    type="button"
                    onClick={() => {
                      scrollToTopShowroom();
                      onOpenStorefrontDoor();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tech font-semibold text-[#111111] hover:text-[#9A741C] hover:underline cursor-pointer"
                  >
                    <DoorOpen className="w-3.5 h-3.5 text-[#B38728]" />
                    <span>Step Outside to Exterior Door</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(0, true);
                      scrollToTopShowroom();
                    }}
                    className="text-xs font-mono-tech font-semibold text-[#9A741C] hover:text-[#111111] underline underline-offset-4 cursor-pointer"
                  >
                    360° Room Overview &uarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
         * SECTION 2: INTERACTIVE FAQS & GARMENT CARE (WHITE, BLACK & GOLD)
         * =================================================================== */}
        <section id="section-faqs" className="scroll-mt-24 pt-16 sm:pt-20 relative">
          {/* Animated Gold Section Divider */}
          <div
            data-scroll-line
            className="scroll-gold-line absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#D4AF37] via-[#111111]/40 to-[#D4AF37]"
          />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div data-scroll-reveal className="scroll-reveal-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#D4AF37] text-[#F5D77F] text-[10px] font-mono-tech uppercase tracking-[0.24em] mb-3 shadow-sm">
                <HelpCircle className="w-3 h-3 text-[#D4AF37]" />
                <span>02 · FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#111111] tracking-wide">
                Client Services,{' '}
                <span className="font-editorial italic font-semibold text-3xl sm:text-[42px] text-[#9A741C]">
                  Sizing &amp; 3D Store Guide
                </span>
              </h2>
            </div>

            {/* Category Filter Pills (Horizontally scrollable on mobile, wrapped on desktop) */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '120ms' }}
              className="scroll-reveal-right flex flex-nowrap sm:flex-wrap items-center gap-1.5 bg-white border border-[#D4AF37]/55 p-1.5 rounded-xl shadow-xs overflow-x-auto max-w-full"
            >
              {(
                [
                  { id: 'all', label: 'All Questions' },
                  { id: 'store', label: '3D Store Guide' },
                  { id: 'craft', label: 'Sizing & Materials' },
                  { id: 'shipping', label: 'Shipping & Duties' },
                  { id: 'returns', label: 'Returns' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFaqCategory(cat.id)}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-[11px] font-mono-tech transition cursor-pointer whitespace-nowrap shrink-0 ${
                    faqCategory === cat.id
                      ? 'bg-[#111111] text-[#F5D77F] border border-[#D4AF37] font-semibold shadow-xs'
                      : 'text-stone-700 hover:text-[#111111] hover:bg-[#FAF8F4]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isExpanded = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    data-scroll-reveal
                    style={{ transitionDelay: `${idx * 75}ms` }}
                    className={`scroll-reveal-up rounded-xl border transition ${
                      isExpanded
                        ? 'bg-white border-2 border-[#D4AF37] shadow-[0_12px_32px_rgba(17,17,17,0.07)]'
                        : 'bg-white/90 border-[#D4AF37]/40 hover:border-[#111111]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isExpanded ? '' : faq.id)}
                      aria-expanded={isExpanded}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="px-2 py-0.5 rounded bg-[#111111] text-[#F5D77F] border border-[#D4AF37]/60 text-[11px] font-mono-tech font-bold shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#111111]">
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#9A741C] shrink-0 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-[#111111]' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-[#D4AF37]/25">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right 4 Columns: Care & Interactive Tools Quick Box */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '220ms' }}
              className="scroll-reveal-right luxury-card-hover lg:col-span-4 bg-white border-2 border-[#D4AF37]/65 rounded-2xl p-6 space-y-5 shadow-[0_16px_40px_rgba(17,17,17,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#D4AF37] flex items-center justify-center text-[#F5D77F]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#111111]">
                    Atelier Care &amp; Sizing Tools
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Preserve the structure of your pieces
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/40">
                  <div className="font-bold text-[#111111] mb-0.5 flex items-center justify-between">
                    <span>480GSM Fleece Wash Protocol</span>
                    <span className="text-[9px] font-mono-tech text-[#9A741C] uppercase">
                      CARE 01
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Cold gentle machine wash inside-out. Lay flat on towel to preserve architectural
                    shoulder structure. Never tumble dry high.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/40">
                  <div className="font-bold text-[#111111] mb-0.5 flex items-center justify-between">
                    <span>Calfskin Leather &amp; Suede Care</span>
                    <span className="text-[9px] font-mono-tech text-[#9A741C] uppercase">
                      CARE 02
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Use dry horsehair brush after wear. Store in the included SAQIB VISUALS dust bag
                    away from direct humidity.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="w-full py-3 px-4 rounded-xl bg-[#111111] hover:bg-[#D4AF37] text-[#F5D77F] hover:text-[#111111] border border-[#D4AF37] text-xs font-mono-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Open Interactive Size Guide</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
         * SECTION 3: CONTACT & PRIVATE CLIENT CONCIERGE (WHITE, BLACK & GOLD)
         * =================================================================== */}
        <section id="section-contact" className="scroll-mt-24 pt-16 sm:pt-20 relative">
          {/* Animated Gold Section Divider */}
          <div
            data-scroll-line
            className="scroll-gold-line absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#D4AF37] via-[#111111]/40 to-[#D4AF37]"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
            {/* Left 5 Columns: Direct Atelier Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div
                data-scroll-reveal
                className="scroll-reveal-left inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#D4AF37] text-[#F5D77F] text-[10px] font-mono-tech uppercase tracking-[0.24em] shadow-sm"
              >
                <MessageSquare className="w-3 h-3 text-[#D4AF37]" />
                <span>03 · PRIVATE CLIENT CONCIERGE</span>
              </div>

              <h2
                data-scroll-reveal
                style={{ transitionDelay: '90ms' }}
                className="scroll-reveal-left font-display text-2xl sm:text-4xl font-bold text-[#111111] tracking-wide leading-tight"
              >
                Direct Line to the{' '}
                <span className="bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#8A6414] bg-clip-text text-transparent gold-shimmer-text">
                  SAQIB VISUALS
                </span>{' '}
                <span className="font-editorial italic font-semibold text-3xl sm:text-[42px] text-[#111111]">
                  Atelier.
                </span>
              </h2>

              <p
                data-scroll-reveal
                style={{ transitionDelay: '150ms' }}
                className="scroll-reveal-left text-xs sm:text-sm text-stone-600 leading-relaxed"
              >
                Whether you require bespoke measurements, VIP styling advice, press pull requests, or
                priority order tracking, our studio specialists respond within 2 business hours.
              </p>

              <div className="space-y-3.5 pt-1">
                <div
                  data-scroll-reveal
                  style={{ transitionDelay: '210ms' }}
                  className="scroll-reveal-left luxury-card-hover flex items-start gap-3.5 p-4 rounded-xl bg-white border border-[#D4AF37]/55 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#F5D77F] border border-[#D4AF37] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-wider text-[#9A741C] font-semibold">
                      CONCIERGE &amp; BESPOKE DESK
                    </div>
                    <div className="text-sm font-bold text-[#111111] mt-0.5">
                      concierge@saqibvisuals.com
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Press &amp; Collaborations: press@saqibvisuals.com
                    </div>
                  </div>
                </div>

                <div
                  data-scroll-reveal
                  style={{ transitionDelay: '300ms' }}
                  className="scroll-reveal-left luxury-card-hover flex items-start gap-3.5 p-4 rounded-xl bg-white border border-[#D4AF37]/55 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#F5D77F] border border-[#D4AF37] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-wider text-[#9A741C] font-semibold">
                      VIP WHATSAPP &amp; STUDIO LINE
                    </div>
                    <div className="text-sm font-bold text-[#111111] mt-0.5">
                      +92 (300) 847-2026 &nbsp;·&nbsp; +44 20 7946 0921
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Instant sizing consultation &amp; custom capsule inquiries
                    </div>
                  </div>
                </div>

                <div
                  data-scroll-reveal
                  style={{ transitionDelay: '390ms' }}
                  className="scroll-reveal-left luxury-card-hover flex items-start gap-3.5 p-4 rounded-xl bg-white border border-[#D4AF37]/55 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#F5D77F] border border-[#D4AF37] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono-tech uppercase tracking-wider text-[#9A741C] font-semibold">
                      FLAGSHIP ATELIER &amp; SHOWROOM
                    </div>
                    <div className="text-sm font-bold text-[#111111] mt-0.5">
                      SAQIB VISUALS Design District, Gulberg III / DHA Phase 6
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#B38728]" />
                      <span>Mon – Sun · 10:00 AM – 10:00 PM (PKT / GMT+5)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Columns: Interactive Concierge Form (Crisp White Card with Gold & Black Accents) */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '180ms' }}
              className="scroll-reveal-right lg:col-span-7 bg-white border-2 border-[#D4AF37]/75 rounded-2xl p-6 sm:p-9 shadow-[0_20px_50px_rgba(17,17,17,0.08)]"
            >
              {submittedTicket ? (
                <div className="py-10 px-4 text-center space-y-5">
                  <div className="w-14 h-14 rounded-full bg-[#111111] border-2 border-[#D4AF37] text-[#F5D77F] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono-tech uppercase tracking-[0.25em] text-[#9A741C] font-bold">
                      PRIORITY TICKET #{submittedTicket}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[#111111]">
                      Thank You, {contactName}.
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                      Your message regarding{' '}
                      <strong className="text-[#111111]">{contactTopic}</strong> has been routed to
                      our Senior Client Concierge. A response will be sent to{' '}
                      <span className="underline font-semibold">{contactEmail}</span> shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setContactMessage('');
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#111111] text-[#F5D77F] border border-[#D4AF37] text-xs font-mono-tech font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#111111] transition cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D4AF37]/35 pb-4 mb-2">
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-[#111111]">
                        Dispatch a Concierge Request
                      </h3>
                      <p className="text-xs text-stone-500">
                        Direct message to the SAQIB VISUALS Atelier team
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#111111] text-[#F5D77F] border border-[#D4AF37] flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="concierge-name"
                        className="block text-[11px] font-mono-tech font-semibold uppercase tracking-wider text-[#111111] mb-1.5"
                      >
                        Full Name *
                      </label>
                      <input
                        id="concierge-name"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Saqib Khan"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/60 text-sm text-[#111111] placeholder:text-stone-400 focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="concierge-email"
                        className="block text-[11px] font-mono-tech font-semibold uppercase tracking-wider text-[#111111] mb-1.5"
                      >
                        Email Address *
                      </label>
                      <input
                        id="concierge-email"
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="client@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/60 text-sm text-[#111111] placeholder:text-stone-400 focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="concierge-topic"
                        className="block text-[11px] font-mono-tech font-semibold uppercase tracking-wider text-[#111111] mb-1.5"
                      >
                        Inquiry Subject
                      </label>
                      <select
                        id="concierge-topic"
                        value={contactTopic}
                        onChange={(e) => setContactTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/60 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                      >
                        <option value="Private Client Styling & Sizing">
                          Private Client Styling &amp; Sizing
                        </option>
                        <option value="Order Status & Express Dispatch">
                          Order Status &amp; Express Dispatch
                        </option>
                        <option value="Bespoke / Custom Garment Production">
                          Bespoke / Custom Garment Production
                        </option>
                        <option value="Returns & Size Exchange">Returns &amp; Size Exchange</option>
                        <option value="Press, Editorial & VIP Showroom">
                          Press, Editorial &amp; VIP Showroom
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="concierge-order"
                        className="block text-[11px] font-mono-tech font-semibold uppercase tracking-wider text-[#111111] mb-1.5"
                      >
                        Order Number (Optional)
                      </label>
                      <input
                        id="concierge-order"
                        type="text"
                        value={contactOrderRef}
                        onChange={(e) => setContactOrderRef(e.target.value)}
                        placeholder="#SV-2026-XXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/60 text-sm text-[#111111] placeholder:text-stone-400 focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="concierge-msg"
                      className="block text-[11px] font-mono-tech font-semibold uppercase tracking-wider text-[#111111] mb-1.5"
                    >
                      Your Message *
                    </label>
                    <textarea
                      id="concierge-msg"
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us how we can assist with your piece, sizing, or bespoke request..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#D4AF37]/60 text-sm text-[#111111] placeholder:text-stone-400 focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-stone-500 font-mono-tech text-center sm:text-left">
                      Encrypted Direct Dispatch · Response within 2 hrs
                    </span>
                    <button
                      type="submit"
                      className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#111111] hover:bg-[#D4AF37] text-[#F5D77F] hover:text-[#111111] border border-[#D4AF37] font-mono-tech text-xs font-bold uppercase tracking-widest transition shadow-md cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Concierge</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
         * SECTION 4: LUXURY ARCHITECTURAL FOOTER (WHITE, BLACK & GOLD)
         * =================================================================== */}
        <footer id="section-footer" className="scroll-mt-24 pt-16 pb-6 space-y-12 relative">
          {/* Animated Gold Section Divider */}
          <div
            data-scroll-line
            className="scroll-gold-line absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#111111] via-[#D4AF37] to-[#111111]"
          />

          {/* 4-Column Directory (Staggered Scroll Reveal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
            {/* Col 1 (3 cols): Showroom Wings */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '0ms' }}
              className="scroll-reveal-up lg:col-span-3 space-y-3.5"
            >
              <div className="text-[11px] font-mono-tech font-bold uppercase tracking-[0.22em] text-[#9A741C]">
                01 · 3D SHOWROOM WINGS
              </div>
              <ul className="space-y-2.5 text-xs text-stone-700 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(0, true);
                      scrollToTopShowroom();
                    }}
                    className="hover:text-[#9A741C] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#B38728]" />
                    <span>360° Full Store Overview</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(0, false);
                      scrollToTopShowroom();
                    }}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    North Wall — Ready-to-Wear Clothing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(1, false);
                      scrollToTopShowroom();
                    }}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    East Wall — Artisanal Footwear
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(2, false);
                      scrollToTopShowroom();
                    }}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    South Wall — Luxury Leather Bags
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateWall(3, false);
                      scrollToTopShowroom();
                    }}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    West Wall — Signature Headwear (Caps)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      scrollToTopShowroom();
                      onOpenStorefrontDoor();
                    }}
                    className="text-[#111111] font-bold hover:text-[#9A741C] hover:underline flex items-center gap-1.5 pt-1 cursor-pointer"
                  >
                    <DoorOpen className="w-3.5 h-3.5 text-[#B38728]" />
                    <span>Exterior Storefront Welcome Door</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 2 (3 cols): Client Services & Utilities */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '100ms' }}
              className="scroll-reveal-up lg:col-span-3 space-y-3.5"
            >
              <div className="text-[11px] font-mono-tech font-bold uppercase tracking-[0.22em] text-[#9A741C]">
                02 · CLIENT SERVICES
              </div>
              <ul className="space-y-2.5 text-xs text-stone-700 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToPageSection('section-about')}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    About SAQIB VISUALS Atelier
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToPageSection('section-faqs')}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    FAQs, Shipping &amp; Garment Care
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenSizeGuide}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    Interactive Size &amp; Fit Calculator
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="hover:text-[#9A741C] transition cursor-pointer"
                  >
                    Search &amp; Filter Archive (25 Pieces)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="inline-flex items-center gap-1.5 text-[#111111] font-bold hover:text-[#9A741C] hover:underline pt-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#B38728]" />
                    <span>Open Shopping Bag &amp; Checkout</span>
                  </button>
                </li>
              </ul>

              {/* Currency Selector */}
              <div className="pt-2">
                <div className="inline-flex items-center bg-white border border-[#D4AF37]/60 rounded-full p-0.5 text-[10px] font-mono-tech">
                  {(['USD', 'EUR'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => onChangeCurrency(curr)}
                      className={`px-3 py-1 rounded-full transition cursor-pointer ${
                        currency === curr
                          ? 'bg-[#111111] text-[#F5D77F] font-bold'
                          : 'text-stone-600 hover:text-[#111111]'
                      }`}
                    >
                      {curr === 'USD' ? 'USD ($)' : 'EUR (€)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 3 (2 cols): Socials & Visual Portfolio */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '200ms' }}
              className="scroll-reveal-up lg:col-span-2 space-y-3.5"
            >
              <div className="text-[11px] font-mono-tech font-bold uppercase tracking-[0.22em] text-[#9A741C]">
                03 · SOCIAL ARCHIVE
              </div>
              <ul className="space-y-2.5 text-xs text-stone-700 font-medium">
                {[
                  { name: 'Instagram', handle: '@saqibvisuals' },
                  { name: 'Behance', handle: 'Saqib Visuals Studio' },
                  { name: 'TikTok', handle: '@saqibvisuals.3d' },
                  { name: 'YouTube', handle: 'Runway & 3D Lookbooks' },
                  { name: 'X / Twitter', handle: '@saqibvisuals' },
                ].map((soc) => (
                  <li key={soc.name}>
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerToast(
                          `${soc.name} (${soc.handle}) — Official SAQIB VISUALS Channel`
                        )
                      }
                      className="group flex items-center justify-between w-full hover:text-[#9A741C] transition cursor-pointer"
                    >
                      <span>{soc.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#B38728]" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 (4 cols): VIP Drop List Newsletter (Black & Gold Contrast Card on White Footer) */}
            <div
              data-scroll-reveal
              style={{ transitionDelay: '300ms' }}
              className="scroll-reveal-scale luxury-card-hover lg:col-span-4 bg-[#111111] text-white border-2 border-[#D4AF37] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
            >
              <div className="text-[10px] font-mono-tech uppercase tracking-[0.22em] text-[#F5D77F]">
                04 · THE INNER CIRCLE (VIP DROP ACCESS)
              </div>
              <h4 className="font-display text-lg font-bold text-white leading-snug">
                Private Access to Limited Capsule Releases &amp; 3D Showroom Drops.
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Subscribers receive early private passcodes 24 hours before public storefront doors
                open.
              </p>

              {newsletterSubscribed ? (
                <div className="p-3.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F5D77F] text-xs font-mono-tech flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>You are registered on the SAQIB VISUALS VIP Drop List.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email for VIP access..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white text-xs text-[#111111] placeholder:text-stone-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D77F] hover:brightness-110 text-[#111111] font-mono-tech text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
                  >
                    Join
                  </button>
                </form>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[10px] font-mono-tech text-[#F5D77F]">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#D4AF37]" />
                  Worldwide DDP Shipping
                </span>
                <span>100% Authentic Guarantee</span>
              </div>
            </div>
          </div>

          {/* Oversized Black & Brushed Gold Architectural Wordmark with Scroll Scale Reveal */}
          <div
            data-scroll-reveal
            style={{ transitionDelay: '150ms' }}
            className="scroll-reveal-scale pt-6 border-t border-[#D4AF37]/30 text-center overflow-hidden select-none"
          >
            <div className="font-editorial italic text-xs sm:text-lg text-[#9A741C] tracking-[0.16em] sm:tracking-[0.22em] mb-1">
              Maison d&apos;Architecture &amp; Streetwear Couture
            </div>
            <div className="font-display font-bold text-2xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.14em] sm:tracking-[0.22em] bg-gradient-to-r from-[#111111] via-[#D4AF37] to-[#111111] bg-clip-text text-transparent gold-shimmer-text leading-none py-2">
              SAQIB VISUALS
            </div>
          </div>

          {/* Bottom Legal, Payment Badges & Return to Top */}
          <div
            data-scroll-reveal
            style={{ transitionDelay: '220ms' }}
            className="scroll-reveal-up flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#D4AF37]/35 text-[11px] font-mono-tech text-stone-600 text-center sm:text-left"
          >
            <div>
              © {new Date().getFullYear()}{' '}
              <strong className="text-[#111111]">SAQIB VISUALS</strong>. All Rights Reserved ·
              Flagship 3D Virtual Mall.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {['VISA', 'MASTERCARD', 'APPLE PAY', 'DHL EXPRESS', 'COD AVAILABLE'].map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-0.5 rounded bg-white border border-[#D4AF37]/55 text-[10px] font-semibold text-[#111111]"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={scrollToTopShowroom}
              className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-full bg-[#111111] hover:bg-[#D4AF37] text-[#F5D77F] hover:text-[#111111] border border-[#D4AF37] font-bold transition cursor-pointer"
            >
              <span>Back to 3D Showroom</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
