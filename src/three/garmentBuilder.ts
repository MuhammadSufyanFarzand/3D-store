import * as THREE from 'three';
import { BAG_PRODUCTS, CAP_PRODUCTS, Product, SHOE_PRODUCTS } from '../data/products';
import {
  ROOM_WALL_THEMES,
  createConcreteWallTexture,
  createOakSlattedBoardTexture,
  createPhotorealBagTexture,
  createPhotorealCapTexture,
  createPhotorealGarmentTexture,
  createPhotorealShoeTexture,
  createPhotorealSideProfileTexture,
  createShoeShelfContactShadowTexture,
  createTravertineFloorTexture,
} from './proceduralTextures';

export const SHOE_SHELF_SLOTS: { u: number; v: number }[] = [
  { u: -1.88, v: 0.24 },
  { u: 0.0, v: 0.24 },
  { u: 1.88, v: 0.24 },
  { u: -1.88, v: -0.82 },
  { u: 0.0, v: -0.82 },
  { u: 1.88, v: -0.82 },
];

export const BAG_CUBBY_SLOTS: { u: number; v: number; shelfTopV: number; row: number }[] = [
  // Row 0: 3 Luxury Bags displayed inside the Upper 3 Illuminated Oak Cubby Cabins
  { u: -1.88, v: -0.78, shelfTopV: -1.20, row: 0 },
  { u: 0.0, v: -0.78, shelfTopV: -1.20, row: 0 },
  { u: 1.88, v: -0.78, shelfTopV: -1.20, row: 0 },
  // Row 1: 3 Luxury Bags displayed inside the Lower 3 Illuminated Oak Cubby Cabins
  { u: -1.88, v: -1.99, shelfTopV: -2.41, row: 1 },
  { u: 0.0, v: -1.99, shelfTopV: -2.41, row: 1 },
  { u: 1.88, v: -1.99, shelfTopV: -2.41, row: 1 },
];

export const CAP_SHELF_SLOTS: { u: number; v: number }[] = [
  { u: -1.04, v: 0.26 },
  { u: 1.04, v: 0.26 },
  { u: -1.04, v: -0.58 },
  { u: 1.04, v: -0.58 },
];

export interface GarmentMeshRefs {
  group: THREE.Group;
  frontGroup: THREE.Group;
  sideGroup: THREE.Group;
  turntableGroup: THREE.Group;
  clothFrontMat: THREE.MeshStandardMaterial;
  clothEdgeMat: THREE.MeshStandardMaterial;
  clothBackMat: THREE.MeshStandardMaterial;
  sideProfileMat: THREE.MeshStandardMaterial;
  product: Product;
  currentColorIdx: number;
  customFrontSignature: string;
}

export interface ShowroomRoomRefs {
  group: THREE.Group;
  floorMat: THREE.MeshStandardMaterial;
  frontWallMat: THREE.MeshStandardMaterial;
  sideWallMat: THREE.MeshStandardMaterial;
  southWallMat: THREE.MeshStandardMaterial;
  westWallMat: THREE.MeshStandardMaterial;
  ceilingMat: THREE.MeshStandardMaterial;
  plinthMat: THREE.MeshStandardMaterial;
  rackPipeMat: THREE.MeshPhysicalMaterial;
  shoeGroups: THREE.Group[];
  bagGroups: THREE.Group[];
  capGroups: THREE.Group[];
  centerPedestalGroup: THREE.Group;
  centerTurntableGroup: THREE.Group;
  centerItemMesh: THREE.Mesh;
  centerItemMat: THREE.MeshStandardMaterial;
  chandelierRingMat: THREE.MeshBasicMaterial;
  pedestalGlowMat: THREE.MeshBasicMaterial;
  currentCenterProductId: string;
  currentWallIdx: number;
}

/**
 * Builds a True Volumetric 3D Product / Garment Group:
 * 1) `frontGroup`: Sculpted 3D Front Relief Shell + 12-Layer Volumetric 3D Extrusion Core + Sculpted 3D Back Shell
 *    so rotating 360° in Quick View feels genuinely 3D with real physical depth and lighting.
 * 2) `turntableGroup`: 3D Studio Turntable Ring & Contact Shadow beneath the product during Quick View.
 * 3) `sideGroup`: Narrow Vertical Side-Profile hanging shirt for rail mode.
 */
