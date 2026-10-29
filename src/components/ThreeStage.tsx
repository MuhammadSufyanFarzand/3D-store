import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Product } from '../data/products';
import {
  BAG_CUBBY_SLOTS,
  CAP_SHELF_SLOTS,
  GarmentMeshRefs,
  SHOE_SHELF_SLOTS,
  createGarmentGroup,
  createShowroomRoomGroup,
  updateCenterpieceProduct,
  updateGarmentColors,
  updateShowroomWallTheme,
} from '../three/garmentBuilder';
import {
  ROOM_WALL_THEMES,
  createCloudPuffTexture,
  createFleeceBumpTexture,
  createMapleWoodTexture,
  createPhotorealGarmentTexture,
  createPhotorealSideProfileTexture,
} from '../three/proceduralTextures';

export type SceneEnvironmentMode = 'white-studio' | 'room' | 'sky';
export type ShowroomLightingMood = 'atelier-day' | 'obsidian-night';

interface ThreeStageProps {
  products: Product[];
  activeIndex: number;
  hoveredIndex: number | null;
  isQuickView: boolean;
  qvSlideIndex: number;
  selectedColors: number[];
  windIntensity: number;
  wireTension: number;
  reducedMotion: boolean;
  sceneMode: SceneEnvironmentMode;
  activeWallIndex: number;
  isStoreOverview?: boolean;
  lightingMood?: ShowroomLightingMood;
  centerpieceIndex?: number;
  orbitResetTrigger: number;
  qvZoom: number;
  customPhotoVersion: number;
  onSelectGarment: (index: number) => void;
  onHoverGarment: (index: number | null) => void;
  onOpenQuickView: (index?: number) => void;
  onChangeWallIndex?: (wallIdx: number, exitStoreOverview?: boolean) => void;
  onUpdateTagPositions?: (positions: { x: number; y: number; visible: boolean }[]) => void;
}

const _vec3A = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

