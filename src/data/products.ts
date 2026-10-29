export type MattingMode =
  | 'navy-overshirt'
  | 'black-street-shirt'
  | 'mustard-patch-shirt'
  | 'varsity-jacket'
  | 'triblock-short-shirt'
  | 'white-life-tee'
  | 'checkered-crewneck'
  | 'shoe-cutout'
  | 'bag-cutout'
  | 'cap-cutout';

export interface ProductColor {
  name: string;
  primary: string;
  secondary: string;
  rib: string;
  inner: string;
  innerTeeColor?: string;
  isOriginalPhoto?: boolean;
  graphicColor?: string;
}

export type GarmentType =
  | 'hoodie'
  | 'hoodie-weirdo'
  | 'hoodie-atheist'
  | 'crewneck'
  | 'tshirt-reign'
  | 'blazer'
  | 'jersey';

export interface Product {
  id: string;
  title: string;
  shortLabel: string;
  category: string;
  price: number;
  type: GarmentType;
  photoUrl: string;
  mattingMode: MattingMode;
  defaultColor: number;
  gsm: string;
  fit: string;
  isShoe?: boolean;
  isBag?: boolean;
  isCap?: boolean;
  shoeTiltRad?: number;
  cropTopRatio?: number;
  graphicText?: string;
  graphicSubtext?: string;
  customFrontImage?: string;
  customSideImage?: string;
  colors: ProductColor[];
  details: string;
  fabricCare: string;
  sizeFit: string;
  shippingReturns: string;
  measurements: {
    size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    chestCm: number;
    lengthCm: number;
    shoulderCm: number;
    sleeveCm: number;
  }[];
}

export interface CartItem {
  productId: string;
  title: string;
  colorName: string;
  colorIndex: number;
  size: string;
  price: number;
  qty: number;
  primaryColor: string;
  photoUrl?: string;
  type: GarmentType;
}