export function createGarmentGroup(
  product: Product,
  colorIndex: number,
  _sharedWoodTex: THREE.CanvasTexture,
  _sharedFleeceBump: THREE.CanvasTexture,
  maxAnisotropy: number
): GarmentMeshRefs {
  const group = new THREE.Group();
  group.name = `garment-${product.id}`;

  const isAccessory = Boolean(product.isShoe || product.isBag || product.isCap);

  const frontTex = createPhotorealGarmentTexture(product, colorIndex, maxAnisotropy);
  const sideTex = createPhotorealSideProfileTexture(product, colorIndex, maxAnisotropy);

  const clothFrontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    transparent: true,
    alphaTest: 0.35,
    side: THREE.DoubleSide,
    roughness: isAccessory ? 0.42 : 0.78,
    metalness: isAccessory ? 0.12 : 0.04,
    envMapIntensity: isAccessory ? 0.65 : 0.25,
  });

  // Slightly shaded material for the volumetric 3D side/extrusion layers so edges have real 3D bevel depth
  const clothEdgeMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    color: new THREE.Color(0xd2cbc0),
    transparent: true,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.55,
    metalness: 0.08,
  });

  const sideProfileMat = new THREE.MeshStandardMaterial({
    map: sideTex,
    transparent: true,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.02,
  });

  const meshY = -1.55;
  const v = new THREE.Vector3();

  // =========================================================================
  // POSTURE A: VOLUMETRIC 3D SCULPTED MODEL (`frontGroup`)
  // =========================================================================
  const frontGroup = new THREE.Group();
  group.add(frontGroup);

  const planeW = isAccessory ? 2.65 : 2.98;
  const planeH = isAccessory ? 2.65 : 3.28;

  // Helper to build a sculpted 3D relief shell (`direction = +1` for front, `-1` for back)
  const buildReliefGeo = (direction: 1 | -1, reliefScale = 1.0) => {
    const geo = new THREE.PlaneGeometry(planeW, planeH, 64, 64);
    const posAttr = geo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const nx = v.x / (planeW / 2);
      const ny = v.y / (planeH / 2);

      let totalZ = 0;
      if (product.isShoe) {
        // 3D Sneaker upper dome, vamp arch, heel counter & thick sculpted midsole ridge
        const upperDome =
          Math.exp(-Math.pow(nx * 1.15, 2)) *
          Math.exp(-Math.pow((ny + 0.08) * 1.35, 2)) *
          0.26;
        const midsoleArch =
          ny < -0.18 && ny > -0.76 && Math.abs(nx) < 0.78
            ? Math.cos(nx * Math.PI * 0.9) * 0.14
            : 0;
        const collarPuff =
          Math.exp(-Math.pow((nx - 0.12) * 2.2, 2)) *
          Math.exp(-Math.pow((ny - 0.22) * 2.2, 2)) *
          0.1;
        totalZ = (upperDome + midsoleArch + collarPuff) * reliefScale;
      } else if (product.isBag) {
        // 3D Structured Luxury Bag body gusset + front flap relief
        const bagBody =
          Math.abs(nx) < 0.68 && ny < 0.28 && ny > -0.75
            ? Math.cos(nx * Math.PI * 0.68) * Math.cos((ny + 0.24) * Math.PI * 0.85) * 0.28
            : 0;
        const flapRelief =
          Math.abs(nx) < 0.62 && ny > -0.15 && ny < 0.25 ? 0.065 : 0;
        totalZ = (bagBody + flapRelief) * reliefScale;
      } else if (product.isCap) {
        // 3D Structured 6-Panel Crown Dome + Curved Visor Brim
        const crownDome =
          Math.exp(-Math.pow(nx * 1.35, 2)) *
          Math.exp(-Math.pow((ny - 0.06) * 1.45, 2)) *
          0.28;
        const visorCurve =
          ny < -0.05 && ny > -0.62 && Math.abs(nx) < 0.72
            ? Math.cos(nx * Math.PI * 0.95) * 0.16
            : 0;
        totalZ = (crownDome + visorCurve) * reliefScale;
      } else {
        // 3D Garment torso volume, collar & hanger relief, placket step, and natural fabric drape
        const torsoEnvelope =
          Math.exp(-Math.pow(nx * 1.18, 2)) * Math.exp(-Math.pow((ny + 0.05) * 1.02, 2));
        const hangerAndCollarRelief =
          ny > 0.48 && ny < 0.88 && Math.abs(nx) < 0.36
            ? Math.cos(nx * Math.PI * 1.2) * 0.075
            : 0;
        const isOuterShirtPanel =
          ny < 0.52 && ny > -0.78 && Math.abs(nx) > 0.085 && Math.abs(nx) < 0.62;
        const placketStep = isOuterShirtPanel ? 0.042 : 0;
        const drapeRipples =
          Math.sin(nx * Math.PI * 3.0) * 0.028 * (1 - Math.max(0, ny) * 0.65);

        totalZ =
          (torsoEnvelope * 0.22 + hangerAndCollarRelief + placketStep + drapeRipples) *
          reliefScale;
      }

      posAttr.setXYZ(i, v.x, v.y, direction * totalZ);
    }
    geo.computeVertexNormals();
    return geo;
  };

  const halfThickness = isAccessory ? 0.14 : 0.09;

  // 1. Front Sculpted 3D Shell
  const frontReliefGeo = buildReliefGeo(1, 1.0);
  const frontMesh = new THREE.Mesh(frontReliefGeo, clothFrontMat);
  frontMesh.position.set(0, meshY, halfThickness);
  frontGroup.add(frontMesh);

  // 2. Back Sculpted 3D Shell (gives full 3D curvature when rotated past 90°–180°)
  const backReliefGeo = buildReliefGeo(-1, 0.92);
  const backMesh = new THREE.Mesh(backReliefGeo, clothFrontMat);
  backMesh.position.set(0, meshY, -halfThickness);
  frontGroup.add(backMesh);

  // 3. Volumetric 3D Extrusion Core (12 stacked intermediate shells bridging -halfThickness to +halfThickness)
  const sliceGeo = buildReliefGeo(1, 0.35);
  const sliceCount = 12;
  for (let s = 1; s < sliceCount; s++) {
    const t = s / sliceCount;
    const zOffset = THREE.MathUtils.lerp(-halfThickness, halfThickness, t);
    const edgeScale = 1.0 - Math.abs(t - 0.5) * 0.03;
    const sliceMesh = new THREE.Mesh(sliceGeo, clothEdgeMat);
    sliceMesh.position.set(0, meshY, zOffset);
    sliceMesh.scale.set(edgeScale, edgeScale, 1);
    frontGroup.add(sliceMesh);
  }

  // =========================================================================
  // 3D STUDIO TURNTABLE PEDESTAL RING (VISIBLE IN QUICK VIEW)
  // =========================================================================
  const turntableGroup = new THREE.Group();
  turntableGroup.position.set(0, meshY - (isAccessory ? 1.08 : 1.48), 0);
  turntableGroup.visible = false;
  group.add(turntableGroup);

  const platformDiscMat = new THREE.MeshStandardMaterial({
    color: 0xf3efe8,
    roughness: 0.35,
    metalness: 0.08,
  });
  const platformDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.18, 0.06, 48),
    platformDiscMat
  );
  platformDisc.position.y = -0.03;
  turntableGroup.add(platformDisc);

  const goldRingMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });
  const outerBezelRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.018, 16, 64),
    goldRingMat
  );
  outerBezelRing.rotation.x = Math.PI / 2;
  outerBezelRing.position.y = 0.0;
  turntableGroup.add(outerBezelRing);

  // 12 radial 3D degree tick markers around the turntable rim so rotation is unmistakably 3D
  const tickGeo = new THREE.BoxGeometry(0.025, 0.012, 0.09);
  for (let tIdx = 0; tIdx < 12; tIdx++) {
    const ang = (tIdx / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, goldRingMat);
    tick.position.set(Math.sin(ang) * 1.04, 0.006, Math.cos(ang) * 1.04);
    tick.rotation.y = ang;
    turntableGroup.add(tick);
  }

  // =========================================================================
  // POSTURE B: NARROW VERTICAL SIDE-PROFILE HANGING SHIRT (`sideGroup`)
  // =========================================================================
  const sideGroup = new THREE.Group();
  group.add(sideGroup);

  const sideGeo = new THREE.PlaneGeometry(2.98, 3.28, 48, 48);
  const sPos = sideGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    v.fromBufferAttribute(sPos, i);
    const nx = v.x / (2.98 / 2);
    const ny = v.y / (3.28 / 2);
    const sideCyl = Math.exp(-Math.pow(nx * 2.8, 2)) * 0.095;
    const sideWave = Math.sin(ny * Math.PI * 3.0) * 0.012;
    sPos.setXYZ(i, v.x, v.y, sideCyl + sideWave);
  }
  sideGeo.computeVertexNormals();

  const sideFrontMesh = new THREE.Mesh(sideGeo, sideProfileMat);
  sideFrontMesh.position.set(0, meshY, 0);
  sideGroup.add(sideFrontMesh);

  return {
    group,
    frontGroup,
    sideGroup,
    turntableGroup,
    clothFrontMat,
    clothEdgeMat,
    clothBackMat: clothFrontMat,
    sideProfileMat,
    product,
    currentColorIdx: colorIndex,
    customFrontSignature: product.customFrontImage || '',
  };
}

