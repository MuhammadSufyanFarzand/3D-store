import * as THREE from 'three';
import { MattingMode, Product } from '../data/products';

interface ProcessedGarmentPhoto {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  hookCenterX: number;
  hookBottomY: number;
}

const photoCache = new Map<string, ProcessedGarmentPhoto>();
const loadingCallbacks = new Map<string, Array<(photo: ProcessedGarmentPhoto) => void>>();

/**
 * Loads each garment's studio photograph (`product.photoUrl`) and prepares a 1024x1024
 * ultra-clean RGBA studio cutout with aligned hanger hook and zero floating particles.
 * - For the 6 pre-cutout transparent PNG/WebP images, preserves 100% of the garment & hanger
 *   using native alpha thresholding + 1px anti-fringe cleanup + connected-component filtering.
 * - For `navy-overshirt`, runs full studio background removal + 3px erosion + connected-component filtering.
 */
function ensureProductPhotoLoaded(
  product: Product,
  cb: (photo: ProcessedGarmentPhoto) => void
) {
  const cacheKey = `${product.id}::${product.photoUrl}`;
  const existing = photoCache.get(cacheKey);
  if (existing) {
    cb(existing);
    return;
  }

  const list = loadingCallbacks.get(cacheKey);
  if (list) {
    list.push(cb);
    return;
  }
  loadingCallbacks.set(cacheKey, [cb]);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = 1024;
    const H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const mode: MattingMode = product.mattingMode;

    // Tailored placement per garment so every hanger aligns at the exact same height on the steel rail
    let padX = 64;
    let padY = 12;
    let drawW = W - padX * 2;
    let drawH = H - padY - 14;

    if (mode === 'black-street-shirt') {
      // Shift down slightly so its wooden hanger sits at y ≈ 94 with room for the chrome hook above
      padX = 68;
      padY = 74;
      drawW = W - padX * 2;
      drawH = 922;
    } else if (mode === 'mustard-patch-shirt') {
      // Scale proportionally so the shirt body fills the same vertical height as the other overshirts
      padX = 42;
      padY = 4;
      drawW = W - padX * 2;
      drawH = 1155;
    } else if (mode === 'checkered-crewneck') {
      // Position collar opening around y ≈ 168 so the wooden hanger tucks right into the neck
      padX = 52;
      padY = 12;
      drawW = W - padX * 2;
      drawH = 1008;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, padX, padY, drawW, drawH);

    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Top hook cutoff Y: clears thin/cropped wire hook pixels above the solid hanger body
    // so our crisp vector metallic hook connects seamlessly to the catenary steel wire at (508, 14)
    const topCutoffY =
      mode === 'black-street-shirt'
        ? 88
        : mode === 'navy-overshirt'
          ? 84
          : mode === 'mustard-patch-shirt'
            ? 98
            : mode === 'varsity-jacket'
              ? 100
              : mode === 'triblock-short-shirt'
                ? 108
                : mode === 'white-life-tee'
                  ? 98
                  : 145;

    let fgMask = new Uint8Array(W * H);
    const queue = new Int32Array(W * H);

    if (mode !== 'navy-overshirt') {
      // =====================================================================
      // NATIVE TRANSPARENT CUTOUT PIPELINE (For the 6 background-removed images)
      // =====================================================================
      for (let y = topCutoffY; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (data[idx * 4 + 3] >= 115) {
            fgMask[idx] = 1;
          }
        }
      }

      // 1-pixel light inward erosion to shave off any semi-transparent edge halo from bg removal
      const eroded = new Uint8Array(fgMask);
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          if (!fgMask[idx]) continue;
          if (
            !fgMask[idx - 1] ||
            !fgMask[idx + 1] ||
            !fgMask[idx - W] ||
            !fgMask[idx + W]
          ) {
            eroded[idx] = 0;
          }
        }
      }
      fgMask = eroded;
    } else {
      // =====================================================================
      // STUDIO MATTING PIPELINE (For Midnight Navy Overshirt on grey background)
      // =====================================================================
      const rowBgR = new Uint8Array(H);
      const rowBgG = new Uint8Array(H);
      const rowBgB = new Uint8Array(H);
      for (let y = 0; y < H; y++) {
        const sy = Math.max(padY + 6, Math.min(H - 18, y));
        const pL = (sy * W + (padX + 6)) * 4;
        const pR = (sy * W + (W - padX - 6)) * 4;
        rowBgR[y] = Math.round((data[pL] + data[pR]) * 0.5);
        rowBgG[y] = Math.round((data[pL + 1] + data[pR + 1]) * 0.5);
        rowBgB[y] = Math.round((data[pL + 2] + data[pR + 2]) * 0.5);
      }

      const isBg = new Uint8Array(W * H);
      let head = 0;
      let tail = 0;

      for (let y = 0; y < topCutoffY; y++) {
        for (let x = 0; x < W; x++) {
          isBg[y * W + x] = 1;
        }
      }

      const pushIfBg = (x: number, y: number) => {
        if (x < 0 || x >= W || y < 0 || y >= H) return;
        const idx = y * W + x;
        if (isBg[idx]) return;
        if (x > 400 && x < 626 && y > 175 && y < 888) return;

        const p = idx * 4;
        if (data[p + 3] < 20) {
          isBg[idx] = 1;
          queue[tail++] = idx;
          return;
        }

        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const diffR = Math.abs(r - rowBgR[y]);
        const diffG = Math.abs(g - rowBgG[y]);
        const diffB = Math.abs(b - rowBgB[y]);

        if (
          (chroma <= 28 && diffR <= 68 && diffG <= 68 && diffB <= 68) ||
          (chroma <= 24 && lum > 108)
        ) {
          isBg[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let y = topCutoffY; y < H; y++) {
        pushIfBg(padX + 2, y);
        pushIfBg(W - padX - 3, y);
      }
      for (let x = 0; x < W; x++) {
        pushIfBg(x, topCutoffY);
        pushIfBg(x, H - 16);
      }

      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % W;
        const cy = (curr / W) | 0;
        if (cx > 0) pushIfBg(cx - 1, cy);
        if (cx < W - 1) pushIfBg(cx + 1, cy);
        if (cy > topCutoffY) pushIfBg(cx, cy - 1);
        if (cy < H - 1) pushIfBg(cx, cy + 1);
      }

      for (let i = 0; i < W * H; i++) {
        fgMask[i] = isBg[i] ? 0 : 1;
      }

      for (let pass = 0; pass < 3; pass++) {
        const nextFg = new Uint8Array(fgMask);
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const idx = y * W + x;
            if (!fgMask[idx]) continue;
            if (
              !fgMask[idx - 1] ||
              !fgMask[idx + 1] ||
              !fgMask[idx - W] ||
              !fgMask[idx + W] ||
              !fgMask[idx - W - 1] ||
              !fgMask[idx - W + 1] ||
              !fgMask[idx + W - 1] ||
              !fgMask[idx + W + 1]
            ) {
              nextFg[idx] = 0;
            }
          }
        }
        fgMask = nextFg;
      }
    }

    // Connected Component Filter from garment center & hanger bar -> eliminates any stray floating specks
    const mainComponent = new Uint8Array(W * H);
    let head = 0;
    let tail = 0;

    const seeds = [
      460 * W + 512,
      320 * W + 512,
      620 * W + 512,
      (topCutoffY + 28) * W + 508,
    ];
    for (const seed of seeds) {
      if (fgMask[seed] && !mainComponent[seed]) {
        mainComponent[seed] = 1;
        queue[tail++] = seed;
      }
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % W;
      const cy = (curr / W) | 0;

      const n1 = curr - 1;
      if (cx > 0 && fgMask[n1] && !mainComponent[n1]) {
        mainComponent[n1] = 1;
        queue[tail++] = n1;
      }
      const n2 = curr + 1;
      if (cx < W - 1 && fgMask[n2] && !mainComponent[n2]) {
        mainComponent[n2] = 1;
        queue[tail++] = n2;
      }
      const n3 = curr - W;
      if (cy > 0 && fgMask[n3] && !mainComponent[n3]) {
        mainComponent[n3] = 1;
        queue[tail++] = n3;
      }
      const n4 = curr + W;
      if (cy < H - 1 && fgMask[n4] && !mainComponent[n4]) {
        mainComponent[n4] = 1;
        queue[tail++] = n4;
      }
    }

    // Interior RGB Color Decontamination on outer 2px border
    const rgba = new Uint8ClampedArray(data);
    const decontamShift = mode === 'navy-overshirt' ? 5 : 3;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const p = idx * 4;
        if (!mainComponent[idx]) {
          rgba[p] = 0;
          rgba[p + 1] = 0;
          rgba[p + 2] = 0;
          rgba[p + 3] = 0;
          continue;
        }

        let isNearEdge = false;
        let immediateBgNeighbors = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= H) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= W) continue;
            if (!mainComponent[ny * W + nx]) {
              isNearEdge = true;
              if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                immediateBgNeighbors++;
              }
            }
          }
        }

        if (isNearEdge) {
          const dirX = x < 512 ? decontamShift : -decontamShift;
          const dirY = y < 460 ? decontamShift : -decontamShift;
          const inX = Math.max(0, Math.min(W - 1, x + dirX));
          const inY = Math.max(0, Math.min(H - 1, y + dirY));
          const inIdx = inY * W + inX;
          if (mainComponent[inIdx]) {
            const inP = inIdx * 4;
            rgba[p] = data[inP];
            rgba[p + 1] = data[inP + 1];
            rgba[p + 2] = data[inP + 2];
          }
        }

        rgba[p + 3] = immediateBgNeighbors > 0 ? 242 : 255;
      }
    }

    const processed: ProcessedGarmentPhoto = {
      width: W,
      height: H,
      rgba,
      hookCenterX: 508,
      hookBottomY: topCutoffY + 12,
    };

    photoCache.set(cacheKey, processed);
    const waiting = loadingCallbacks.get(cacheKey) || [];
    loadingCallbacks.delete(cacheKey);
    waiting.forEach((fn) => fn(processed));
  };
  img.src = product.photoUrl;
}

