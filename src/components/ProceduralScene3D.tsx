import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ProceduralLevel } from '../game/proceduralData';

// Pre-allocated scratch math helpers at module scope (zero GC inside animation loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _particleColor = new THREE.Color();
const _rayMouse = new THREE.Vector2();

export interface ProceduralScene3DProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  activeLevel: ProceduralLevel;
  activeStepIndex: number;
  currentMeasureValue: number;
  explodedAmount: number; // 0 to 1
  cameraPresetIndex: number; // 0 = auto step, 1 = front, 2 = top-down, 3 = isometric
  darkMode: boolean;
  stepPulseTrigger: number; // increments on step action/completion to trigger juice/particles/hitstop
  onScenePropInteract: () => void;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  colorHex: number;
}

function createWoodCounterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 160; i++) {
    const y = (i / 160) * 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(42, 24, 12, 0.24)' : 'rgba(122, 82, 48, 0.2)';
    ctx.fillRect(0, y, 512, 2 + (i % 5));
  }
  // Subtle plank seams
  ctx.strokeStyle = 'rgba(28, 16, 8, 0.45)';
  ctx.lineWidth = 3;
  for (let p = 1; p < 4; p++) {
    ctx.beginPath();
    ctx.moveTo(0, p * 128);
    ctx.lineTo(512, p * 128);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createMeasurementBeakerTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#facc15';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.lineWidth = 3;

  const marks = [50, 100, 150, 200, 250];
  marks.forEach((gram, idx) => {
    const y = 220 - idx * 42;
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(165, y);
    ctx.stroke();
    ctx.fillText(`${gram}g`, 24, y + 6);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createTabletScreenTexture(maxAnisotropy: number): {
  texture: THREE.CanvasTexture;
  updateScreen: (stepIdx: number, progressRatio: number, levelTitle: string) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;

  const updateScreen = (stepIdx: number, progressRatio: number, levelTitle: string) => {
    const pct = Math.round(Math.min(1, Math.max(0, progressRatio)) * 100);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 512, 360);

    // Header bar
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('e-Pustaka Nasional Ksatria', 24, 40);

    // Step status card
    ctx.fillStyle = '#312e81';
    ctx.fillRect(24, 86, 464, 150);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px sans-serif';
    const stepLabels = [
      '1. Mengunduh Paket Aplikasi (100 MB)',
      '2. Alokasi Penyimpanan Offline (250 MB)',
      '3. Formulir Kartu Anggota Digital',
      '4. Verifikasi Optik Kode QR (50 mm)',
    ];
    ctx.fillText(stepLabels[stepIdx] || levelTitle, 44, 125);

    // Progress bar inside tablet
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(44, 155, 424, 34);
    ctx.fillStyle = pct >= 95 ? '#22c55e' : '#a855f7';
    ctx.fillRect(44, 155, Math.round(4.24 * pct), 34);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`PROGRES PROSEDUR: ${pct}%`, 44, 220);

    // QR badge preview on right
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(368, 252, 92, 92);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c + stepIdx) % 2 === 0) {
          ctx.fillRect(378 + c * 14, 262 + r * 14, 12, 12);
        }
      }
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Status: Kartu Anggota Ksatria', 24, 285);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Klik 3D Tablet / Tombol Aksi', 24, 315);

    texture.needsUpdate = true;
  };

  updateScreen(0, 0.2, 'e-Pustaka');
  return { texture, updateScreen };
}