/**
 * Dynamically re-dyes or updates both the Horizontal Front-Facing and Vertical Side-Profile 3D meshes
 */
export function updateGarmentColors(
  refs: GarmentMeshRefs,
  colorIndex: number,
  maxAnisotropy: number
) {
  const sig = refs.product.customFrontImage || '';
  if (refs.currentColorIdx === colorIndex && refs.customFrontSignature === sig) return;
  refs.currentColorIdx = colorIndex;
  refs.customFrontSignature = sig;

  const newFrontTex = createPhotorealGarmentTexture(refs.product, colorIndex, maxAnisotropy);
  const newSideTex = createPhotorealSideProfileTexture(refs.product, colorIndex, maxAnisotropy);

  if (refs.clothFrontMat.map) refs.clothFrontMat.map.dispose();
  refs.clothFrontMat.map = newFrontTex;
  refs.clothFrontMat.needsUpdate = true;

  if (refs.clothEdgeMat.map) refs.clothEdgeMat.map.dispose();
  refs.clothEdgeMat.map = newFrontTex;
  refs.clothEdgeMat.needsUpdate = true;

  if (refs.sideProfileMat.map) refs.sideProfileMat.map.dispose();
  refs.sideProfileMat.map = newSideTex;
  refs.sideProfileMat.needsUpdate = true;
}

/**
 * Helper to create crisp architectural wall signage or poster textures
 */