/**
 * Draws a clean, zero-noise vector metallic hanger hook behind (`destination-over`) the garment
 * (plus a sculpted wooden hanger tucked inside the collar for the flat-lay Checkered Crewneck).
 */
function drawHangerHookAndBar(
  ctx: CanvasRenderingContext2D,
  mode: MattingMode,
  centerX = 508,
  bottomY = 98
) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';

  // For the flat-lay Checkered Crewneck, tuck a sculpted wooden hanger behind the front collar rib
  if (mode === 'checkered-crewneck') {
    const woodGrad = ctx.createLinearGradient(385, 92, 630, 195);
    woodGrad.addColorStop(0, '#9a6842');
    woodGrad.addColorStop(0.5, '#d4a579');
    woodGrad.addColorStop(1, '#845432');
    const barPath = new Path2D(
      'M378 190 C425 130 470 94 508 94 C546 94 590 130 638 190 C618 205 590 198 570 176 C544 148 526 136 508 136 C490 136 472 148 446 176 C426 198 398 205 378 190 Z'
    );
    ctx.fillStyle = woodGrad;
    ctx.fill(barPath);
    ctx.strokeStyle = 'rgba(70, 40, 18, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke(barPath);
    bottomY = 104;
  }

  const isDarkHook = mode === 'triblock-short-shirt' || mode === 'varsity-jacket';
  const hookGrad = ctx.createLinearGradient(centerX - 35, 6, centerX + 35, bottomY);
  if (isDarkHook) {
    hookGrad.addColorStop(0, '#23262c');
    hookGrad.addColorStop(0.5, '#525866');
    hookGrad.addColorStop(1, '#16181c');
  } else {
    hookGrad.addColorStop(0, '#68707c');
    hookGrad.addColorStop(0.5, '#cbd4e0');
    hookGrad.addColorStop(1, '#3f4652');
  }

  ctx.strokeStyle = hookGrad;
  ctx.lineWidth = 5.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, bottomY);
  ctx.lineTo(centerX, Math.min(54, bottomY - 12));
  ctx.bezierCurveTo(centerX, 36, centerX + 28, 28, centerX + 26, 14);
  ctx.bezierCurveTo(centerX + 24, 4, centerX - 18, 4, centerX - 34, 24);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the full horizontal front-facing photographic garment (`frontGroup`)
 */
export function renderPhotographicShirtToCanvas(
  ctx: CanvasRenderingContext2D,
  photo: ProcessedGarmentPhoto,
  product: Product,
  _colorIndex: number
) {
  const W = photo.width;
  const H = photo.height;
  const outImg = ctx.createImageData(W, H);
  outImg.data.set(photo.rgba);

  ctx.clearRect(0, 0, W, H);
  ctx.putImageData(outImg, 0, 0);
  drawHangerHookAndBar(ctx, product.mattingMode, photo.hookCenterX, photo.hookBottomY);
}

/**
 * Renders the narrow VERTICAL SIDE-PROFILE HANGING GARMENT (`sideGroup`)
 * constructed from THAT specific garment's real photographic sleeve, cuff/hem, and torso!
 */
function renderPhotographicSideProfileToCanvas(
  ctx: CanvasRenderingContext2D,
  photo: ProcessedGarmentPhoto,
  product: Product,
  colorIndex: number
) {
  const W = 1024;
  const H = 1024;
  ctx.clearRect(0, 0, W, H);

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = W;
  frontCanvas.height = H;
  const frontCtx = frontCanvas.getContext('2d', { willReadFrequently: true })!;
  renderPhotographicShirtToCanvas(frontCtx, photo, product, colorIndex);

  const mode = product.mattingMode;
  const isShortSleeve = mode === 'white-life-tee' || mode === 'triblock-short-shirt';
  const bottomY = 900;

  // 1. Master Vertical Silhouette Clip (Strictly clips everything inside a clean vertical hanging profile)
  ctx.save();
  const masterVerticalClip = new Path2D(
    `M464 90 C486 78 538 78 560 90 C586 112 608 195 620 390 C628 545 630 720 624 ${bottomY} C590 ${
      bottomY + 38
    } 434 ${bottomY + 38} 400 ${bottomY} C394 720 396 545 404 390 C416 195 438 112 464 90 Z`
  );
  ctx.clip(masterVerticalClip);

  // Solid base fill inside clip so there are never any internal transparent pinholes
  const c = product.colors[colorIndex] || product.colors[0];
  ctx.fillStyle = c.primary;
  ctx.fillRect(380, 75, 265, bottomY - 40);

  // Real photographic torso slice from `frontCanvas`
  ctx.drawImage(frontCanvas, 250, 110, 310, 790, 388, 95, 250, bottomY - 85);

  // Real photographic hanging sleeve down the center of the vertical profile
  ctx.save();
  if (isShortSleeve) {
    ctx.translate(512, 330);
    ctx.rotate(0.45);
    ctx.drawImage(frontCanvas, 70, 195, 240, 340, -110, -165, 220, 340);
  } else {
    ctx.translate(512, 480);
    ctx.rotate(-0.09);
    ctx.drawImage(frontCanvas, 72, 195, 225, 650, -106, -310, 212, 640);
  }
  ctx.restore();

  // Cylindrical 3D side-profile studio shading
  const sideShade = ctx.createLinearGradient(392, 0, 632, 0);
  sideShade.addColorStop(0, 'rgba(0,0,0,0.36)');
  sideShade.addColorStop(0.24, 'rgba(255,255,255,0.08)');
  sideShade.addColorStop(0.52, 'rgba(0,0,0,0.06)');
  sideShade.addColorStop(0.8, 'rgba(255,255,255,0.08)');
  sideShade.addColorStop(1, 'rgba(0,0,0,0.36)');
  ctx.fillStyle = sideShade;
  ctx.fillRect(385, 80, 255, bottomY - 40);

  ctx.restore();

  // 2. Clean Vector Hanger Hook behind top of vertical profile
  drawHangerHookAndBar(ctx, mode === 'checkered-crewneck' ? 'navy-overshirt' : mode, 508, 98);
}