const DEFAULT_MEASUREMENTS = [
  { size: 'XS' as const, chestCm: 114, lengthCm: 71, shoulderCm: 50, sleeveCm: 60 },
  { size: 'S' as const, chestCm: 120, lengthCm: 73, shoulderCm: 52, sleeveCm: 61 },
  { size: 'M' as const, chestCm: 126, lengthCm: 75, shoulderCm: 54, sleeveCm: 62 },
  { size: 'L' as const, chestCm: 132, lengthCm: 77, shoulderCm: 56, sleeveCm: 63 },
  { size: 'XL' as const, chestCm: 138, lengthCm: 79, shoulderCm: 58, sleeveCm: 64 },
  { size: 'XXL' as const, chestCm: 144, lengthCm: 81, shoulderCm: 60, sleeveCm: 65 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'white-life-graphic-tee',
    title: 'Life Is Short Heavyweight Tee',
    shortLabel: 'Graphic Tee',
    category: 'T-SHIRTS · GRAPHIC JERSEY',
    price: 129.0,
    type: 'tshirt-reign',
    photoUrl: '/assets/aistudio/image_IbcSyy_BH_22cf4d33.webp',
    mattingMode: 'white-life-tee',
    defaultColor: 0,
    gsm: '310GSM Organic Jersey',
    fit: 'Relaxed Studio Fit',
    colors: [
      {
        name: 'Optical White (Original)',
        primary: '#F5F6F8',
        secondary: '#E2E4E8',
        rib: '#ECEEF2',
        inner: '#D8DCE2',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Crisp 310GSM combed organic cotton crew-neck t-shirt featuring minimalist architectural clock-hand typography ("life is short. LIVE IT") screen-printed across the chest.',
    fabricCare:
      '100% organic ring-spun combed cotton (310 g/m²). Wash cold inside-out; hang dry on wooden hanger.',
    sizeFit:
      'Relaxed studio silhouette with thick ribbed crew collar and clean sleeve drape.',
    shippingReturns:
      'Complimentary express DHL shipping on all orders over $100 / €100. Dispatched within 24 hours.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'black-street-legend-shirt',
    title: 'Street Legend Graphic Cargo Shirt',
    shortLabel: 'Street Shirt',
    category: 'OVERSHIRTS · STREET ARCHIVE',
    price: 199.0,
    type: 'hoodie-weirdo',
    photoUrl: '/assets/aistudio/2457d3f1-6804-4af3-8ce9-9ef56aeb4722_qczdIxdhV_0a2af9cb.webp',
    mattingMode: 'black-street-shirt',
    defaultColor: 0,
    gsm: '390GSM Jet Black Twill',
    fit: 'Oversized Layered Cut',
    colors: [
      {
        name: 'Jet Black (Original)',
        primary: '#151619',
        secondary: '#0D0E10',
        rib: '#121316',
        inner: '#090A0C',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Heavyweight jet-black cotton twill utility overshirt styled open over a crisp white crew-neck tee. Detailed with industrial chest coordinates, vertical "STRLEGEND IXV" typography, sleeve number badge, and dual flap pockets.',
    fabricCare:
      '100% heavyweight combed cotton twill (390 g/m²). Cold gentle wash inside-out.',
    sizeFit:
      'Boxy streetwear overshirt cut with rolled cuffs and curved shirttail hem.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'mustard-tactical-patch-shirt',
    title: 'Ochre Tactical Patch Overshirt',
    shortLabel: 'Ochre Shirt',
    category: 'OVERSHIRTS · WORKWEAR',
    price: 189.0,
    type: 'crewneck',
    photoUrl: '/assets/aistudio/cf5054b9-d9ce-4e29-9c1e-9c61724950f3_5euERZcdn_4fe7e5de.webp',
    mattingMode: 'mustard-patch-shirt',
    defaultColor: 0,
    gsm: '380GSM Cavalry Twill',
    fit: 'Tailored Workwear Fit',
    colors: [
      {
        name: 'Ochre Mustard (Original)',
        primary: '#C4903A',
        secondary: '#9E7024',
        rib: '#B2802E',
        inner: '#7A5418',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Garment-dyed ochre mustard cotton twill overshirt layered over an optical white crew-neck tee with pendant detail. Features woven contrast chest & sleeve patches, mitered button-flap pockets, and contrast black buttons.',
    fabricCare:
      '100% organic cotton cavalry twill (380 g/m²). Machine wash cold; hang dry.',
    sizeFit:
      'Structured shoulder with casually ruched forearm cuffs and open-front layering drape.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'midnight-navy-signature-shirt',
    title: 'Midnight Navy Utility Shirt',
    shortLabel: 'Navy Shirt',
    category: 'SIGNATURE · ORIGINAL EDITION',
    price: 199.0,
    type: 'hoodie-atheist',
    photoUrl: '/assets/aistudio/image_7102778c.png',
    mattingMode: 'navy-overshirt',
    defaultColor: 0,
    gsm: '380GSM Fine Cotton Twill',
    fit: 'Tailored Streetwear Drape',
    colors: [
      {
        name: 'Midnight Navy (Original)',
        primary: '#1B2952',
        secondary: '#111B38',
        rib: '#162244',
        inner: '#0C142B',
        innerTeeColor: '#F5F7FA',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Our signature Midnight Navy 380GSM fine cotton twill utility overshirt layered over an optical white heavyweight crew-neck tee. Tailored with dual mitered button-flap chest pockets, luminous mother-of-pearl buttons, and structured turn-back cuffs.',
    fabricCare:
      '100% long-staple combed organic cotton twill (380 g/m²). Wash cold with like colors; hang on contoured wooden hanger.',
    sizeFit:
      'True-to-size relaxed layered silhouette with crisp shoulder structure and curved hem.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100. Dispatched within 24 hours.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'varsity-letterman-jacket',
    title: 'Archive Varsity Letterman Jacket',
    shortLabel: 'Varsity Jacket',
    category: 'OUTERWEAR · VARSITY ARCHIVE',
    price: 249.0,
    type: 'blazer',
    photoUrl: '/assets/aistudio/image_Iy3akqBft_e1f01bd4.webp',
    mattingMode: 'varsity-jacket',
    defaultColor: 0,
    gsm: '540GSM Wool & Heavy Fleece',
    fit: 'Boxy Collegiate Fit',
    colors: [
      {
        name: 'Onyx & Heather Grey (Original)',
        primary: '#1A1B1E',
        secondary: '#B4B8BE',
        rib: '#18191C',
        inner: '#0E0F12',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Heavyweight collegiate varsity jacket featuring a jet-black wool-blend body, contrast heather-grey fleece sleeves, chenille "A" chest monogram, "07" sleeve appliqué, welt pockets, and striped rib-knit trim.',
    fabricCare:
      'Body: 540GSM wool-cotton blend. Sleeves: heavyweight brushed cotton fleece. Dry clean or spot clean only.',
    sizeFit:
      'Relaxed boxy collegiate silhouette designed to layer over tees and hoodies.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'triblock-resort-shirt',
    title: 'Tri-Block Short-Sleeve Shirt',
    shortLabel: 'Resort Shirt',
    category: 'SHIRTS · COLOR-BLOCK EDITION',
    price: 159.0,
    type: 'jersey',
    photoUrl: '/assets/aistudio/image_89e897c4.png',
    mattingMode: 'triblock-short-shirt',
    defaultColor: 0,
    gsm: '290GSM Poplin Weave',
    fit: 'Relaxed Summer Cut',
    colors: [
      {
        name: 'Peach / Slate / Black (Original)',
        primary: '#F5C4B4',
        secondary: '#6B6E72',
        rib: '#141518',
        inner: '#F5F7FA',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Architectural diagonal color-block short-sleeve button-down shirt in blush peach, slate grey, and jet black, finished with an embroidered antler chest crest and layered over a crisp white crew-neck tee.',
    fabricCare:
      '100% combed cotton poplin (290 g/m²). Machine wash cold at 30°C; hang to dry.',
    sizeFit:
      'Relaxed short-sleeve cut with cuffed sleeves and curved hem.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'checkered-archive-crewneck',
    title: 'Archive Checkered Crewneck',
    shortLabel: 'Sweatshirt',
    category: 'SWEATSHIRTS · LUXURY KNIT',
    price: 219.0,
    type: 'hoodie',
    photoUrl: '/assets/aistudio/image_xD0jdZHEK_16a4fe98.webp',
    mattingMode: 'checkered-crewneck',
    defaultColor: 0,
    gsm: '480GSM Jacquard Fleece',
    fit: 'Structured Boxy Fit',
    colors: [
      {
        name: 'Ivory & Stone Check (Original)',
        primary: '#EFECE4',
        secondary: '#C6C0B4',
        rib: '#E8E4DA',
        inner: '#1B1C1E',
        isOriginalPhoto: true,
      },
    ],
    details:
      '480GSM ivory double-knit crewneck sweatshirt woven with an asymmetrical tonal stone check motif, contrast black-and-ivory striped rib-knit collar, and heavyweight ribbed cuffs and waistband.',
    fabricCare:
      '100% organic combed cotton jacquard fleece (480 g/m²). Machine wash cold inside-out; lay flat to dry.',
    sizeFit:
      'Boxy contemporary crewneck silhouette with structured shoulders.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  // =========================================================================
  // WALL 2 (SHOES WALL): 6 TRANSPARENT STUDIO SNEAKERS ON FLOATING SHELVES
  // =========================================================================
  {
    id: 'shoe-aero-emerald-runner',
    title: 'Aero Sculpt Emerald Runner',
    shortLabel: 'Emerald Runner',
    category: 'FOOTWEAR · SCULPTED SOLE',
    price: 189.0,
    type: 'hoodie',
    photoUrl: '/assets/shoes/shoe1.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: '3D Knit & Dual-Density EVA',
    fit: 'True to Size · Sculpted Arch',
    isShoe: true,
    shoeTiltRad: 0.43,
    colors: [
      {
        name: 'Summit White & Emerald (Original)',
        primary: '#1E6B43',
        secondary: '#F2F3F0',
        rib: '#155233',
        inner: '#E5E6E2',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Architectural high-volume runner crafted with breathable engineered mesh uppers, forest-emerald TPU cage overlays, and a wave-sculpted dual-density midsole.',
    fabricCare:
      'Upper: Engineered knit & TPU cage. Outsole: High-abrasion traction rubber. Spot clean with soft brush and cold water.',
    sizeFit:
      'True-to-size performance fit with padded ankle collar and pull tabs.',
    shippingReturns:
      'Complimentary express DHL shipping in custom archive shoe box.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'shoe-nitro-mint-velocity',
    title: 'Nitro Velocity Mint Runner',
    shortLabel: 'Nitro Runner',
    category: 'FOOTWEAR · CARBON NITRO',
    price: 210.0,
    type: 'hoodie-weirdo',
    photoUrl: '/assets/shoes/shoe2.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: 'Nitrogen-Infused Foam & Ripstop',
    fit: 'Aerodynamic Race Fit',
    isShoe: true,
    shoeTiltRad: 0.48,
    colors: [
      {
        name: 'Obsidian & Hyper Mint (Original)',
        primary: '#3BE0B8',
        secondary: '#25272C',
        rib: '#16181C',
        inner: '#2E3138',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Stealth charcoal ripstop runner engineered with nitrogen-infused NITRO midsole cushioning, hyper-mint structural side cage, and glossy sculpted heel stabilizer.',
    fabricCare:
      'Nitrogen-infused supercritical foam midsole with carbon-rubber outsole. Wipe clean with damp cloth.',
    sizeFit:
      'Sleek locked-in midfoot wrap with responsive forefoot rocker.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'shoe-hypervolt-court-pro',
    title: 'HyperVolt Court Performance',
    shortLabel: 'Volt Court',
    category: 'FOOTWEAR · COURT ARCHIVE',
    price: 229.0,
    type: 'tshirt-reign',
    photoUrl: '/assets/shoes/shoe3.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: 'FlyWeave & Molded Heel Counter',
    fit: 'Locked-In Court Fit',
    isShoe: true,
    shoeTiltRad: 0.28,
    colors: [
      {
        name: 'Electric Volt & Onyx (Original)',
        primary: '#7EE838',
        secondary: '#181A1B',
        rib: '#58B81E',
        inner: '#121314',
        isOriginalPhoto: true,
      },
    ],
    details:
      'High-energy Electric Volt court sneaker featuring external molded onyx heel fins, ribbed midfoot torsion plates, and multi-directional herringbone traction pods.',
    fabricCare:
      'Reinforced monofilament mesh with molded TPU heel counter. Spot clean only.',
    sizeFit:
      'Snug lockdown fit with dual webbing lace loops and dual pull tabs.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'shoe-kinetic-blade-orange',
    title: 'Kinetic Blade Orange Runner',
    shortLabel: 'Blade Runner',
    category: 'FOOTWEAR · BLADE SUSPENSION',
    price: 195.0,
    type: 'crewneck',
    photoUrl: '/assets/shoes/shoe4.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: 'Hollow-Core Blade Sole & Mesh',
    fit: 'Responsive Street Fit',
    isShoe: true,
    shoeTiltRad: 0.52,
    colors: [
      {
        name: 'Platinum & Blaze Orange (Original)',
        primary: '#FF751F',
        secondary: '#E4E2E6',
        rib: '#222126',
        inner: '#D4D2D8',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Futuristic street runner set on a hollowed Blaze Orange kinetic blade suspension sole, paired with a platinum-silver molded upper and contrast orange speed-lacing.',
    fabricCare:
      'Molded synthetic & breathable mesh upper with high-rebound TPU blade outsole.',
    sizeFit:
      'True-to-size street silhouette with spring-loaded heel return.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'shoe-cloudknit-rose-trainer',
    title: 'CloudKnit Rose Ultralight',
    shortLabel: 'Rose Trainer',
    category: 'FOOTWEAR · FEATHER KNIT',
    price: 169.0,
    type: 'jersey',
    photoUrl: '/assets/shoes/shoe5.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: 'Seamless Ribbed Prime-Knit',
    fit: 'Sock-Like Featherweight Fit',
    isShoe: true,
    shoeTiltRad: 0.58,
    colors: [
      {
        name: 'Rose Quartz Monochrome (Original)',
        primary: '#E66796',
        secondary: '#F29BB9',
        rib: '#C94A78',
        inner: '#FAD0DF',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Monochromatic Rose Quartz featherweight trainer knitted from a single piece of diagonal-ribbed breathable yarn, set atop an articulated flex-groove phylon sole.',
    fabricCare:
      '100% engineered stretch knit upper with ultralight EVA flex sole. Cold gentle wash or spot clean.',
    sizeFit:
      'Adaptive sock-like fit that molds effortlessly to the foot.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'shoe-air-react-volt-270',
    title: 'Air Max React 270 Volt',
    shortLabel: 'Air React 270',
    category: 'FOOTWEAR · AIR UNIT ARCHIVE',
    price: 239.0,
    type: 'blazer',
    photoUrl: '/assets/shoes/shoe6.png',
    mattingMode: 'shoe-cutout',
    defaultColor: 0,
    gsm: '270° Max Air & No-Sew Overlays',
    fit: 'Cushioned Lifestyle Fit',
    isShoe: true,
    shoeTiltRad: 0.82,
    cropTopRatio: 0.20,
    colors: [
      {
        name: 'Optical White / Volt / Cyan (Original)',
        primary: '#B8E62E',
        secondary: '#F5F7FA',
        rib: '#1CA8E8',
        inner: '#141619',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Iconic lifestyle silhouette combining a translucent Volt-green 270-degree heel air unit with crisp optical-white layered mesh, cyan speed-lace loops, and a crimson archive tag.',
    fabricCare:
      'Multi-layer no-sew textile upper with visible heel air bag and React foam forefoot.',
    sizeFit:
      'True-to-size cushioned lifestyle fit with elevated heel air unit.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  // =========================================================================
  // WALL 3 (BAGS WALL): 6 LUXURY STUDIO BAGS ON OAK CUBBY DISPLAY TABLE
  // =========================================================================
  {
    id: 'bag-terracotta-woven-top-handle',
    title: 'Terracotta Intrecciato Top-Handle',
    shortLabel: 'Terracotta Bag',
    category: 'BAGS · WOVEN LEATHER ARCHIVE',
    price: 289.0,
    type: 'hoodie',
    photoUrl: '/assets/bags/bag1.webp',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Hand-Woven Calfskin & Smooth Flap',
    fit: 'Structured Top-Handle + Crossbody Strap',
    isBag: true,
    colors: [
      {
        name: 'Burnt Terracotta (Original)',
        primary: '#E06D3B',
        secondary: '#B84D22',
        rib: '#8F3816',
        inner: '#F29B70',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Artisanal burnt-terracotta handbag crafted with an intrecciato woven calfskin body, smooth saddle-leather top flap, tonal Gancini turn-lock hardware, arched top handle, and detachable shoulder strap.',
    fabricCare:
      '100% full-grain Italian calfskin leather with suede-lined interior. Store in dust bag away from direct heat.',
    sizeFit:
      'Width: 26 cm · Height: 22 cm · Depth: 12 cm. Fits essentials, phone, wallet, and sunglasses.',
    shippingReturns:
      'Complimentary express DHL shipping in signature SAQIB VISUALS presentation box.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'bag-champagne-quilted-chain-tote',
    title: 'Champagne Quilted Chain Tote',
    shortLabel: 'Champagne Tote',
    category: 'BAGS · QUILTED CALFSKIN',
    price: 319.0,
    type: 'crewneck',
    photoUrl: '/assets/bags/bag2.webp',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Diamond-Quilted Nappa & 18K Gold Chain',
    fit: 'Spacious Structured Luxury Tote',
    isBag: true,
    colors: [
      {
        name: 'Champagne Cream & Gold (Original)',
        primary: '#EED9C4',
        secondary: '#D4AF72',
        rib: '#C4A484',
        inner: '#FAF0E6',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Structured champagne-cream diamond-quilted nappa leather tote elevated with a heavy braided leather-and-gold chain drape, grommeted top trim, rolled leather handles, and engraved side medallion.',
    fabricCare:
      'Diamond-quilted lambskin & calfskin trim with brushed gold-plated brass hardware. Wipe gently with dry microfiber cloth.',
    sizeFit:
      'Width: 34 cm · Height: 25 cm · Depth: 14 cm. Dual interior zip compartments.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'bag-blush-monogram-duffle',
    title: 'Blush Monogram Speedy Boston',
    shortLabel: 'Blush Speedy',
    category: 'BAGS · MONOGRAM ARCHIVE',
    price: 349.0,
    type: 'tshirt-reign',
    photoUrl: '/assets/bags/bag3.png',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Jacquard Monogram Canvas & Vachetta',
    fit: 'Iconic Rolled-Handle Boston Silhouette',
    isBag: true,
    colors: [
      {
        name: 'Blush Rose & Vachetta Tan (Original)',
        primary: '#EAA8B8',
        secondary: '#D99E6A',
        rib: '#C98296',
        inner: '#F7DCE2',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Pastel blush-rose monogrammed canvas Boston duffle bag trimmed with natural vachetta saddle-leather corner reinforcements, rolled top handles, clochette key holder, and polished brass hardware.',
    fabricCare:
      'Coated jacquard canvas with natural vachetta cowhide trim. Protect leather trim from moisture.',
    sizeFit:
      'Width: 30 cm · Height: 21 cm · Depth: 17 cm. Classic everyday luxury carryall.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'bag-slate-geometric-crossbody',
    title: 'Slate Blue Geometric Crossbody',
    shortLabel: 'Slate Crossbody',
    category: 'BAGS · PEBBLED LEATHER',
    price: 249.0,
    type: 'hoodie-weirdo',
    photoUrl: '/assets/bags/bag4.png',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Pebbled Calfskin & Gold V-Lock',
    fit: 'Compact Dome Top-Handle & Crossbody',
    isBag: true,
    colors: [
      {
        name: 'Powder Slate & Champagne Gold (Original)',
        primary: '#9AA8BC',
        secondary: '#D4B28C',
        rib: '#738296',
        inner: '#BCC6D4',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Architectural powder slate-blue pebbled leather dome crossbody bag featuring geometric contrast stitching, signature gold V turn-lock crest, dual curved side gusset zippers with coin pulls, and adjustable strap.',
    fabricCare:
      'Full-grain pebbled calfskin with polished gold-tone hardware. Clean with leather conditioner.',
    sizeFit:
      'Width: 25 cm · Height: 19 cm · Depth: 11 cm. Includes detachable crossbody strap.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'bag-azure-croc-pom-tote',
    title: 'Azure Croc-Embossed Charm Tote',
    shortLabel: 'Azure Croc Tote',
    category: 'BAGS · CROC-EMBOSSED LEATHER',
    price: 269.0,
    type: 'jersey',
    photoUrl: '/assets/bags/bag5.png',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Croc-Embossed Leather & Fur Pom Charm',
    fit: 'Structured Dual-Handle Satchel',
    isBag: true,
    colors: [
      {
        name: 'Periwinkle Azure & Charcoal (Original)',
        primary: '#7FA3E0',
        secondary: '#42454A',
        rib: '#5C82C4',
        inner: '#A8C2F0',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Vibrant periwinkle-azure crocodile-embossed leather structured satchel accented with a detachable charcoal faux-fur double pom-pom and stitched leather leaf charm, gold hardware mounts, and crossbody strap.',
    fabricCare:
      'Crocodile-embossed calfskin leather with gold-plated hardware. Wipe clean with soft dry cloth.',
    sizeFit:
      'Width: 29 cm · Height: 22 cm · Depth: 13 cm. Three interior compartments.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'bag-ivory-floral-charm-satchel',
    title: 'Optical Ivory Floral-Charm Satchel',
    shortLabel: 'Ivory Satchel',
    category: 'BAGS · STRUCTURED SATCHEL',
    price: 279.0,
    type: 'blazer',
    photoUrl: '/assets/bags/bag6.png',
    mattingMode: 'bag-cutout',
    defaultColor: 0,
    gsm: 'Saffiano Leather & Pearl Floral Charm',
    fit: 'Tailored Winged Top-Handle Tote',
    isBag: true,
    colors: [
      {
        name: 'Optical Ivory & Rose Gold (Original)',
        primary: '#EFECE8',
        secondary: '#C99E6E',
        rib: '#D6D1CA',
        inner: '#FAF8F5',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Refined optical-ivory structured leather satchel with contrast black edge piping, diamond-shaped rose-gold handle mounts, and a cascading metallic leather blossom, woven pearl sphere, and crystal drop charm.',
    fabricCare:
      'Scratch-resistant crossgrain leather with rose-gold hardware and pearl pendant charm.',
    sizeFit:
      'Width: 30 cm · Height: 23 cm · Depth: 13 cm. Structured flat base with protective metal feet.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  // =========================================================================
  // WALL 4 (CAPS WALL): 4 STUDIO 3D HEADWEAR PIECES ON FLOATING CAP SHELVES
  // =========================================================================
  {
    id: 'cap-optical-white-classic',
    title: 'Optical White 6-Panel Studio Cap',
    shortLabel: 'White 6-Panel',
    category: 'HEADWEAR · STRUCTURED TWILL',
    price: 79.0,
    type: 'tshirt-reign',
    photoUrl: '/assets/caps/cap1.png',
    mattingMode: 'cap-cutout',
    defaultColor: 0,
    gsm: '340GSM Brushed Cotton Bull Twill',
    fit: 'Structured 6-Panel · Curved Visor',
    isCap: true,
    colors: [
      {
        name: 'Optical White (Original)',
        primary: '#F4F5F7',
        secondary: '#DFE2E7',
        rib: '#CFD4DC',
        inner: '#FFFFFF',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Minimalist monochrome optical-white structured 6-panel baseball cap crafted from heavy 340GSM brushed cotton bull twill, featuring tonal embroidered eyelets, multi-row stitched curved visor, and tonal top button.',
    fabricCare:
      '100% organic combed cotton twill (340 g/m²). Spot clean with damp cloth and mild soap; air dry on cap form.',
    sizeFit:
      'One Size Fits All (55–61 cm) with tonal rear strap and brushed metal tri-glide buckle.',
    shippingReturns:
      'Complimentary express DHL shipping in crush-proof SAQIB VISUALS headwear box.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'cap-faith-ombre-visor',
    title: 'Faith Cross Ombré-Visor Cap',
    shortLabel: 'Faith Ombré Cap',
    category: 'HEADWEAR · EMBROIDERED EDITION',
    price: 89.0,
    type: 'hoodie-weirdo',
    photoUrl: '/assets/caps/cap2.png',
    mattingMode: 'cap-cutout',
    defaultColor: 0,
    gsm: '320GSM Performance Twill & Ombré Brim',
    fit: 'High-Crown 6-Panel · Gradient Visor',
    isCap: true,
    colors: [
      {
        name: 'Optical White & Obsidian Ombré (Original)',
        primary: '#F2F4F8',
        secondary: '#1F2229',
        rib: '#565C68',
        inner: '#181A20',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Architectural high-crown 6-panel baseball cap in crisp optical white with an airbrushed obsidian-black gradient curved visor and precision-stitched vertical "Faith" cross script embroidery on the front crown.',
    fabricCare:
      '100% high-density cotton-poly twill with fade-resistant gradient dye. Wipe clean with soft damp cloth.',
    sizeFit:
      'Adjustable rear closure (55–61 cm) with breathable mesh sweatband interior.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'cap-punk-velvet-catear',
    title: 'Onyx Velvet Cat-Ear Baker Boy Cap',
    shortLabel: 'Punk Velvet Cap',
    category: 'HEADWEAR · AVANT-GARDE ARCHIVE',
    price: 119.0,
    type: 'hoodie',
    photoUrl: '/assets/caps/cap3.png',
    mattingMode: 'cap-cutout',
    defaultColor: 0,
    gsm: '410GSM Plush Onyx Velvet & Tartan Trim',
    fit: 'Sculpted 8-Panel Newsboy Silhouette',
    isCap: true,
    colors: [
      {
        name: 'Onyx Velvet & Monochrome Plaid (Original)',
        primary: '#16171A',
        secondary: '#D8DCE2',
        rib: '#2A2C32',
        inner: '#0D0E10',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Avant-garde sculpted baker-boy cap tailored in plush jet-black cotton velvet with structured 3D cat-ear crown peaks, monochrome tartan plaid brow band, raw-edge plaid patch appliqué, and dual crossed silver safety pins.',
    fabricCare:
      'Plush cotton velvet body with woven tartan band and stainless-steel hardware. Brush gently with velvet lint brush.',
    sizeFit:
      'Structured newsboy fit (56–59 cm) with elasticated inner satin sweatband.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
  {
    id: 'cap-blush-pierced-ring',
    title: 'Blush Pink Pierced-Ring & Chain Cap',
    shortLabel: 'Blush Ring Cap',
    category: 'HEADWEAR · HARDWARE ARCHIVE',
    price: 95.0,
    type: 'jersey',
    photoUrl: '/assets/caps/cap4.png',
    mattingMode: 'cap-cutout',
    defaultColor: 0,
    gsm: '350GSM Garment-Dyed Twill & Chrome Rings',
    fit: 'Streetwear 6-Panel · Pierced Brim',
    isCap: true,
    colors: [
      {
        name: 'Pastel Blush & Chrome Hardware (Original)',
        primary: '#ECB8C6',
        secondary: '#C8CDD4',
        rib: '#D498A8',
        inner: '#F7D8E0',
        isOriginalPhoto: true,
      },
    ],
    details:
      'Garment-dyed pastel blush-pink 6-panel twill cap customized with three polished chrome hoop rings piercing the curved visor edge and quadruple studded D-ring silver curb-chain drapery along the left temple.',
    fabricCare:
      '100% heavy garment-dyed cotton twill with rust-proof nickel-plated brass rings and chains. Spot clean only.',
    sizeFit:
      'Adjustable streetwear fit (55–61 cm) with rear metal strap buckle.',
    shippingReturns:
      'Complimentary express shipping on all orders over $100 / €100.',
    measurements: DEFAULT_MEASUREMENTS,
  },
];

export const CLOTHING_PRODUCTS = PRODUCTS.filter((p) => !p.isShoe && !p.isBag && !p.isCap);
export const SHOE_PRODUCTS = PRODUCTS.filter((p) => p.isShoe);
export const BAG_PRODUCTS = PRODUCTS.filter((p) => p.isBag);
export const CAP_PRODUCTS = PRODUCTS.filter((p) => p.isCap);

export function formatCurrency(amount: number, currency: 'EUR' | 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `€${amount.toFixed(2).replace('.', ',')}`;
}