function createSignCanvasTexture(
  text: string,
  bgHex: string,
  fgHex: string,
  subText?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 768, 192);

  // Subtle brushed-brass double border
  ctx.strokeStyle = 'rgba(209, 172, 110, 0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 752, 176);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, 736, 160);

  ctx.fillStyle = fgHex;
  ctx.font = `800 ${text.length > 8 ? 58 : 68}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, subText ? 80 : 96);

  if (subText) {
    ctx.fillStyle = '#d4af72';
    ctx.font = '600 20px Inter, system-ui, sans-serif';
    ctx.fillText(subText, 384, 142);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFramedPosterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // White matboard background
  ctx.fillStyle = '#f8f7f4';
  ctx.fillRect(0, 0, 512, 640);

  // Inner black border
  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, 464, 592);

  // Editorial typography ("LAYERS THAT HANG RIGHT" style)
  ctx.fillStyle = '#141414';
  ctx.font = 'italic 900 54px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('LAYERS', 64, 150);
  ctx.fillText('THAT', 64, 212);
  ctx.fillText('HANG', 64, 274);
  ctx.fillText('RIGHT.', 64, 336);

  // Minimalist diagonal brushstroke / swoosh graphic
  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(72, 470);
  ctx.quadraticCurveTo(210, 540, 420, 405);
  ctx.stroke();

  ctx.font = '700 17px Inter, monospace';
  ctx.fillStyle = '#333333';
  ctx.fillText('SAQIB VISUALS · STUDIO EDITION', 64, 565);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the 360° 4-Wall Virtual Store Room with Stylish Painted Mall Walls & SAQIB VISUALS Branding:
 * - Room center is at `(0, 0, 5.2)` so the North Wall (`Wall 0 — Clothing`) sits at `z = -0.65` right behind the garments.
 * - East Wall (`Wall 1 — Shoes`): Deep Slate-Teal Mall Wall + Overhead "SHOES" sign + warm oak wall board + 6 3D sneakers on white floating shelves.
 * - South Wall (`Wall 2 — Bags`): Venetian Terracotta Mall Wall + Overhead "BAGS" sign + empty warm oak 2x3 cubby display table + wall hooks.
 * - West Wall (`Wall 3 — Caps`): Deep Forest Sage Mall Wall + Overhead "CAPS" sign + warm oak display board + 2 rows of empty cap shelves + table.
 */
export function createShowroomRoomGroup(maxAnisotropy: number): ShowroomRoomRefs {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'architectural-showroom-room';

  const initialTheme = ROOM_WALL_THEMES[0];
  const floorTex = createTravertineFloorTexture(maxAnisotropy, 0);
  const northWallTex = createConcreteWallTexture(maxAnisotropy, 0);
  const eastWallTex = createConcreteWallTexture(maxAnisotropy, 1);
  const southWallTex = createConcreteWallTexture(maxAnisotropy, 2);
  const westWallTex = createConcreteWallTexture(maxAnisotropy, 3);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.38,
    metalness: 0.06,
  });

  const frontWallMat = new THREE.MeshStandardMaterial({
    map: northWallTex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const sideWallMat = new THREE.MeshStandardMaterial({
    map: eastWallTex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const southWallMat = new THREE.MeshStandardMaterial({
    map: southWallTex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const westWallMat = new THREE.MeshStandardMaterial({
    map: westWallTex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const oakWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc9a068,
    roughness: 0.52,
    metalness: 0.05,
  });

  const oakDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa67c46,
    roughness: 0.58,
    metalness: 0.05,
  });

  const whiteShelfMat = new THREE.MeshStandardMaterial({
    color: 0xfaf9f6,
    roughness: 0.32,
    metalness: 0.06,
  });

  const rackPipeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialTheme.pipeColor),
    metalness: 0.88,
    roughness: 0.2,
    clearcoat: 0.6,
  });

  const chromePipeMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6edf5,
    metalness: 0.94,
    roughness: 0.15,
    clearcoat: 0.6,
  });

  const roomCenterZ = 5.2;
  const halfRoom = 5.85; // North z = -0.65, South z = +11.05, West x = -5.85, East x = +5.85
  const floorY = -2.65;
  const ceilingY = 3.15;
  const roomHeight = ceilingY - floorY;
  const wallCenterY = (ceilingY + floorY) / 2;

  // =========================================================================
  // 1. NORTH WALL (WALL 0 — CLOTHING RACK WALL AT z = -0.65)
  // =========================================================================
  const northWallZ = roomCenterZ - halfRoom; // -0.65
  const wallGeo = new THREE.PlaneGeometry(halfRoom * 2, roomHeight);

  const northWallMesh = new THREE.Mesh(wallGeo, frontWallMat);
  northWallMesh.position.set(0, wallCenterY, northWallZ);
  northWallMesh.receiveShadow = true;
  roomGroup.add(northWallMesh);

  // 3D Architectural Brand Sign ("SAQIB VISUALS") on the North Wall above the clothing pipe bar (below top navbar)
  const brandSignTex = createSignCanvasTexture(
    'SAQIB VISUALS',
    '#171412',
    '#F7F1E5',
    'FLAGSHIP BOUTIQUE'
  );
  const brandSignMat = new THREE.MeshBasicMaterial({ map: brandSignTex });
  const brandSignMesh = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.54, 0.08), brandSignMat);
  brandSignMesh.position.set(0, 1.42, northWallZ + 0.05);
  roomGroup.add(brandSignMesh);

  // Framed B&W Editorial Poster on the Left of the Clothing Wall
  const posterTex = createFramedPosterTexture();
  const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });
  const posterGroup = new THREE.Group();
  posterGroup.position.set(-4.55, 0.22, northWallZ + 0.04);
  const frameBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 1.72, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.4 })
  );
  const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.62), posterMat);
  posterFace.position.z = 0.035;
  posterGroup.add(frameBox, posterFace);
  roomGroup.add(posterGroup);

  // Wall-Mounted Horizontal Garment Pipe Bar (`samne wali wall pa pipe`)
  const pipeY = 0.88;
  const pipeZ = -0.02;
  const halfSpan = 4.55;
  const tubeRadius = 0.036;

  const topBarGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, halfSpan * 2, 24);
  topBarGeo.rotateZ(Math.PI / 2);
  const topBarMesh = new THREE.Mesh(topBarGeo, rackPipeMat);
  topBarMesh.position.set(0, pipeY, pipeZ);
  topBarMesh.castShadow = true;
  roomGroup.add(topBarMesh);

  const chromeStripGeo = new THREE.CylinderGeometry(
    tubeRadius * 0.48,
    tubeRadius * 0.48,
    halfSpan * 1.98,
    16
  );
  chromeStripGeo.rotateZ(Math.PI / 2);
  const chromeStripMesh = new THREE.Mesh(chromeStripGeo, chromePipeMat);
  chromeStripMesh.position.set(0, pipeY + tubeRadius * 0.65, pipeZ);
  roomGroup.add(chromeStripMesh);

  // Wall-Mounting Standoff Brackets bolting the horizontal bar straight into the North Wall
  [-4.15, 4.15].forEach((bx) => {
    const armDepth = pipeZ - northWallZ;
    const armGeo = new THREE.CylinderGeometry(0.028, 0.028, armDepth, 16);
    armGeo.rotateX(Math.PI / 2);
    const armMesh = new THREE.Mesh(armGeo, rackPipeMat);
    armMesh.position.set(bx, pipeY, northWallZ + armDepth / 2);
    roomGroup.add(armMesh);

    const flangeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.025, 20);
    flangeGeo.rotateX(Math.PI / 2);
    const flangeMesh = new THREE.Mesh(flangeGeo, chromePipeMat);
    flangeMesh.position.set(bx, pipeY, northWallZ + 0.015);
    roomGroup.add(flangeMesh);
  });

  // Low Warm-Oak Wooden Display Table / Bench below the Clothing Rack on the North Wall
  const northWoodTableTop = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.12, 0.88),
    oakWoodMat
  );
  northWoodTableTop.position.set(0, floorY + 0.56, northWallZ + 0.48);
  northWoodTableTop.castShadow = true;
  northWoodTableTop.receiveShadow = true;
  roomGroup.add(northWoodTableTop);

  [-2.85, 0, 2.85].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.82), oakDarkMat);
    leg.position.set(lx, floorY + 0.28, northWallZ + 0.48);
    roomGroup.add(leg);
  });

  // =========================================================================
  // 2. EAST WALL (WALL 1 — SHOES WALL WITH OAK BOARD & 6 3D SNEAKERS)
  // =========================================================================
  const eastWallMesh = new THREE.Mesh(wallGeo, sideWallMat);
  eastWallMesh.position.set(halfRoom, wallCenterY, roomCenterZ);
  eastWallMesh.rotation.y = -Math.PI / 2;
  eastWallMesh.receiveShadow = true;
  roomGroup.add(eastWallMesh);

  const shoesFixtureGroup = new THREE.Group();
  shoesFixtureGroup.position.set(halfRoom - 0.05, 0, roomCenterZ);
  shoesFixtureGroup.rotation.y = -Math.PI / 2;
  roomGroup.add(shoesFixtureGroup);

  // Overhead suspended "SHOES" architectural sign box positioned cleanly below the top navbar
  const shoesSignTex = createSignCanvasTexture('SHOES', '#1a2329', '#ffffff');
  const shoesSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.42, 0.12),
    new THREE.MeshBasicMaterial({ map: shoesSignTex })
  );
  shoesSignMesh.position.set(0, 1.48, 0.22);
  shoesFixtureGroup.add(shoesSignMesh);

  // Compact Warm Oak Slatted Recessed Wall Board for Shoes
  const oakSlattedTex = createOakSlattedBoardTexture(maxAnisotropy);
  const shoesBoardMat = new THREE.MeshStandardMaterial({
    map: oakSlattedTex,
    roughness: 0.52,
    metalness: 0.05,
  });
  const shoesBoardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(6.02, 2.58, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.45, metalness: 0.2 })
  );
  shoesBoardFrame.position.set(0, -0.18, -0.01);
  shoesFixtureGroup.add(shoesBoardFrame);

  const shoesBoard = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.48, 0.08), shoesBoardMat);
  shoesBoard.position.set(0, -0.18, 0.01);
  shoesBoard.receiveShadow = true;
  shoesFixtureGroup.add(shoesBoard);

  // Shared Dual-Patch Outsole Contact Shadow Texture (Forefoot + Heel AO Crevice + Soft Penumbra)
  const shelfContactShadowTex = createShoeShelfContactShadowTexture();
  const shelfContactShadowMat = new THREE.MeshBasicMaterial({
    map: shelfContactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.95,
  });

  // Soft Wall Cast Shadow Texture behind each shelf & sneaker
  const shelfWallShadowMat = new THREE.MeshBasicMaterial({
    map: shelfContactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.42,
  });

  // Warm Under-Shelf Architectural LED Strip Material
  const ledStripMat = new THREE.MeshBasicMaterial({
    color: 0xfff1d6,
  });

  // Sculpted 3D Relief Geometry shared by the 6 Sneakers
  const shoePlaneW = 1.28;
  const shoePlaneH = 1.28;
  const baseShoeGeo = new THREE.PlaneGeometry(shoePlaneW, shoePlaneH, 32, 32);
  const shoePosAttr = baseShoeGeo.attributes.position;
  const sv = new THREE.Vector3();
  for (let i = 0; i < shoePosAttr.count; i++) {
    sv.fromBufferAttribute(shoePosAttr, i);
    const nx = sv.x / (shoePlaneW * 0.5);
    const ny = sv.y / (shoePlaneH * 0.5);
    // 3D sculpted sneaker upper & sole convexity
    const bodyRelief =
      Math.exp(-Math.pow(nx * 1.15, 2)) * Math.exp(-Math.pow((ny + 0.18) * 1.4, 2)) * 0.11;
    const soleRidge = ny < -0.35 && ny > -0.78 ? 0.035 : 0;
    shoePosAttr.setXYZ(i, sv.x, sv.y, bodyRelief + soleRidge);
  }
  baseShoeGeo.computeVertexNormals();

  const shoeGroups: THREE.Group[] = [];

  // 2 Rows × 3 Columns = 6 Crisp White Floating Shoe Display Shelves + 6 3D Sneakers
  SHOE_SHELF_SLOTS.forEach((slot, sIdx) => {
    // 1. Soft downward cast shadow from the floating shelf onto the oak board
    const shelfWallShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.56, 0.30),
      shelfWallShadowMat
    );
    shelfWallShadow.position.set(slot.u, slot.v - 0.085, 0.055);
    shoesFixtureGroup.add(shelfWallShadow);

    // 2. Crisp White Floating Shoe Display Shelf
    const shelfMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.44, 0.085, 0.50),
      whiteShelfMat
    );
    shelfMesh.position.set(slot.u, slot.v, 0.27);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    shoesFixtureGroup.add(shelfMesh);

    // 3. Recessed Warm LED Light Strip underneath the floating shelf
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 0.015, 0.04),
      ledStripMat
    );
    ledStrip.position.set(slot.u, slot.v - 0.046, 0.30);
    shoesFixtureGroup.add(ledStrip);

    // 4. Dedicated 3D Multi-Layered Outsole Contact Shadow on top of the white shelf
    const contactShadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 0.42),
      shelfContactShadowMat
    );
    contactShadowPlane.rotation.x = -Math.PI / 2;
    contactShadowPlane.position.set(slot.u, slot.v + 0.045, 0.33);
    shoesFixtureGroup.add(contactShadowPlane);

    const shoeProd = SHOE_PRODUCTS[sIdx];
    const shoeHolder = new THREE.Group();
    // Sneaker outsole (`soleLineY = 858` -> local y = -0.3379 * 1.28 = -0.4325) sits flush at shelf top (`slot.v + 0.043`)
    const holderBaseY = slot.v + 0.475;
    shoeHolder.position.set(slot.u, holderBaseY, 0.34);
    shoeHolder.userData = {
      baseX: slot.u,
      baseY: holderBaseY,
      baseZ: 0.34,
      shoeIndex: sIdx,
      contactShadowMesh: contactShadowPlane,
    };

    if (shoeProd) {
      const shoeTex = createPhotorealShoeTexture(shoeProd, maxAnisotropy);

      // Soft cast shadow of the sneaker silhouette onto the oak board behind it
      const wallSilhouetteMat = new THREE.MeshBasicMaterial({
        map: shoeTex,
        color: 0x1a1106,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const wallSilhouetteMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(shoePlaneW * 0.96, shoePlaneH * 0.96),
        wallSilhouetteMat
      );
      wallSilhouetteMesh.position.set(0.05, -0.04, -0.24);
      shoeHolder.add(wallSilhouetteMesh);

      const shoeMat = new THREE.MeshStandardMaterial({
        map: shoeTex,
        transparent: true,
        alphaTest: 0.04,
        side: THREE.DoubleSide,
        roughness: 0.48,
        metalness: 0.08,
      });
      const shoeMesh = new THREE.Mesh(baseShoeGeo, shoeMat);
      shoeMesh.castShadow = true;
      shoeHolder.add(shoeMesh);
    }

    shoesFixtureGroup.add(shoeHolder);
    shoeGroups.push(shoeHolder);
  });

  // Warm-Oak Wooden Display Table with Legs below the Shoes Wall Board
  const shoesTableTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.9, 0.12, 0.88),
    oakWoodMat
  );
  shoesTableTop.position.set(0, floorY + 0.64, 0.46);
  shoesTableTop.castShadow = true;
  shoesTableTop.receiveShadow = true;
  shoesFixtureGroup.add(shoesTableTop);

  [-2.65, 0, 2.65].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.64, 0.82), oakDarkMat);
    leg.position.set(lx, floorY + 0.32, 0.46);
    shoesFixtureGroup.add(leg);
  });

  // =========================================================================
  // 3. SOUTH WALL (WALL 2 — BAGS WALL WITH OAK CUBBY DISPLAY & 6 LUXURY 3D BAGS)
  // =========================================================================
  const southWallZ = roomCenterZ + halfRoom; // +11.05
  const southWallMesh = new THREE.Mesh(wallGeo, southWallMat);
  southWallMesh.position.set(0, wallCenterY, southWallZ);
  southWallMesh.rotation.y = Math.PI;
  southWallMesh.receiveShadow = true;
  roomGroup.add(southWallMesh);

  const bagsFixtureGroup = new THREE.Group();
  bagsFixtureGroup.position.set(0, 0, southWallZ - 0.05);
  bagsFixtureGroup.rotation.y = Math.PI;
  roomGroup.add(bagsFixtureGroup);

  // Overhead "BAGS" Sign positioned cleanly below the top navbar
  const bagsSignTex = createSignCanvasTexture('BAGS', '#261712', '#ffffff');
  const bagsSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.42, 0.12),
    new THREE.MeshBasicMaterial({ map: bagsSignTex })
  );
  bagsSignMesh.position.set(0, 1.48, 0.22);
  bagsFixtureGroup.add(bagsSignMesh);

  // 2x3 Oak Wooden Cubby Display Cabinet holding all 6 Luxury Bags inside the 6 Cabins
  const tableW = 5.80;
  const tableH = 2.66; // From floorY (-2.65) up to +0.01
  const tableD = 0.92;
  const tableCenterY = floorY + tableH / 2;

  // Backboard of cubby table
  const cubbyBack = new THREE.Mesh(
    new THREE.BoxGeometry(tableW, tableH, 0.06),
    oakDarkMat
  );
  cubbyBack.position.set(0, tableCenterY, 0.03);
  bagsFixtureGroup.add(cubbyBack);

  // 3 Horizontal Shelves: Bottom Cabin Floor (-2.46, top at -2.41), Middle Cabin Floor (-1.25, top at -1.20), Top Cabin Roof (-0.04, top at +0.01)
  [-2.46, -1.25, -0.04].forEach((hy) => {
    const hPlank = new THREE.Mesh(
      new THREE.BoxGeometry(tableW, 0.1, tableD),
      oakWoodMat
    );
    hPlank.position.set(0, hy, tableD / 2);
    hPlank.receiveShadow = true;
    bagsFixtureGroup.add(hPlank);
  });

  // 4 Vertical Dividers creating 3 wide illuminated cubby columns (2 rows x 3 columns = 6 Cabins)
  [-tableW / 2 + 0.05, -tableW / 6, tableW / 6, tableW / 2 - 0.05].forEach((vx) => {
    const vPlank = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, tableH, tableD),
      oakWoodMat
    );
    vPlank.position.set(vx, tableCenterY, tableD / 2);
    bagsFixtureGroup.add(vPlank);
  });

  // Sculpted 3D Leather Handbag Relief Geometry shared by the 6 Luxury Bags
  const bagPlaneW = 1.18;
  const bagPlaneH = 1.18;
  const baseBagGeo = new THREE.PlaneGeometry(bagPlaneW, bagPlaneH, 32, 32);
  const bagPosAttr = baseBagGeo.attributes.position;
  for (let i = 0; i < bagPosAttr.count; i++) {
    sv.fromBufferAttribute(bagPosAttr, i);
    const nx = sv.x / (bagPlaneW * 0.5);
    const ny = sv.y / (bagPlaneH * 0.5);
    // Structured 3D leather body convexity + arched top-handle relief
    const bodyConvex =
      Math.exp(-Math.pow(nx * 1.18, 2)) * Math.exp(-Math.pow((ny + 0.14) * 1.35, 2)) * 0.13;
    const handleArch =
      ny > 0.18 && ny < 0.78 && Math.abs(nx) < 0.42 ? 0.035 : 0;
    bagPosAttr.setXYZ(i, sv.x, sv.y, bodyConvex + handleArch);
  }
  baseBagGeo.computeVertexNormals();

  const bagGroups: THREE.Group[] = [];

  // Place all 6 Luxury 3D Bags inside the 6 Illuminated Oak Cubby Cabins (3 Upper Cabins + 3 Lower Cabins)
  BAG_CUBBY_SLOTS.forEach((slot, bIdx) => {
    // Warm recessed LED strip on the ceiling of each of the 6 cubby cabins
    const cubbyLed = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.016, 0.05),
      ledStripMat
    );
    cubbyLed.position.set(slot.u, slot.row === 0 ? -0.04 : -1.28, 0.58);
    bagsFixtureGroup.add(cubbyLed);

    // Dedicated 3D Leather Base Contact Shadow on the Oak Shelf underneath the bag
    const bagContactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.14, 0.42),
      shelfContactShadowMat
    );
    bagContactShadow.rotation.x = -Math.PI / 2;
    bagContactShadow.position.set(slot.u, slot.shelfTopV + 0.004, 0.52);
    bagsFixtureGroup.add(bagContactShadow);

    const bagProd = BAG_PRODUCTS[bIdx];
    const bagHolder = new THREE.Group();
    bagHolder.position.set(slot.u, slot.v, 0.54);
    bagHolder.userData = {
      baseX: slot.u,
      baseY: slot.v,
      baseZ: 0.54,
      bagIndex: bIdx,
      contactShadowMesh: bagContactShadow,
    };

    if (bagProd) {
      const bagTex = createPhotorealBagTexture(bagProd, maxAnisotropy);

      // Soft cast silhouette shadow of the handbag onto the wall/backboard behind it
      const bagShadowMat = new THREE.MeshBasicMaterial({
        map: bagTex,
        color: 0x160d06,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const bagShadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(bagPlaneW * 0.96, bagPlaneH * 0.96),
        bagShadowMat
      );
      bagShadowMesh.position.set(0.04, -0.03, -0.24);
      bagHolder.add(bagShadowMesh);

      const bagMat = new THREE.MeshStandardMaterial({
        map: bagTex,
        transparent: true,
        alphaTest: 0.04,
        side: THREE.DoubleSide,
        roughness: 0.42,
        metalness: 0.12,
      });
      const bagMesh = new THREE.Mesh(baseBagGeo, bagMat);
      bagMesh.castShadow = true;
      bagHolder.add(bagMesh);
    }

    bagsFixtureGroup.add(bagHolder);
    bagGroups.push(bagHolder);
  });

  // =========================================================================
  // 4. WEST WALL (WALL 3 — CAPS WALL WITH SLATTED OAK BOARD & 4 STUDIO 3D CAPS)
  // =========================================================================
  const westWallMesh = new THREE.Mesh(wallGeo, westWallMat);
  westWallMesh.position.set(-halfRoom, wallCenterY, roomCenterZ);
  westWallMesh.rotation.y = Math.PI / 2;
  westWallMesh.receiveShadow = true;
  roomGroup.add(westWallMesh);

  const capsFixtureGroup = new THREE.Group();
  capsFixtureGroup.position.set(-halfRoom + 0.05, 0, roomCenterZ);
  capsFixtureGroup.rotation.y = Math.PI / 2;
  roomGroup.add(capsFixtureGroup);

  // Overhead "CAPS" Sign positioned cleanly below the top navbar
  const capsSignTex = createSignCanvasTexture('CAPS', '#19241d', '#ffffff');
  const capsSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.42, 0.12),
    new THREE.MeshBasicMaterial({ map: capsSignTex })
  );
  capsSignMesh.position.set(0, 1.48, 0.22);
  capsFixtureGroup.add(capsSignMesh);

  // Compact Dark-Bronze Recessed Outer Architectural Frame + Slatted Oak Pegboard for Caps
  const capsBoardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.42, 2.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.45, metalness: 0.2 })
  );
  capsBoardFrame.position.set(0, 0.04, -0.01);
  capsFixtureGroup.add(capsBoardFrame);

  const capsBoard = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.96, 0.08), shoesBoardMat);
  capsBoard.position.set(0, 0.04, 0.01);
  capsBoard.receiveShadow = true;
  capsFixtureGroup.add(capsBoard);

  // Smooth Sculpted 3D Headwear Dome Geometry shared by the 4 Caps (zero sharp step ridges)
  const capPlaneW = 0.84;
  const capPlaneH = 0.84;
  const baseCapGeo = new THREE.PlaneGeometry(capPlaneW, capPlaneH, 32, 32);
  const capPosAttr = baseCapGeo.attributes.position;
  for (let i = 0; i < capPosAttr.count; i++) {
    sv.fromBufferAttribute(capPosAttr, i);
    const nx = sv.x / (capPlaneW * 0.5);
    const ny = sv.y / (capPlaneH * 0.5);
    // Smooth continuous 3D dome relief without any step discontinuity
    const crownDome =
      Math.exp(-Math.pow(nx * 1.15, 2)) *
      Math.exp(-Math.pow((ny + 0.08) * 1.2, 2)) *
      0.075;
    capPosAttr.setXYZ(i, sv.x, sv.y, crownDome);
  }
  baseCapGeo.computeVertexNormals();

  const capGroups: THREE.Group[] = [];

  // 2 Rows × 2 Columns = 4 Crisp White Floating Cap Display Ledges + 4 Interactive 3D Caps
  CAP_SHELF_SLOTS.forEach((slot, cIdx) => {
    // 1. Soft downward cast shadow from the floating cap shelf onto the oak board
    const capShelfWallShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.30, 0.26),
      shelfWallShadowMat
    );
    capShelfWallShadow.position.set(slot.u, slot.v - 0.075, 0.055);
    capsFixtureGroup.add(capShelfWallShadow);

    // 2. Crisp White Floating Cap Display Shelf
    const capShelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 0.075, 0.44),
      whiteShelfMat
    );
    capShelf.position.set(slot.u, slot.v, 0.24);
    capShelf.castShadow = true;
    capShelf.receiveShadow = true;
    capsFixtureGroup.add(capShelf);

    // 3. Recessed Warm LED Light Strip underneath the floating cap shelf
    const capLed = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.015, 0.04),
      ledStripMat
    );
    capLed.position.set(slot.u, slot.v - 0.042, 0.27);
    capsFixtureGroup.add(capLed);

    // 4. Dedicated 3D Multi-Layered Contact Shadow on top of the white cap shelf
    const capContactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.35),
      shelfContactShadowMat
    );
    capContactShadow.rotation.x = -Math.PI / 2;
    capContactShadow.position.set(slot.u, slot.v + 0.040, 0.30);
    capsFixtureGroup.add(capContactShadow);

    const capProd = CAP_PRODUCTS[cIdx];
    const capHolder = new THREE.Group();
    // Cap base (`capBaseLineY = 858` -> local y = -0.3379 * 0.84 = -0.2838) sits flush at shelf top (`slot.v + 0.038`)
    const holderBaseY = slot.v + 0.322;
    capHolder.position.set(slot.u, holderBaseY, 0.31);
    capHolder.userData = {
      baseX: slot.u,
      baseY: holderBaseY,
      baseZ: 0.31,
      capIndex: cIdx,
      contactShadowMesh: capContactShadow,
    };

    if (capProd) {
      const capTex = createPhotorealCapTexture(capProd, maxAnisotropy);

      // Soft cast silhouette shadow of the cap onto the oak board behind it
      const capWallShadowMat = new THREE.MeshBasicMaterial({
        map: capTex,
        color: 0x1a1106,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const capWallShadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(capPlaneW * 0.96, capPlaneH * 0.96),
        capWallShadowMat
      );
      capWallShadowMesh.position.set(0.04, -0.03, -0.22);
      capHolder.add(capWallShadowMesh);

      const capMat = new THREE.MeshStandardMaterial({
        map: capTex,
        transparent: true,
        alphaTest: 0.04,
        side: THREE.DoubleSide,
        roughness: 0.48,
        metalness: 0.08,
      });
      const capMesh = new THREE.Mesh(baseCapGeo, capMat);
      capMesh.castShadow = true;
      capHolder.add(capMesh);
    }

    capsFixtureGroup.add(capHolder);
    capGroups.push(capHolder);
  });

  // Low Wooden Display Table under the Caps Board
  const capsTableTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 0.12, 0.88),
    oakWoodMat
  );
  capsTableTop.position.set(0, floorY + 0.78, 0.48);
  capsFixtureGroup.add(capsTableTop);

  [-1.95, 1.95].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.82), oakDarkMat);
    leg.position.set(lx, floorY + 0.39, 0.48);
    capsFixtureGroup.add(leg);
  });

  // =========================================================================
  // 5. LEGACY CENTER PEDESTAL REFS (HIDDEN — REPLACED BY CLEAN WOODEN TABLES)
  // =========================================================================
  const centerPedestalGroup = new THREE.Group();
  centerPedestalGroup.name = 'center-luxury-display-pedestal';
  centerPedestalGroup.position.set(0, floorY, roomCenterZ);
  centerPedestalGroup.visible = false;

  const neroMarbleMat = new THREE.MeshPhysicalMaterial({
    color: 0x121110,
    roughness: 0.16,
    metalness: 0.12,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });

  const brushedGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.5,
  });

  const pedestalGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf5d77f,
  });

  // Part 1: Wide Floor Ambient Shadow / Gold Halo Disc
  const baseFloorDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.24, 0.04, 40),
    neroMarbleMat
  );
  baseFloorDisc.position.set(0, 0.02, 0);
  baseFloorDisc.receiveShadow = true;
  centerPedestalGroup.add(baseFloorDisc);

  // Part 2: Glowing Recessed Gold Floor LED Ring
  const floorLedRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.014, 12, 48),
    pedestalGlowMat
  );
  floorLedRing.rotation.x = Math.PI / 2;
  floorLedRing.position.set(0, 0.042, 0);
  centerPedestalGroup.add(floorLedRing);

  // Part 3: Stepped Octagonal Obsidian Marble Plinth Column
  const plinthCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.88, 0.52, 8),
    neroMarbleMat
  );
  plinthCore.position.set(0, 0.28, 0);
  plinthCore.castShadow = true;
  plinthCore.receiveShadow = true;
  centerPedestalGroup.add(plinthCore);

  // Part 4: Brushed Brass Architectural Waist Band around the Marble Column
  const waistGoldBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.83, 0.83, 0.045, 32),
    brushedGoldMat
  );
  waistGoldBand.position.set(0, 0.54, 0);
  centerPedestalGroup.add(waistGoldBand);

  // Part 5: Polished Nero Marquina Black Marble Tabletop Deck
  const marbleTableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 0.98, 0.09, 40),
    neroMarbleMat
  );
  marbleTableTop.position.set(0, 0.60, 0);
  marbleTableTop.castShadow = true;
  marbleTableTop.receiveShadow = true;
  centerPedestalGroup.add(marbleTableTop);

  // Part 6: Brushed Gold Bezel Rim around the Tabletop
  const tableTopGoldRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.03, 0.02, 16, 48),
    brushedGoldMat
  );
  tableTopGoldRim.rotation.x = Math.PI / 2;
  tableTopGoldRim.position.set(0, 0.64, 0);
  centerPedestalGroup.add(tableTopGoldRim);

  // Part 7: Crystal Glass Display Case / Cylindrical Vitrine Dome + 4 Brass Pillars
  const glassVitrineMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.06,
    metalness: 0.05,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const glassDome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.74, 0.82, 32, 1, true),
    glassVitrineMat
  );
  glassDome.position.set(0, 1.05, 0);
  centerPedestalGroup.add(glassDome);

  const vitrineTopCap = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.018, 14, 48),
    brushedGoldMat
  );
  vitrineTopCap.rotation.x = Math.PI / 2;
  vitrineTopCap.position.set(0, 1.46, 0);
  centerPedestalGroup.add(vitrineTopCap);

  for (let pIdx = 0; pIdx < 4; pIdx++) {
    const angle = (pIdx * Math.PI) / 2 + Math.PI / 4;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.82, 12),
      brushedGoldMat
    );
    pillar.position.set(Math.cos(angle) * 0.74, 1.05, Math.sin(angle) * 0.74);
    centerPedestalGroup.add(pillar);
  }

  // Part 8: Rotating 360° Brushed-Gold Turntable & Featured "DROP OF THE WEEK" Piece
  const centerTurntableGroup = new THREE.Group();
  centerTurntableGroup.position.set(0, 0.66, 0);
  centerPedestalGroup.add(centerTurntableGroup);

  const turntableDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.60, 0.04, 32),
    brushedGoldMat
  );
  turntableDisc.position.set(0, 0.02, 0);
  centerTurntableGroup.add(turntableDisc);

  const turntableInnerPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.50, 0.50, 0.045, 32),
    neroMarbleMat
  );
  turntableInnerPad.position.set(0, 0.025, 0);
  centerTurntableGroup.add(turntableInnerPad);

  const initialCenterShoe = SHOE_PRODUCTS[0];
  const initialCenterTex = createPhotorealShoeTexture(initialCenterShoe, maxAnisotropy);
  const centerItemMat = new THREE.MeshStandardMaterial({
    map: initialCenterTex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    roughness: 0.38,
    metalness: 0.12,
  });

  const centerItemGeo = new THREE.PlaneGeometry(0.86, 0.86, 24, 24);
  const centerItemMesh = new THREE.Mesh(centerItemGeo, centerItemMat);
  centerItemMesh.position.set(0, 0.42, 0);
  centerItemMesh.castShadow = true;
  centerTurntableGroup.add(centerItemMesh);

  // Part 9: Overhead Chandelier Ref (hidden so view is clean and unobstructed)
  const chandelierGroup = new THREE.Group();
  chandelierGroup.position.set(0, ceilingY - 0.32, roomCenterZ);
  chandelierGroup.visible = false;

  const chandelierOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.032, 16, 64),
    brushedGoldMat
  );
  chandelierOuterRing.rotation.x = Math.PI / 2;
  chandelierGroup.add(chandelierOuterRing);

  const chandelierRingMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c2,
  });
  const chandelierInnerGlow = new THREE.Mesh(
    new THREE.TorusGeometry(1.41, 0.018, 12, 64),
    chandelierRingMat
  );
  chandelierInnerGlow.rotation.x = Math.PI / 2;
  chandelierInnerGlow.position.y = -0.02;
  chandelierGroup.add(chandelierInnerGlow);

  for (let rodIdx = 0; rodIdx < 4; rodIdx++) {
    const rAngle = (rodIdx * Math.PI) / 2;
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8),
      brushedGoldMat
    );
    rod.position.set(Math.cos(rAngle) * 1.45, 0.17, Math.sin(rAngle) * 1.45);
    chandelierGroup.add(rod);
  }

  // =========================================================================
  // 6. FLOOR & CEILING OF THE 4-WALL VIRTUAL STORE ROOM
  // =========================================================================
  const floorGeo = new THREE.PlaneGeometry(halfRoom * 2, halfRoom * 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, floorY, roomCenterZ);
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xebe5dc,
    roughness: 0.85,
    metalness: 0.02,
  });
  const ceilingGeo = new THREE.PlaneGeometry(halfRoom * 2, halfRoom * 2);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(0, ceilingY, roomCenterZ);
  roomGroup.add(ceilingMesh);

  return {
    group: roomGroup,
    floorMat,
    frontWallMat,
    sideWallMat,
    southWallMat,
    westWallMat,
    ceilingMat,
    plinthMat: oakWoodMat,
    rackPipeMat,
    shoeGroups,
    bagGroups,
    capGroups,
    centerPedestalGroup,
    centerTurntableGroup,
    centerItemMesh,
    centerItemMat,
    chandelierRingMat,
    pedestalGlowMat,
    currentCenterProductId: initialCenterShoe?.id || '',
    currentWallIdx: 0,
  };
}

/**
 * Updates the 3D texture of the rotating "Drop of the Week" piece inside the Center Luxury Glass Case
 */
export function updateCenterpieceProduct(
  roomRefs: ShowroomRoomRefs,
  product: Product,
  colorIdx: number,
  maxAnisotropy: number
) {
  const sig = `${product.id}-${colorIdx}-${product.customFrontImage || ''}`;
  if (roomRefs.currentCenterProductId === sig) return;
  roomRefs.currentCenterProductId = sig;

  let newTex: THREE.CanvasTexture;
  if (product.isShoe) {
    newTex = createPhotorealShoeTexture(product, maxAnisotropy);
  } else if (product.isBag) {
    newTex = createPhotorealBagTexture(product, maxAnisotropy);
  } else if (product.isCap) {
    newTex = createPhotorealCapTexture(product, maxAnisotropy);
  } else {
    newTex = createPhotorealGarmentTexture(product, colorIdx, maxAnisotropy);
  }

  if (roomRefs.centerItemMat.map) {
    roomRefs.centerItemMat.map.dispose();
  }
  roomRefs.centerItemMat.map = newTex;
  roomRefs.centerItemMat.needsUpdate = true;
}

/**
 * Updates the 4-Wall Virtual Store Room state
 */
export function updateShowroomWallTheme(
  roomRefs: ShowroomRoomRefs,
  wallIndex: number,
  _maxAnisotropy: number
) {
  if (roomRefs.currentWallIdx === wallIndex) return;
  roomRefs.currentWallIdx = wallIndex;
}