/**
 * Removes solid studio background from any user-uploaded custom garment image
 */
function drawCustomImageWithSmartMatting(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
) {
  const W = 1024;
  const H = 1024;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 64, 16, 896, 992);

  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  const cornerIdx = (24 * W + 76) * 4;
  if (data[cornerIdx + 3] < 20) return;

  const bgR = data[cornerIdx];
  const bgG = data[cornerIdx + 1];
  const bgB = data[cornerIdx + 2];

  const isBg = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x: number, y: number) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const idx = y * W + x;
    if (isBg[idx]) return;
    const p = idx * 4;
    if (data[p + 3] === 0) {
      isBg[idx] = 1;
      queue[tail++] = idx;
      return;
    }
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    if (
      Math.abs(r - bgR) <= 44 &&
      Math.abs(g - bgG) <= 44 &&
      Math.abs(b - bgB) <= 44
    ) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < W; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, 18);
    pushIfBg(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    pushIfBg(0, y);
    pushIfBg(66, y);
    pushIfBg(W - 66, y);
    pushIfBg(W - 1, y);
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % W;
    const cy = (curr / W) | 0;
    if (cx > 0) pushIfBg(cx - 1, cy);
    if (cx < W - 1) pushIfBg(cx + 1, cy);
    if (cy > 0) pushIfBg(cx, cy - 1);
    if (cy < H - 1) pushIfBg(cx, cy + 1);
  }

  for (let i = 0; i < W * H; i++) {
    if (isBg[i]) {
      data[i * 4 + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export function createFleeceBumpTexture(maxAnisotropy = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMapleWoodTexture(maxAnisotropy = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#8a5834');
  grad.addColorStop(0.5, '#b88256');
  grad.addColorStop(1, '#7a4b2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface RoomWallTheme {
  id: number;
  key: 'clothing' | 'shoes' | 'bags' | 'caps';
  navLabel: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  yawAngle: number;
  frontWallTop: string;
  frontWallBottom: string;
  sideWallInner: string;
  sideWallOuter: string;
  alcoveBg: string;
  slatColor: string;
  ceilingColor: string;
  floorTop: string;
  floorBottom: string;
  gridLineColor: string;
  baseboardColor: string;
  pipeColor: string;
  pipeHighlight: string;
  plinthColor: string;
  isDarkWall: boolean;
}

export const ROOM_WALL_THEMES: RoomWallTheme[] = [
  {
    id: 0,
    key: 'clothing',
    navLabel: 'Clothing',
    label: '1st Wall · Clothing Flagship Wall',
    shortLabel: 'Clothing',
    subtitle: 'Venetian Taupe-Bronze Wall · Steel Pipe & 7 Hanging Pieces',
    yawAngle: 0,
    frontWallTop: '#5c4d42',
    frontWallBottom: '#3e332b',
    sideWallInner: '#4d4036',
    sideWallOuter: '#352b24',
    alcoveBg: '#6e5d50',
    slatColor: '#c9a368',
    ceilingColor: '#ebe5dc',
    floorTop: '#b9b0a4',
    floorBottom: '#8f8579',
    gridLineColor: 'rgba(52, 42, 32, 0.22)',
    baseboardColor: '#1e1915',
    pipeColor: '#1b1d20',
    pipeHighlight: '#f5f7fa',
    plinthColor: '#c89e68',
    isDarkWall: true,
  },
  {
    id: 1,
    key: 'shoes',
    navLabel: 'Shoes',
    label: '2nd Wall · Footwear Gallery Wall',
    shortLabel: 'Shoes',
    subtitle: 'Deep Slate-Teal Mall Wall · Oak Board & 6 Studio 3D Sneakers',
    yawAngle: -Math.PI / 2,
    frontWallTop: '#273d47',
    frontWallBottom: '#17262d',
    sideWallInner: '#20333c',
    sideWallOuter: '#142026',
    alcoveBg: '#314b57',
    slatColor: '#c9a368',
    ceilingColor: '#ebe5dc',
    floorTop: '#b9b0a4',
    floorBottom: '#8f8579',
    gridLineColor: 'rgba(52, 42, 32, 0.22)',
    baseboardColor: '#1e1915',
    pipeColor: '#1b1d20',
    pipeHighlight: '#f5f7fa',
    plinthColor: '#c69f68',
    isDarkWall: true,
  },
  {
    id: 2,
    key: 'bags',
    navLabel: 'Bags',
    label: '3rd Wall · Bags Cubby Boutique Wall',
    shortLabel: 'Bags',
    subtitle: 'Venetian Terracotta Mall Wall · 6 Luxury 3D Bags on Oak Cubby Display',
    yawAngle: -Math.PI,
    frontWallTop: '#6b3e33',
    frontWallBottom: '#46261e',
    sideWallInner: '#593228',
    sideWallOuter: '#3b1f18',
    alcoveBg: '#7d4a3d',
    slatColor: '#c9a368',
    ceilingColor: '#ebe5dc',
    floorTop: '#b9b0a4',
    floorBottom: '#8f8579',
    gridLineColor: 'rgba(52, 42, 32, 0.22)',
    baseboardColor: '#1e1915',
    pipeColor: '#1b1d20',
    pipeHighlight: '#f5f7fa',
    plinthColor: '#d4b07b',
    isDarkWall: true,
  },
  {
    id: 3,
    key: 'caps',
    navLabel: 'Caps',
    label: '4th Wall · Headwear Lounge Wall',
    shortLabel: 'Caps',
    subtitle: 'Deep Forest Sage Mall Wall · 4 Studio 3D Caps on Floating Shelves',
    yawAngle: -Math.PI * 1.5,
    frontWallTop: '#33463b',
    frontWallBottom: '#1e2b23',
    sideWallInner: '#28382f',
    sideWallOuter: '#18221c',
    alcoveBg: '#3f5649',
    slatColor: '#c9a368',
    ceilingColor: '#ebe5dc',
    floorTop: '#b9b0a4',
    floorBottom: '#8f8579',
    gridLineColor: 'rgba(52, 42, 32, 0.22)',
    baseboardColor: '#1e1915',
    pipeColor: '#1b1d20',
    pipeHighlight: '#f5f7fa',
    plinthColor: '#cfa974',
    isDarkWall: true,
  },
];

export function createTravertineFloorTexture(
  maxAnisotropy = 1,
  wallIndex = 0
): THREE.CanvasTexture {
  const theme = ROOM_WALL_THEMES[wallIndex] || ROOM_WALL_THEMES[0];
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Rich warm travertine stone gradient with high-contrast depth
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  baseGrad.addColorStop(0, '#c2b9ad');
  baseGrad.addColorStop(0.5, '#aba195');
  baseGrad.addColorStop(1, '#92887c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle stone tile tonal variation per 256x256 slab
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const shade = ((tx + ty) % 2 === 0 ? 1 : -1) * 0.03;
      ctx.fillStyle =
        shade > 0 ? 'rgba(255, 248, 238, 0.045)' : 'rgba(35, 28, 20, 0.045)';
      ctx.fillRect(tx * 256, ty * 256, 256, 256);
    }
  }

  // Organic travertine mineral veins
  ctx.strokeStyle = 'rgba(70, 58, 45, 0.08)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 28; i++) {
    const y = (i * 37) % 1024;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(340, y + 14, 680, y - 14, 1024, y + 6);
    ctx.stroke();
  }

  // Crisp architectural tile grout lines with subtle bevel highlight
  ctx.strokeStyle = theme.gridLineColor;
  ctx.lineWidth = 3;
  for (let p = 256; p < 1024; p += 256) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(1024, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createConcreteWallTexture(
  maxAnisotropy = 1,
  wallIndex = 0
): THREE.CanvasTexture {
  const theme = ROOM_WALL_THEMES[wallIndex] || ROOM_WALL_THEMES[0];
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Rich Venetian matte designer wall paint vertical gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, theme.frontWallTop);
  grad.addColorStop(0.55, theme.sideWallInner);
  grad.addColorStop(1, theme.frontWallBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle Venetian plaster brushwork texture
  for (let i = 0; i < 120; i++) {
    const x = (i * 83) % 1024;
    const y = (i * 47) % 512;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(255, 245, 230, 0.018)' : 'rgba(10, 8, 6, 0.024)';
    ctx.fillRect(x, y, 140, 24);
  }

  // Center recessed architectural gallery alcove panel
  ctx.fillStyle = theme.alcoveBg;
  ctx.fillRect(116, 36, 792, 428);

  // Inner shadow & brushed-brass picture-frame molding around the center panel
  ctx.strokeStyle = 'rgba(10, 8, 6, 0.42)';
  ctx.lineWidth = 6;
  ctx.strokeRect(116, 36, 792, 428);

  ctx.strokeStyle = 'rgba(205, 168, 108, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(126, 46, 772, 408);

  // Decorative architectural vertical brass-and-wood fluting on left & right wings
  for (let sx = 24; sx < 104; sx += 14) {
    ctx.fillStyle = 'rgba(12, 10, 8, 0.36)';
    ctx.fillRect(sx - 2, 36, 4, 428);
    ctx.fillRect(1024 - sx - 10, 36, 4, 428);

    ctx.fillStyle = theme.slatColor;
    ctx.fillRect(sx, 36, 6, 428);
    ctx.fillRect(1024 - sx - 6, 36, 6, 428);
  }

  // Overhead warm gallery track spotlight cones washing down the painted wall
  [256, 512, 768].forEach((spotX) => {
    const spotGrad = ctx.createRadialGradient(spotX, 18, 12, spotX, 240, 290);
    spotGrad.addColorStop(0, 'rgba(255, 242, 214, 0.24)');
    spotGrad.addColorStop(0.5, 'rgba(255, 234, 196, 0.09)');
    spotGrad.addColorStop(1, 'rgba(255, 234, 196, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(spotX - 290, 0, 580, 512);
  });

  // Top ceiling cove shadow & bottom dark-walnut baseboard with brass trim
  const topShadow = ctx.createLinearGradient(0, 0, 0, 32);
  topShadow.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
  topShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topShadow;
  ctx.fillRect(0, 0, 1024, 32);

  ctx.fillStyle = '#1b1612';
  ctx.fillRect(0, 484, 1024, 28);
  ctx.fillStyle = '#c9a368';
  ctx.fillRect(0, 481, 1024, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

const shoeCanvasCache = new Map<string, HTMLCanvasElement>();
const shoeLoadingCallbacks = new Map<string, Array<(c: HTMLCanvasElement) => void>>();

/**
 * Loads a transparent sneaker PNG, strips any top floating logo (`cropTopRatio`),
 * performs two-pass automatic forefoot-to-heel leveling so both the toe/forefoot
 * and heel rest 100% flat on the horizontal shelf plane (`soleLineY = 858`),
 * and applies subtle studio bottom-edge ambient occlusion to the outsole.
 */
function ensureShoeCanvasLoaded(
  product: Product,
  cb: (leveledCanvas: HTMLCanvasElement) => void
) {
  const key = `${product.id}::${product.customFrontImage || product.photoUrl}`;
  const cached = shoeCanvasCache.get(key);
  if (cached) {
    cb(cached);
    return;
  }

  const waiting = shoeLoadingCallbacks.get(key);
  if (waiting) {
    waiting.push(cb);
    return;
  }
  shoeLoadingCallbacks.set(key, [cb]);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const S = 1280;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = S;
    rotCanvas.height = S;
    const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true })!;

    // Step 1: Prepare clean source (cropping top ratio if needed, e.g. shoe6 top logo)
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.naturalWidth || 1024;
    srcCanvas.height = img.naturalHeight || 1024;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0);
    if (product.cropTopRatio && product.cropTopRatio > 0) {
      srcCtx.clearRect(0, 0, srcCanvas.width, Math.round(srcCanvas.height * product.cropTopRatio));
    }

    const fitScale = Math.min((S * 0.72) / srcCanvas.width, (S * 0.72) / srcCanvas.height);
    const dw = srcCanvas.width * fitScale;
    const dh = srcCanvas.height * fitScale;

    const renderAtAngle = (angleRad: number) => {
      rotCtx.clearRect(0, 0, S, S);
      rotCtx.save();
      rotCtx.translate(S * 0.5, S * 0.5);
      rotCtx.rotate(angleRad);
      rotCtx.drawImage(srcCanvas, -dw * 0.5, -dh * 0.5, dw, dh);
      rotCtx.restore();
    };

    // Pass 1: Initial tilt rotation
    let finalAngle = product.shoeTiltRad ?? 0.42;
    renderAtAngle(finalAngle);

    // Measure bounding box & lowest outsole contact points in Forefoot (left) vs Heel (right)
    const findBoundsAndSoleSlope = () => {
      const rotData = rotCtx.getImageData(0, 0, S, S).data;
      let minX = S;
      let maxX = 0;
      let minY = S;
      let maxY = 0;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const a = rotData[(y * S + x) * 4 + 3];
          if (a >= 50) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const spanW = Math.max(1, maxX - minX);
      // Forefoot contact zone: 16% .. 46% from left toe
      const fStart = Math.round(minX + spanW * 0.16);
      const fEnd = Math.round(minX + spanW * 0.46);
      let forefootX = (fStart + fEnd) * 0.5;
      let forefootY = minY;

      for (let x = fStart; x <= fEnd; x++) {
        for (let y = maxY; y >= minY; y--) {
          if (rotData[(y * S + x) * 4 + 3] >= 70) {
            if (y > forefootY) {
              forefootY = y;
              forefootX = x;
            }
            break;
          }
        }
      }

      // Heel contact zone: 58% .. 90% from left toe
      const hStart = Math.round(minX + spanW * 0.58);
      const hEnd = Math.round(minX + spanW * 0.90);
      let heelX = (hStart + hEnd) * 0.5;
      let heelY = minY;

      for (let x = hStart; x <= hEnd; x++) {
        for (let y = maxY; y >= minY; y--) {
          if (rotData[(y * S + x) * 4 + 3] >= 70) {
            if (y > heelY) {
              heelY = y;
              heelX = x;
            }
            break;
          }
        }
      }

      return { minX, maxX, minY, maxY, forefootX, forefootY, heelX, heelY };
    };

    let info = findBoundsAndSoleSlope();
    // Pass 2: Auto-level forefoot & heel so both contact patches sit on the exact same horizontal line
    if (info.heelX > info.forefootX + 40 && Math.abs(info.forefootY - info.heelY) > 2) {
      const deltaRad = THREE.MathUtils.clamp(
        Math.atan2(info.forefootY - info.heelY, info.heelX - info.forefootX),
        -0.28,
        0.28
      );
      finalAngle += deltaRad;
      renderAtAngle(finalAngle);
      info = findBoundsAndSoleSlope();
    }

    let { minX, maxX, minY, maxY } = info;
    if (maxX <= minX || maxY <= minY) {
      minX = 160;
      maxX = S - 160;
      minY = 160;
      maxY = S - 160;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1024;
    outCanvas.height = 1024;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

    const bw = maxX - minX;
    const bh = maxY - minY;
    const targetW = 840;
    const scale = Math.min(targetW / bw, 660 / bh);
    const finalW = bw * scale;
    const finalH = bh * scale;
    const destX = (1024 - finalW) * 0.5;
    const soleLineY = 858;
    const destY = soleLineY - finalH;

    // Draw the leveled, ultra-clean transparent sneaker sitting flush on soleLineY (858)
    outCtx.drawImage(rotCanvas, minX, minY, bw, bh, destX, destY, finalW, finalH);

    // Apply subtle physical outsole self-occlusion along the bottom 12px of the rubber sole
    // so the rubber tread blends naturally into the shelf contact shadow
    const outImg = outCtx.getImageData(0, 0, 1024, 1024);
    const od = outImg.data;
    for (let y = Math.max(0, Math.floor(soleLineY - 22)); y < 1024; y++) {
      const distFromSole = Math.max(0, soleLineY - y);
      const aoFactor =
        distFromSole <= 14 ? 0.78 + (distFromSole / 14) * 0.22 : 1.0;
      for (let x = 0; x < 1024; x++) {
        const p = (y * 1024 + x) * 4;
        if (od[p + 3] > 15) {
          od[p] = Math.round(od[p] * aoFactor);
          od[p + 1] = Math.round(od[p + 1] * aoFactor);
          od[p + 2] = Math.round(od[p + 2] * aoFactor);
        }
      }
    }
    outCtx.putImageData(outImg, 0, 0);

    shoeCanvasCache.set(key, outCanvas);
    const cbs = shoeLoadingCallbacks.get(key) || [];
    shoeLoadingCallbacks.delete(key);
    cbs.forEach((fn) => fn(outCanvas));
  };
  img.src = product.customFrontImage || product.photoUrl;
}

/**
 * Generates a leveled 1024x1024 studio texture for any of the 6 Sneakers on Wall 2 (`Shoes`)
 */
export function createPhotorealShoeTexture(
  product: Product,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  ensureShoeCanvasLoaded(product, (leveled) => {
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(leveled, 0, 0);
    tex.needsUpdate = true;
  });

  return tex;
}

const bagCanvasCache = new Map<string, HTMLCanvasElement>();
const bagLoadingCallbacks = new Map<string, Array<(c: HTMLCanvasElement) => void>>();

/**
 * Loads any of the 6 luxury bag images (`/assets/bags/bag1.webp`..`bag6.png`),
 * performs smart border-seeded + handle-arch flood-fill studio background removal
 * (preserving white/ivory leather bags via edge piping while stripping any white studio background or fringe),
 * centers the bag horizontally, aligns its leather base flush at `bagBaseLineY = 868`,
 * and adds subtle bottom-base ambient occlusion so it sits naturally on the oak cubby shelves.
 */
function ensureBagCanvasLoaded(
  product: Product,
  cb: (cleanBagCanvas: HTMLCanvasElement) => void
) {
  const key = `${product.id}::${product.customFrontImage || product.photoUrl}`;
  const cached = bagCanvasCache.get(key);
  if (cached) {
    cb(cached);
    return;
  }

  const waiting = bagLoadingCallbacks.get(key);
  if (waiting) {
    waiting.push(cb);
    return;
  }
  bagLoadingCallbacks.set(key, [cb]);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = 1024;
    const H = 1024;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = W;
    workCanvas.height = H;
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;

    const iw = img.naturalWidth || 1024;
    const ih = img.naturalHeight || 1024;
    const fitScale = Math.min((W - 48) / iw, (H - 48) / ih);
    const dw = iw * fitScale;
    const dh = ih * fitScale;
    const dx = (W - dw) * 0.5;
    const dy = (H - dh) * 0.5;

    workCtx.clearRect(0, 0, W, H);
    workCtx.drawImage(img, dx, dy, dw, dh);

    const imgData = workCtx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Smart border & handle-arch BFS flood-fill to strip any pure-white or transparent studio background
    // while stopping cleanly at dark/gold/colored leather piping
    const isBg = new Uint8Array(W * H);
    const queue = new Int32Array(W * H);
    let head = 0;
    let tail = 0;

    const tryPushBg = (x: number, y: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const idx = y * W + x;
      if (isBg[idx]) return;
      const p = idx * 4;
      const a = data[p + 3];
      if (a < 45) {
        isBg[idx] = 1;
        queue[tail++] = idx;
        return;
      }
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      // Pure studio white background check (protects shaded ivory leather <= 245)
      if (r >= 248 && g >= 248 && b >= 248 && chroma <= 6) {
        isBg[idx] = 1;
        queue[tail++] = idx;
      }
    };

    // Seed from all 4 canvas edges
    for (let x = 0; x < W; x++) {
      tryPushBg(x, 0);
      tryPushBg(x, H - 1);
    }
    for (let y = 0; y < H; y++) {
      tryPushBg(0, y);
      tryPushBg(W - 1, y);
    }
    // Also seed inside the top handle arch opening & side strap loops if pure white/transparent
    for (let y = Math.round(H * 0.14); y <= Math.round(H * 0.36); y += 8) {
      for (let x = Math.round(W * 0.42); x <= Math.round(W * 0.58); x += 8) {
        tryPushBg(x, y);
      }
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % W;
      const cy = (curr / W) | 0;
      if (cx > 0) tryPushBg(cx - 1, cy);
      if (cx < W - 1) tryPushBg(cx + 1, cy);
      if (cy > 0) tryPushBg(cx, cy - 1);
      if (cy < H - 1) tryPushBg(cx, cy + 1);
    }

    // Apply background mask & 1px anti-fringe edge feathering
    let minX = W;
    let maxX = 0;
    let minY = H;
    let maxY = 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const p = idx * 4;
        if (isBg[idx] || data[p + 3] < 65) {
          data[p + 3] = 0;
          continue;
        }
        // Check if bordering background pixel -> shave bright white halo fringe
        let touchesBg = false;
        if (
          (x > 0 && isBg[idx - 1]) ||
          (x < W - 1 && isBg[idx + 1]) ||
          (y > 0 && isBg[idx - W]) ||
          (y < H - 1 && isBg[idx + W])
        ) {
          touchesBg = true;
        }
        if (touchesBg) {
          const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
          if (lum > 244) {
            data[p + 3] = 0;
            continue;
          }
          data[p + 3] = Math.min(data[p + 3], 210);
        }

        if (data[p + 3] >= 80) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    workCtx.putImageData(imgData, 0, 0);

    if (maxX <= minX || maxY <= minY) {
      minX = 128;
      maxX = W - 128;
      minY = 128;
      maxY = H - 128;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1024;
    outCanvas.height = 1024;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

    const bw = maxX - minX;
    const bh = maxY - minY;
    const targetMaxW = 790;
    const targetMaxH = 740;
    const scale = Math.min(targetMaxW / bw, targetMaxH / bh);
    const finalW = bw * scale;
    const finalH = bh * scale;
    const destX = (1024 - finalW) * 0.5;
    const bagBaseLineY = 868;
    const destY = bagBaseLineY - finalH;

    outCtx.clearRect(0, 0, 1024, 1024);
    outCtx.drawImage(workCanvas, minX, minY, bw, bh, destX, destY, finalW, finalH);

    // Subtle bottom-base self-occlusion so the leather base sits naturally on the oak shelf
    const outImg = outCtx.getImageData(0, 0, 1024, 1024);
    const od = outImg.data;
    for (let y = Math.max(0, Math.floor(bagBaseLineY - 24)); y < 1024; y++) {
      const distFromBase = Math.max(0, bagBaseLineY - y);
      const aoFactor =
        distFromBase <= 16 ? 0.78 + (distFromBase / 16) * 0.22 : 1.0;
      for (let x = 0; x < 1024; x++) {
        const p = (y * 1024 + x) * 4;
        if (od[p + 3] > 15) {
          od[p] = Math.round(od[p] * aoFactor);
          od[p + 1] = Math.round(od[p + 1] * aoFactor);
          od[p + 2] = Math.round(od[p + 2] * aoFactor);
        }
      }
    }
    outCtx.putImageData(outImg, 0, 0);

    bagCanvasCache.set(key, outCanvas);
    const cbs = bagLoadingCallbacks.get(key) || [];
    bagLoadingCallbacks.delete(key);
    cbs.forEach((fn) => fn(outCanvas));
  };
  img.src = product.customFrontImage || product.photoUrl;
}

/**
 * Generates a 1024x1024 studio cutout texture for any of the 6 Luxury Bags on Wall 3 (`Bags`)
 */
export function createPhotorealBagTexture(
  product: Product,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  ensureBagCanvasLoaded(product, (cleanBag) => {
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(cleanBag, 0, 0);
    tex.needsUpdate = true;
  });

  return tex;
}

const capCanvasCache = new Map<string, HTMLCanvasElement>();
const capLoadingCallbacks = new Map<string, Array<(c: HTMLCanvasElement) => void>>();

/**
 * Loads any of the 4 studio cap images (`/assets/caps/cap1.png`..`cap4.png`),
 * preserves 100% of native transparent PNG cutouts (protecting optical-white cap crowns & brims)
 * while removing any solid background if a custom photo is uploaded,
 * centers the cap horizontally, aligns its visor/base flush at `capBaseLineY = 858`,
 * and applies subtle bottom-edge ambient occlusion so it sits naturally on the floating cap shelves.
 */
function ensureCapCanvasLoaded(
  product: Product,
  cb: (cleanCapCanvas: HTMLCanvasElement) => void
) {
  const key = `${product.id}::${product.customFrontImage || product.photoUrl}`;
  const cached = capCanvasCache.get(key);
  if (cached) {
    cb(cached);
    return;
  }

  const waiting = capLoadingCallbacks.get(key);
  if (waiting) {
    waiting.push(cb);
    return;
  }
  capLoadingCallbacks.set(key, [cb]);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = 1024;
    const H = 1024;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = W;
    workCanvas.height = H;
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;

    const iw = img.naturalWidth || 1024;
    const ih = img.naturalHeight || 1024;
    const fitScale = Math.min((W - 48) / iw, (H - 48) / ih);
    const dw = iw * fitScale;
    const dh = ih * fitScale;
    const dx = (W - dw) * 0.5;
    const dy = (H - dh) * 0.5;

    workCtx.clearRect(0, 0, W, H);
    workCtx.drawImage(img, dx, dy, dw, dh);

    const imgData = workCtx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Check if the image already has a native transparent background in the corners
    const cornerAlpha =
      data[(12 * W + 12) * 4 + 3] +
      data[(12 * W + (W - 12)) * 4 + 3] +
      data[((H - 12) * W + 12) * 4 + 3];

    if (cornerAlpha >= 40) {
      // Custom uploaded image with solid background -> run border-seeded flood-fill
      const cIdx = (12 * W + 12) * 4;
      const bgR = data[cIdx];
      const bgG = data[cIdx + 1];
      const bgB = data[cIdx + 2];

      const isBg = new Uint8Array(W * H);
      const queue = new Int32Array(W * H);
      let head = 0;
      let tail = 0;

      const tryPushBg = (x: number, y: number) => {
        if (x < 0 || x >= W || y < 0 || y >= H) return;
        const idx = y * W + x;
        if (isBg[idx]) return;
        const p = idx * 4;
        if (data[p + 3] < 40) {
          isBg[idx] = 1;
          queue[tail++] = idx;
          return;
        }
        if (
          Math.abs(data[p] - bgR) <= 22 &&
          Math.abs(data[p + 1] - bgG) <= 22 &&
          Math.abs(data[p + 2] - bgB) <= 22
        ) {
          isBg[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let x = 0; x < W; x++) {
        tryPushBg(x, 0);
        tryPushBg(x, H - 1);
      }
      for (let y = 0; y < H; y++) {
        tryPushBg(0, y);
        tryPushBg(W - 1, y);
      }

      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % W;
        const cy = (curr / W) | 0;
        if (cx > 0) tryPushBg(cx - 1, cy);
        if (cx < W - 1) tryPushBg(cx + 1, cy);
        if (cy > 0) tryPushBg(cx, cy - 1);
        if (cy < H - 1) tryPushBg(cx, cy + 1);
      }

      for (let i = 0; i < W * H; i++) {
        if (isBg[i]) data[i * 4 + 3] = 0;
      }
    }

    // Measure tight bounding box of the cap silhouette & clean any faint alpha<35 noise
    let minX = W;
    let maxX = 0;
    let minY = H;
    let maxY = 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = (y * W + x) * 4;
        const a = data[p + 3];
        if (a < 35) {
          data[p + 3] = 0;
          continue;
        }
        if (a >= 75) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    workCtx.putImageData(imgData, 0, 0);

    if (maxX <= minX || maxY <= minY) {
      minX = 128;
      maxX = W - 128;
      minY = 128;
      maxY = H - 128;
    }

    // -------------------------------------------------------------------------
    // TWO-POINT AUTO-LEVELING: Ensure both front visor tip and rear crown base
    // rest flat and level on the shelf (instead of rear crown floating in air)
    // -------------------------------------------------------------------------
    const rawBw = maxX - minX;
    const findLowestInBand = (xStartRatio: number, xEndRatio: number) => {
      const xs = Math.max(0, Math.floor(minX + rawBw * xStartRatio));
      const xe = Math.min(W - 1, Math.ceil(minX + rawBw * xEndRatio));
      let bestX = Math.round((xs + xe) * 0.5);
      let bestY = -1;
      for (let x = xs; x <= xe; x++) {
        for (let y = maxY; y >= minY; y--) {
          if (data[(y * W + x) * 4 + 3] >= 110) {
            if (y > bestY) {
              bestY = y;
              bestX = x;
            }
            break;
          }
        }
      }
      return { x: bestX, y: bestY };
    };

    const frontContact = findLowestInBand(0.06, 0.42);
    const rearContact = findLowestInBand(0.56, 0.92);

    let levelCanvas = workCanvas;
    if (
      frontContact.y > 0 &&
      rearContact.y > 0 &&
      Math.abs(rearContact.x - frontContact.x) > 40
    ) {
      const rawAngle = Math.atan2(
        rearContact.y - frontContact.y,
        rearContact.x - frontContact.x
      );
      const tiltAngle = Math.max(-0.24, Math.min(0.24, -rawAngle));
      if (Math.abs(tiltAngle) > 0.008) {
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = W;
        rotCanvas.height = H;
        const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true })!;
        const cx = (minX + maxX) * 0.5;
        const cy = (minY + maxY) * 0.5;
        rotCtx.translate(cx, cy);
        rotCtx.rotate(tiltAngle);
        rotCtx.drawImage(workCanvas, -cx, -cy);
        levelCanvas = rotCanvas;

        // Recompute tight bounding box after leveling rotation
        const rotData = rotCtx.getImageData(0, 0, W, H).data;
        minX = W;
        maxX = 0;
        minY = H;
        maxY = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (rotData[(y * W + x) * 4 + 3] >= 75) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
      }
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = 1024;
    outCanvas.height = 1024;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

    const bw = Math.max(64, maxX - minX);
    const bh = Math.max(64, maxY - minY);
    const targetMaxW = 720;
    const targetMaxH = 560;
    const scale = Math.min(targetMaxW / bw, targetMaxH / bh);
    const finalW = bw * scale;
    const finalH = bh * scale;
    const destX = (1024 - finalW) * 0.5;
    const capBaseLineY = 858;
    const destY = capBaseLineY - finalH;

    outCtx.clearRect(0, 0, 1024, 1024);
    outCtx.drawImage(levelCanvas, minX, minY, bw, bh, destX, destY, finalW, finalH);

    // Subtle bottom-edge self-occlusion along the lowest 16px where visor & crown rest on the shelf
    const outImg = outCtx.getImageData(0, 0, 1024, 1024);
    const od = outImg.data;
    for (let y = Math.max(0, Math.floor(capBaseLineY - 22)); y < 1024; y++) {
      const distFromBase = Math.max(0, capBaseLineY - y);
      const aoFactor =
        distFromBase <= 16 ? 0.80 + (distFromBase / 16) * 0.20 : 1.0;
      for (let x = 0; x < 1024; x++) {
        const p = (y * 1024 + x) * 4;
        if (od[p + 3] > 15) {
          od[p] = Math.round(od[p] * aoFactor);
          od[p + 1] = Math.round(od[p + 1] * aoFactor);
          od[p + 2] = Math.round(od[p + 2] * aoFactor);
        }
      }
    }
    outCtx.putImageData(outImg, 0, 0);

    capCanvasCache.set(key, outCanvas);
    const cbs = capLoadingCallbacks.get(key) || [];
    capLoadingCallbacks.delete(key);
    cbs.forEach((fn) => fn(outCanvas));
  };
  img.src = product.customFrontImage || product.photoUrl;
}

/**
 * Generates a 1024x1024 studio cutout texture for any of the 4 Caps on Wall 4 (`Caps`)
 */
export function createPhotorealCapTexture(
  product: Product,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  ensureCapCanvasLoaded(product, (cleanCap) => {
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(cleanCap, 0, 0);
    tex.needsUpdate = true;
  });

  return tex;
}

/**
 * Creates a realistic multi-layered contact shadow texture for the top surface
 * of each white floating shoe shelf:
 * - Wide diffused penumbra shadow across the shelf
 * - Dual dark Ambient Occlusion (AO) contact patches under the Forefoot & Heel rubber tread
 */
export function createShoeShelfContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);

  // Layer 1: Wide soft ambient penumbra across the shelf surface
  ctx.save();
  ctx.translate(256, 134);
  ctx.scale(1.0, 0.34);
  const penumbra = ctx.createRadialGradient(0, 0, 18, 0, 0, 215);
  penumbra.addColorStop(0, 'rgba(20, 15, 10, 0.52)');
  penumbra.addColorStop(0.55, 'rgba(20, 15, 10, 0.26)');
  penumbra.addColorStop(0.85, 'rgba(20, 15, 10, 0.08)');
  penumbra.addColorStop(1, 'rgba(20, 15, 10, 0)');
  ctx.fillStyle = penumbra;
  ctx.beginPath();
  ctx.arc(0, 0, 215, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 2: Crisp dark Forefoot Outsole Contact Patch (left-center)
  ctx.save();
  ctx.translate(182, 132);
  ctx.scale(1.0, 0.24);
  const forefootAO = ctx.createRadialGradient(0, 0, 6, 0, 0, 96);
  forefootAO.addColorStop(0, 'rgba(8, 6, 4, 0.88)');
  forefootAO.addColorStop(0.48, 'rgba(12, 9, 6, 0.58)');
  forefootAO.addColorStop(1, 'rgba(12, 9, 6, 0)');
  ctx.fillStyle = forefootAO;
  ctx.beginPath();
  ctx.arc(0, 0, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 3: Crisp dark Heel Outsole Contact Patch (right-center)
  ctx.save();
  ctx.translate(334, 132);
  ctx.scale(1.0, 0.24);
  const heelAO = ctx.createRadialGradient(0, 0, 6, 0, 0, 86);
  heelAO.addColorStop(0, 'rgba(8, 6, 4, 0.88)');
  heelAO.addColorStop(0.48, 'rgba(12, 9, 6, 0.56)');
  heelAO.addColorStop(1, 'rgba(12, 9, 6, 0)');
  ctx.fillStyle = heelAO;
  ctx.beginPath();
  ctx.arc(0, 0, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 4: Continuous outsole bridge connecting forefoot & heel
  ctx.save();
  ctx.translate(258, 132);
  ctx.scale(1.0, 0.16);
  const bridgeAO = ctx.createRadialGradient(0, 0, 10, 0, 0, 155);
  bridgeAO.addColorStop(0, 'rgba(10, 8, 5, 0.72)');
  bridgeAO.addColorStop(0.65, 'rgba(10, 8, 5, 0.38)');
  bridgeAO.addColorStop(1, 'rgba(10, 8, 5, 0)');
  ctx.fillStyle = bridgeAO;
  ctx.beginPath();
  ctx.arc(0, 0, 155, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a rich architectural Warm Oak Slatted Wood Board texture for Wall 2 (`Shoes`)
 * with fine wood grain fibers, vertical architectural slat grooves, recessed frame shadow,
 * and warm overhead gallery spotlight cones.
 */
export function createOakSlattedBoardTexture(maxAnisotropy = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm honey-oak base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
  baseGrad.addColorStop(0, '#d2a86e');
  baseGrad.addColorStop(0.5, '#c79b60');
  baseGrad.addColorStop(1, '#b88b50');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Fine organic wood-grain planks & cathedral grain variation
  for (let i = 0; i < 180; i++) {
    const y = (i * 2.9) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 76, 28, 0.045)' : 'rgba(255, 226, 182, 0.035)';
    ctx.fillRect(0, y, 1024, 1.8);
  }

  // Subtle vertical architectural slat joinery lines across the oak board
  for (let x = 32; x < 1024; x += 32) {
    ctx.fillStyle = 'rgba(72, 44, 14, 0.16)';
    ctx.fillRect(x, 12, 2, 488);
    ctx.fillStyle = 'rgba(255, 228, 185, 0.10)';
    ctx.fillRect(x + 2, 12, 1.5, 488);
  }

  // 3 Overhead Gallery Track Spotlight Cones illuminating the 3 columns of sneakers
  [196, 512, 828].forEach((spotX) => {
    const spotGrad = ctx.createRadialGradient(spotX, 60, 10, spotX, 230, 260);
    spotGrad.addColorStop(0, 'rgba(255, 244, 220, 0.22)');
    spotGrad.addColorStop(0.55, 'rgba(255, 235, 200, 0.08)');
    spotGrad.addColorStop(1, 'rgba(255, 235, 200, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(spotX - 260, 0, 520, 512);
  });

  // Recessed dark-bronze architectural border frame
  ctx.strokeStyle = 'rgba(58, 36, 12, 0.42)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 1014, 502);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates the HORIZONTAL FRONT-FACING STUDIO GARMENT TEXTURE (`frontGroup`)
 */
export function createPhotorealGarmentTexture(
  product: Product,
  colorIndex: number,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  if (product.isShoe) {
    return createPhotorealShoeTexture(product, maxAnisotropy);
  }
  if (product.isBag) {
    return createPhotorealBagTexture(product, maxAnisotropy);
  }
  if (product.isCap) {
    return createPhotorealCapTexture(product, maxAnisotropy);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  if (product.customFrontImage) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawCustomImageWithSmartMatting(ctx, img);
      tex.needsUpdate = true;
    };
    img.src = product.customFrontImage;
    return tex;
  }

  ensureProductPhotoLoaded(product, (photo) => {
    renderPhotographicShirtToCanvas(ctx, photo, product, colorIndex);
    tex.needsUpdate = true;
  });

  return tex;
}

/**
 * Generates the narrow VERTICAL SIDE-PROFILE HANGING TEXTURE (`sideGroup`)
 */
export function createPhotorealSideProfileTexture(
  product: Product,
  colorIndex: number,
  maxAnisotropy = 1
): THREE.CanvasTexture {
  if (product.isShoe) {
    return createPhotorealShoeTexture(product, maxAnisotropy);
  }
  if (product.isBag) {
    return createPhotorealBagTexture(product, maxAnisotropy);
  }
  if (product.isCap) {
    return createPhotorealCapTexture(product, maxAnisotropy);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  if (product.customSideImage || product.customFrontImage) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 1024;
      tempCanvas.height = 1024;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
      drawCustomImageWithSmartMatting(tempCtx, img);

      ctx.clearRect(0, 0, 1024, 1024);
      ctx.save();
      const clip = new Path2D(
        'M464 90 C486 78 538 78 560 90 C586 112 608 195 622 390 C630 565 632 765 628 892 C594 936 430 936 396 892 C392 765 394 565 402 390 C416 195 438 112 464 90 Z'
      );
      ctx.clip(clip);
      ctx.drawImage(tempCanvas, 180, 10, 664, 1000, 385, 10, 254, 1000);
      ctx.restore();
      drawHangerHookAndBar(ctx, 'navy-overshirt', 512, 94);
      tex.needsUpdate = true;
    };
    img.src = product.customSideImage || product.customFrontImage!;
    return tex;
  }

  ensureProductPhotoLoaded(product, (photo) => {
    renderPhotographicSideProfileToCanvas(ctx, photo, product, colorIndex);
    tex.needsUpdate = true;
  });

  return tex;
}

/**
 * Renders Slide 2 in Quick View: High-Resolution Studio Collar/Upper Detail Close-Up
 */
export function renderLookbookPortraitCanvas(
  canvas: HTMLCanvasElement,
  product: Product,
  colorIndex: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (product.isShoe) {
    ensureShoeCanvasLoaded(product, (leveled) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(leveled, 70, 180, 884, 710, 0, 0, w, h);
    });
    return;
  }
  if (product.isBag) {
    ensureBagCanvasLoaded(product, (cleanBag) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(cleanBag, 90, 90, 844, 820, 0, 0, w, h);
    });
    return;
  }
  if (product.isCap) {
    ensureCapCanvasLoaded(product, (cleanCap) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(cleanCap, 80, 140, 864, 760, 0, 0, w, h);
    });
    return;
  }

  ensureProductPhotoLoaded(product, (photo) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = photo.width;
    offscreen.height = photo.height;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })!;
    renderPhotographicShirtToCanvas(offCtx, photo, product, colorIndex);

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(offscreen, 175, 55, 674, 650, 0, 0, w, h);
  });
}