export const ThreeStage: React.FC<ThreeStageProps> = ({
  products,
  activeIndex,
  hoveredIndex,
  isQuickView,
  qvSlideIndex,
  selectedColors,
  windIntensity,
  wireTension,
  reducedMotion,
  sceneMode,
  activeWallIndex,
  isStoreOverview = false,
  lightingMood = 'atelier-day',
  centerpieceIndex = 7,
  orbitResetTrigger,
  qvZoom,
  customPhotoVersion,
  onSelectGarment,
  onHoverGarment,
  onOpenQuickView,
  onChangeWallIndex,
  onUpdateTagPositions,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    products,
    activeIndex,
    hoveredIndex,
    isQuickView,
    qvSlideIndex,
    selectedColors,
    windIntensity,
    wireTension,
    reducedMotion,
    sceneMode,
    activeWallIndex,
    isStoreOverview,
    lightingMood,
    centerpieceIndex,
    qvZoom,
    customPhotoVersion,
    onSelectGarment,
    onHoverGarment,
    onOpenQuickView,
    onChangeWallIndex,
    onUpdateTagPositions,
  });

  useEffect(() => {
    stateRef.current = {
      products,
      activeIndex,
      hoveredIndex,
      isQuickView,
      qvSlideIndex,
      selectedColors,
      windIntensity,
      wireTension,
      reducedMotion,
      sceneMode,
      activeWallIndex,
      isStoreOverview,
      lightingMood,
      centerpieceIndex,
      qvZoom,
      customPhotoVersion,
      onSelectGarment,
      onHoverGarment,
      onOpenQuickView,
      onChangeWallIndex,
      onUpdateTagPositions,
    };
  }, [
    products,
    activeIndex,
    hoveredIndex,
    isQuickView,
    qvSlideIndex,
    selectedColors,
    windIntensity,
    wireTension,
    reducedMotion,
    sceneMode,
    activeWallIndex,
    isStoreOverview,
    lightingMood,
    centerpieceIndex,
    qvZoom,
    customPhotoVersion,
    onSelectGarment,
    onHoverGarment,
    onOpenQuickView,
    onChangeWallIndex,
    onUpdateTagPositions,
  ]);

  const clothingCount =
    products.filter((p) => !p.isShoe && !p.isBag && !p.isCap).length || 7;
  const shoeCount = products.filter((p) => p.isShoe).length || 6;
  const bagCount = products.filter((p) => p.isBag).length || 6;
  const rackCenter = (clothingCount - 1) / 2;

  const physicsRef = useRef({
    currentPos: rackCenter,
    targetPos: rackCenter,
    velocity: 0,
    wallTransitionOffset: 0,
    prevWallIdx: activeWallIndex,
    // 360° 4-Wall Virtual Store Room Camera Yaw & Zoom
    roomYaw: 0, // 0 = North (Clothing), PI/2 = East (Shoes), PI = South (Bags), 3PI/2 = West (Caps)
    targetRoomYaw: 0,
    roomZoom: isStoreOverview ? 0.78 : 1.04,
    targetRoomZoom: isStoreOverview ? 0.78 : 1.04,
    dragStartRoomYaw: 0,
    swingAngles: products.map(() => 0),
    swingVelocities: products.map(() => 0),
    turnProgress: products.map(() => 0),
    partingOffsets: products.map(() => 0),
    internalHoveredIdx: -1,
    orbitYaw: 0,
    orbitPitch: 0,
    targetOrbitYaw: 0,
    targetOrbitPitch: 0,
    mouseParallaxX: 0,
    mouseParallaxY: 0,
    isDragging: false,
    dragMoved: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTarget: rackCenter,
    dragStartYaw: 0,
    dragStartPitch: 0,
  });

  useEffect(() => {
    const p = physicsRef.current;
    const clampedClothingIdx = Math.min(clothingCount - 1, Math.max(0, activeIndex));
    const desiredPos =
      sceneMode === 'white-studio' || sceneMode === 'room'
        ? (clothingCount - 1) / 2
        : clampedClothingIdx;
    const delta = desiredPos - p.targetPos;
    p.targetPos = desiredPos;
    if (!reducedMotion && Math.abs(delta) > 0.01) {
      for (let i = 0; i < p.swingVelocities.length; i++) {
        p.swingVelocities[i] += Math.max(-1.8, Math.min(1.8, delta * 0.75));
      }
    }
  }, [activeIndex, sceneMode, reducedMotion, clothingCount]);

  // Smooth 360° camera rotation & zoom when switching between Store, Clothing, Shoes, Bags, Caps
  useEffect(() => {
    const p = physicsRef.current;
    const desiredYaw = (((activeWallIndex % 4) + 4) % 4) * (Math.PI * 0.5);
    const diff = Math.atan2(
      Math.sin(desiredYaw - p.targetRoomYaw),
      Math.cos(desiredYaw - p.targetRoomYaw)
    );
    p.targetRoomYaw = p.targetRoomYaw + diff;
    p.targetRoomZoom = isStoreOverview ? 0.78 : 1.04;

    if (p.prevWallIdx !== activeWallIndex) {
      const dir = diff >= 0 ? 1 : -1;
      p.prevWallIdx = activeWallIndex;
      if (!reducedMotion) {
        p.wallTransitionOffset = dir * 0.85;
        for (let i = 0; i < p.swingVelocities.length; i++) {
          p.swingVelocities[i] += dir * 0.36;
        }
      }
    }
  }, [activeWallIndex, isStoreOverview, reducedMotion]);

  useEffect(() => {
    physicsRef.current.targetOrbitYaw = 0;
    physicsRef.current.targetOrbitPitch = 0;
  }, [orbitResetTrigger, isQuickView, qvSlideIndex, activeIndex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    function getCatenaryPosition(
      normX: number,
      sagAmount: number,
      isRoomStand: boolean,
      targetVec: THREE.Vector3
    ) {
      if (isRoomStand) {
        targetVec.set(normX, 0.86, 0);
        return targetVec;
      }
      const span = 13.6;
      const t = THREE.MathUtils.clamp((normX + span / 2) / span, 0, 1);
      const yEnds = 1.18;
      const yCenter = 0.56 - sagAmount;
      const oneMinusT = 1 - t;
      const y = oneMinusT * oneMinusT * yEnds + 2 * oneMinusT * t * yCenter + t * t * yEnds;
      const z = -Math.pow(normX * 0.11, 2) * 0.18;
      targetVec.set(normX, y, z);
      return targetVec;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let isSoftwareGl = false;

    try {
      const glCanvas = document.createElement('canvas');
      const glContext =
        glCanvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
        glCanvas.getContext('webgl', { powerPreference: 'high-performance' });

      if (glContext) {
        const ext = glContext.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : glContext.RENDERER;
        const gpu = String(glContext.getParameter(param) || '');
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);

        renderer = new THREE.WebGLRenderer({
          canvas: glCanvas,
          context: glContext as WebGLRenderingContext,
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          alpha: false,
        });
      }
    } catch {
      renderer = null;
    }

    // =========================================================================
    // FALLBACK ENGINE: 2D CANVAS + TRUE 3D 4-WALL ROOM PERSPECTIVE PROJECTOR
    // =========================================================================
    if (!renderer) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
      fallbackCanvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
      fallbackCanvas.style.width = '100%';
      fallbackCanvas.style.height = '100%';
      container.innerHTML = '';
      container.appendChild(fallbackCanvas);

      const ctx2d = fallbackCanvas.getContext('2d')!;

      const fallbackGarments = stateRef.current.products.map((prod, idx) => {
        const cIdx = stateRef.current.selectedColors[idx] ?? prod.defaultColor;
        return {
          product: prod,
          colorIdx: cIdx,
          customSig: prod.customFrontImage || '',
          frontTex: createPhotorealGarmentTexture(prod, cIdx, 1),
          sideTex: createPhotorealSideProfileTexture(prod, cIdx, 1),
          screenBounds: { x: 0, y: 0, w: 0, h: 0 },
        };
      });
      const centerpieceBounds2D = { x: 0, y: 0, w: 0, h: 0 };

      const handlePointerDown2D = (e: PointerEvent) => {
        if (e.button !== 0) return;
        const p = physicsRef.current;
        p.isDragging = true;
        p.dragMoved = false;
        p.dragStartX = e.clientX;
        p.dragStartY = e.clientY;
        p.dragStartTarget = p.targetPos;
        p.dragStartYaw = p.targetOrbitYaw;
        p.dragStartPitch = p.targetOrbitPitch;
        p.dragStartRoomYaw = p.targetRoomYaw;
      };

      const handlePointerMove2D = (e: PointerEvent) => {
        const p = physicsRef.current;
        const rect = fallbackCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (p.isDragging) {
          const dx = e.clientX - p.dragStartX;
          const dy = e.clientY - p.dragStartY;
          if (Math.hypot(dx, dy) > 6) p.dragMoved = true;

          if (stateRef.current.isQuickView) {
            p.targetOrbitYaw = p.dragStartYaw + dx * 0.01;
            p.targetOrbitPitch = THREE.MathUtils.clamp(
              p.dragStartPitch + dy * 0.005,
              -0.38,
              0.38
            );
          } else if (stateRef.current.sceneMode === 'room') {
            // Rotate 360° smoothly across all 4 walls in the Virtual Store Room!
            p.targetRoomYaw = p.dragStartRoomYaw - dx * 0.0042;
          } else {
            const deltaIndex = -dx / 190;
            p.targetPos = THREE.MathUtils.clamp(
              p.dragStartTarget + deltaIndex,
              0,
              clothingCount - 1
            );
          }
          return;
        }

        if (!stateRef.current.isQuickView) {
          let foundHover = -1;
          const cosClothingWall = Math.cos(p.roomYaw);
          const sinShoesWall = Math.sin(p.roomYaw);

          // Check Clothing items on Wall 0 (or Studio/Sky rail)
          if (stateRef.current.sceneMode !== 'room' || cosClothingWall > 0.35) {
            for (let i = 0; i < clothingCount; i++) {
              const b = fallbackGarments[i]?.screenBounds;
              if (
                b &&
                b.w > 0 &&
                mx >= b.x - b.w * 0.5 &&
                mx <= b.x + b.w * 0.5 &&
                my >= b.y - b.h * 0.5 &&
                my <= b.y + b.h * 0.5
              ) {
                foundHover = i;
                break;
              }
            }
          }

          // Check 6 3D Sneakers on Wall 1 (Shoes Wall)
          if (
            foundHover === -1 &&
            stateRef.current.sceneMode === 'room' &&
            sinShoesWall > 0.35
          ) {
            for (let i = clothingCount; i < clothingCount + shoeCount; i++) {
              const b = fallbackGarments[i]?.screenBounds;
              if (
                b &&
                b.w > 0 &&
                mx >= b.x - b.w * 0.5 &&
                mx <= b.x + b.w * 0.5 &&
                my >= b.y - b.h * 0.5 &&
                my <= b.y + b.h * 0.5
              ) {
                foundHover = i;
                break;
              }
            }
          }

          // Check 6 3D Luxury Bags on Wall 2 (Bags Wall)
          if (
            foundHover === -1 &&
            stateRef.current.sceneMode === 'room' &&
            cosClothingWall < -0.35
          ) {
            for (
              let i = clothingCount + shoeCount;
              i < clothingCount + shoeCount + bagCount;
              i++
            ) {
              const b = fallbackGarments[i]?.screenBounds;
              if (
                b &&
                b.w > 0 &&
                mx >= b.x - b.w * 0.5 &&
                mx <= b.x + b.w * 0.5 &&
                my >= b.y - b.h * 0.5 &&
                my <= b.y + b.h * 0.5
              ) {
                foundHover = i;
                break;
              }
            }
          }

          // Check 4 3D Studio Caps on Wall 3 (Caps Wall)
          if (
            foundHover === -1 &&
            stateRef.current.sceneMode === 'room' &&
            sinShoesWall < -0.35
          ) {
            for (
              let i = clothingCount + shoeCount + bagCount;
              i < fallbackGarments.length;
              i++
            ) {
              const b = fallbackGarments[i]?.screenBounds;
              if (
                b &&
                b.w > 0 &&
                mx >= b.x - b.w * 0.5 &&
                mx <= b.x + b.w * 0.5 &&
                my >= b.y - b.h * 0.5 &&
                my <= b.y + b.h * 0.5
              ) {
                foundHover = i;
                break;
              }
            }
          }

          // Check Center Luxury Pedestal ("Drop of the Week") in Room mode
          if (
            foundHover === -1 &&
            stateRef.current.sceneMode === 'room' &&
            centerpieceBounds2D.w > 0 &&
            mx >= centerpieceBounds2D.x - centerpieceBounds2D.w * 0.5 &&
            mx <= centerpieceBounds2D.x + centerpieceBounds2D.w * 0.5 &&
            my >= centerpieceBounds2D.y - centerpieceBounds2D.h * 0.5 &&
            my <= centerpieceBounds2D.y + centerpieceBounds2D.h * 0.5
          ) {
            foundHover = stateRef.current.centerpieceIndex ?? 7;
          }

          if (foundHover !== p.internalHoveredIdx) {
            if (foundHover !== -1 && !stateRef.current.reducedMotion) {
              p.swingVelocities[foundHover] += 0.24;
            }
            p.internalHoveredIdx = foundHover;
            stateRef.current.onHoverGarment(foundHover === -1 ? null : foundHover);
            fallbackCanvas.style.cursor = foundHover !== -1 ? 'pointer' : 'grab';
          }
        }
      };

      const handlePointerUp2D = (e: PointerEvent) => {
        const p = physicsRef.current;
        if (!p.isDragging) return;
        p.isDragging = false;

        if (!stateRef.current.isQuickView) {
          if (p.dragMoved) {
            if (stateRef.current.sceneMode === 'room') {
              // Snap to nearest of the 4 walls after 360° room drag
              const twoPi = Math.PI * 2;
              const normYaw = ((p.targetRoomYaw % twoPi) + twoPi) % twoPi;
              const nearestWall = Math.round(normYaw / (Math.PI * 0.5)) % 4;
              const snappedYaw = Math.round(p.targetRoomYaw / (Math.PI * 0.5)) * (Math.PI * 0.5);
              p.targetRoomYaw = snappedYaw;
              if (stateRef.current.onChangeWallIndex) {
                stateRef.current.onChangeWallIndex(nearestWall, false);
              }
            }
          } else {
            const rect = fallbackCanvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Check Center Luxury Display Pedestal click first
            if (
              stateRef.current.sceneMode === 'room' &&
              centerpieceBounds2D.w > 0 &&
              mx >= centerpieceBounds2D.x - centerpieceBounds2D.w * 0.5 &&
              mx <= centerpieceBounds2D.x + centerpieceBounds2D.w * 0.5 &&
              my >= centerpieceBounds2D.y - centerpieceBounds2D.h * 0.5 &&
              my <= centerpieceBounds2D.y + centerpieceBounds2D.h * 0.5
            ) {
              const cpIdx = stateRef.current.centerpieceIndex ?? 7;
              stateRef.current.onSelectGarment(cpIdx);
              stateRef.current.onOpenQuickView(cpIdx);
              return;
            }

            for (let i = 0; i < fallbackGarments.length; i++) {
              const b = fallbackGarments[i].screenBounds;
              if (
                b.w > 0 &&
                mx >= b.x - b.w * 0.5 &&
                mx <= b.x + b.w * 0.5 &&
                my >= b.y - b.h * 0.5 &&
                my <= b.y + b.h * 0.5
              ) {
                stateRef.current.onSelectGarment(i);
                stateRef.current.onOpenQuickView(i);
                break;
              }
            }
          }
        }
      };

      fallbackCanvas.addEventListener('pointerdown', handlePointerDown2D);
      window.addEventListener('pointermove', handlePointerMove2D);
      window.addEventListener('pointerup', handlePointerUp2D);

      const handleResize2D = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        fallbackCanvas.width = window.innerWidth * dpr;
        fallbackCanvas.height = window.innerHeight * dpr;
      };
      window.addEventListener('resize', handleResize2D);

      let animId = 0;
      let isDisposed2D = false;
      let tagCount = 0;
      const clock2D = new THREE.Clock();

      // Helper for 3D-to-2D perspective polygon clipping & projection inside the 4-Wall Room
      const HALF_ROOM = 6.0;
      const FLOOR_Y = -2.65;
      const CEIL_Y = 3.15;

      function wallLocalToWorld(
        wallIdx: number,
        u: number,
        v: number,
        d = 0
      ): [number, number, number] {
        // wallIdx: 0 = North (Clothing), 1 = East (Shoes), 2 = South (Bags), 3 = West (Caps)
        if (wallIdx === 0) return [u, v, -HALF_ROOM + d];
        if (wallIdx === 1) return [HALF_ROOM - d, v, u];
        if (wallIdx === 2) return [-u, v, HALF_ROOM - d];
        return [-HALF_ROOM + d, v, -u];
      }

      function worldToCam(
        wx: number,
        wy: number,
        wz: number,
        yaw: number,
        camBack: number
      ): [number, number, number] {
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cx = wx * cosY - wz * sinY;
        const cy = wy + 0.18;
        const cz = -wx * sinY - wz * cosY + camBack;
        return [cx, cy, cz];
      }

      function clipAndProjectPolygon(
        worldPts: [number, number, number][],
        yaw: number,
        camBack: number,
        focal: number,
        cxScreen: number,
        cyScreen: number
      ): { pts: [number, number][]; avgZ: number } | null {
        const nearZ = 0.25;
        const camPts = worldPts.map(([wx, wy, wz]) =>
          worldToCam(wx, wy, wz, yaw, camBack)
        );

        const clipped: [number, number, number][] = [];
        for (let i = 0; i < camPts.length; i++) {
          const curr = camPts[i];
          const prev = camPts[(i + camPts.length - 1) % camPts.length];
          const currIn = curr[2] >= nearZ;
          const prevIn = prev[2] >= nearZ;

          if (currIn !== prevIn) {
            const t = (nearZ - prev[2]) / (curr[2] - prev[2]);
            clipped.push([
              prev[0] + t * (curr[0] - prev[0]),
              prev[1] + t * (curr[1] - prev[1]),
              nearZ,
            ]);
          }
          if (currIn) {
            clipped.push(curr);
          }
        }

        if (clipped.length < 3) return null;

        let sumZ = 0;
        const screenPts: [number, number][] = clipped.map(([cx, cy, cz]) => {
          sumZ += cz;
          return [cxScreen + (cx / cz) * focal, cyScreen - (cy / cz) * focal];
        });

        return { pts: screenPts, avgZ: sumZ / clipped.length };
      }

      const tick2D = () => {
        if (isDisposed2D) return;
        const dt = Math.min(0.05, clock2D.getDelta());
        const elapsed = clock2D.getElapsedTime();
        const st = stateRef.current;
        const p = physicsRef.current;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const isMobile = w < 1024;
        const isWhiteStudio = st.sceneMode === 'white-studio';
        const isRoomMode = st.sceneMode === 'room';
        const windFactor = st.reducedMotion ? 0 : st.windIntensity / 100;
        const tensionSag = (1 - st.wireTension / 100) * 0.32;

        p.wallTransitionOffset = THREE.MathUtils.damp(p.wallTransitionOffset, 0, 7, dt);
        p.roomYaw = THREE.MathUtils.damp(p.roomYaw, p.targetRoomYaw, 6.5, dt);
        p.roomZoom = THREE.MathUtils.damp(p.roomZoom, p.targetRoomZoom, 6.5, dt);

        ctx2d.save();
        ctx2d.scale(dpr, dpr);

        const pxPerUnit = Math.min(w / 10.5, h / 5.4);
        const centerX = w * 0.5;
        const centerY = h * 0.54;

        // Update textures if color or custom upload changed
        for (let i = 0; i < fallbackGarments.length; i++) {
          const fg = fallbackGarments[i];
          const prod = st.products[i];
          if (!prod) continue;
          const wantedColor = st.selectedColors[i] ?? prod.defaultColor;
          const sig = prod.customFrontImage || '';
          if (fg.colorIdx !== wantedColor || fg.customSig !== sig || fg.product !== prod) {
            fg.product = prod;
            fg.colorIdx = wantedColor;
            fg.customSig = sig;
            fg.frontTex = createPhotorealGarmentTexture(prod, wantedColor, 1);
            fg.sideTex = createPhotorealSideProfileTexture(prod, wantedColor, 1);
          }
        }

        // Physics update
        if (st.reducedMotion) {
          p.currentPos = p.targetPos;
          p.velocity = 0;
        } else {
          const posDiff = p.targetPos - p.currentPos;
          p.velocity = p.velocity * 0.8 + posDiff * 0.14;
          p.currentPos += p.velocity;
        }

        p.orbitYaw = THREE.MathUtils.damp(p.orbitYaw, p.targetOrbitYaw, 8, dt);
        p.orbitPitch = THREE.MathUtils.damp(p.orbitPitch, p.targetOrbitPitch, 8, dt);

        const baseSpacing =
          isWhiteStudio || isRoomMode
            ? isMobile
              ? 1.05
              : 1.12
            : isMobile
              ? 1.85
              : 2.15;
        const activeHoverIdx =
          st.hoveredIndex !== null ? st.hoveredIndex : p.internalHoveredIdx;
        const screenTagPositions: { x: number; y: number; visible: boolean }[] =
          fallbackGarments.map(() => ({ x: 0, y: 0, visible: false }));

        // ===================================================================
        // MODE A: 360° 4-WALL VIRTUAL STORE ROOM (Matches Reference Video!)
        // ===================================================================
        if (isRoomMode && !st.isQuickView) {
          const yaw = p.roomYaw;
          const zoom = p.roomZoom;
          const camBack = 3.65;
          const focal = Math.min(w, h) * 0.86 * zoom;
          const cxScreen = w * 0.5;
          const cyScreen = h * 0.52;

          const isNightMood = st.lightingMood === 'obsidian-night';

          // Base architectural coffered ceiling & high-contrast travertine floor fill (Day vs Obsidian Night Mood)
          const ceilGrad = ctx2d.createLinearGradient(0, 0, 0, h * 0.52);
          if (isNightMood) {
            ceilGrad.addColorStop(0, '#13110e');
            ceilGrad.addColorStop(0.75, '#1b1713');
            ceilGrad.addColorStop(1, '#241e18');
          } else {
            ceilGrad.addColorStop(0, '#eee9e0');
            ceilGrad.addColorStop(0.75, '#e2dcd1');
            ceilGrad.addColorStop(1, '#cfc8bc');
          }
          ctx2d.fillStyle = ceilGrad;
          ctx2d.fillRect(0, 0, w, h * 0.52);

          const floorGrad = ctx2d.createLinearGradient(0, h * 0.5, 0, h);
          if (isNightMood) {
            floorGrad.addColorStop(0, '#2a241d');
            floorGrad.addColorStop(0.35, '#3b3228');
            floorGrad.addColorStop(1, '#1e1914');
          } else {
            floorGrad.addColorStop(0, '#9c9286');
            floorGrad.addColorStop(0.35, '#b4aa9e');
            floorGrad.addColorStop(1, '#8c8276');
          }
          ctx2d.fillStyle = floorGrad;
          ctx2d.fillRect(0, h * 0.52, w, h * 0.48);

          const fillQuad = (
            worldPts: [number, number, number][],
            fillStyle: string | CanvasGradient,
            strokeStyle?: string,
            lineWidth = 1.5
          ) => {
            const proj = clipAndProjectPolygon(
              worldPts,
              yaw,
              camBack,
              focal,
              cxScreen,
              cyScreen
            );
            if (!proj) return null;
            ctx2d.beginPath();
            proj.pts.forEach(([sx, sy], idx) => {
              if (idx === 0) ctx2d.moveTo(sx, sy);
              else ctx2d.lineTo(sx, sy);
            });
            ctx2d.closePath();
            ctx2d.fillStyle = fillStyle;
            ctx2d.fill();
            if (strokeStyle) {
              ctx2d.strokeStyle = strokeStyle;
              ctx2d.lineWidth = lineWidth;
              ctx2d.stroke();
            }
            return proj;
          };

          // Subtle 3D Travertine Floor Tile Grid & Center Specular Sheen
          for (let gx = -4; gx <= 4; gx += 2) {
            for (let gz = 1.2; gz <= 9.2; gz += 2) {
              fillQuad(
                [
                  [gx, FLOOR_Y, gz],
                  [gx + 2, FLOOR_Y, gz],
                  [gx + 2, FLOOR_Y, gz + 2],
                  [gx, FLOOR_Y, gz + 2],
                ],
                (Math.round(gx + gz) / 2) % 2 === 0
                  ? 'rgba(255, 248, 238, 0.04)'
                  : 'rgba(38, 30, 22, 0.04)',
                'rgba(52, 42, 32, 0.16)',
                1
              );
            }
          }

          const drawWallQuad = (
            wIdx: number,
            u0: number,
            v0: number,
            u1: number,
            v1: number,
            d: number,
            fillStyle: string | CanvasGradient,
            strokeStyle?: string,
            lineWidth = 1.2
          ) => {
            return fillQuad(
              [
                wallLocalToWorld(wIdx, u0, v1, d),
                wallLocalToWorld(wIdx, u1, v1, d),
                wallLocalToWorld(wIdx, u1, v0, d),
                wallLocalToWorld(wIdx, u0, v0, d),
              ],
              fillStyle,
              strokeStyle,
              lineWidth
            );
          };

          // Helper to draw a 3D Box protruding from wall `wIdx` (`table` / `shelf` / `board`)
          const drawWallBox3D = (
            wIdx: number,
            uCenter: number,
            vCenter: number,
            boxW: number,
            boxH: number,
            dStart: number,
            dEnd: number,
            frontCol: string,
            topCol: string,
            sideCol: string,
            strokeCol = 'rgba(0,0,0,0.12)'
          ) => {
            const u0 = uCenter - boxW * 0.5;
            const u1 = uCenter + boxW * 0.5;
            const v0 = vCenter - boxH * 0.5;
            const v1 = vCenter + boxH * 0.5;

            fillQuad(
              [
                wallLocalToWorld(wIdx, u0, v1, dStart),
                wallLocalToWorld(wIdx, u0, v1, dEnd),
                wallLocalToWorld(wIdx, u0, v0, dEnd),
                wallLocalToWorld(wIdx, u0, v0, dStart),
              ],
              sideCol,
              strokeCol,
              1
            );
            fillQuad(
              [
                wallLocalToWorld(wIdx, u1, v1, dStart),
                wallLocalToWorld(wIdx, u1, v1, dEnd),
                wallLocalToWorld(wIdx, u1, v0, dEnd),
                wallLocalToWorld(wIdx, u1, v0, dStart),
              ],
              sideCol,
              strokeCol,
              1
            );
            if (vCenter > -0.2) {
              fillQuad(
                [
                  wallLocalToWorld(wIdx, u0, v0, dStart),
                  wallLocalToWorld(wIdx, u1, v0, dStart),
                  wallLocalToWorld(wIdx, u1, v0, dEnd),
                  wallLocalToWorld(wIdx, u0, v0, dEnd),
                ],
                sideCol,
                strokeCol,
                1
              );
            } else {
              fillQuad(
                [
                  wallLocalToWorld(wIdx, u0, v1, dStart),
                  wallLocalToWorld(wIdx, u1, v1, dStart),
                  wallLocalToWorld(wIdx, u1, v1, dEnd),
                  wallLocalToWorld(wIdx, u0, v1, dEnd),
                ],
                topCol,
                strokeCol,
                1
              );
            }
            drawWallQuad(wIdx, u0, v0, u1, v1, dEnd, frontCol, strokeCol, 1.2);
          };

          // Sort the 4 walls back-to-front by their center depth in camera space
          const wallOrder = [0, 1, 2, 3]
            .map((wIdx) => {
              const [wx, wy, wz] = wallLocalToWorld(wIdx, 0, 0, 0);
              const [, , cz] = worldToCam(wx, wy, wz, yaw, camBack);
              return { wIdx, cz };
            })
            .sort((a, b) => b.cz - a.cz);

          // 1. Render all 4 Room Walls & Their Fixtures (Back-to-Front)
          for (const { wIdx } of wallOrder) {
            const wallTheme = ROOM_WALL_THEMES[wIdx] || ROOM_WALL_THEMES[0];
            const wallPaintGrad = ctx2d.createLinearGradient(0, h * 0.06, 0, h * 0.88);
            wallPaintGrad.addColorStop(0, wallTheme.frontWallTop);
            wallPaintGrad.addColorStop(0.55, wallTheme.sideWallInner);
            wallPaintGrad.addColorStop(1, wallTheme.frontWallBottom);

            const wallProj = drawWallQuad(
              wIdx,
              -HALF_ROOM,
              FLOOR_Y,
              HALF_ROOM,
              CEIL_Y,
              0,
              wallPaintGrad,
              'rgba(0, 0, 0, 0.38)',
              1.8
            );
            if (!wallProj) continue;

            // Center Recessed Architectural Gallery Panel with Brushed-Brass Molding Frame
            drawWallQuad(
              wIdx,
              -4.65,
              FLOOR_Y + 0.36,
              4.65,
              CEIL_Y - 0.34,
              0.005,
              wallTheme.alcoveBg,
              'rgba(12, 10, 8, 0.45)',
              2.2
            );
            drawWallQuad(
              wIdx,
              -4.54,
              FLOOR_Y + 0.46,
              4.54,
              CEIL_Y - 0.44,
              0.007,
              'rgba(255, 245, 228, 0.02)',
              'rgba(205, 168, 108, 0.55)',
              1.4
            );

            // Architectural Vertical Brass & Wood Fluting Slats on Left & Right Wings of Every Mall Wall
            [-5.5, -5.28, -5.06, 5.06, 5.28, 5.5].forEach((fluteU) => {
              drawWallQuad(
                wIdx,
                fluteU - 0.045,
                FLOOR_Y + 0.36,
                fluteU + 0.045,
                CEIL_Y - 0.34,
                0.012,
                '#c9a368',
                'rgba(15, 10, 6, 0.42)',
                1
              );
            });

            // Overhead Warm Gallery Spotlight Cones washing down the painted mall wall
            [-2.4, 0, 2.4].forEach((spotU) => {
              drawWallQuad(
                wIdx,
                spotU - 1.15,
                0.35,
                spotU + 1.15,
                CEIL_Y - 0.12,
                0.009,
                'rgba(255, 242, 212, 0.075)'
              );
              // Track spotlight canister on ceiling rim
              drawWallBox3D(
                wIdx,
                spotU,
                CEIL_Y - 0.08,
                0.24,
                0.12,
                0.05,
                0.26,
                '#1a1816',
                '#2c2824',
                '#12100e',
                'rgba(205, 168, 108, 0.45)'
              );
            });

            // Ceiling Cove Shadow & Left/Right Vertical Corner Ambient Occlusion (AO)
            drawWallQuad(
              wIdx,
              -HALF_ROOM,
              CEIL_Y - 0.26,
              HALF_ROOM,
              CEIL_Y,
              0.014,
              'rgba(8, 6, 4, 0.32)'
            );
            drawWallQuad(
              wIdx,
              -HALF_ROOM,
              FLOOR_Y,
              -HALF_ROOM + 0.32,
              CEIL_Y,
              0.014,
              'rgba(8, 6, 4, 0.24)'
            );
            drawWallQuad(
              wIdx,
              HALF_ROOM - 0.32,
              FLOOR_Y,
              HALF_ROOM,
              CEIL_Y,
              0.014,
              'rgba(8, 6, 4, 0.24)'
            );

            // Floor-to-Wall Ambient Occlusion Shadow Strip across the Travertine Floor
            fillQuad(
              [
                wallLocalToWorld(wIdx, -HALF_ROOM, FLOOR_Y + 0.005, 0),
                wallLocalToWorld(wIdx, HALF_ROOM, FLOOR_Y + 0.005, 0),
                wallLocalToWorld(wIdx, HALF_ROOM, FLOOR_Y + 0.005, 0.55),
                wallLocalToWorld(wIdx, -HALF_ROOM, FLOOR_Y + 0.005, 0.55),
              ],
              'rgba(18, 14, 10, 0.22)'
            );

            // Dark Espresso-Walnut Baseboard + Brushed Champagne-Brass Trim Strip
            drawWallQuad(
              wIdx,
              -HALF_ROOM,
              FLOOR_Y,
              HALF_ROOM,
              FLOOR_Y + 0.2,
              0.018,
              '#1b1612',
              'rgba(0,0,0,0.45)',
              1.2
            );
            drawWallQuad(
              wIdx,
              -HALF_ROOM,
              FLOOR_Y + 0.2,
              HALF_ROOM,
              FLOOR_Y + 0.23,
              0.02,
              '#c9a368'
            );

            // ===============================================================
            // WALL 0 (NORTH): CLOTHING RACK WALL + "SAQIB VISUALS" SIGN + FRAMED POSTER
            // ===============================================================
            if (wIdx === 0) {
              // Soft drop shadow behind Framed Poster
              drawWallQuad(
                0,
                -4.55 - 0.69,
                0.22 - 0.89,
                -4.55 + 0.73,
                0.22 + 0.85,
                0.015,
                'rgba(8, 6, 4, 0.36)'
              );
              drawWallBox3D(
                0,
                -4.55,
                0.22,
                1.38,
                1.72,
                0.01,
                0.08,
                '#f8f7f4',
                '#181818',
                '#181818',
                '#c9a368'
              );
              const posterCenter = worldToCam(
                ...wallLocalToWorld(0, -4.55, 0.22, 0.085),
                yaw,
                camBack
              );
              if (posterCenter[2] > 0.4) {
                const px = cxScreen + (posterCenter[0] / posterCenter[2]) * focal;
                const py = cyScreen - (posterCenter[1] / posterCenter[2]) * focal;
                const pScale = focal / posterCenter[2];
                ctx2d.save();
                ctx2d.fillStyle = '#181818';
                ctx2d.font = `italic 900 ${Math.max(8, Math.round(pScale * 0.17))}px Georgia, serif`;
                ctx2d.textAlign = 'center';
                ctx2d.fillText('LAYERS', px, py - pScale * 0.30);
                ctx2d.fillText('THAT HANG', px, py - pScale * 0.09);
                ctx2d.fillText('RIGHT.', px, py + pScale * 0.12);
                ctx2d.font = `700 ${Math.max(6, Math.round(pScale * 0.072))}px Inter, monospace`;
                ctx2d.fillStyle = '#55524d';
                ctx2d.fillText('SAQIB VISUALS', px, py + pScale * 0.45);
                ctx2d.restore();
              }

              // 3D Raised Luxury Obsidian & Brushed-Gold Brand Plaque for "SAQIB VISUALS" (positioned below top navbar)
              drawWallQuad(
                0,
                -1.64,
                1.11,
                1.64,
                1.71,
                0.015,
                'rgba(8, 6, 4, 0.38)'
              );
              drawWallBox3D(
                0,
                0,
                1.42,
                3.15,
                0.54,
                0.01,
                0.08,
                '#171412',
                '#2b2520',
                '#100e0c',
                'rgba(209, 172, 110, 0.78)'
              );

              const logoCam = worldToCam(
                ...wallLocalToWorld(0, 0, 1.42, 0.085),
                yaw,
                camBack
              );
              if (logoCam[2] > 0.4) {
                const lx = cxScreen + (logoCam[0] / logoCam[2]) * focal;
                const ly = cyScreen - (logoCam[1] / logoCam[2]) * focal;
                const lScale = focal / logoCam[2];
                ctx2d.save();
                ctx2d.fillStyle = '#F7F1E5';
                ctx2d.shadowColor = 'rgba(0, 0, 0, 0.65)';
                ctx2d.shadowBlur = 8;
                ctx2d.font = `800 ${Math.max(12, Math.round(lScale * 0.23))}px Cinzel, 'Cormorant Garamond', Georgia, serif`;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText('SAQIB VISUALS', lx, ly - lScale * 0.05);

                ctx2d.shadowBlur = 0;
                ctx2d.fillStyle = '#D4AF72';
                ctx2d.font = `700 ${Math.max(7, Math.round(lScale * 0.072))}px Montserrat, sans-serif`;
                ctx2d.fillText('FLAGSHIP BOUTIQUE · VIRTUAL MALL', lx, ly + lScale * 0.14);
                ctx2d.restore();
              }

              // Soft downward cast shadow from the horizontal garment pipe onto the painted wall
              drawWallQuad(
                0,
                -4.48,
                0.73,
                4.48,
                0.82,
                0.02,
                'rgba(10, 8, 6, 0.34)'
              );
              [-4.15, 4.15].forEach((bx) => {
                drawWallBox3D(
                  0,
                  bx,
                  0.88,
                  0.13,
                  0.13,
                  0,
                  0.58,
                  '#1e2024',
                  '#525760',
                  '#141619'
                );
              });
              drawWallBox3D(
                0,
                0,
                0.88,
                8.9,
                0.075,
                0.52,
                0.6,
                '#1e2024',
                '#e6edf5',
                '#141619',
                'rgba(0,0,0,0.4)'
              );

              // Low Warm-Oak Wooden Display Table below the Clothing Rack on the North Wall
              [-2.85, 0, 2.85].forEach((lu) => {
                drawWallBox3D(
                  0,
                  lu,
                  FLOOR_Y + 0.28,
                  0.14,
                  0.56,
                  0.08,
                  0.86,
                  '#b08954',
                  '#cfa974',
                  '#946f3d'
                );
              });
              drawWallBox3D(
                0,
                0,
                FLOOR_Y + 0.56,
                6.4,
                0.12,
                0.04,
                0.92,
                '#cfa974',
                '#e0bc89',
                '#b08954',
                'rgba(70, 45, 18, 0.24)'
              );
            }

            // ===============================================================
            // WALL 1 (EAST): SHOES WALL — SLATTED OAK BOARD + 6 FLOATING SHELVES + 6 3D SNEAKERS
            // ===============================================================
            if (wIdx === 1) {
              // Overhead suspended "SHOES" dark architectural sign box positioned cleanly below the top navbar
              drawWallBox3D(
                1,
                0,
                1.48,
                1.86,
                0.42,
                0.12,
                0.26,
                '#152026',
                '#22323b',
                '#0f171c',
                'rgba(209, 172, 110, 0.65)'
              );
              const signCam = worldToCam(
                ...wallLocalToWorld(1, 0, 1.48, 0.27),
                yaw,
                camBack
              );
              if (signCam[2] > 0.4) {
                const sx = cxScreen + (signCam[0] / signCam[2]) * focal;
                const sy = cyScreen - (signCam[1] / signCam[2]) * focal;
                const sScale = focal / signCam[2];
                ctx2d.save();
                ctx2d.fillStyle = '#F7F1E5';
                ctx2d.font = `800 ${Math.max(10, Math.round(sScale * 0.20))}px Cinzel, 'Cormorant Garamond', Georgia, serif`;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText('SHOES', sx, sy);
                ctx2d.restore();
              }

              // Compact Dark-Bronze Recessed Outer Architectural Frame around the Oak Board
              drawWallBox3D(
                1,
                0,
                -0.18,
                6.02,
                2.58,
                0,
                0.05,
                '#3b2610',
                '#4d3216',
                '#2b1b0a',
                'rgba(25, 14, 4, 0.45)'
              );

              // Compact Warm Honey-Oak Slatted Display Board on the Shoes Wall
              drawWallBox3D(
                1,
                0,
                -0.18,
                5.9,
                2.48,
                0.02,
                0.09,
                '#c99d62',
                '#dfb77c',
                '#a67e46',
                'rgba(70, 44, 16, 0.35)'
              );

              // Vertical Architectural Wood Slat Grooves & Highlight Planks across the Oak Board
              for (let su = -2.75; su <= 2.75; su += 0.32) {
                drawWallQuad(
                  1,
                  su - 0.014,
                  -1.38,
                  su + 0.014,
                  1.02,
                  0.092,
                  'rgba(68, 42, 14, 0.16)'
                );
              }

              // Warm Overhead Gallery Spotlight Cones on each of the 3 Sneaker Columns
              [-1.88, 0, 1.88].forEach((colU) => {
                drawWallQuad(
                  1,
                  colU - 0.65,
                  0.25,
                  colU + 0.65,
                  1.02,
                  0.093,
                  'rgba(255, 243, 216, 0.10)'
                );
              });

              // Warm-Oak Wooden Display Table with Legs below the Shoes Wall Board
              [-2.65, 0, 2.65].forEach((lu) => {
                drawWallBox3D(
                  1,
                  lu,
                  FLOOR_Y + 0.32,
                  0.14,
                  0.64,
                  0.08,
                  0.86,
                  '#b08954',
                  '#cfa974',
                  '#946f3d'
                );
              });
              drawWallBox3D(
                1,
                0,
                FLOOR_Y + 0.64,
                5.9,
                0.12,
                0.04,
                0.92,
                '#cfa974',
                '#e0bc89',
                '#b08954',
                'rgba(70, 45, 18, 0.26)'
              );

              // 2 Rows × 3 Columns = 6 Crisp White Floating Shoe Shelves + 6 Interactive 3D Sneakers!
              SHOE_SHELF_SLOTS.forEach((slot, sIdx) => {
                const globalIdx = clothingCount + sIdx;
                const fgShoe = fallbackGarments[globalIdx];
                const isShoeHovered = activeHoverIdx === globalIdx;

                p.turnProgress[globalIdx] = THREE.MathUtils.damp(
                  p.turnProgress[globalIdx] || 0,
                  isShoeHovered ? 1 : 0,
                  10,
                  dt
                );
                const hoverAmt = p.turnProgress[globalIdx] || 0;

                // 1. Deep soft cast shadow underneath the floating shelf onto the warm oak board
                drawWallQuad(
                  1,
                  slot.u - 0.74,
                  slot.v - 0.19,
                  slot.u + 0.74,
                  slot.v - 0.04,
                  0.094,
                  'rgba(48, 28, 8, 0.16)'
                );
                drawWallQuad(
                  1,
                  slot.u - 0.71,
                  slot.v - 0.11,
                  slot.u + 0.71,
                  slot.v - 0.04,
                  0.095,
                  'rgba(38, 22, 5, 0.28)'
                );

                // 2. Warm Under-Shelf Recessed LED Light Strip Glow
                drawWallQuad(
                  1,
                  slot.u - 0.63,
                  slot.v - 0.062,
                  slot.u + 0.63,
                  slot.v - 0.04,
                  0.21,
                  'rgba(255, 242, 208, 0.65)'
                );

                // 3. Crisp White 3D Floating Shoe Display Shelf (with explicit bright white top deck)
                const su0 = slot.u - 0.72;
                const su1 = slot.u + 0.72;
                const sv0 = slot.v - 0.042;
                const sv1 = slot.v + 0.042;
                const sdStart = 0.09;
                const sdEnd = 0.52;

                // Side faces of shelf
                fillQuad(
                  [
                    wallLocalToWorld(1, su0, sv1, sdStart),
                    wallLocalToWorld(1, su0, sv1, sdEnd),
                    wallLocalToWorld(1, su0, sv0, sdEnd),
                    wallLocalToWorld(1, su0, sv0, sdStart),
                  ],
                  '#dfddd7'
                );
                fillQuad(
                  [
                    wallLocalToWorld(1, su1, sv1, sdStart),
                    wallLocalToWorld(1, su1, sv1, sdEnd),
                    wallLocalToWorld(1, su1, sv0, sdEnd),
                    wallLocalToWorld(1, su1, sv0, sdStart),
                  ],
                  '#dfddd7'
                );
                // Top surface deck of shelf (always drawn so the sneaker sits on a crisp white surface)
                fillQuad(
                  [
                    wallLocalToWorld(1, su0, sv1, sdStart),
                    wallLocalToWorld(1, su1, sv1, sdStart),
                    wallLocalToWorld(1, su1, sv1, sdEnd),
                    wallLocalToWorld(1, su0, sv1, sdEnd),
                  ],
                  '#ffffff',
                  'rgba(0,0,0,0.06)',
                  1
                );
                // Front thickness edge of shelf
                drawWallQuad(
                  1,
                  su0,
                  sv0,
                  su1,
                  sv1,
                  sdEnd,
                  '#f4f3ef',
                  isShoeHovered ? 'rgba(232, 93, 42, 0.65)' : 'rgba(0,0,0,0.12)',
                  1.2
                );

                if (!fgShoe) return;

                // 3D position of the sneaker sitting flush on top of this floating shelf
                const shoeDepth = 0.34 + hoverAmt * 0.24;
                const shoeV = slot.v + 0.475 + hoverAmt * 0.07;
                const [wx, wy, wz] = wallLocalToWorld(1, slot.u, shoeV, shoeDepth);
                const [cx, cy, cz] = worldToCam(wx, wy, wz, yaw, camBack);

                if (cz <= 0.45) {
                  fgShoe.screenBounds = { x: 0, y: 0, w: 0, h: 0 };
                  return;
                }

                const shoeScreenX = cxScreen + (cx / cz) * focal;
                const shoeScreenY = cyScreen - (cy / cz) * focal;
                const perspScale = focal / cz;

                // Perspective foreshortening when viewing the East Wall (Shoes) at an angle
                const eastWallFacing = Math.max(0.28, Math.abs(Math.sin(yaw)));
                const shoeW = perspScale * 1.28 * (1 + hoverAmt * 0.14) * eastWallFacing;
                const shoeH = perspScale * 1.28 * (1 + hoverAmt * 0.14);
                const idleBob = st.reducedMotion
                  ? 0
                  : Math.sin(elapsed * 2.1 + sIdx * 0.9) * 2.0 * hoverAmt;

                // Compute exact screen-space Y coordinate where the sneaker's rubber outsole meets the shelf top
                // (`soleLineY = 858` in 1024px canvas => +0.3379 * shoeH below shoeScreenY)
                const [shelfTopWx, shelfTopWy, shelfTopWz] = wallLocalToWorld(
                  1,
                  slot.u,
                  slot.v + 0.043,
                  0.34
                );
                const [stCx, stCy, stCz] = worldToCam(
                  shelfTopWx,
                  shelfTopWy,
                  shelfTopWz,
                  yaw,
                  camBack
                );
                const shelfTopScreenX =
                  stCz > 0.3 ? cxScreen + (stCx / stCz) * focal : shoeScreenX;
                const shelfTopScreenY =
                  stCz > 0.3
                    ? cyScreen - (stCy / stCz) * focal
                    : shoeScreenY + shoeH * 0.338;

                const imgSource = fgShoe.frontTex.image as CanvasImageSource;

                if (imgSource) {
                  // STAGE 1: Soft 3D Silhouette Cast Shadow onto the Warm Slatted Oak Board behind the sneaker
                  ctx2d.save();
                  ctx2d.translate(
                    shoeScreenX + shoeW * 0.045 + hoverAmt * 9,
                    shoeScreenY + shoeH * 0.03 + hoverAmt * 8
                  );
                  ctx2d.rotate(-hoverAmt * 0.08);
                  ctx2d.scale(0.95, 0.92);
                  ctx2d.globalAlpha = 0.22 - hoverAmt * 0.05;
                  ctx2d.filter = 'blur(7px) brightness(0.12)';
                  ctx2d.drawImage(imgSource, -shoeW * 0.5, -shoeH * 0.5, shoeW, shoeH);
                  ctx2d.restore();

                  // STAGE 2: Wide Diffused Penumbra Contact Shadow across the White Shelf Top Surface
                  const shadowScale = 1 - hoverAmt * 0.15;
                  const penumbraRx = Math.max(8, shoeW * 0.44 * shadowScale);
                  const penumbraRy = Math.max(2.5, shoeH * 0.052 * shadowScale);
                  ctx2d.save();
                  ctx2d.translate(shelfTopScreenX, shelfTopScreenY + 1.5);
                  ctx2d.scale(1, penumbraRy / penumbraRx);
                  const penGrad = ctx2d.createRadialGradient(0, 0, penumbraRx * 0.08, 0, 0, penumbraRx);
                  penGrad.addColorStop(0, `rgba(22, 16, 10, ${(0.46 - hoverAmt * 0.16).toFixed(2)})`);
                  penGrad.addColorStop(0.55, `rgba(22, 16, 10, ${(0.24 - hoverAmt * 0.08).toFixed(2)})`);
                  penGrad.addColorStop(1, 'rgba(22, 16, 10, 0)');
                  ctx2d.fillStyle = penGrad;
                  ctx2d.beginPath();
                  ctx2d.arc(0, 0, penumbraRx, 0, Math.PI * 2);
                  ctx2d.fill();
                  ctx2d.restore();

                  // STAGE 3: Crisp Dual-Patch Ambient Occlusion (AO) Crevice Shadow right under Forefoot & Heel
                  const aoAlpha = 0.84 - hoverAmt * 0.34;
                  const drawContactPatch = (offsetX: number, rxRatio: number, ryRatio: number) => {
                    const rx = Math.max(4, shoeW * rxRatio * shadowScale);
                    const ry = Math.max(1.4, shoeH * ryRatio * shadowScale);
                    ctx2d.save();
                    ctx2d.translate(shelfTopScreenX + offsetX, shelfTopScreenY);
                    ctx2d.scale(1, ry / rx);
                    const aoGrad = ctx2d.createRadialGradient(0, 0, rx * 0.05, 0, 0, rx);
                    aoGrad.addColorStop(0, `rgba(8, 6, 4, ${aoAlpha.toFixed(2)})`);
                    aoGrad.addColorStop(0.5, `rgba(14, 10, 7, ${(aoAlpha * 0.58).toFixed(2)})`);
                    aoGrad.addColorStop(1, 'rgba(14, 10, 7, 0)');
                    ctx2d.fillStyle = aoGrad;
                    ctx2d.beginPath();
                    ctx2d.arc(0, 0, rx, 0, Math.PI * 2);
                    ctx2d.fill();
                    ctx2d.restore();
                  };
                  // Forefoot rubber tread contact patch (left)
                  drawContactPatch(-shoeW * 0.145, 0.21, 0.022);
                  // Heel rubber tread contact patch (right)
                  drawContactPatch(shoeW * 0.155, 0.19, 0.022);
                  // Midfoot outsole bridge
                  drawContactPatch(0, 0.34, 0.015);

                  // STAGE 4: Crisp 3D Auto-Levelled Sneaker sitting flush on the White Floating Shelf
                  ctx2d.save();
                  ctx2d.translate(shoeScreenX, shoeScreenY + idleBob);
                  ctx2d.rotate(-hoverAmt * 0.09);
                  ctx2d.drawImage(imgSource, -shoeW * 0.5, -shoeH * 0.5, shoeW, shoeH);
                  ctx2d.restore();
                }

                // Sneaker Title label below shelf when hovered
                if (hoverAmt > 0.35 && Math.sin(yaw) > 0.55) {
                  ctx2d.save();
                  ctx2d.globalAlpha = Math.min(1, (hoverAmt - 0.35) * 1.8);
                  ctx2d.fillStyle = '#ffffff';
                  ctx2d.font = `600 ${Math.max(10, Math.round(perspScale * 0.105))}px Inter, system-ui, sans-serif`;
                  ctx2d.textAlign = 'center';
                  ctx2d.shadowColor = 'rgba(0,0,0,0.55)';
                  ctx2d.shadowBlur = 6;
                  ctx2d.fillText(
                    fgShoe.product.title,
                    shoeScreenX,
                    shoeScreenY + shoeH * 0.44
                  );
                  ctx2d.restore();
                }

                fgShoe.screenBounds = {
                  x: shoeScreenX,
                  y: shoeScreenY + shoeH * 0.08,
                  w: shoeW * 0.84,
                  h: shoeH * 0.68,
                };

                screenTagPositions[globalIdx] = {
                  x: shoeScreenX,
                  y: shoeScreenY - shoeH * 0.34,
                  visible:
                    Math.sin(yaw) > 0.72 &&
                    !st.isStoreOverview &&
                    shoeScreenX > 20 &&
                    shoeScreenX < w - 20,
                };
              });
            }

            // ===============================================================
            // WALL 2 (SOUTH): BAGS WALL — 2x3 OAK CUBBY DISPLAY TABLE + 6 LUXURY 3D BAGS
            // ===============================================================
            if (wIdx === 2) {
              drawWallBox3D(
                2,
                0,
                1.48,
                1.86,
                0.42,
                0.12,
                0.26,
                '#261612',
                '#38211b',
                '#1a0f0c',
                'rgba(209, 172, 110, 0.65)'
              );
              const signCam = worldToCam(
                ...wallLocalToWorld(2, 0, 1.48, 0.27),
                yaw,
                camBack
              );
              if (signCam[2] > 0.4) {
                const sx = cxScreen + (signCam[0] / signCam[2]) * focal;
                const sy = cyScreen - (signCam[1] / signCam[2]) * focal;
                const sScale = focal / signCam[2];
                ctx2d.save();
                ctx2d.fillStyle = '#F7F1E5';
                ctx2d.font = `800 ${Math.max(10, Math.round(sScale * 0.20))}px Cinzel, 'Cormorant Garamond', Georgia, serif`;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText('BAGS', sx, sy);
                ctx2d.restore();
              }

              const tW = 5.80;
              const tH = 2.66;
              const tD = 0.92;
              // Dark-oak recessed interior backboard of the 6-cabin cubby cabinet
              drawWallQuad(
                2,
                -tW * 0.5,
                FLOOR_Y,
                tW * 0.5,
                FLOOR_Y + tH,
                0.04,
                '#8f6836',
                'rgba(32, 18, 5, 0.55)',
                1.6
              );

              // Warm recessed LED glow inside all 6 cubby cabins (3 Upper Cabins + 3 Lower Cabins)
              [-1.88, 0, 1.88].forEach((cu) => {
                drawWallQuad(
                  2,
                  cu - 0.78,
                  -0.22,
                  cu + 0.78,
                  -0.10,
                  0.16,
                  'rgba(255, 240, 204, 0.44)'
                );
                drawWallQuad(
                  2,
                  cu - 0.78,
                  -1.42,
                  cu + 0.78,
                  -1.30,
                  0.16,
                  'rgba(255, 240, 204, 0.44)'
                );
              });

              // 3 Horizontal Oak Shelves: Bottom Cabin Floor (-2.46, top at -2.41), Middle Cabin Floor (-1.25, top at -1.20), Top Cabin Roof (-0.04, top at +0.01)
              [-2.46, -1.25, -0.04].forEach((hv) => {
                drawWallBox3D(
                  2,
                  0,
                  hv,
                  tW,
                  0.1,
                  0.04,
                  tD,
                  '#d4b07b',
                  '#e5c696',
                  '#b58e58',
                  'rgba(55, 34, 12, 0.36)'
                );
              });

              // 4 Vertical Oak Dividers creating the 3 Cubby Columns (2 rows x 3 columns = 6 Cabins)
              [-tW * 0.5 + 0.06, -tW / 6, tW / 6, tW * 0.5 - 0.06].forEach((vu) => {
                drawWallBox3D(
                  2,
                  vu,
                  FLOOR_Y + tH * 0.5,
                  0.1,
                  tH,
                  0.04,
                  tD,
                  '#d4b07b',
                  '#e5c696',
                  '#b58e58',
                  'rgba(55, 34, 12, 0.36)'
                );
              });

              // Render all 6 Interactive 3D Luxury Bags inside the 6 Illuminated Oak Cubby Cabins (Row 0 Upper Cabins + Row 1 Lower Cabins)
              BAG_CUBBY_SLOTS.forEach((slot, bIdx) => {
                const globalIdx = clothingCount + shoeCount + bIdx;
                const fgBag = fallbackGarments[globalIdx];
                if (!fgBag) return;
                const isBagHovered = activeHoverIdx === globalIdx;

                p.turnProgress[globalIdx] = THREE.MathUtils.damp(
                  p.turnProgress[globalIdx] || 0,
                  isBagHovered ? 1 : 0,
                  10,
                  dt
                );
                const hoverAmt = p.turnProgress[globalIdx] || 0;

                const bagDepth = 0.54 + hoverAmt * 0.24;
                const bagV = slot.v + hoverAmt * 0.06;
                const [wx, wy, wz] = wallLocalToWorld(2, slot.u, bagV, bagDepth);
                const [cx, cy, cz] = worldToCam(wx, wy, wz, yaw, camBack);

                if (cz <= 0.45) {
                  fgBag.screenBounds = { x: 0, y: 0, w: 0, h: 0 };
                  return;
                }

                const bagScreenX = cxScreen + (cx / cz) * focal;
                const bagScreenY = cyScreen - (cy / cz) * focal;
                const perspScale = focal / cz;

                const southWallFacing = Math.max(0.28, Math.abs(Math.cos(yaw)));
                const bagW = perspScale * 1.18 * (1 + hoverAmt * 0.12) * southWallFacing;
                const bagH = perspScale * 1.18 * (1 + hoverAmt * 0.12);
                const idleBob = st.reducedMotion
                  ? 0
                  : Math.sin(elapsed * 2.0 + bIdx * 0.85) * 1.8 * hoverAmt;

                // Project exact oak shelf top surface coordinate underneath the bag's leather base
                const [shelfWx, shelfWy, shelfWz] = wallLocalToWorld(
                  2,
                  slot.u,
                  slot.shelfTopV,
                  0.54
                );
                const [sCx, sCy, sCz] = worldToCam(shelfWx, shelfWy, shelfWz, yaw, camBack);
                const shelfScreenX =
                  sCz > 0.3 ? cxScreen + (sCx / sCz) * focal : bagScreenX;
                const shelfScreenY =
                  sCz > 0.3
                    ? cyScreen - (sCy / sCz) * focal
                    : bagScreenY + bagH * 0.348;

                const imgSource = fgBag.frontTex.image as CanvasImageSource;
                if (imgSource) {
                  // STAGE 1: Soft 3D Cast Silhouette Shadow onto the Oak Cubby Backboard / Terracotta Wall
                  ctx2d.save();
                  ctx2d.translate(
                    bagScreenX + bagW * 0.04 + hoverAmt * 8,
                    bagScreenY + bagH * 0.03 + hoverAmt * 6
                  );
                  ctx2d.scale(0.95, 0.93);
                  ctx2d.globalAlpha = 0.24 - hoverAmt * 0.05;
                  ctx2d.filter = 'blur(6px) brightness(0.10)';
                  ctx2d.drawImage(imgSource, -bagW * 0.5, -bagH * 0.5, bagW, bagH);
                  ctx2d.restore();

                  // STAGE 2: Wide Warm Penumbra Contact Shadow on the Oak Shelf Top
                  const shadowScale = 1 - hoverAmt * 0.14;
                  const penRx = Math.max(8, bagW * 0.42 * shadowScale);
                  const penRy = Math.max(2.5, bagH * 0.055 * shadowScale);
                  ctx2d.save();
                  ctx2d.translate(shelfScreenX, shelfScreenY + 1.5);
                  ctx2d.scale(1, penRy / penRx);
                  const penGrad = ctx2d.createRadialGradient(0, 0, penRx * 0.08, 0, 0, penRx);
                  penGrad.addColorStop(0, `rgba(24, 14, 6, ${(0.52 - hoverAmt * 0.16).toFixed(2)})`);
                  penGrad.addColorStop(0.55, `rgba(24, 14, 6, ${(0.26 - hoverAmt * 0.08).toFixed(2)})`);
                  penGrad.addColorStop(1, 'rgba(24, 14, 6, 0)');
                  ctx2d.fillStyle = penGrad;
                  ctx2d.beginPath();
                  ctx2d.arc(0, 0, penRx, 0, Math.PI * 2);
                  ctx2d.fill();
                  ctx2d.restore();

                  // STAGE 3: Crisp Ambient Occlusion (AO) Leather Base Crevice Shadow
                  const aoAlpha = 0.86 - hoverAmt * 0.32;
                  const aoRx = Math.max(5, bagW * 0.34 * shadowScale);
                  const aoRy = Math.max(1.5, bagH * 0.024 * shadowScale);
                  ctx2d.save();
                  ctx2d.translate(shelfScreenX, shelfScreenY);
                  ctx2d.scale(1, aoRy / aoRx);
                  const aoGrad = ctx2d.createRadialGradient(0, 0, aoRx * 0.06, 0, 0, aoRx);
                  aoGrad.addColorStop(0, `rgba(10, 6, 3, ${aoAlpha.toFixed(2)})`);
                  aoGrad.addColorStop(0.55, `rgba(16, 10, 5, ${(aoAlpha * 0.58).toFixed(2)})`);
                  aoGrad.addColorStop(1, 'rgba(16, 10, 5, 0)');
                  ctx2d.fillStyle = aoGrad;
                  ctx2d.beginPath();
                  ctx2d.arc(0, 0, aoRx, 0, Math.PI * 2);
                  ctx2d.fill();
                  ctx2d.restore();

                  // STAGE 4: Crisp Background-Removed 3D Luxury Bag sitting flush on the Oak Shelf
                  ctx2d.save();
                  ctx2d.translate(bagScreenX, bagScreenY + idleBob);
                  ctx2d.rotate(hoverAmt * 0.04);
                  ctx2d.drawImage(imgSource, -bagW * 0.5, -bagH * 0.5, bagW, bagH);
                  ctx2d.restore();
                }

                // Bag Title Label on Hover
                if (hoverAmt > 0.35 && Math.cos(yaw) < -0.55) {
                  ctx2d.save();
                  ctx2d.globalAlpha = Math.min(1, (hoverAmt - 0.35) * 1.8);
                  ctx2d.fillStyle = '#F7F1E5';
                  ctx2d.font = `600 ${Math.max(10, Math.round(perspScale * 0.105))}px Inter, system-ui, sans-serif`;
                  ctx2d.textAlign = 'center';
                  ctx2d.shadowColor = 'rgba(0,0,0,0.65)';
                  ctx2d.shadowBlur = 6;
                  ctx2d.fillText(
                    fgBag.product.title,
                    bagScreenX,
                    bagScreenY + bagH * 0.44
                  );
                  ctx2d.restore();
                }

                fgBag.screenBounds = {
                  x: bagScreenX,
                  y: bagScreenY + bagH * 0.05,
                  w: bagW * 0.82,
                  h: bagH * 0.76,
                };

                screenTagPositions[globalIdx] = {
                  x: bagScreenX,
                  y: bagScreenY - bagH * 0.36,
                  visible:
                    Math.cos(yaw) < -0.72 &&
                    !st.isStoreOverview &&
                    bagScreenX > 20 &&
                    bagScreenX < w - 20,
                };
              });
            }

            // ===============================================================
            // WALL 3 (WEST): CAPS WALL — SLATTED OAK BOARD + 4 FLOATING SHELVES + 4 3D CAPS
            // ===============================================================
            if (wIdx === 3) {
              drawWallBox3D(
                3,
                0,
                1.48,
                1.86,
                0.42,
                0.12,
                0.26,
                '#17241c',
                '#24362b',
                '#101a14',
                'rgba(209, 172, 110, 0.65)'
              );
              const signCam = worldToCam(
                ...wallLocalToWorld(3, 0, 1.48, 0.27),
                yaw,
                camBack
              );
              if (signCam[2] > 0.4) {
                const sx = cxScreen + (signCam[0] / signCam[2]) * focal;
                const sy = cyScreen - (signCam[1] / signCam[2]) * focal;
                const sScale = focal / signCam[2];
                ctx2d.save();
                ctx2d.fillStyle = '#F7F1E5';
                ctx2d.font = `800 ${Math.max(10, Math.round(sScale * 0.20))}px Cinzel, 'Cormorant Garamond', Georgia, serif`;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText('CAPS', sx, sy);
                ctx2d.restore();
              }

              // Compact Dark-Bronze Recessed Outer Architectural Frame around the Caps Oak Board
              drawWallBox3D(
                3,
                0,
                0.04,
                4.42,
                2.06,
                0,
                0.05,
                '#3b2610',
                '#4d3216',
                '#2b1b0a',
                'rgba(25, 14, 4, 0.45)'
              );

              // Compact Warm Honey-Oak Slatted Display Board for Caps
              drawWallBox3D(
                3,
                0,
                0.04,
                4.3,
                1.96,
                0.02,
                0.09,
                '#c99d62',
                '#dfb77c',
                '#a67e46',
                'rgba(70, 44, 16, 0.35)'
              );

              // Vertical Wood Slat Grooves across the Caps Oak Board
              for (let cu = -1.92; cu <= 1.92; cu += 0.32) {
                drawWallQuad(
                  3,
                  cu - 0.014,
                  -0.90,
                  cu + 0.014,
                  0.98,
                  0.092,
                  'rgba(68, 42, 14, 0.16)'
                );
              }

              // Warm Overhead Gallery Spotlight Cones on the 2 Cap Columns
              [-1.04, 1.04].forEach((colU) => {
                drawWallQuad(
                  3,
                  colU - 0.65,
                  0.20,
                  colU + 0.65,
                  0.98,
                  0.093,
                  'rgba(255, 243, 216, 0.10)'
                );
              });

              // Low Oak Display Table under the Caps Board
              [-1.95, 1.95].forEach((lu) => {
                drawWallBox3D(
                  3,
                  lu,
                  FLOOR_Y + 0.39,
                  0.12,
                  0.78,
                  0.1,
                  0.86,
                  '#b08954',
                  '#cfa974',
                  '#946f3d'
                );
              });
              drawWallBox3D(
                3,
                0,
                FLOOR_Y + 0.78,
                4.3,
                0.12,
                0.06,
                0.92,
                '#cfa974',
                '#e0bc89',
                '#b08954',
                'rgba(70, 45, 18, 0.24)'
              );

              // 2 Rows × 2 Columns = 4 Crisp White Floating Cap Display Ledges + 4 Interactive 3D Caps!
              CAP_SHELF_SLOTS.forEach((slot, cIdx) => {
                const globalIdx = clothingCount + shoeCount + bagCount + cIdx;
                const fgCap = fallbackGarments[globalIdx];
                const isCapHovered = activeHoverIdx === globalIdx;

                p.turnProgress[globalIdx] = THREE.MathUtils.damp(
                  p.turnProgress[globalIdx] || 0,
                  isCapHovered ? 1 : 0,
                  10,
                  dt
                );
                const hoverAmt = p.turnProgress[globalIdx] || 0;

                // 1. Deep soft cast shadow underneath the floating cap shelf onto the oak board
                drawWallQuad(
                  3,
                  slot.u - 0.60,
                  slot.v - 0.16,
                  slot.u + 0.60,
                  slot.v - 0.038,
                  0.094,
                  'rgba(48, 28, 8, 0.16)'
                );
                drawWallQuad(
                  3,
                  slot.u - 0.57,
                  slot.v - 0.095,
                  slot.u + 0.57,
                  slot.v - 0.038,
                  0.095,
                  'rgba(38, 22, 5, 0.28)'
                );

                // 2. Warm Under-Shelf Recessed LED Light Strip Glow
                drawWallQuad(
                  3,
                  slot.u - 0.50,
                  slot.v - 0.055,
                  slot.u + 0.50,
                  slot.v - 0.036,
                  0.19,
                  'rgba(255, 242, 208, 0.65)'
                );

                // 3. Crisp White 3D Floating Cap Display Shelf (with explicit bright white top deck)
                const su0 = slot.u - 0.58;
                const su1 = slot.u + 0.58;
                const sv0 = slot.v - 0.038;
                const sv1 = slot.v + 0.038;
                const sdStart = 0.09;
                const sdEnd = 0.45;

                fillQuad(
                  [
                    wallLocalToWorld(3, su0, sv1, sdStart),
                    wallLocalToWorld(3, su0, sv1, sdEnd),
                    wallLocalToWorld(3, su0, sv0, sdEnd),
                    wallLocalToWorld(3, su0, sv0, sdStart),
                  ],
                  '#dfddd7'
                );
                fillQuad(
                  [
                    wallLocalToWorld(3, su1, sv1, sdStart),
                    wallLocalToWorld(3, su1, sv1, sdEnd),
                    wallLocalToWorld(3, su1, sv0, sdEnd),
                    wallLocalToWorld(3, su1, sv0, sdStart),
                  ],
                  '#dfddd7'
                );
                fillQuad(
                  [
                    wallLocalToWorld(3, su0, sv1, sdStart),
                    wallLocalToWorld(3, su1, sv1, sdStart),
                    wallLocalToWorld(3, su1, sv1, sdEnd),
                    wallLocalToWorld(3, su0, sv1, sdEnd),
                  ],
                  '#ffffff',
                  'rgba(0,0,0,0.06)',
                  1
                );
                drawWallQuad(
                  3,
                  su0,
                  sv0,
                  su1,
                  sv1,
                  sdEnd,
                  '#f4f3ef',
                  isCapHovered ? 'rgba(232, 93, 42, 0.65)' : 'rgba(0,0,0,0.12)',
                  1.2
                );

                if (!fgCap) return;

                // 3D position of the cap sitting flush on top of this floating shelf
                const capDepth = 0.31 + hoverAmt * 0.22;
                const capV = slot.v + 0.322 + hoverAmt * 0.06;
                const [wx, wy, wz] = wallLocalToWorld(3, slot.u, capV, capDepth);
                const [cx, cy, cz] = worldToCam(wx, wy, wz, yaw, camBack);

                if (cz <= 0.45) {
                  fgCap.screenBounds = { x: 0, y: 0, w: 0, h: 0 };
                  return;
                }

                const capScreenX = cxScreen + (cx / cz) * focal;
                const capScreenY = cyScreen - (cy / cz) * focal;
                const perspScale = focal / cz;

                const westWallFacing = Math.max(0.28, Math.abs(Math.sin(yaw)));
                const capW = perspScale * 0.84 * (1 + hoverAmt * 0.14) * westWallFacing;
                const capH = perspScale * 0.84 * (1 + hoverAmt * 0.14);
                const idleBob = st.reducedMotion
                  ? 0
                  : Math.sin(elapsed * 2.1 + cIdx * 0.9) * 1.8 * hoverAmt;

                // Project exact white shelf top coordinate underneath the cap's brim & crown
                const [shelfTopWx, shelfTopWy, shelfTopWz] = wallLocalToWorld(
                  3,
                  slot.u,
                  slot.v + 0.038,
                  0.31
                );
                const [stCx, stCy, stCz] = worldToCam(
                  shelfTopWx,
                  shelfTopWy,
                  shelfTopWz,
                  yaw,
                  camBack
                );
                const shelfTopScreenX =
                  stCz > 0.3 ? cxScreen + (stCx / stCz) * focal : capScreenX;
                const shelfTopScreenY =
                  stCz > 0.3
                    ? cyScreen - (stCy / stCz) * focal
                    : capScreenY + capH * 0.338;

                const imgSource = fgCap.frontTex.image as CanvasImageSource;
                if (imgSource) {
                  // STAGE 1: Soft 3D Silhouette Cast Shadow onto the Warm Slatted Oak Board behind the cap
                  ctx2d.save();
                  ctx2d.translate(
                    capScreenX + capW * 0.04 + hoverAmt * 8,
                    capScreenY + capH * 0.03 + hoverAmt * 7
                  );
                  ctx2d.rotate(-hoverAmt * 0.05);
                  ctx2d.scale(0.95, 0.92);
                  ctx2d.globalAlpha = 0.22 - hoverAmt * 0.05;
                  ctx2d.filter = 'blur(6px) brightness(0.12)';
                  ctx2d.drawImage(imgSource, -capW * 0.5, -capH * 0.5, capW, capH);
                  ctx2d.restore();

                  // STAGE 2: Wide Diffused Penumbra Contact Shadow across the White Shelf Top Surface
                  const shadowScale = 1 - hoverAmt * 0.15;
                  const penumbraRx = Math.max(8, capW * 0.42 * shadowScale);
                  const penumbraRy = Math.max(2.5, capH * 0.052 * shadowScale);
                  ctx2d.save();
                  ctx2d.translate(shelfTopScreenX, shelfTopScreenY + 1.5);
                  ctx2d.scale(1, penumbraRy / penumbraRx);
                  const penGrad = ctx2d.createRadialGradient(
                    0,
                    0,
                    penumbraRx * 0.08,
                    0,
                    0,
                    penumbraRx
                  );
                  penGrad.addColorStop(
                    0,
                    `rgba(22, 16, 10, ${(0.46 - hoverAmt * 0.16).toFixed(2)})`
                  );
                  penGrad.addColorStop(
                    0.55,
                    `rgba(22, 16, 10, ${(0.24 - hoverAmt * 0.08).toFixed(2)})`
                  );
                  penGrad.addColorStop(1, 'rgba(22, 16, 10, 0)');
                  ctx2d.fillStyle = penGrad;
                  ctx2d.beginPath();
                  ctx2d.arc(0, 0, penumbraRx, 0, Math.PI * 2);
                  ctx2d.fill();
                  ctx2d.restore();

                  // STAGE 3: Crisp Dual-Patch Ambient Occlusion (AO) Crevice Shadow under Visor & Crown Base
                  const aoAlpha = 0.84 - hoverAmt * 0.34;
                  const drawCapContactPatch = (
                    offsetX: number,
                    rxRatio: number,
                    ryRatio: number
                  ) => {
                    const rx = Math.max(4, capW * rxRatio * shadowScale);
                    const ry = Math.max(1.4, capH * ryRatio * shadowScale);
                    ctx2d.save();
                    ctx2d.translate(shelfTopScreenX + offsetX, shelfTopScreenY);
                    ctx2d.scale(1, ry / rx);
                    const aoGrad = ctx2d.createRadialGradient(0, 0, rx * 0.05, 0, 0, rx);
                    aoGrad.addColorStop(0, `rgba(8, 6, 4, ${aoAlpha.toFixed(2)})`);
                    aoGrad.addColorStop(
                      0.5,
                      `rgba(14, 10, 7, ${(aoAlpha * 0.58).toFixed(2)})`
                    );
                    aoGrad.addColorStop(1, 'rgba(14, 10, 7, 0)');
                    ctx2d.fillStyle = aoGrad;
                    ctx2d.beginPath();
                    ctx2d.arc(0, 0, rx, 0, Math.PI * 2);
                    ctx2d.fill();
                    ctx2d.restore();
                  };
                  // Front curved visor contact patch
                  drawCapContactPatch(-capW * 0.08, 0.22, 0.022);
                  // Rear crown base contact patch
                  drawCapContactPatch(capW * 0.14, 0.22, 0.022);
                  // Center sweatband rim bridge
                  drawCapContactPatch(0.02 * capW, 0.34, 0.015);

                  // STAGE 4: Crisp 3D Studio Cap sitting flush on the White Floating Shelf
                  ctx2d.save();
                  ctx2d.translate(capScreenX, capScreenY + idleBob);
                  ctx2d.rotate(-hoverAmt * 0.05);
                  ctx2d.drawImage(imgSource, -capW * 0.5, -capH * 0.5, capW, capH);
                  ctx2d.restore();
                }

                // Cap Title label below shelf when hovered
                if (hoverAmt > 0.35 && Math.sin(yaw) < -0.55) {
                  ctx2d.save();
                  ctx2d.globalAlpha = Math.min(1, (hoverAmt - 0.35) * 1.8);
                  ctx2d.fillStyle = '#F7F1E5';
                  ctx2d.font = `600 ${Math.max(10, Math.round(perspScale * 0.105))}px Inter, system-ui, sans-serif`;
                  ctx2d.textAlign = 'center';
                  ctx2d.shadowColor = 'rgba(0,0,0,0.65)';
                  ctx2d.shadowBlur = 6;
                  ctx2d.fillText(
                    fgCap.product.title,
                    capScreenX,
                    capScreenY + capH * 0.44
                  );
                  ctx2d.restore();
                }

                fgCap.screenBounds = {
                  x: capScreenX,
                  y: capScreenY + capH * 0.06,
                  w: capW * 0.84,
                  h: capH * 0.72,
                };

                screenTagPositions[globalIdx] = {
                  x: capScreenX,
                  y: capScreenY - capH * 0.34,
                  visible:
                    Math.sin(yaw) < -0.72 &&
                    !st.isStoreOverview &&
                    capScreenX > 20 &&
                    capScreenX < w - 20,
                };
              });
            }
          }

          // 2. Render All 7 Clothing Garments Hanging on Wall 0 (North / Clothing Wall) in 3D Room Perspective!
          for (let i = 0; i < clothingCount; i++) {
            const fg = fallbackGarments[i];
            if (!fg) continue;
            const offset = i - p.currentPos;

            const shouldTurnFront = i === activeHoverIdx;
            p.turnProgress[i] = THREE.MathUtils.damp(
              p.turnProgress[i],
              shouldTurnFront ? 1 : 0,
              11,
              dt
            );
            const showFrontMesh = p.turnProgress[i] > 0.48;

            let targetParting = 0;
            if (activeHoverIdx !== -1 && activeHoverIdx < clothingCount && i !== activeHoverIdx) {
              const distFromHover = i - activeHoverIdx;
              const sign = distFromHover < 0 ? -1 : 1;
              targetParting =
                sign * Math.max(0.24, 0.78 / Math.pow(Math.abs(distFromHover), 0.65));
            }
            p.partingOffsets[i] = THREE.MathUtils.damp(
              p.partingOffsets[i],
              targetParting,
              9,
              dt
            );

            if (!st.reducedMotion) {
              const windTorque = Math.sin(elapsed * 2.0 + i * 1.1) * 0.08 * windFactor;
              const accel =
                -14.0 * p.swingAngles[i] -
                4.5 * p.swingVelocities[i] +
                windTorque * 3.5 +
                p.velocity * 2.0;
              p.swingVelocities[i] += accel * dt;
              p.swingAngles[i] += p.swingVelocities[i] * dt;
            } else {
              p.swingAngles[i] = 0;
            }

            const worldX = offset * baseSpacing + p.partingOffsets[i];
            const [wx, wy, wz] = wallLocalToWorld(0, worldX, 0.88, 0.58);
            const [cx, cy, cz] = worldToCam(wx, wy, wz, yaw, camBack);

            if (cz <= 0.45) {
              fg.screenBounds = { x: 0, y: 0, w: 0, h: 0 };
              screenTagPositions[i] = { x: 0, y: 0, visible: false };
              continue;
            }

            const hookScreenX = cxScreen + (cx / cz) * focal;
            const hookScreenY = cyScreen - (cy / cz) * focal;
            const perspScale = focal / cz;

            const flipAngle = showFrontMesh
              ? ((1 - p.turnProgress[i]) / 0.52) * 1.32
              : -(p.turnProgress[i] / 0.48) * 1.32;
            const cosFlip = Math.max(0.14, Math.cos(flipAngle));

            const wallFacingCos = Math.max(0.22, Math.abs(Math.cos(yaw)));
            const garmentW =
              perspScale * 2.38 * (1 + p.turnProgress[i] * 0.12) * wallFacingCos;
            const garmentH = perspScale * 2.64 * (1 + p.turnProgress[i] * 0.12);

            ctx2d.save();
            ctx2d.translate(hookScreenX + 10, hookScreenY + 16);
            ctx2d.rotate(p.swingAngles[i]);
            ctx2d.scale(cosFlip * 0.9, 0.96);
            ctx2d.globalAlpha = 0.26;
            ctx2d.filter = 'blur(8px) brightness(0.1)';
            const imgSource = (
              showFrontMesh ? fg.frontTex.image : fg.sideTex.image
            ) as CanvasImageSource;
            if (imgSource) {
              ctx2d.drawImage(imgSource, -garmentW * 0.5, -10, garmentW, garmentH);
            }
            ctx2d.restore();

            ctx2d.save();
            ctx2d.translate(hookScreenX, hookScreenY);
            ctx2d.rotate(p.swingAngles[i]);
            ctx2d.scale(cosFlip, 1);
            if (imgSource) {
              ctx2d.drawImage(imgSource, -garmentW * 0.5, -10, garmentW, garmentH);
            }
            ctx2d.restore();

            if (p.turnProgress[i] > 0.55 && Math.cos(yaw) > 0.6) {
              ctx2d.save();
              ctx2d.globalAlpha = Math.min(1, (p.turnProgress[i] - 0.55) * 2.2);
              ctx2d.fillStyle = '#F7F1E5';
              ctx2d.shadowColor = 'rgba(0, 0, 0, 0.65)';
              ctx2d.shadowBlur = 6;
              ctx2d.font = `600 ${Math.max(11, Math.round(perspScale * 0.11))}px Inter, system-ui, sans-serif`;
              ctx2d.textAlign = 'center';
              ctx2d.fillText(
                fg.product.title,
                hookScreenX,
                hookScreenY + garmentH * 0.95
              );
              ctx2d.restore();
            }

            fg.screenBounds = {
              x: hookScreenX,
              y: hookScreenY + garmentH * 0.48,
              w: showFrontMesh ? garmentW * 0.75 : garmentW * 0.34,
              h: garmentH * 0.92,
            };

            screenTagPositions[i] = {
              x: hookScreenX,
              y: hookScreenY + 32,
              visible:
                Math.cos(yaw) > 0.72 &&
                !st.isStoreOverview &&
                hookScreenX > 20 &&
                hookScreenX < w - 20,
            };
          }

          // Keep center floor unobstructed so wooden wall display tables remain clearly visible
          centerpieceBounds2D.w = 0;
          centerpieceBounds2D.h = 0;

          // Night Mood Ambient Golden Vignette Overlay
          if (isNightMood) {
            const nightVig = ctx2d.createRadialGradient(
              cxScreen,
              cyScreen,
              Math.min(w, h) * 0.18,
              cxScreen,
              cyScreen,
              Math.max(w, h) * 0.72
            );
            nightVig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            nightVig.addColorStop(1, 'rgba(8, 6, 4, 0.42)');
            ctx2d.fillStyle = nightVig;
            ctx2d.fillRect(0, 0, w, h);
          }

          ctx2d.restore();

          tagCount++;
          if (tagCount % 2 === 0 && st.onUpdateTagPositions) {
            st.onUpdateTagPositions(screenTagPositions);
          }

          animId = requestAnimationFrame(tick2D);
          return;
        }

        // ===================================================================
        // MODE B: WHITE STUDIO RAIL / SUNSET SKY RAIL / QUICK VIEW
        // ===================================================================
        if (isWhiteStudio || isRoomMode) {
          ctx2d.fillStyle = isRoomMode ? '#eceae6' : '#FAFAFA';
          ctx2d.fillRect(0, 0, w, h);
        } else {
          const skyGrad = ctx2d.createLinearGradient(0, 0, 0, h);
          skyGrad.addColorStop(0, '#7c98b3');
          skyGrad.addColorStop(0.35, '#d69f9a');
          skyGrad.addColorStop(0.7, '#eb9c78');
          skyGrad.addColorStop(1, '#d97f54');
          ctx2d.fillStyle = skyGrad;
          ctx2d.fillRect(0, 0, w, h);
        }

        if (!st.isQuickView) {
          ctx2d.save();
          ctx2d.strokeStyle = isWhiteStudio ? '#b8c0c8' : '#d8e0e8';
          ctx2d.lineWidth = 3.2;
          ctx2d.beginPath();
          for (let step = -7.2; step <= 7.2; step += 0.4) {
            getCatenaryPosition(step, tensionSag, false, _vec3A);
            const sx = centerX + _vec3A.x * pxPerUnit;
            const sy = centerY - _vec3A.y * pxPerUnit;
            if (step === -7.2) ctx2d.moveTo(sx, sy);
            else ctx2d.lineTo(sx, sy);
          }
          ctx2d.stroke();
          ctx2d.restore();
        }

        for (let i = 0; i < fallbackGarments.length; i++) {
          const fg = fallbackGarments[i];
          if (!fg) continue;
          const isAccessoryItem = Boolean(
            fg.product.isShoe || fg.product.isBag || fg.product.isCap
          );

          // In non-QuickView rail modes, only render the 7 Clothing garments on the wire
          if (!st.isQuickView && isAccessoryItem) {
            fg.screenBounds = { x: 0, y: 0, w: 0, h: 0 };
            screenTagPositions[i] = { x: 0, y: 0, visible: false };
            continue;
          }

          const offset = i - p.currentPos;

          const shouldTurnFront = st.isQuickView
            ? i === st.activeIndex
            : isWhiteStudio || isRoomMode
              ? i === activeHoverIdx
              : i === st.activeIndex || i === activeHoverIdx;

          p.turnProgress[i] = THREE.MathUtils.damp(
            p.turnProgress[i],
            shouldTurnFront ? 1 : 0,
            11,
            dt
          );

          const showFrontMesh = p.turnProgress[i] > 0.48;

          let targetParting = 0;
          if (!st.isQuickView && activeHoverIdx !== -1 && i !== activeHoverIdx) {
            const distFromHover = i - activeHoverIdx;
            const sign = distFromHover < 0 ? -1 : 1;
            targetParting = sign * Math.max(0.24, 0.78 / Math.pow(Math.abs(distFromHover), 0.65));
          }
          p.partingOffsets[i] = THREE.MathUtils.damp(
            p.partingOffsets[i],
            targetParting,
            9,
            dt
          );

          if (!st.reducedMotion) {
            const windTorque = Math.sin(elapsed * 2.0 + i * 1.1) * 0.08 * windFactor;
            const accel =
              -14.0 * p.swingAngles[i] -
              4.5 * p.swingVelocities[i] +
              windTorque * 3.5 +
              p.velocity * 2.0;
            p.swingVelocities[i] += accel * dt;
            p.swingAngles[i] += p.swingVelocities[i] * dt;
          } else {
            p.swingAngles[i] = 0;
          }

          if (st.isQuickView) {
            if (i === st.activeIndex && st.qvSlideIndex === 0) {
              const qvX = isMobile ? w * 0.5 : w * 0.28;
              const qvY = isMobile ? h * 0.23 : h * 0.46;
              const drawSize = Math.min(w, h) * (isMobile ? 0.44 : 0.62) * st.qvZoom;

              const idleYaw = st.reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.06;
              const totalYaw = p.orbitYaw + idleYaw;
              const orbitSin = Math.sin(totalYaw);
              const orbitCos = Math.cos(totalYaw);
              const pitchSin = Math.sin(p.orbitPitch);

              // Smooth 3D perspective width that never collapses into a flat 2D sliver
              const perspScaleX = 0.78 + 0.22 * Math.abs(orbitCos);
              const perspShearY = orbitSin * 0.11;
              const perspPitchScaleY = 1 - Math.abs(pitchSin) * 0.08;

              // Total 3D volumetric thickness offset across the 16 depth slices
              const totalThicknessX = -orbitSin * drawSize * (isAccessoryItem ? 0.095 : 0.065);
              const totalThicknessY = pitchSin * drawSize * 0.055;

              // 1. 3D Studio Spotlight Aura behind the Product
              const auraRadius = drawSize * 0.78;
              const auraGrad = ctx2d.createRadialGradient(
                qvX - orbitSin * 18,
                qvY - 12,
                auraRadius * 0.08,
                qvX,
                qvY,
                auraRadius
              );
              auraGrad.addColorStop(0, 'rgba(255, 249, 238, 0.95)');
              auraGrad.addColorStop(0.55, 'rgba(238, 230, 216, 0.45)');
              auraGrad.addColorStop(1, 'rgba(246, 242, 236, 0)');
              ctx2d.save();
              ctx2d.fillStyle = auraGrad;
              ctx2d.beginPath();
              ctx2d.arc(qvX, qvY, auraRadius, 0, Math.PI * 2);
              ctx2d.fill();
              ctx2d.restore();

              // 2. Interactive 3D Rotating Studio Turntable Pedestal beneath the Product
              const ttCenterY = qvY + drawSize * (isAccessoryItem ? 0.34 : 0.45);
              const ttRx = drawSize * (isAccessoryItem ? 0.48 : 0.44);
              const ttRy = ttRx * (0.22 + Math.max(-0.06, pitchSin * 0.12));
              const ttRimHeight = Math.max(8, drawSize * 0.038);

              ctx2d.save();
              // Turntable Floor Drop Shadow
              const floorShadowGrad = ctx2d.createRadialGradient(
                qvX,
                ttCenterY + ttRimHeight + 6,
                ttRx * 0.15,
                qvX,
                ttCenterY + ttRimHeight + 6,
                ttRx * 1.18
              );
              floorShadowGrad.addColorStop(0, 'rgba(24, 18, 12, 0.34)');
              floorShadowGrad.addColorStop(0.6, 'rgba(24, 18, 12, 0.14)');
              floorShadowGrad.addColorStop(1, 'rgba(24, 18, 12, 0)');
              ctx2d.fillStyle = floorShadowGrad;
              ctx2d.beginPath();
              ctx2d.ellipse(
                qvX,
                ttCenterY + ttRimHeight + 6,
                ttRx * 1.15,
                ttRy * 1.22,
                0,
                0,
                Math.PI * 2
              );
              ctx2d.fill();

              // Turntable 3D Cylindrical Side Wall (Brushed Warm Stone + Gold Trim)
              const sideWallGrad = ctx2d.createLinearGradient(
                qvX - ttRx,
                ttCenterY,
                qvX + ttRx,
                ttCenterY
              );
              sideWallGrad.addColorStop(0, '#b5a894');
              sideWallGrad.addColorStop(0.3, '#e8dfd1');
              sideWallGrad.addColorStop(0.5, '#f5efe6');
              sideWallGrad.addColorStop(0.75, '#cfc3b0');
              sideWallGrad.addColorStop(1, '#9e907c');

              ctx2d.fillStyle = sideWallGrad;
              ctx2d.beginPath();
              ctx2d.ellipse(qvX, ttCenterY + ttRimHeight, ttRx, ttRy, 0, 0, Math.PI);
              ctx2d.lineTo(qvX - ttRx, ttCenterY);
              ctx2d.ellipse(qvX, ttCenterY, ttRx, ttRy, 0, Math.PI, 0, true);
              ctx2d.closePath();
              ctx2d.fill();

              // Gold Lower Bezel Ring
              ctx2d.strokeStyle = '#D4AF37';
              ctx2d.lineWidth = 1.6;
              ctx2d.beginPath();
              ctx2d.ellipse(qvX, ttCenterY + ttRimHeight, ttRx, ttRy, 0, 0, Math.PI);
              ctx2d.stroke();

              // Turntable Top Surface Deck
              const topDeckGrad = ctx2d.createRadialGradient(
                qvX - orbitSin * ttRx * 0.25,
                ttCenterY - ttRy * 0.2,
                ttRx * 0.05,
                qvX,
                ttCenterY,
                ttRx
              );
              topDeckGrad.addColorStop(0, '#ffffff');
              topDeckGrad.addColorStop(0.65, '#f4efe7');
              topDeckGrad.addColorStop(1, '#dfd6c7');

              ctx2d.fillStyle = topDeckGrad;
              ctx2d.strokeStyle = '#D4AF37';
              ctx2d.lineWidth = 1.8;
              ctx2d.beginPath();
              ctx2d.ellipse(qvX, ttCenterY, ttRx, ttRy, 0, 0, Math.PI * 2);
              ctx2d.fill();
              ctx2d.stroke();

              // Rotating 360° Compass Degree Tick Marks on the Turntable Top Ring
              const tickCount = 24;
              for (let tIdx = 0; tIdx < tickCount; tIdx++) {
                const tAng = (tIdx / tickCount) * Math.PI * 2 + totalYaw;
                const rInner = tIdx % 3 === 0 ? 0.82 : 0.88;
                const rOuter = 0.95;
                const x0 = qvX + Math.cos(tAng) * ttRx * rInner;
                const y0 = ttCenterY + Math.sin(tAng) * ttRy * rInner;
                const x1 = qvX + Math.cos(tAng) * ttRx * rOuter;
                const y1 = ttCenterY + Math.sin(tAng) * ttRy * rOuter;

                ctx2d.strokeStyle =
                  tIdx % 3 === 0 ? 'rgba(184, 142, 42, 0.85)' : 'rgba(140, 122, 95, 0.45)';
                ctx2d.lineWidth = tIdx % 3 === 0 ? 1.8 : 1.0;
                ctx2d.beginPath();
                ctx2d.moveTo(x0, y0);
                ctx2d.lineTo(x1, y1);
                ctx2d.stroke();
              }

              // Product Contact Shadow on the Turntable Top Surface (shifts with 3D rotation)
              const contactShadowRx = ttRx * (isAccessoryItem ? 0.62 : 0.48) * perspScaleX;
              const contactShadowRy = ttRy * 0.52;
              const contactGrad = ctx2d.createRadialGradient(
                qvX + totalThicknessX * 0.25,
                ttCenterY - ttRy * 0.05,
                contactShadowRx * 0.08,
                qvX + totalThicknessX * 0.25,
                ttCenterY - ttRy * 0.05,
                contactShadowRx
              );
              contactGrad.addColorStop(0, 'rgba(20, 14, 8, 0.52)');
              contactGrad.addColorStop(0.55, 'rgba(20, 14, 8, 0.22)');
              contactGrad.addColorStop(1, 'rgba(20, 14, 8, 0)');
              ctx2d.fillStyle = contactGrad;
              ctx2d.beginPath();
              ctx2d.ellipse(
                qvX + totalThicknessX * 0.25,
                ttCenterY - ttRy * 0.05,
                contactShadowRx,
                contactShadowRy,
                orbitSin * 0.15,
                0,
                Math.PI * 2
              );
              ctx2d.fill();
              ctx2d.restore();

              // 3. 16-Layer Volumetric 3D Extrusion Stack + Sculpted Front Surface
              const imgSource = fg.frontTex.image as CanvasImageSource;
              if (imgSource) {
                const depthSlices = 14;
                for (let s = 0; s <= depthSlices; s++) {
                  const t = s / depthSlices; // 0 = back shell, 1 = front shell
                  const sliceOffsetX = (0.5 - t) * totalThicknessX;
                  const sliceOffsetY = (0.5 - t) * totalThicknessY;
                  const isFrontSlice = s === depthSlices;

                  ctx2d.save();
                  ctx2d.translate(qvX + sliceOffsetX, qvY + sliceOffsetY);
                  ctx2d.rotate(p.swingAngles[i] * 0.18 + p.orbitPitch * 0.08);
                  ctx2d.transform(
                    perspScaleX,
                    perspShearY,
                    -perspShearY * 0.28,
                    perspPitchScaleY,
                    0,
                    0
                  );

                  if (!isFrontSlice) {
                    // Volumetric 3D side-wall extrusion shading (dark warm bevel along the sole/edges)
                    const shade = Math.round(58 + t * 28);
                    ctx2d.filter = `brightness(${shade}%) contrast(118%) saturate(90%)`;
                    ctx2d.globalAlpha = 0.92;
                  } else {
                    ctx2d.filter = 'drop-shadow(0px 10px 18px rgba(18, 12, 6, 0.22))';
                  }

                  ctx2d.drawImage(
                    imgSource,
                    -drawSize * 0.5,
                    -drawSize * 0.48,
                    drawSize,
                    drawSize * 1.05
                  );
                  ctx2d.restore();
                }

                // 4. Dynamic 3D Specular Rim-Light Sweep across the Product as you rotate
                if (Math.abs(orbitSin) > 0.04) {
                  ctx2d.save();
                  ctx2d.translate(qvX - totalThicknessX * 0.5, qvY - totalThicknessY * 0.5);
                  ctx2d.transform(
                    perspScaleX,
                    perspShearY,
                    -perspShearY * 0.28,
                    perspPitchScaleY,
                    0,
                    0
                  );
                  const sheenX = orbitSin * drawSize * 0.28;
                  const sheenGrad = ctx2d.createLinearGradient(
                    sheenX - drawSize * 0.22,
                    -drawSize * 0.4,
                    sheenX + drawSize * 0.22,
                    drawSize * 0.4
                  );
                  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                  sheenGrad.addColorStop(
                    0.5,
                    `rgba(255, 250, 240, ${(Math.abs(orbitSin) * 0.16).toFixed(3)})`
                  );
                  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                  ctx2d.globalCompositeOperation = 'source-atop';
                  ctx2d.fillStyle = sheenGrad;
                  ctx2d.fillRect(-drawSize * 0.45, -drawSize * 0.45, drawSize * 0.9, drawSize * 0.9);
                  ctx2d.restore();
                }
              }
            }
            screenTagPositions[i] = { x: 0, y: 0, visible: false };
          } else {
            const worldX = offset * baseSpacing + p.partingOffsets[i];
            getCatenaryPosition(worldX, tensionSag, false, _vec3A);

            const hookScreenX = centerX + _vec3A.x * pxPerUnit;
            const hookScreenY = centerY - _vec3A.y * pxPerUnit;

            const flipAngle = showFrontMesh
              ? ((1 - p.turnProgress[i]) / 0.52) * 1.32
              : -(p.turnProgress[i] / 0.48) * 1.32;
            const cosFlip = Math.max(0.14, Math.cos(flipAngle));

            const garmentW = pxPerUnit * 2.48 * (1 + p.turnProgress[i] * 0.12);
            const garmentH = pxPerUnit * 2.74 * (1 + p.turnProgress[i] * 0.12);

            ctx2d.save();
            ctx2d.translate(hookScreenX, hookScreenY);
            ctx2d.rotate(p.swingAngles[i]);
            ctx2d.scale(cosFlip, 1);

            const imgSource = (
              showFrontMesh ? fg.frontTex.image : fg.sideTex.image
            ) as CanvasImageSource;
            if (imgSource) {
              ctx2d.drawImage(imgSource, -garmentW * 0.5, -12, garmentW, garmentH);
            }
            ctx2d.restore();

            fg.screenBounds = {
              x: hookScreenX,
              y: hookScreenY + garmentH * 0.48,
              w: showFrontMesh ? garmentW * 0.75 : garmentW * 0.32,
              h: garmentH * 0.92,
            };

            screenTagPositions[i] = {
              x: hookScreenX,
              y: hookScreenY + 34,
              visible: hookScreenX > 20 && hookScreenX < w - 20,
            };
          }
        }

        ctx2d.restore();

        tagCount++;
        if (tagCount % 2 === 0 && st.onUpdateTagPositions) {
          st.onUpdateTagPositions(screenTagPositions);
        }

        animId = requestAnimationFrame(tick2D);
      };

      tick2D();

      return () => {
        isDisposed2D = true;
        cancelAnimationFrame(animId);
        fallbackCanvas.removeEventListener('pointerdown', handlePointerDown2D);
        window.removeEventListener('pointermove', handlePointerMove2D);
        window.removeEventListener('pointerup', handlePointerUp2D);
        window.removeEventListener('resize', handleResize2D);
      };
    }

    // =========================================================================
    // PRIMARY ENGINE: THREE.JS WEBGL 3D STAGE
    // =========================================================================
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, -0.35, 8.2);
    camera.lookAt(0, -0.5, 0);

    const skyGeo = new THREE.SphereGeometry(68, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y * 0.85 + 0.45, 0.0, 1.0);

          vec3 cHorizon = vec3(0.851, 0.498, 0.329);
          vec3 cGlow    = vec3(0.961, 0.690, 0.463);
          vec3 cWarm    = vec3(0.922, 0.612, 0.471);
          vec3 cRose    = vec3(0.839, 0.624, 0.604);
          vec3 cDusk    = vec3(0.659, 0.624, 0.678);
          vec3 cZenith  = vec3(0.486, 0.596, 0.702);

          vec3 col = mix(cHorizon, cGlow, smoothstep(0.0, 0.22, h));
          col = mix(col, cWarm, smoothstep(0.22, 0.42, h));
          col = mix(col, cRose, smoothstep(0.42, 0.64, h));
          col = mix(col, cDusk, smoothstep(0.64, 0.84, h));
          col = mix(col, cZenith, smoothstep(0.84, 1.0, h));

          float sunDist = length(vec2(dir.x, dir.y + 0.10));
          float sunGlow = exp(-sunDist * 3.0) * 0.28;
          col += vec3(1.0, 0.78, 0.48) * sunGlow;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    const cloudTex = createCloudPuffTexture();
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);

    const cloudPuffs: { mesh: THREE.Mesh; speed: number; baseY: number; phase: number }[] = [];
    const cloudGeo = new THREE.PlaneGeometry(10.5, 5.6);

    for (let i = 0; i < 22; i++) {
      const cloudMat = new THREE.MeshBasicMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.32 + (i % 4) * 0.08,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(cloudGeo, cloudMat);
      const x = (i - 11) * 2.5 + Math.sin(i * 2.1) * 1.4;
      const y = -3.4 + (i % 5) * 1.35;
      const z = -9.8 - (i % 4) * 3.0;
      mesh.position.set(x, y, z);
      const scale = 0.9 + (i % 3) * 0.35;
      mesh.scale.set(scale * 1.35, scale, 1);
      cloudGroup.add(mesh);
      cloudPuffs.push({
        mesh,
        speed: 0.1 + (i % 5) * 0.035,
        baseY: y,
        phase: i * 0.9,
      });
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const showroomRoomRefs = createShowroomRoomGroup(maxAniso);
    scene.add(showroomRoomRefs.group);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8e4e0, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
    keyLight.position.set(3.5, 4.8, 6.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xeef2f6, 0.25);
    fillLight.position.set(-4.0, 2.0, 4.5);
    scene.add(fillLight);

    // Overhead Golden Chandelier Pin-Spotlight + Pedestal Warm Glow Light
    const centerSpotLight = new THREE.SpotLight(0xffe6a3, 2.4, 14, Math.PI / 5, 0.55, 1.2);
    centerSpotLight.position.set(0, 3.05, 5.2);
    centerSpotLight.target.position.set(0, -2.0, 5.2);
    scene.add(centerSpotLight);
    scene.add(centerSpotLight.target);

    const pedestalPointLight = new THREE.PointLight(0xf5d77f, 0.9, 4.5, 1.5);
    pedestalPointLight.position.set(0, -1.55, 5.2);
    scene.add(pedestalPointLight);

    const wireMat = new THREE.MeshPhysicalMaterial({
      color: 0xc4ccd4,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.6,
    });

    const wirePoints = [
      new THREE.Vector3(-7.2, 1.22, -0.35),
      new THREE.Vector3(-3.6, 0.82, -0.08),
      new THREE.Vector3(0, 0.64, 0),
      new THREE.Vector3(3.6, 0.82, -0.08),
      new THREE.Vector3(7.2, 1.22, -0.35),
    ];
    const wireCurve = new THREE.CatmullRomCurve3(wirePoints);
    const wireGeo = new THREE.TubeGeometry(wireCurve, 56, 0.02, 12, false);
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    const sharedWoodTex = createMapleWoodTexture(maxAniso);
    const sharedFleeceBump = createFleeceBumpTexture(maxAniso);

    const garmentRefs: GarmentMeshRefs[] = stateRef.current.products.map((prod, idx) => {
      const refs = createGarmentGroup(
        prod,
        stateRef.current.selectedColors[idx] ?? prod.defaultColor,
        sharedWoodTex,
        sharedFleeceBump,
        maxAniso
      );
      scene.add(refs.group);
      return refs;
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    const domEl = renderer.domElement;
    let lastHoverRaycast = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const p = physicsRef.current;
      p.isDragging = true;
      p.dragMoved = false;
      p.dragStartX = e.clientX;
      p.dragStartY = e.clientY;
      p.dragStartTarget = p.targetPos;
      p.dragStartYaw = p.targetOrbitYaw;
      p.dragStartPitch = p.targetOrbitPitch;
      p.dragStartRoomYaw = p.targetRoomYaw;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const p = physicsRef.current;
      const rect = domEl.getBoundingClientRect();

      p.mouseParallaxX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      p.mouseParallaxY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (p.isDragging) {
        const dx = e.clientX - p.dragStartX;
        const dy = e.clientY - p.dragStartY;
        if (Math.hypot(dx, dy) > 6) {
          p.dragMoved = true;
        }

        if (stateRef.current.isQuickView) {
          const orbitSens = window.innerWidth < 768 ? 0.014 : 0.01;
          p.targetOrbitYaw = p.dragStartYaw + dx * orbitSens;
          p.targetOrbitPitch = THREE.MathUtils.clamp(
            p.dragStartPitch + dy * 0.005,
            -0.38,
            0.38
          );
        } else if (stateRef.current.sceneMode === 'room') {
          const roomSwipeSens = window.innerWidth < 768 ? 0.0078 : 0.0042;
          p.targetRoomYaw = p.dragStartRoomYaw - dx * roomSwipeSens;
        } else {
          const deltaIndex = -dx / (window.innerWidth < 768 ? 115 : 190);
          p.targetPos = THREE.MathUtils.clamp(
            p.dragStartTarget + deltaIndex,
            0,
            clothingCount - 1
          );
        }
        return;
      }

      const now = performance.now();
      if (!stateRef.current.isQuickView && now - lastHoverRaycast > 40) {
        lastHoverRaycast = now;
        _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(_pointerNdc, camera);

        let foundHover = -1;
        const cosClothingWall = Math.cos(p.roomYaw);
        const sinShoesWall = Math.sin(p.roomYaw);

        if (stateRef.current.sceneMode !== 'room' || cosClothingWall > 0.35) {
          for (let i = 0; i < clothingCount; i++) {
            if (!garmentRefs[i].group.visible) continue;
            const hits = raycaster.intersectObject(garmentRefs[i].group, true);
            if (hits.length > 0) {
              foundHover = i;
              break;
            }
          }
        }

        if (
          foundHover === -1 &&
          stateRef.current.sceneMode === 'room' &&
          sinShoesWall > 0.35
        ) {
          for (let sIdx = 0; sIdx < showroomRoomRefs.shoeGroups.length; sIdx++) {
            const sg = showroomRoomRefs.shoeGroups[sIdx];
            const hits = raycaster.intersectObject(sg, true);
            if (hits.length > 0) {
              foundHover = clothingCount + sIdx;
              break;
            }
          }
        }

        if (
          foundHover === -1 &&
          stateRef.current.sceneMode === 'room' &&
          cosClothingWall < -0.35
        ) {
          for (let bIdx = 0; bIdx < showroomRoomRefs.bagGroups.length; bIdx++) {
            const bg = showroomRoomRefs.bagGroups[bIdx];
            const hits = raycaster.intersectObject(bg, true);
            if (hits.length > 0) {
              foundHover = clothingCount + shoeCount + bIdx;
              break;
            }
          }
        }

        if (
          foundHover === -1 &&
          stateRef.current.sceneMode === 'room' &&
          sinShoesWall < -0.35
        ) {
          for (let cIdx = 0; cIdx < showroomRoomRefs.capGroups.length; cIdx++) {
            const cg = showroomRoomRefs.capGroups[cIdx];
            const hits = raycaster.intersectObject(cg, true);
            if (hits.length > 0) {
              foundHover = clothingCount + shoeCount + bagCount + cIdx;
              break;
            }
          }
        }

        if (foundHover !== p.internalHoveredIdx) {
          if (foundHover !== -1 && !stateRef.current.reducedMotion) {
            p.swingVelocities[foundHover] += 0.24;
          }
          p.internalHoveredIdx = foundHover;
          stateRef.current.onHoverGarment(foundHover === -1 ? null : foundHover);
          domEl.style.cursor = foundHover !== -1 ? 'pointer' : 'grab';
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const p = physicsRef.current;
      if (!p.isDragging) return;
      p.isDragging = false;

      if (!stateRef.current.isQuickView) {
        if (p.dragMoved) {
          if (stateRef.current.sceneMode === 'room') {
            const twoPi = Math.PI * 2;
            const normYaw = ((p.targetRoomYaw % twoPi) + twoPi) % twoPi;
            const nearestWall = Math.round(normYaw / (Math.PI * 0.5)) % 4;
            const snappedYaw = Math.round(p.targetRoomYaw / (Math.PI * 0.5)) * (Math.PI * 0.5);
            p.targetRoomYaw = snappedYaw;
            if (stateRef.current.onChangeWallIndex) {
              stateRef.current.onChangeWallIndex(nearestWall, false);
            }
          } else if (stateRef.current.sceneMode !== 'white-studio') {
            const snapped = Math.round(p.targetPos);
            p.targetPos = snapped;
            stateRef.current.onSelectGarment(snapped);
          }
        } else {
          const rect = domEl.getBoundingClientRect();
          _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(_pointerNdc, camera);

          for (let i = 0; i < clothingCount; i++) {
            if (!garmentRefs[i].group.visible) continue;
            const intersects = raycaster.intersectObject(garmentRefs[i].group, true);
            if (intersects.length > 0) {
              if (
                stateRef.current.sceneMode === 'white-studio' ||
                stateRef.current.sceneMode === 'room'
              ) {
                stateRef.current.onSelectGarment(i);
                stateRef.current.onOpenQuickView(i);
              } else {
                if (
                  i === stateRef.current.activeIndex &&
                  Math.abs(p.currentPos - p.targetPos) < 0.2
                ) {
                  stateRef.current.onOpenQuickView(i);
                } else {
                  p.targetPos = i;
                  stateRef.current.onSelectGarment(i);
                }
              }
              return;
            }
          }

          if (stateRef.current.sceneMode === 'room') {
            for (let sIdx = 0; sIdx < showroomRoomRefs.shoeGroups.length; sIdx++) {
              const sg = showroomRoomRefs.shoeGroups[sIdx];
              const intersects = raycaster.intersectObject(sg, true);
              if (intersects.length > 0) {
                const globalIdx = clothingCount + sIdx;
                stateRef.current.onSelectGarment(globalIdx);
                stateRef.current.onOpenQuickView(globalIdx);
                return;
              }
            }
            for (let bIdx = 0; bIdx < showroomRoomRefs.bagGroups.length; bIdx++) {
              const bg = showroomRoomRefs.bagGroups[bIdx];
              const intersects = raycaster.intersectObject(bg, true);
              if (intersects.length > 0) {
                const globalIdx = clothingCount + shoeCount + bIdx;
                stateRef.current.onSelectGarment(globalIdx);
                stateRef.current.onOpenQuickView(globalIdx);
                return;
              }
            }
            for (let cIdx = 0; cIdx < showroomRoomRefs.capGroups.length; cIdx++) {
              const cg = showroomRoomRefs.capGroups[cIdx];
              const intersects = raycaster.intersectObject(cg, true);
              if (intersects.length > 0) {
                const globalIdx = clothingCount + shoeCount + bagCount + cIdx;
                stateRef.current.onSelectGarment(globalIdx);
                stateRef.current.onOpenQuickView(globalIdx);
                return;
              }
            }
          }
        }
      }
    };

    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      // Widen FOV slightly on narrow portrait mobile screens so 4-wall showroom fits cleanly
      camera.fov = aspect < 0.85 ? THREE.MathUtils.clamp(38 + (0.85 - aspect) * 34, 38, 54) : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    let tagUpdateCounter = 0;
    const clock = new THREE.Clock();
    const activeRenderer = renderer;

    function afterDraw(cb: () => void) {
      const gl = activeRenderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const p = physicsRef.current;

      const isMobile = window.innerWidth < 1024;
      const isCompactPhone = window.innerWidth < 640;
      const isWhiteStudio = st.sceneMode === 'white-studio';
      const isRoomMode = st.sceneMode === 'room';
      const windFactor = st.reducedMotion ? 0 : st.windIntensity / 100;
      const tensionSag = (1 - st.wireTension / 100) * 0.32;

      p.wallTransitionOffset = THREE.MathUtils.damp(p.wallTransitionOffset, 0, 7, dt);
      p.roomYaw = THREE.MathUtils.damp(p.roomYaw, p.targetRoomYaw, 6.5, dt);
      p.roomZoom = THREE.MathUtils.damp(p.roomZoom, p.targetRoomZoom, 6.5, dt);

      if (isRoomMode && !st.isQuickView) {
        const roomCenterZ = 5.2;
        const portraitBackBoost = isCompactPhone ? 1.28 : isMobile ? 1.12 : 1.0;
        const camBack = (3.0 / p.roomZoom) * portraitBackBoost;
        const lookX = Math.sin(p.roomYaw);
        const lookZ = -Math.cos(p.roomYaw);
        camera.position.set(-lookX * camBack, -0.25, roomCenterZ - lookZ * camBack);
        camera.lookAt(lookX * 6.0, -0.32, roomCenterZ + lookZ * 6.0);
      } else {
        camera.position.set(0, -0.35, 8.2);
        camera.lookAt(0, -0.5, 0);
      }

      skyMesh.visible = st.sceneMode === 'sky';
      cloudGroup.visible = st.sceneMode === 'sky';
      showroomRoomRefs.group.visible = isRoomMode && !st.isQuickView;
      showroomRoomRefs.group.position.x = 0;
      updateShowroomWallTheme(showroomRoomRefs, st.activeWallIndex, maxAniso);

      // Update Day / Night Luxury Lighting Mood & Centerpiece Rotating Display
      const isNightMood = st.lightingMood === 'obsidian-night';
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        isNightMood ? 0.38 : 1.15,
        5,
        dt
      );
      hemiLight.color.setHex(isNightMood ? 0xffdfa8 : 0xffffff);
      hemiLight.groundColor.setHex(isNightMood ? 0x1a140e : 0xe8e4e0);
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        isNightMood ? 0.35 : 0.65,
        5,
        dt
      );
      fillLight.intensity = THREE.MathUtils.damp(
        fillLight.intensity,
        isNightMood ? 0.12 : 0.25,
        5,
        dt
      );
      centerSpotLight.visible = isRoomMode && !st.isQuickView;
      pedestalPointLight.visible = isRoomMode && !st.isQuickView;
      centerSpotLight.intensity = THREE.MathUtils.damp(
        centerSpotLight.intensity,
        isNightMood ? 4.8 : 2.2,
        5,
        dt
      );
      pedestalPointLight.intensity = THREE.MathUtils.damp(
        pedestalPointLight.intensity,
        isNightMood ? 1.85 : 0.85,
        5,
        dt
      );
      showroomRoomRefs.ceilingMat.color.setHex(isNightMood ? 0x1a1612 : 0xebe5dc);

      const cpIdx = st.centerpieceIndex ?? 7;
      const cpProd = st.products[cpIdx] || st.products[0];
      if (cpProd) {
        const cpColorIdx = st.selectedColors[cpIdx] ?? cpProd.defaultColor;
        updateCenterpieceProduct(showroomRoomRefs, cpProd, cpColorIdx, maxAniso);
      }
      if (!st.reducedMotion) {
        showroomRoomRefs.centerTurntableGroup.rotation.y = elapsed * 0.85;
        showroomRoomRefs.centerItemMesh.position.y =
          0.42 + Math.sin(elapsed * 2.2) * 0.03;
      }

      wireMesh.visible =
        !isRoomMode &&
        !st.products[st.activeIndex]?.isShoe &&
        !st.products[st.activeIndex]?.isBag &&
        !st.products[st.activeIndex]?.isCap;
      scene.fog =
        st.sceneMode === 'sky' ? new THREE.FogExp2(0xdc8d6c, 0.016) : null;

      for (let i = 0; i < garmentRefs.length; i++) {
        garmentRefs[i].product = st.products[i];
        const wantedColor = st.selectedColors[i] ?? st.products[i].defaultColor;
        updateGarmentColors(garmentRefs[i], wantedColor, maxAniso);
      }

      if (!st.reducedMotion && st.sceneMode === 'sky') {
        for (let i = 0; i < cloudPuffs.length; i++) {
          const cp = cloudPuffs[i];
          cp.mesh.position.x += cp.speed * dt * (0.6 + windFactor * 1.1);
          if (cp.mesh.position.x > 16) cp.mesh.position.x = -16;
          cp.mesh.position.y = cp.baseY + Math.sin(elapsed * 0.4 + cp.phase) * 0.08;
        }
      }

      if (st.reducedMotion) {
        p.currentPos = p.targetPos;
        p.velocity = 0;
      } else {
        const posDiff = p.targetPos - p.currentPos;
        p.velocity = p.velocity * 0.8 + posDiff * 0.14;
        p.currentPos += p.velocity;
      }

      p.orbitYaw = THREE.MathUtils.damp(p.orbitYaw, p.targetOrbitYaw, 8, dt);
      p.orbitPitch = THREE.MathUtils.damp(p.orbitPitch, p.targetOrbitPitch, 8, dt);

      const dynamicSag =
        tensionSag +
        (st.reducedMotion
          ? 0
          : Math.min(0.18, Math.abs(p.velocity) * 0.38) +
            Math.sin(elapsed * 1.8) * 0.018 * windFactor);

      const targetWireY = st.isQuickView ? 3.8 : 0;
      wireMesh.position.y = THREE.MathUtils.damp(wireMesh.position.y, targetWireY, 6, dt);
      wireMesh.scale.y = 1 + dynamicSag * 0.28;

      const baseSpacing =
        isWhiteStudio || isRoomMode
          ? isCompactPhone
            ? 0.94
            : isMobile
              ? 1.04
              : 1.12
          : isMobile
            ? 1.85
            : 2.15;
      const activeHoverIdx =
        st.hoveredIndex !== null ? st.hoveredIndex : p.internalHoveredIdx;

      const screenTagPositions: { x: number; y: number; visible: boolean }[] =
        garmentRefs.map(() => ({ x: 0, y: 0, visible: false }));

      // Animate the 6 3D Sneakers on Wall 1 (East / Shoes Wall) inside the 3D Room
      for (let sIdx = 0; sIdx < showroomRoomRefs.shoeGroups.length; sIdx++) {
        const sg = showroomRoomRefs.shoeGroups[sIdx];
        const globalIdx = clothingCount + sIdx;
        const isShoeHovered = activeHoverIdx === globalIdx;
        p.turnProgress[globalIdx] = THREE.MathUtils.damp(
          p.turnProgress[globalIdx] || 0,
          isShoeHovered ? 1 : 0,
          10,
          dt
        );
        const hoverAmt = p.turnProgress[globalIdx] || 0;
        const baseX = sg.userData.baseX ?? 0;
        const baseY = sg.userData.baseY ?? 0;
        const baseZ = sg.userData.baseZ ?? 0.36;

        sg.position.set(baseX, baseY + hoverAmt * 0.08, baseZ + hoverAmt * 0.22);
        sg.rotation.z = hoverAmt * 0.09;
        sg.scale.setScalar(1 + hoverAmt * 0.14);

        const contactShadowMesh = sg.userData.contactShadowMesh as THREE.Mesh | undefined;
        if (contactShadowMesh) {
          contactShadowMesh.scale.set(1 - hoverAmt * 0.12, 1 - hoverAmt * 0.12, 1);
        }

        if (isRoomMode && !st.isQuickView) {
          sg.getWorldPosition(_projVec);
          _projVec.y += 0.42;
          _projVec.project(camera);
          const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;
          screenTagPositions[globalIdx] = {
            x: sx,
            y: sy,
            visible:
              _projVec.z < 1 &&
              Math.sin(p.roomYaw) > 0.72 &&
              !st.isStoreOverview &&
              sx > 12 &&
              sx < window.innerWidth - 12,
          };
        }
      }

      // Animate the 6 3D Luxury Bags on Wall 2 (South / Bags Wall) inside the 3D Room
      for (let bIdx = 0; bIdx < showroomRoomRefs.bagGroups.length; bIdx++) {
        const bg = showroomRoomRefs.bagGroups[bIdx];
        const globalIdx = clothingCount + shoeCount + bIdx;
        const isBagHovered = activeHoverIdx === globalIdx;
        p.turnProgress[globalIdx] = THREE.MathUtils.damp(
          p.turnProgress[globalIdx] || 0,
          isBagHovered ? 1 : 0,
          10,
          dt
        );
        const hoverAmt = p.turnProgress[globalIdx] || 0;
        const baseX = bg.userData.baseX ?? 0;
        const baseY = bg.userData.baseY ?? 0;
        const baseZ = bg.userData.baseZ ?? 0.54;

        bg.position.set(baseX, baseY + hoverAmt * 0.07, baseZ + hoverAmt * 0.22);
        bg.rotation.z = hoverAmt * 0.04;
        bg.scale.setScalar(1 + hoverAmt * 0.14);

        const contactShadowMesh = bg.userData.contactShadowMesh as THREE.Mesh | undefined;
        if (contactShadowMesh) {
          contactShadowMesh.scale.set(1 - hoverAmt * 0.12, 1 - hoverAmt * 0.12, 1);
        }

        if (isRoomMode && !st.isQuickView) {
          bg.getWorldPosition(_projVec);
          _projVec.y += 0.38;
          _projVec.project(camera);
          const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;
          screenTagPositions[globalIdx] = {
            x: sx,
            y: sy,
            visible:
              _projVec.z < 1 &&
              Math.cos(p.roomYaw) < -0.72 &&
              !st.isStoreOverview &&
              sx > 12 &&
              sx < window.innerWidth - 12,
          };
        }
      }

      // Animate the 4 3D Studio Caps on Wall 3 (West / Caps Wall) inside the 3D Room
      for (let cIdx = 0; cIdx < showroomRoomRefs.capGroups.length; cIdx++) {
        const cg = showroomRoomRefs.capGroups[cIdx];
        const globalIdx = clothingCount + shoeCount + bagCount + cIdx;
        const isCapHovered = activeHoverIdx === globalIdx;
        p.turnProgress[globalIdx] = THREE.MathUtils.damp(
          p.turnProgress[globalIdx] || 0,
          isCapHovered ? 1 : 0,
          10,
          dt
        );
        const hoverAmt = p.turnProgress[globalIdx] || 0;
        const baseX = cg.userData.baseX ?? 0;
        const baseY = cg.userData.baseY ?? 0;
        const baseZ = cg.userData.baseZ ?? 0.34;

        cg.position.set(baseX, baseY + hoverAmt * 0.07, baseZ + hoverAmt * 0.22);
        cg.rotation.z = hoverAmt * 0.05;
        cg.scale.setScalar(1 + hoverAmt * 0.14);

        const contactShadowMesh = cg.userData.contactShadowMesh as THREE.Mesh | undefined;
        if (contactShadowMesh) {
          contactShadowMesh.scale.set(1 - hoverAmt * 0.12, 1 - hoverAmt * 0.12, 1);
        }

        if (isRoomMode && !st.isQuickView) {
          cg.getWorldPosition(_projVec);
          _projVec.y += 0.38;
          _projVec.project(camera);
          const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;
          screenTagPositions[globalIdx] = {
            x: sx,
            y: sy,
            visible:
              _projVec.z < 1 &&
              Math.sin(p.roomYaw) < -0.72 &&
              !st.isStoreOverview &&
              sx > 12 &&
              sx < window.innerWidth - 12,
          };
        }
      }

      for (let i = 0; i < garmentRefs.length; i++) {
        const refs = garmentRefs[i];
        const g = refs.group;
        const isAccessoryItem = Boolean(
          refs.product.isShoe || refs.product.isBag || refs.product.isCap
        );

        // Sneakers & Bags only use their standalone `garmentRefs` mesh when inspected in QuickView!
        if (isAccessoryItem && !st.isQuickView) {
          g.visible = false;
          continue;
        }

        const offset = i - p.currentPos;
        const absOffset = Math.abs(offset);

        const shouldTurnFront = st.isQuickView
          ? i === st.activeIndex
          : isWhiteStudio || isRoomMode
            ? i === activeHoverIdx
            : i === st.activeIndex || i === activeHoverIdx;

        p.turnProgress[i] = THREE.MathUtils.damp(
          p.turnProgress[i],
          shouldTurnFront ? 1 : 0,
          11,
          dt
        );

        const showFrontMesh = isAccessoryItem || p.turnProgress[i] > 0.48;
        refs.frontGroup.visible = showFrontMesh;
        refs.sideGroup.visible = !showFrontMesh;

        let targetParting = 0;
        if (
          !st.isQuickView &&
          activeHoverIdx !== -1 &&
          activeHoverIdx < clothingCount &&
          i !== activeHoverIdx
        ) {
          const distFromHover = i - activeHoverIdx;
          const sign = distFromHover < 0 ? -1 : 1;
          targetParting = sign * Math.max(0.24, 0.78 / Math.pow(Math.abs(distFromHover), 0.65));
        }
        p.partingOffsets[i] = THREE.MathUtils.damp(
          p.partingOffsets[i],
          targetParting,
          9,
          dt
        );

        if (st.reducedMotion) {
          p.swingAngles[i] = 0;
          p.swingVelocities[i] = 0;
        } else {
          const windTorque = Math.sin(elapsed * 2.0 + i * 1.1) * 0.08 * windFactor;
          const springForce = -14.0 * p.swingAngles[i];
          const dampingForce = -4.5 * p.swingVelocities[i];
          const accel = springForce + dampingForce + windTorque * 3.5 + p.velocity * 2.0;
          p.swingVelocities[i] += accel * dt;
          p.swingAngles[i] += p.swingVelocities[i] * dt;
        }

        if (st.isQuickView) {
          if (i === st.activeIndex) {
            const showHanging = st.qvSlideIndex === 0;
            g.visible = showHanging;
            refs.turntableGroup.visible = showHanging;

            const qvTargetX = isMobile ? 0 : -1.75;
            const qvTargetY = isMobile ? 1.58 : 0.98;
            const qvTargetZ = isMobile ? 0.95 * st.qvZoom : 1.85 * st.qvZoom;

            g.position.x = THREE.MathUtils.damp(g.position.x, qvTargetX, 7, dt);
            g.position.y = THREE.MathUtils.damp(g.position.y, qvTargetY, 7, dt);
            g.position.z = THREE.MathUtils.damp(g.position.z, qvTargetZ, 7, dt);

            const idleSway = st.reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.05;
            const totalOrbitYaw = p.orbitYaw + idleSway;
            const orbitSin = Math.sin(totalOrbitYaw);

            // Rotate the 3D Studio Turntable full 360° underneath the product
            refs.turntableGroup.rotation.y = totalOrbitYaw;

            // Smooth 3D orbital yaw (±36°) + volumetric slice parallax so the product always feels deeply 3D without flattening edge-on
            g.rotation.y = THREE.MathUtils.damp(g.rotation.y, orbitSin * 0.62, 9, dt);
            g.rotation.x = THREE.MathUtils.damp(g.rotation.x, p.orbitPitch, 9, dt);
            g.rotation.z = THREE.MathUtils.damp(g.rotation.z, p.swingAngles[i] * 0.2, 8, dt);

            // Dynamically fan the volumetric 3D extrusion shells to accentuate physical sole/body thickness during rotation
            const fChildren = refs.frontGroup.children;
            for (let cIdx = 0; cIdx < fChildren.length; cIdx++) {
              const child = fChildren[cIdx];
              const relZ = child.position.z;
              child.position.x = -orbitSin * relZ * 0.85;
              child.position.y = -1.55 + Math.sin(p.orbitPitch) * relZ * 0.55;
            }

            // Orbit key light slightly with user drag for real-time 3D specular highlights
            keyLight.position.x = 2.8 + orbitSin * 2.4;

            const targetScale = isMobile ? 0.76 * st.qvZoom : 1.02 * st.qvZoom;
            g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 7, dt));
          } else {
            g.visible = false;
            refs.turntableGroup.visible = false;
          }
          screenTagPositions[i] = { x: 0, y: 0, visible: false };
        } else {
          refs.turntableGroup.visible = false;
          const fChildren = refs.frontGroup.children;
          for (let cIdx = 0; cIdx < fChildren.length; cIdx++) {
            fChildren[cIdx].position.x = 0;
            fChildren[cIdx].position.y = -1.55;
          }
          g.visible = isWhiteStudio || isRoomMode ? true : absOffset < 3.6;
          const worldX = offset * baseSpacing + p.partingOffsets[i];
          getCatenaryPosition(worldX, dynamicSag, isRoomMode, _vec3A);

          const zLift = p.turnProgress[i] * 0.42;
          const zDepth =
            _vec3A.z + zLift - (isWhiteStudio || isRoomMode ? 0 : absOffset * 0.45);

          g.position.x = THREE.MathUtils.damp(g.position.x, _vec3A.x, 11, dt);
          g.position.y = THREE.MathUtils.damp(g.position.y, _vec3A.y, 11, dt);
          g.position.z = THREE.MathUtils.damp(g.position.z, zDepth, 11, dt);

          const flipAngle = showFrontMesh
            ? ((1 - p.turnProgress[i]) / 0.52) * 1.32
            : -(p.turnProgress[i] / 0.48) * 1.32;

          const baseScale =
            isWhiteStudio || isRoomMode
              ? isCompactPhone
                ? 0.66
                : isMobile
                  ? 0.72
                  : 0.80
              : Math.max(0.52, (isMobile ? 0.88 : 1.0) - absOffset * 0.16);
          const targetScale = baseScale * (1 + p.turnProgress[i] * 0.12);

          g.rotation.y = THREE.MathUtils.damp(g.rotation.y, flipAngle, 14, dt);
          g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0, 10, dt);
          g.rotation.z = p.swingAngles[i];
          g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 10, dt));

          _projVec.set(g.position.x, g.position.y - 0.34, g.position.z + 0.1);
          _projVec.project(camera);
          const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;
          screenTagPositions[i] = {
            x: sx,
            y: sy,
            visible:
              g.visible &&
              _projVec.z < 1 &&
              (!isRoomMode || (Math.cos(p.roomYaw) > 0.72 && !st.isStoreOverview)) &&
              sx > 12 &&
              sx < window.innerWidth - 12,
          };
        }
      }

      tagUpdateCounter++;
      if (tagUpdateCounter % 2 === 0 && st.onUpdateTagPositions) {
        st.onUpdateTagPositions(screenTagPositions);
      }

      activeRenderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      activeRenderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`${
        isQuickView ? 'fixed' : 'absolute'
      } inset-0 z-0 w-full h-full touch-pan-y cursor-grab active:cursor-grabbing`}
      aria-hidden="true"
    />
  );
};