export const ProceduralScene3D: React.FC<ProceduralScene3DProps> = (props) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<ProceduralScene3DProps>(props);
  propsRef.current = props;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL from GPU renderer string (never user agent)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = propsRef.current.darkMode ? 0x0f172a : 0xf3e8ff;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    // Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      100,
    );
    camera.position.set(0, 3.2, 5.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 2.2;
    controls.maxDistance = 9.0;
    controls.target.set(0, 0.9, 0);

    let userDraggingCamera = false;
    controls.addEventListener('start', () => {
      userDraggingCamera = true;
    });
    controls.addEventListener('end', () => {
      window.setTimeout(() => {
        userDraggingCamera = false;
      }, 2500);
    });

    // 3-Point Studio Lighting Rig (Warm Key + Cool Hemisphere Fill + Purple Rim)
    const hemiLight = new THREE.HemisphereLight(0xd8b4fe, 0x1e1b4b, 0.8);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(4.5, 7.5, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 4.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.15);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const woodTex = createWoodCounterTexture(maxAniso);
    const beakerTex = createMeasurementBeakerTexture(maxAniso);
    const tabletScreen = createTabletScreenTexture(maxAniso);

    // Shared Contact Shadow Geometry & Material (prevents floating props)
    const contactShadowGeo = new THREE.CircleGeometry(0.75, 24);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x090514,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    // Ground / Studio Workbench Table (Composite 5-part workbench)
    const workbenchGroup = new THREE.Group();
    const tableTopGeo = new THREE.BoxGeometry(6.8, 0.24, 3.8);
    const tableTopMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.08,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = -0.12;
    tableTop.receiveShadow = true;
    workbenchGroup.add(tableTop);

    // Purple Ksatria Trim Bevel around workbench
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.32,
      metalness: 0.45,
    });
    const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.08, 0.1), trimMat);
    frontTrim.position.set(0, -0.08, 1.92);
    workbenchGroup.add(frontTrim);

    // Cutting / Workspace Mat (offset by +0.02 on Y to prevent Z-fighting)
    const matMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.025, 2.6),
      new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        roughness: 0.8,
        metalness: 0.05,
      }),
    );
    matMesh.position.set(0, 0.015, 0);
    matMesh.receiveShadow = true;
    workbenchGroup.add(matMesh);

    scene.add(workbenchGroup);

    const interactables: THREE.Object3D[] = [];

    // =========================================================================
    // LEVEL 1 GROUP: Studio Kuliner "Membuat Kue Cubit Lumer" (Composite Groups)
    // =========================================================================
    const level1Group = new THREE.Group();
    scene.add(level1Group);

    // Prop 1A: Composite 7-Part Measuring Beaker (Left: x = -1.65)
    const beakerGroup = new THREE.Group();
    beakerGroup.position.set(-1.65, 0, 0.15);
    const beakerShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    beakerShadow.position.y = 0.032;
    beakerShadow.scale.setScalar(0.75);
    beakerGroup.add(beakerShadow);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: beakerTex,
      roughness: 0.15,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beakerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 1.15, 24, 1, true), glassMat);
    beakerBody.position.y = 0.6;
    beakerBody.renderOrder = 2;
    beakerGroup.add(beakerBody);

    const beakerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.41, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.25, metalness: 0.6 }),
    );
    beakerBase.position.y = 0.04;
    beakerGroup.add(beakerBase);

    const beakerRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.025, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    );
    beakerRim.rotation.x = Math.PI / 2;
    beakerRim.position.y = 1.17;
    beakerGroup.add(beakerRim);

    const beakerHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.035, 12, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3, metalness: 0.4 }),
    );
    beakerHandle.rotation.z = -Math.PI / 2;
    beakerHandle.position.set(-0.4, 0.62, 0);
    beakerGroup.add(beakerHandle);

    // Dynamic Flour Fill inside Beaker
    const flourFillMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.9,
      metalness: 0.02,
    });
    const flourFillMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.95, 20), flourFillMat);
    flourFillMesh.position.y = 0.52;
    beakerGroup.add(flourFillMesh);

    level1Group.add(beakerGroup);
    interactables.push(beakerBody, flourFillMesh);

    // Prop 1B: Composite 8-Part Mixing Bowl & Rotating Whisk (Center: x = 0)
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(0, 0, -0.05);
    const bowlShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    bowlShadow.position.y = 0.032;
    bowlShadow.scale.setScalar(1.05);
    bowlGroup.add(bowlShadow);

    const lathePoints = [
      new THREE.Vector2(0.01, 0.04),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.68, 0.36),
      new THREE.Vector2(0.76, 0.78),
      new THREE.Vector2(0.7, 0.82),
      new THREE.Vector2(0.6, 0.38),
      new THREE.Vector2(0.35, 0.1),
      new THREE.Vector2(0.01, 0.1),
    ];
    const bowlGeo = new THREE.LatheGeometry(lathePoints, 28);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.22,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.castShadow = true;
    bowlGroup.add(bowlMesh);

    const bowlGoldBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.73, 0.025, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85 }),
    );
    bowlGoldBand.rotation.x = Math.PI / 2;
    bowlGoldBand.position.y = 0.78;
    bowlGroup.add(bowlGoldBand);

    // Batter inside Mixing Bowl
    const batterMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.35,
      metalness: 0.05,
    });
    const batterMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.38, 0.42, 24), batterMat);
    batterMesh.position.y = 0.34;
    bowlGroup.add(batterMesh);

    // Composite 6-Part Stainless Whisk
    const whiskGroup = new THREE.Group();
    whiskGroup.position.set(0, 0.95, 0);
    const whiskHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3, metalness: 0.4 }),
    );
    whiskHandle.position.y = 0.35;
    whiskGroup.add(whiskHandle);

    const whiskWireMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.9,
    });
    for (let w = 0; w < 4; w++) {
      const wire = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 20), whiskWireMat);
      wire.rotation.y = (w * Math.PI) / 4;
      wire.scale.set(0.85, 1.45, 1);
      wire.position.y = -0.12;
      whiskGroup.add(wire);
    }
    bowlGroup.add(whiskGroup);
    level1Group.add(bowlGroup);
    interactables.push(bowlMesh, batterMesh, whiskHandle);

    // Prop 1C: Composite 9-Part Stove & Kue Cubit Mold Pan (Right: x = 1.65)
    const stoveGroup = new THREE.Group();
    stoveGroup.position.set(1.65, 0, 0.15);
    const stoveShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    stoveShadow.position.y = 0.032;
    stoveShadow.scale.setScalar(0.95);
    stoveGroup.add(stoveShadow);

    const stoveBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.22, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 }),
    );
    stoveBase.position.y = 0.14;
    stoveBase.castShadow = true;
    stoveGroup.add(stoveBase);

    const burnerGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const burnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 12, 24), burnerGlowMat);
    burnerRing.rotation.x = Math.PI / 2;
    burnerRing.position.y = 0.27;
    stoveGroup.add(burnerRing);

    const panPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.44, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.65 }),
    );
    panPlate.position.y = 0.36;
    stoveGroup.add(panPlate);

    // 6 Rising Golden Kue Cubit Domes with Choco Sprinkles
    const kueDomes: THREE.Mesh[] = [];
    const kueMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.55,
      metalness: 0.05,
    });
    for (let k = 0; k < 6; k++) {
      const angle = (k / 6) * Math.PI * 2;
      const r = k === 5 ? 0 : 0.24;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), kueMat);
      dome.position.set(Math.cos(angle) * r, 0.42, Math.sin(angle) * r);
      dome.scale.set(1, 0.65, 1);
      stoveGroup.add(dome);
      kueDomes.push(dome);
    }

    level1Group.add(stoveGroup);
    interactables.push(stoveBase, panPlate);

    // =========================================================================
    // LEVEL 2 GROUP: Bengkel Jaringan "Merakit & Memasang Router Wi-Fi"
    // =========================================================================
    const level2Group = new THREE.Group();
    level2Group.visible = false;
    scene.add(level2Group);

    const routerGroup = new THREE.Group();
    routerGroup.position.set(0, 0, 0);
    const routerShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    routerShadow.position.y = 0.032;
    routerShadow.scale.set(1.6, 1, 1.1);
    routerGroup.add(routerShadow);

    // Router main body
    const routerChassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.34, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.35, metalness: 0.55 }),
    );
    routerChassis.position.y = 0.32;
    routerChassis.castShadow = true;
    routerGroup.add(routerChassis);

    // Top purple metallic accent plate
    const routerTopPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.05, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.2, metalness: 0.7 }),
    );
    routerTopPlate.position.y = 0.51;
    routerGroup.add(routerTopPlate);

    // 4 Front Status LEDs
    const routerLeds: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.2,
        roughness: 0.2,
      });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), ledMat);
      led.position.set(-0.45 + i * 0.3, 0.53, 0.52);
      routerGroup.add(led);
      routerLeds.push(led);
    }

    // 2 Articulated High-Gain Antennas (Pivoted at base)
    const antennaLeftPivot = new THREE.Group();
    antennaLeftPivot.position.set(-0.78, 0.45, -0.68);
    const antennaMastMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const antLeftMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.35, 16), antennaMastMat);
    antLeftMast.position.y = 0.65;
    const antLeftTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 }),
    );
    antLeftTip.position.y = 1.35;
    antennaLeftPivot.add(antLeftMast, antLeftTip);
    routerGroup.add(antennaLeftPivot);

    const antennaRightPivot = antennaLeftPivot.clone();
    antennaRightPivot.position.set(0.78, 0.45, -0.68);
    routerGroup.add(antennaRightPivot);

    // Blue WAN Port & RJ45 Connector Plug
    const wanPortSocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.22, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.3 }),
    );
    wanPortSocket.position.set(0.35, 0.32, 0.69);
    routerGroup.add(wanPortSocket);

    const rj45PlugGroup = new THREE.Group();
    rj45PlugGroup.position.set(0.35, 0.32, 1.45);
    const rj45Head = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.5 }),
    );
    const rj45Cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 }),
    );
    rj45Cable.rotation.x = Math.PI / 2;
    rj45Cable.position.z = 0.55;
    rj45PlugGroup.add(rj45Head, rj45Cable);
    routerGroup.add(rj45PlugGroup);

    // 12V Power Adapter Plug
    const powerPlugGroup = new THREE.Group();
    powerPlugGroup.position.set(-0.45, 0.32, 1.45);
    const dcPlug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.42, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.8 }),
    );
    dcPlug.rotation.x = Math.PI / 2;
    powerPlugGroup.add(dcPlug);
    routerGroup.add(powerPlugGroup);

    // Expanding 3D Wi-Fi Signal Rings
    const signalRings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.0,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 + r * 0.45, 0.025, 12, 36), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.65;
      routerGroup.add(ring);
      signalRings.push(ring);
    }

    level2Group.add(routerGroup);
    interactables.push(routerChassis, routerTopPlate, rj45Head, dcPlug);

    // =========================================================================
    // LEVEL 3 GROUP: Stasiun Literasi Digital "e-Pustaka Nasional"
    // =========================================================================
    const level3Group = new THREE.Group();
    level3Group.visible = false;
    scene.add(level3Group);

    const kioskGroup = new THREE.Group();
    const kioskShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    kioskShadow.position.y = 0.032;
    kioskShadow.scale.set(1.5, 1, 1.2);
    kioskGroup.add(kioskShadow);

    // Stand Pedestal
    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 }),
    );
    standBase.position.y = 0.08;
    kioskGroup.add(standBase);

    const standNeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.95, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.75 }),
    );
    standNeck.position.set(0, 0.55, -0.2);
    standNeck.rotation.x = -0.25;
    kioskGroup.add(standNeck);

    // 3D Tablet Frame & Live Canvas Screen
    const tabletFrameGroup = new THREE.Group();
    tabletFrameGroup.position.set(0, 1.05, 0);
    tabletFrameGroup.rotation.x = -0.35;

    const tabletBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 1.65, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.25, metalness: 0.7 }),
    );
    tabletBody.castShadow = true;
    tabletFrameGroup.add(tabletBody);

    const tabletScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 1.48),
      new THREE.MeshBasicMaterial({ map: tabletScreen.texture }),
    );
    tabletScreenMesh.position.z = 0.065;
    tabletFrameGroup.add(tabletScreenMesh);

    kioskGroup.add(tabletFrameGroup);

    // Floating 3D Digital Ksatria Library Card & Optical Scanner
    const digitalCardGroup = new THREE.Group();
    digitalCardGroup.position.set(1.65, 0.85, 0.35);
    const cardBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.6, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.2, metalness: 0.6 }),
    );
    const cardGoldStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.12, 0.045),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 }),
    );
    cardGoldStripe.position.y = 0.14;
    digitalCardGroup.add(cardBody, cardGoldStripe);
    kioskGroup.add(digitalCardGroup);

    level3Group.add(kioskGroup);
    interactables.push(tabletBody, tabletScreenMesh, cardBody);

    // =========================================================================
    // ZERO-GC POOLED PARTICLE RING BUFFER (InstancedMesh, 48 instances)
    // =========================================================================
    const PARTICLE_COUNT = 48;
    const particleGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleMesh.frustumCulled = false;
    particleMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3);
    scene.add(particleMesh);

    const particles: ParticleSlot[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.6,
      scale: 0,
      colorHex: 0xfacc15,
    }));
    let particleHead = 0;

    function spawnParticleBurst(originX: number, originY: number, originZ: number, count: number, hex: number) {
      for (let i = 0; i < count; i++) {
        const slot = particles[particleHead];
        particleHead = (particleHead + 1) % PARTICLE_COUNT;
        slot.active = true;
        slot.x = originX + (Math.random() - 0.5) * 0.35;
        slot.y = originY + (Math.random() - 0.5) * 0.2;
        slot.z = originZ + (Math.random() - 0.5) * 0.35;
        slot.vx = (Math.random() - 0.5) * 2.2;
        slot.vy = 1.4 + Math.random() * 2.2;
        slot.vz = (Math.random() - 0.5) * 2.2;
        slot.life = 0;
        slot.maxLife = 0.45 + Math.random() * 0.35;
        slot.scale = 0.8 + Math.random() * 0.7;
        slot.colorHex = hex;
      }
    }

    // Raycaster & Keyboard Input Listeners
    const raycaster = new THREE.Raycaster();
    const keysPressed = new Set<string>();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_rayMouse, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0 && propsRef.current.gameState === 'playing') {
        propsRef.current.onScenePropInteract();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };
    const handleBlur = () => {
      keysPressed.clear();
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pre-compile shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Software WebGL afterDraw fence sync pacing
    let frameId = 0;
    let unmounted = false;
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (unmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const clock = new THREE.Clock();
    let elapsedTotal = 0;
    let hitstopTimer = 0;
    let cameraTrauma = 0;
    let lastPulseTrigger = propsRef.current.stepPulseTrigger;
    let lastDarkMode = propsRef.current.darkMode;

    function tick() {
      if (unmounted) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      elapsedTotal += dt;

      const currentProps = propsRef.current;

      // Update background/fog on dark mode toggle
      if (currentProps.darkMode !== lastDarkMode) {
        lastDarkMode = currentProps.darkMode;
        const nextBg = currentProps.darkMode ? 0x0f172a : 0xf3e8ff;
        (scene.background as THREE.Color).setHex(nextBg);
        (scene.fog as THREE.FogExp2).color.setHex(nextBg);
      }

      // Check for action/completion pulse trigger -> hitstop + camera trauma + particles
      if (currentProps.stepPulseTrigger !== lastPulseTrigger) {
        lastPulseTrigger = currentProps.stepPulseTrigger;
        hitstopTimer = 0.045;
        cameraTrauma = Math.min(1.0, cameraTrauma + 0.35);
        const burstX =
          currentProps.activeLevel.id === 1
            ? currentProps.activeStepIndex === 0
              ? -1.65
              : currentProps.activeStepIndex === 3
                ? 1.65
                : 0
            : 0;
        spawnParticleBurst(burstX, 1.15, 0, 14, 0xfacc15);
      }

      const simDt = hitstopTimer > 0 ? 0 : dt;
      if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
      }
      cameraTrauma = Math.max(0, cameraTrauma - dt * 2.2);

      // Toggle visible 3D level group
      const lvlId = currentProps.activeLevel.id;
      level1Group.visible = lvlId === 1;
      level2Group.visible = lvlId === 2;
      level3Group.visible = lvlId === 3;

      const stepObj =
        currentProps.activeLevel.steps[currentProps.activeStepIndex] || currentProps.activeLevel.steps[0];
      const progressRatio = Math.max(
        0,
        Math.min(
          1.2,
          (currentProps.currentMeasureValue - stepObj.minVal) /
            Math.max(1, stepObj.targetVal - stepObj.minVal),
        ),
      );
      const explode = currentProps.explodedAmount;

      // Keyboard WASD / Arrow camera orbit support
      const orbitSpeed = 1.6 * dt;
      if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) {
        camera.position.x -= orbitSpeed;
      }
      if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) {
        camera.position.x += orbitSpeed;
      }
      if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) {
        camera.position.y = Math.min(5.2, camera.position.y + orbitSpeed * 0.6);
      }
      if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) {
        camera.position.y = Math.max(1.2, camera.position.y - orbitSpeed * 0.6);
      }

      // Camera Choreography (Title live spline pan vs Playing damped focus)
      if (currentProps.gameState === 'title') {
        const angle = elapsedTotal * 0.35;
        _targetCamPos.set(Math.sin(angle) * 4.4, 2.75 + Math.sin(elapsedTotal * 0.7) * 0.2, Math.cos(angle) * 4.4);
        _targetLookAt.set(0, 0.85, 0);
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-3.5 * dt));
        controls.target.lerp(_targetLookAt, 1 - Math.exp(-3.5 * dt));
      } else if (!userDraggingCamera && keysPressed.size === 0) {
        if (currentProps.cameraPresetIndex === 1) {
          _targetCamPos.set(0, 2.2, 4.6);
          _targetLookAt.set(0, 0.9, 0);
        } else if (currentProps.cameraPresetIndex === 2) {
          _targetCamPos.set(0, 5.2, 1.4);
          _targetLookAt.set(0, 0.6, 0);
        } else if (currentProps.cameraPresetIndex === 3) {
          _targetCamPos.set(3.4, 3.2, 3.6);
          _targetLookAt.set(0, 0.8, 0);
        } else {
          _targetCamPos.set(...stepObj.cameraPreset);
          _targetLookAt.set(...stepObj.lookAtPreset);
        }
        // Apply decaying trauma * trauma shake
        const shake = cameraTrauma * cameraTrauma * 0.12;
        _targetCamPos.x += Math.sin(elapsedTotal * 45) * shake;
        _targetCamPos.y += Math.cos(elapsedTotal * 52) * shake;

        const dampFactor = 1 - Math.exp(-4.5 * dt);
        camera.position.lerp(_targetCamPos, dampFactor);
        controls.target.lerp(_targetLookAt, dampFactor);
      }

      controls.update();

      // Update Level 1 Procedural Animations
      if (lvlId === 1) {
        const sIdx = currentProps.activeStepIndex;
        const flourRatio = sIdx === 0 ? progressRatio : sIdx > 0 ? 1 : 0.2;
        flourFillMesh.scale.y = Math.max(0.08, Math.min(1.15, flourRatio));
        flourFillMesh.position.y = 0.08 + flourFillMesh.scale.y * 0.45 + explode * 0.5;

        const milkRatio = sIdx === 1 ? progressRatio : sIdx > 1 ? 1 : 0.25;
        batterMesh.scale.y = Math.max(0.15, Math.min(1.2, milkRatio));
        batterMesh.position.y = 0.16 + batterMesh.scale.y * 0.2 + explode * 0.4;

        // Whisk rotation during step 3
        const whiskSpeed = sIdx === 2 ? 2.5 + progressRatio * 8 : 0.8;
        whiskGroup.rotation.y += simDt * whiskSpeed;
        whiskGroup.position.y = 0.95 + Math.sin(elapsedTotal * 4) * 0.04 + explode * 0.85;

        // Baking heat & Kue Cubit rising during step 4
        const bakeRatio = sIdx === 3 ? progressRatio : 0.25;
        burnerGlowMat.emissiveIntensity = 0.25 + bakeRatio * 1.4;
        kueDomes.forEach((dome, idx) => {
          const rise = 0.55 + bakeRatio * 0.55 + Math.sin(elapsedTotal * 3 + idx) * 0.03;
          dome.scale.set(1, rise, 1);
          dome.position.y = 0.42 + explode * 0.55;
        });
      }

      // Update Level 2 Procedural Animations (Router Assembly)
      if (lvlId === 2) {
        const sIdx = currentProps.activeStepIndex;
        const antRatio = sIdx === 0 ? progressRatio : sIdx > 0 ? 1 : 0.15;
        const targetAngle = (1 - Math.min(1, antRatio)) * (Math.PI / 2.2);
        antennaLeftPivot.rotation.z = THREE.MathUtils.damp(antennaLeftPivot.rotation.z, targetAngle, 6, dt);
        antennaRightPivot.rotation.z = THREE.MathUtils.damp(antennaRightPivot.rotation.z, -targetAngle, 6, dt);

        const wanRatio = sIdx === 1 ? progressRatio : sIdx > 1 ? 1 : 0;
        rj45PlugGroup.position.z = THREE.MathUtils.damp(
          rj45PlugGroup.position.z,
          1.45 - Math.min(1, wanRatio) * 0.68 + explode * 0.5,
          6,
          dt,
        );

        const pwrRatio = sIdx === 2 ? progressRatio : sIdx > 2 ? 1 : 0;
        powerPlugGroup.position.z = THREE.MathUtils.damp(
          powerPlugGroup.position.z,
          1.45 - Math.min(1, pwrRatio) * 0.68 + explode * 0.5,
          6,
          dt,
        );

        const sigRatio = sIdx === 3 ? progressRatio : 0.1;
        routerTopPlate.position.y = 0.51 + explode * 0.65;
        routerLeds.forEach((led, idx) => {
          const mat = led.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = idx <= sIdx ? 0.95 : 0.15;
        });
        signalRings.forEach((ring, idx) => {
          const mat = ring.material as THREE.MeshBasicMaterial;
          if (sIdx === 3 && sigRatio > 0.1) {
            const wave = ((elapsedTotal * 1.4 + idx * 0.33) % 1);
            ring.scale.setScalar(0.6 + wave * 1.4 * sigRatio);
            mat.opacity = (1 - wave) * 0.65 * Math.min(1, sigRatio);
          } else {
            mat.opacity = 0;
          }
        });
      }

      // Update Level 3 Procedural Animations (Digital Library Kiosk)
      if (lvlId === 3) {
        const sIdx = currentProps.activeStepIndex;
        tabletScreen.updateScreen(sIdx, progressRatio, currentProps.activeLevel.title);
        tabletScreenMesh.position.z = 0.065 + explode * 0.45;
        digitalCardGroup.position.y = 0.85 + Math.sin(elapsedTotal * 2.5) * 0.08 + explode * 0.4;
        digitalCardGroup.rotation.y = elapsedTotal * 0.6 + progressRatio * 1.5;
      }

      // Update Pooled InstancedMesh Particles (Zero GC)
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        if (!p.active) {
          _dummyObj.position.set(0, -20, 0);
          _dummyObj.scale.setScalar(0);
          _dummyObj.updateMatrix();
          particleMesh.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          _dummyObj.position.set(0, -20, 0);
          _dummyObj.scale.setScalar(0);
          _dummyObj.updateMatrix();
          particleMesh.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 4.8 * dt;
        const lifeNorm = 1 - p.life / p.maxLife;
        _dummyObj.position.set(p.x, p.y, p.z);
        _dummyObj.scale.setScalar(p.scale * lifeNorm);
        _dummyObj.updateMatrix();
        particleMesh.setMatrixAt(i, _dummyObj.matrix);
        _particleColor.setHex(p.colorHex);
        particleMesh.setColorAt(i, _particleColor);
      }
      particleMesh.instanceMatrix.needsUpdate = true;
      if (particleMesh.instanceColor) {
        particleMesh.instanceColor.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      woodTex.dispose();
      beakerTex.dispose();
      tabletScreen.texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="procedural-3d-canvas"
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
      aria-label="Kanvas Simulasi 3D Teks Prosedur Teka-Teki by Ksatria"
    />
  );
};