export function createCloudPuffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(255, 210, 175, 0.58)');
  grad.addColorStop(0.45, 'rgba(242, 162, 132, 0.30)');
  grad.addColorStop(0.78, 'rgba(214, 130, 120, 0.09)');
  grad.addColorStop(1, 'rgba(214, 130, 120, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function renderMacroFabricCanvas(
  canvas: HTMLCanvasElement,
  product: Product,
  colorIndex: number,
  zoomLevel = 1
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (product.isShoe) {
    ensureShoeCanvasLoaded(product, (leveled) => {
      ctx.clearRect(0, 0, w, h);
      const cropSize = Math.round(420 / zoomLevel);
      const startX = 512 - Math.round(cropSize * 0.5);
      const startY = 580 - Math.round(cropSize * 0.5);
      ctx.drawImage(leveled, startX, startY, cropSize, cropSize, 0, 0, w, h);
    });
    return;
  }
  if (product.isBag) {
    ensureBagCanvasLoaded(product, (cleanBag) => {
      ctx.clearRect(0, 0, w, h);
      const cropSize = Math.round(440 / zoomLevel);
      const startX = 512 - Math.round(cropSize * 0.5);
      const startY = 560 - Math.round(cropSize * 0.5);
      ctx.drawImage(cleanBag, startX, startY, cropSize, cropSize, 0, 0, w, h);
    });
    return;
  }
  if (product.isCap) {
    ensureCapCanvasLoaded(product, (cleanCap) => {
      ctx.clearRect(0, 0, w, h);
      const cropSize = Math.round(420 / zoomLevel);
      const startX = 512 - Math.round(cropSize * 0.5);
      const startY = 520 - Math.round(cropSize * 0.5);
      ctx.drawImage(cleanCap, startX, startY, cropSize, cropSize, 0, 0, w, h);
    });
    return;
  }

  ensureProductPhotoLoaded(product, (photo) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = photo.width;
    offscreen.height = photo.height;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })!;
    renderPhotographicShirtToCanvas(offCtx, photo, product, colorIndex);

    ctx.clearRect(0, 0, w, h);
    // Zoom directly into the real photographic chest fabric & graphic/pocket detail!
    const cropSize = Math.round(360 / zoomLevel);
    const startX = 512 - Math.round(cropSize * 0.5);
    const startY = 390 - Math.round(cropSize * 0.5);
    ctx.drawImage(offscreen, startX, startY, cropSize, cropSize, 0, 0, w, h);
  });
}
