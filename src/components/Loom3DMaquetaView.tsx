"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Sun,
  Sunset,
  Home,
  Compass,
  Camera,
  Box,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
  Globe,
  Trees,
  Download,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  useLoomLang,
  getStageDisplayName,
} from "@/lib/loomI18n";
import {
  AREA_TIERS,
  getAreaTier,
  AreaTierKey,
} from "@/lib/loomLotTelemetry";
import {
  LOOM_NORTH_MAP_ANGLE_RAD,
  LOOM_DIR_NORTH,
  LOOM_DIR_EAST,
  LOOM_DIR_WEST,
  LOOM_DIR_BREEZE_FROM,
  LOOM_DIR_BREEZE_TO,
  LOOM_SUN_PROGRESS,
  sampleLoomSolarArcOffset,
  getLoomSceneSunPosition,
  cameraLookToCompassReading,
} from "@/lib/loomGeoOrientation";

import type { MaquetaLot } from "@/types/lots";
export type { MaquetaLot };
import {
  CAMERA_PRESETS,
  STAGE_CAMERA_TARGETS,
  WORLD_W,
  WORLD_D,
  svgToWorld,
  getTerrainElevationAt,
  type Unified3DLot,
  type Landscape3DData,
  type CameraPreset,
} from "./loom3d/presets";
import {
  createFloatingPillSprite,
  createAnimatedWindFlowTexture,
  createSunCoronaFlareSprite,
  createAtmosphericCloudWispTexture,
  createOrganicWaterAndGrassTexture,
  SKY_DOME_VERTEX_GLSL,
  SKY_DOME_FRAGMENT_GLSL,
  TERRAIN_WATER_VERTEX_GLSL,
  TERRAIN_WATER_FRAGMENT_GLSL,
} from "./loom3d/shaders";
import {
  mergeSimpleBufferGeometries,
  createSculptedTropicalTreeGeometries,
  createVillaReplicaMaterials,
  getOrBuildSplitInstancedVillaMeshes,
  buildLoomVillaReplica3D,
  type VillaReplicaMaterials,
} from "./loom3d/villaBuilder";
import {
  buildAnimatedTrafficCars,
  sampleTrafficLoopPoint,
  type AnimatedTrafficItem,
} from "./loom3d/trafficRoutes";
import { exportLoomAvailabilityMapPng } from "./loom3d/availabilityMapExporter";
import LoomMaquetaLoader from "./loom3d/LoomMaquetaLoader";
import {
  type Advisor,
  isInstitutionalAdvisor,
  getAdvisorDisplayLabel,
  getAdvisorRolePrefix,
} from "@/lib/referralTracking";

interface Loom3DMaquetaViewProps {
  stageId: string;
  onChangeStage: (newStageId: string) => void;
  lotsMap: Record<string, MaquetaLot>;
  selectedLot: MaquetaLot | null;
  onSelectLot: (lot: MaquetaLot) => void;
  onExit3D: () => void;
  onOpenLocation?: () => void;
  assignedAdvisor?: Advisor | null;
  onOpenContact?: () => void;
}

export default function Loom3DMaquetaView({
  stageId,
  onChangeStage,
  lotsMap,
  selectedLot,
  onSelectLot,
  onExit3D,
  onOpenLocation,
  assignedAdvisor,
  onOpenContact,
}: Loom3DMaquetaViewProps) {
  const { isEn } = useLoomLang();
  const isEnRef = useRef(isEn);
  isEnRef.current = isEn;
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoveredLotIdRef = useRef<string | null>(null);
  const radarMarkerRef = useRef<SVGGElement | null>(null);
  const radarYawLabelRef = useRef<HTMLSpanElement | null>(null);
  const compassDialRef = useRef<SVGGElement | null>(null);
  const compassHeadingLabelRef = useRef<HTMLSpanElement | null>(null);
  const telemetryAnimRef = useRef<{
    windTex: THREE.CanvasTexture | null;
    sunCorona: THREE.Sprite | null;
    sunCore: THREE.Mesh | null;
    solarCurve: THREE.CatmullRomCurve3 | null;
  }>({
    windTex: null,
    sunCorona: null,
    sunCore: null,
    solarCurve: null,
  });
  const villaMatsCacheRef = useRef<{ day: VillaReplicaMaterials | null; sunset: VillaReplicaMaterials | null; unitBox: THREE.BoxGeometry | null }>({
    day: null,
    sunset: null,
    unitBox: null,
  });

  const [isSunset, setIsSunset] = useState<boolean>(false);
  const [villaMode, setVillaMode] = useState<"showcase" | "all" | "off">("showcase");
  const [showTrees3D, setShowTrees3D] = useState<boolean>(true);
  const [showDronePins, setShowDronePins] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<"all" | "stage">("all");
  const [colorMode, setColorMode] = useState<"status" | "area" | "typology">("status");
  const [activeAreaFilter, setActiveAreaFilter] = useState<AreaTierKey | "all">("all");
  const [activePreset, setActivePreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);
  const [hoveredLot, setHoveredLot] = useState<{ lot: MaquetaLot; stageId: string; x: number; y: number } | null>(null);
  const [unifiedLots, setUnifiedLots] = useState<Unified3DLot[]>([]);
  const [landscapeData, setLandscapeData] = useState<Landscape3DData | null>(null);
  const [carTemplates, setCarTemplates] = useState<THREE.Group[]>([]);
  const [droneRenderModal, setDroneRenderModal] = useState<CameraPreset["renderPreview"] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<"stages" | "options" | null>(null);
  const [isAreaCardCollapsed, setIsAreaCardCollapsed] = useState<boolean>(false);
  const bottomBarScrollRef = useRef<HTMLDivElement | null>(null);
  const [bootMilestones, setBootMilestones] = useState({
    renderer: false,
    masterTex: false,
    masksTex: false,
    westTex: false,
    unifiedLots: false,
    palms: false,
    cars: false,
    carsGrace: false,
    lotsStatusGrace: false,
    forceReady: false,
  });
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);
  const [isIntroFlying, setIsIntroFlying] = useState<boolean>(false);
  const hasTriggeredRevealRef = useRef<boolean>(false);
  const introFlightRef = useRef<{
    active: boolean;
    elapsed: number;
    skipFirstDelta: boolean;
    duration: number;
    posCurve: THREE.CatmullRomCurve3 | null;
    targetCurve: THREE.CatmullRomCurve3 | null;
    cloudGroup: THREE.Group | null;
    cloudMaterials: { mat: THREE.SpriteMaterial; baseOpacity: number }[];
    cloudTex: THREE.CanvasTexture | null;
  }>({
    active: false,
    elapsed: 0,
    skipFirstDelta: false,
    duration: 3.15,
    posCurve: null,
    targetCurve: null,
    cloudGroup: null,
    cloudMaterials: [],
    cloudTex: null,
  });

  const cancelAndDisposeIntroFlight = () => {
    const f = introFlightRef.current;
    const wasActive = f.active;
    f.active = false;
    if (wasActive && sceneRefs.current.controls && sceneRefs.current.camera) {
      sceneRefs.current.desiredPos.copy(sceneRefs.current.camera.position);
      sceneRefs.current.desiredTarget.copy(sceneRefs.current.controls.target);
      sceneRefs.current.controls.update();
    }
    if (f.cloudGroup && f.cloudGroup.parent) {
      f.cloudGroup.parent.remove(f.cloudGroup);
    }
    f.cloudMaterials.forEach(({ mat }) => mat.dispose());
    f.cloudTex?.dispose();
    f.cloudGroup = null;
    f.cloudMaterials = [];
    f.cloudTex = null;
    if (wasActive) {
      setIsIntroFlying(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/loom/loom_unified_3d_lots.json?v=4")
      .then((r) => r.json())
      .then((data: Unified3DLot[]) => {
        if (isMounted) {
          setUnifiedLots(data);
          setBootMilestones((m) => ({ ...m, unifiedLots: true }));
        }
      })
      .catch((err) => {
        console.error("Error loading unified 3D lots:", err);
        if (isMounted) setBootMilestones((m) => ({ ...m, unifiedLots: true }));
      });

    fetch("/loom/loom_landscape_3d.json")
      .then((r) => r.json())
      .then((data: Landscape3DData) => {
        if (isMounted) setLandscapeData(data);
      })
      .catch((err) => {
        console.error("Error loading 3D landscape data:", err);
        if (isMounted) setBootMilestones((m) => ({ ...m, palms: true }));
      });

    // Carga en paralelo durante la precarga de nubes para evitar tirones o "pop-in" a mitad del vuelo de dron
    const carLoader = new GLTFLoader();
    const carModelUrls = [
      "/loom/models/car_suv_luxury.glb?v=6",
      "/loom/models/car_coupe_gt.glb?v=6",
      "/loom/models/car_sedan_exec.glb?v=6",
      "/loom/models/car_pickup_luxury.glb?v=6",
    ];
    Promise.all(
      carModelUrls.map(
        (url) =>
          new Promise<THREE.Group | null>((resolve) => {
            carLoader.load(
              url,
              (gltf) => {
                gltf.scene.traverse((node) => {
                  if ((node as THREE.Mesh).isMesh) {
                    const m = node as THREE.Mesh;
                    m.castShadow = false;
                    m.receiveShadow = false;
                    m.matrixAutoUpdate = false;
                    m.updateMatrix();
                    if ((m.material as THREE.MeshStandardMaterial)?.isMeshStandardMaterial) {
                      (m.material as THREE.MeshStandardMaterial).envMapIntensity = 1.25;
                    }
                  }
                });
                resolve(gltf.scene);
              },
              undefined,
              () => resolve(null)
            );
          })
      )
    ).then((loadedCars) => {
      if (isMounted) {
        setCarTemplates(loadedCars.filter((g): g is THREE.Group => g !== null));
        setBootMilestones((m) => ({ ...m, cars: true }));
      }
    });

    // Ventanas de cortesía anti-bloqueo para redes móviles lentas
    const graceTimer = setTimeout(() => {
      if (isMounted) setBootMilestones((m) => ({ ...m, lotsStatusGrace: true }));
    }, 1150);
    const carsGraceTimer = setTimeout(() => {
      if (isMounted) setBootMilestones((m) => ({ ...m, carsGrace: true }));
    }, 1450);
    const hardCapTimer = setTimeout(() => {
      if (isMounted) setBootMilestones((m) => ({ ...m, forceReady: true }));
    }, 3800);

    return () => {
      isMounted = false;
      clearTimeout(graceTimer);
      clearTimeout(carsGraceTimer);
      clearTimeout(hardCapTimer);
    };
  }, []);

  const sceneRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    renderer: THREE.WebGLRenderer | null;
    ambientLight: THREE.AmbientLight | null;
    dirLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    terrainShaderMat: THREE.ShaderMaterial | null;
    skyShaderMat: THREE.ShaderMaterial | null;
    lotsGroup: THREE.Group | null;
    villasGroup: THREE.Group | null;
    carsGroup: THREE.Group | null;
    landscapeGroup: THREE.Group | null;
    telemetryGroup: THREE.Group | null;
    palmCrownTex: THREE.CanvasTexture | null;
    desiredPos: THREE.Vector3;
    desiredTarget: THREE.Vector3;
    isFlying: boolean;
  }>({
    scene: null,
    camera: null,
    controls: null,
    renderer: null,
    ambientLight: null,
    dirLight: null,
    hemiLight: null,
    terrainShaderMat: null,
    skyShaderMat: null,
    lotsGroup: null,
    villasGroup: null,
    carsGroup: null,
    landscapeGroup: null,
    telemetryGroup: null,
    palmCrownTex: null,
    desiredPos: new THREE.Vector3(...CAMERA_PRESETS[0].position),
    desiredTarget: new THREE.Vector3(...CAMERA_PRESETS[0].target),
    isFlying: false,
  });

  const animatedTrafficRef = useRef<AnimatedTrafficItem[]>([]);

  const lotsMapRef = useRef(lotsMap);
  lotsMapRef.current = lotsMap;
  const unifiedLotsRef = useRef(unifiedLots);
  unifiedLotsRef.current = unifiedLots;
  const onSelectLotRef = useRef(onSelectLot);
  onSelectLotRef.current = onSelectLot;
  const onChangeStageRef = useRef(onChangeStage);
  onChangeStageRef.current = onChangeStage;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d6eef8");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 350);
    camera.position.set(...CAMERA_PRESETS[0].position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.NoToneMapping;

    // Mapa de entorno IBL (RoomEnvironment) para reflejos reales en pintura automotriz, cromo, rines y vidrios
    const pmremGen = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGen.fromScene(roomEnv, 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmremGen.dispose();
    roomEnv.dispose();

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    // Paneo estrictamente horizontal paralelo al suelo (impide hundir el pivote bajo tierra con clic derecho)
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.085;
    controls.minPolarAngle = 0.05;
    controls.minDistance = 0.65;
    controls.maxDistance = 54;
    controls.addEventListener("start", () => {
      sceneRefs.current.isFlying = false;
      if (introFlightRef.current.active || introFlightRef.current.cloudGroup) {
        cancelAndDisposeIntroFlight();
      }
    });

    const ambientLight = new THREE.AmbientLight("#f8fafc", 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#bae6fd", "#051415", 0.5);
    scene.add(hemiLight);

    const initialSunPos = getLoomSceneSunPosition(false);
    const initialSunVec = new THREE.Vector3(...initialSunPos).normalize();

    const dirLight = new THREE.DirectionalLight("#fffbeb", 1.55);
    dirLight.position.set(...initialSunPos);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 95;
    const d = 24;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Domo Atmosférico de Cielo Caribeño (Elimina por completo el vacío negro en el horizonte)
    const skyGeo = new THREE.SphereGeometry(180, 32, 24);
    const skyShaderMat = new THREE.ShaderMaterial({
      vertexShader: SKY_DOME_VERTEX_GLSL,
      fragmentShader: SKY_DOME_FRAGMENT_GLSL,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uIsSunset: { value: 0 },
        uSunDir: { value: initialSunVec.clone() },
      },
    });
    const skyDome = new THREE.Mesh(skyGeo, skyShaderMat);
    scene.add(skyDome);

    const detailTex = createOrganicWaterAndGrassTexture();
    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const masterTex = loader.load(
      "/loom/loom_masterplan_bg.webp?v=8",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        setBootMilestones((m) => (m.masterTex ? m : { ...m, masterTex: true }));
      },
      undefined,
      () => {
        setBootMilestones((m) => (m.masterTex ? m : { ...m, masterTex: true }));
      }
    );

    const westEarthTex = loader.load(
      "/loom/loom_west_earth_via.webp?v=2",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        setBootMilestones((m) => (m.westTex ? m : { ...m, westTex: true }));
      },
      undefined,
      () => {
        setBootMilestones((m) => (m.westTex ? m : { ...m, westTex: true }));
      }
    );

    const masksTex = loader.load(
      "/loom/loom_terrain_masks.png?v=2",
      (t) => {
        t.anisotropy = maxAniso;
        setBootMilestones((m) => (m.masksTex ? m : { ...m, masksTex: true }));
      },
      undefined,
      () => {
        setBootMilestones((m) => (m.masksTex ? m : { ...m, masksTex: true }));
      }
    );

    // Terreno Costero Extendido (172m x 118m en escala 3D) con subdivisión optimizada 128x128 para 60 FPS
    const terrainGeo = new THREE.PlaneGeometry(WORLD_W * 4.5, WORLD_D * 5.5, 128, 128);
    const terrainShaderMat = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_WATER_VERTEX_GLSL,
      fragmentShader: TERRAIN_WATER_FRAGMENT_GLSL,
      side: THREE.DoubleSide,
      uniforms: {
        uMasterTex: { value: masterTex },
        uWestEarthTex: { value: westEarthTex },
        uMasksTex: { value: masksTex },
        uDetailTex: { value: detailTex },
        uTime: { value: 0 },
        uIsSunset: { value: 0 },
        uSunDir: { value: initialSunVec.clone() },
        uCameraPos: { value: camera.position.clone() },
      },
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainShaderMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = 0;
    scene.add(terrainMesh);

    const shadowGeo = new THREE.PlaneGeometry(WORLD_W, WORLD_D);
    const shadowCatcherMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const shadowCatcherMesh = new THREE.Mesh(shadowGeo, shadowCatcherMat);
    shadowCatcherMesh.rotation.x = -Math.PI / 2;
    shadowCatcherMesh.position.y = 0.003;
    shadowCatcherMesh.receiveShadow = true;
    scene.add(shadowCatcherMesh);

    const lotsGroup = new THREE.Group();
    scene.add(lotsGroup);

    const villasGroup = new THREE.Group();
    scene.add(villasGroup);

    const carsGroup = new THREE.Group();
    scene.add(carsGroup);

    const landscapeGroup = new THREE.Group();
    scene.add(landscapeGroup);

    const telemetryGroup = new THREE.Group();
    scene.add(telemetryGroup);

    sceneRefs.current = {
      ...sceneRefs.current,
      scene,
      camera,
      controls,
      renderer,
      ambientLight,
      dirLight,
      hemiLight,
      terrainShaderMat,
      skyShaderMat,
      lotsGroup,
      villasGroup,
      carsGroup,
      landscapeGroup,
      telemetryGroup,
      palmCrownTex: null,
    };
    setBootMilestones((m) => (m.renderer ? m : { ...m, renderer: true }));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.012);
    const planeHitVec = new THREE.Vector3();
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;
    let hoverRafPending = false;
    let lastClientX = 0;
    let lastClientY = 0;

    // Detección matemática 2D ultra-rápida (0.003 ms vs 4 ms de raycasting 3D sobre 318 ExtrudeGeometry)
    const pickLotOnGroundPlane = (clientX: number, clientY: number): Unified3DLot | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(groundPickPlane, planeHitVec)) return null;

      const svgX = (planeHitVec.x / WORLD_W + 0.5) * 3840;
      const svgY = (planeHitVec.z / WORLD_D + 0.5) * 2160;
      if (svgX < 0 || svgX > 3840 || svgY < 0 || svgY > 2160) return null;

      const lots = unifiedLotsRef.current;
      for (let i = 0; i < lots.length; i++) {
        const pLot = lots[i];
        if (
          Math.abs(svgX - pLot.cx) > pLot.width * 0.65 ||
          Math.abs(svgY - pLot.cy) > pLot.height * 0.65
        ) {
          continue;
        }
        const verts = pLot.vertices;
        if (verts.length < 3) continue;
        let inside = false;
        for (let j = 0, k = verts.length - 1; j < verts.length; k = j++) {
          const xi = verts[j][0],
            yi = verts[j][1];
          const xj = verts[k][0],
            yj = verts[k][1];
          const intersect =
            yi > svgY !== yj > svgY &&
            svgX < ((xj - xi) * (svgY - yi)) / (yj - yi + 0.00001) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) return pLot;
      }
      return null;
    };

    const handlePointerMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (tooltipRef.current && hoveredLotIdRef.current) {
        const tx = Math.min(lastClientX + 16, window.innerWidth - 230);
        const ty = Math.max(16, lastClientY - 48);
        tooltipRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      if (isPointerDown && Math.hypot(lastClientX - pointerDownPos.x, lastClientY - pointerDownPos.y) > 5) {
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
        }
        return;
      }

      if (hoverRafPending) return;
      hoverRafPending = true;
      requestAnimationFrame(() => {
        hoverRafPending = false;
        const pickedLot = pickLotOnGroundPlane(lastClientX, lastClientY);
        if (pickedLot) {
          const lotData = lotsMapRef.current[pickedLot.id];
          if (lotData) {
            renderer.domElement.style.cursor = "pointer";
            if (hoveredLotIdRef.current !== pickedLot.id) {
              hoveredLotIdRef.current = pickedLot.id;
              setHoveredLot({
                lot: lotData,
                stageId: pickedLot.stageId || "etapa_1",
                x: lastClientX,
                y: lastClientY,
              });
            }
            return;
          }
        }
        renderer.domElement.style.cursor = "grab";
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
        }
      });
    };

    const handlePointerDown = (e: MouseEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const pickedLot = pickLotOnGroundPlane(e.clientX, e.clientY);
      if (pickedLot) {
        const lotData = lotsMapRef.current[pickedLot.id];
        if (lotData) {
          if (pickedLot.stageId) onChangeStageRef.current(pickedLot.stageId);
          onSelectLotRef.current(lotData);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);
    renderer.domElement.addEventListener("mousedown", handlePointerDown);
    renderer.domElement.addEventListener("mouseup", handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    let lastYawUpdate = 0;
    let simElapsed = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      // Paso 6: Pausar renderizado GPU cuando la pestaña está en segundo plano
      if (document.hidden) {
        clock.getDelta();
        return;
      }

      const rawDelta = clock.getDelta();
      // Tope de delta a 33 ms: evita saltos espaciales si el navegador pierde algún fotograma
      const dt = Math.min(Math.max(rawDelta, 0), 0.033);
      simElapsed += dt;
      const elapsed = simElapsed;

      if (sceneRefs.current.terrainShaderMat) {
        sceneRefs.current.terrainShaderMat.uniforms.uTime.value = elapsed;
        sceneRefs.current.terrainShaderMat.uniforms.uCameraPos.value.copy(camera.position);
      }

      const flight = introFlightRef.current;
      if (flight.active && flight.posCurve && flight.targetCurve) {
        if (flight.skipFirstDelta) {
          flight.skipFirstDelta = false;
        } else {
          flight.elapsed += dt;
        }
        const rawT = Math.min(1, Math.max(0, flight.elapsed / flight.duration));
        // Curva aerodinámica C2 continua (0 tirón al iniciar, planeo fluido sobre el Mar Caribe y aterrizaje suave en las villas)
        const smoothT = rawT * rawT * (3 - 2 * rawT);
        const easedT = 1 - Math.pow(1 - smoothT, 1.35);

        flight.posCurve.getPointAt(easedT, camera.position);
        flight.targetCurve.getPointAt(easedT, controls.target);
        camera.lookAt(controls.target);

        const cloudFade = 1 - THREE.MathUtils.smoothstep(easedT, 0.14, 0.72);
        for (let c = 0; c < flight.cloudMaterials.length; c++) {
          const cm = flight.cloudMaterials[c];
          cm.mat.opacity = cm.baseOpacity * cloudFade;
        }

        if (rawT >= 1) {
          cancelAndDisposeIntroFlight();
        }
      } else {
        if (sceneRefs.current.isFlying) {
          camera.position.lerp(sceneRefs.current.desiredPos, 0.065);
          controls.target.lerp(sceneRefs.current.desiredTarget, 0.065);
          if (
            camera.position.distanceTo(sceneRefs.current.desiredPos) < 0.12 &&
            controls.target.distanceTo(sceneRefs.current.desiredTarget) < 0.12
          ) {
            sceneRefs.current.isFlying = false;
          }
        }

        // Bloqueo físico de suelo y colinas 3D: el pivote y la cámara jamás pueden bajar del terreno
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -26.0, 26.0);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -16.0, 16.0);
        const targetGroundY = getTerrainElevationAt(controls.target.x, controls.target.z);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, targetGroundY + 0.02, 2.4);

        controls.update();

        const camGroundY = getTerrainElevationAt(camera.position.x, camera.position.z);
        const minSafeCamY = Math.max(0.42, camGroundY + 0.42);
        if (camera.position.y < minSafeCamY) {
          camera.position.y = minSafeCamY;
        }
      }

      // Animación a 60 FPS del tráfico vehicular 3D en circuitos cerrados continuos con giro suave por las avenidas de Loom
      const trafficList = animatedTrafficRef.current;
      for (let i = 0; i < trafficList.length; i++) {
        const item = trafficList[i];
        if (item.totalLength <= 0.001) continue;
        const dist = ((elapsed * item.speed + item.phaseOffset) % item.totalLength + item.totalLength) % item.totalLength;
        const [cx, cz] = sampleTrafficLoopPoint(item, dist);
        const [lx, lz] = sampleTrafficLoopPoint(item, dist + 0.048);
        const headingRad = -Math.atan2(lz - cz, lx - cx);

        item.carObj.position.set(cx, 0.005, cz);
        item.carObj.rotation.y = headingRad;
        item.carObj.updateMatrix();

        item.shadowObj.position.set(cx, 0.004, cz);
        item.shadowObj.rotation.y = headingRad;
        item.shadowObj.updateMatrix();
      }

      // Animación a 60 FPS de la Brisa Marina Caribeña y el Sol Bioclimático del lote seleccionado
      if (telemetryAnimRef.current.windTex) {
        telemetryAnimRef.current.windTex.offset.x = -elapsed * 0.78;
      }
      if (telemetryAnimRef.current.sunCorona) {
        const pulse = 0.38 + Math.sin(elapsed * 2.6) * 0.032;
        telemetryAnimRef.current.sunCorona.scale.set(pulse, pulse, 1);
      }

      // Sincronización en tiempo real (60 FPS, 0 re-renders de React) de posición, Radar y Rosa de los Vientos A001
      const dx = controls.target.x - camera.position.x;
      const dz = controls.target.z - camera.position.z;
      const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
      if (radarMarkerRef.current) {
        const normX = THREE.MathUtils.clamp(controls.target.x / WORLD_W + 0.5, 0.08, 0.92);
        const normY = THREE.MathUtils.clamp(controls.target.z / WORLD_D + 0.5, 0.16, 0.84);
        const rx = normX * 160;
        const ry = normY * 90;
        radarMarkerRef.current.setAttribute(
          "transform",
          `translate(${rx.toFixed(1)}, ${ry.toFixed(1)}) rotate(${deg.toFixed(1)})`
        );
      }

      const compassReading = cameraLookToCompassReading(dx, dz);
      if (compassDialRef.current) {
        compassDialRef.current.setAttribute(
          "transform",
          `rotate(${compassReading.dialNorthDeg.toFixed(1)} 28 28)`
        );
      }

      if (elapsed - lastYawUpdate > 0.15) {
        lastYawUpdate = elapsed;
        const card = isEnRef.current ? compassReading.cardinalEn : compassReading.cardinalEs;
        const labelTxt = `${compassReading.trueBearingDeg}° ${card}`;
        if (radarYawLabelRef.current) {
          radarYawLabelRef.current.textContent = labelTxt;
        }
        if (compassHeadingLabelRef.current) {
          compassHeadingLabelRef.current.textContent = labelTxt;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      cancelAndDisposeIntroFlight();
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      renderer.domElement.removeEventListener("mousedown", handlePointerDown);
      renderer.domElement.removeEventListener("mouseup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const {
      scene,
      ambientLight,
      dirLight,
      hemiLight,
      terrainShaderMat,
      skyShaderMat,
    } = sceneRefs.current;
    if (!scene || !ambientLight || !dirLight || !hemiLight) return;

    const sunPos = getLoomSceneSunPosition(isSunset);
    const sunVec = new THREE.Vector3(...sunPos).normalize();

    if (isSunset) {
      scene.background = new THREE.Color("#f9b86b");
      ambientLight.color.set("#fdba74");
      ambientLight.intensity = 0.62;
      dirLight.color.set("#fb923c");
      dirLight.intensity = 1.78;
      dirLight.position.set(...sunPos);
      hemiLight.color.set("#f97316");
      if (terrainShaderMat) {
        terrainShaderMat.uniforms.uIsSunset.value = 1.0;
        terrainShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
      if (skyShaderMat) {
        skyShaderMat.uniforms.uIsSunset.value = 1.0;
        skyShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
    } else {
      scene.background = new THREE.Color("#d6eef8");
      ambientLight.color.set("#f8fafc");
      ambientLight.intensity = 0.88;
      dirLight.color.set("#fffbeb");
      dirLight.intensity = 1.55;
      dirLight.position.set(...sunPos);
      hemiLight.color.set("#bae6fd");
      if (terrainShaderMat) {
        terrainShaderMat.uniforms.uIsSunset.value = 0.0;
        terrainShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
      if (skyShaderMat) {
        skyShaderMat.uniforms.uIsSunset.value = 0.0;
        skyShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
    }
    if (sceneRefs.current.renderer) {
      sceneRefs.current.renderer.shadowMap.needsUpdate = true;
    }
  }, [isSunset]);

  // Caché de geometrías de vegetación 3D (Paso 5: evita recargar palmera_caribe_hd.glb o recalcular árboles al alternar Día/Atardecer)
  const landscapeAssetCacheRef = useRef<{
    palmScene: THREE.Group | null;
    sculptedTrees: { crownGeo: THREE.BufferGeometry; trunkGeo: THREE.BufferGeometry } | null;
  }>({
    palmScene: null,
    sculptedTrees: null,
  });

  // ==========================================================================
  // CAPA 4: PALMERAS COCOTERAS HD DESDE ARCHIVO .GLB + CORONA ORGÁNICA
  // Carga /loom/models/palmera_caribe_hd.glb (tronco anillado + cocos + 15 pencas
  // pinnadas 3D en 3 anillos de filotaxis) e instancia las 165 palmeras a 60 FPS
  // ==========================================================================
  useEffect(() => {
    const { landscapeGroup } = sceneRefs.current;
    if (!landscapeGroup) return;

    while (landscapeGroup.children.length > 0) {
      const child = landscapeGroup.children[0] as THREE.Mesh;
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material?.dispose();
      landscapeGroup.remove(child);
    }

    if (!showTrees3D || !landscapeData) return;

    const dummy = new THREE.Object3D();
    const palmCount = landscapeData.palms.length;
    if (palmCount === 0) return;

    let cancelled = false;

    const buildLandscapeInstances = (palmScene: THREE.Group) => {
      if (cancelled || !sceneRefs.current.landscapeGroup) return;
      const grp = sceneRefs.current.landscapeGroup;

      const filteredPalms = landscapeData.palms.filter(
        ([sx, sy]) => sx < 2820 || (sy >= 520 && sy <= 1480)
      );
      const activePalmCount = filteredPalms.length;

      if (activePalmCount > 0) {
        palmScene.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            if (mat.color.g > mat.color.r * 1.04) {
              mat.color.set(isSunset ? "#8a7a4f" : "#486e30");
              mat.roughness = 0.72;
              mat.metalness = 0.02;
            } else if (isSunset) {
              mat.color.multiply(new THREE.Color("#e8cfa8"));
            }
            const inst = new THREE.InstancedMesh(mesh.geometry, mat, activePalmCount);
            inst.castShadow = true;
            inst.receiveShadow = true;

            filteredPalms.forEach(([sx, sy, sc, rot], i) => {
              const [wx, wz] = svgToWorld(sx, sy);
              const s = sc * 0.96;
              dummy.position.set(wx, 0, wz);
              dummy.rotation.set(0, rot, 0);
              dummy.scale.set(s, s, s);
              dummy.updateMatrix();
              inst.setMatrixAt(i, dummy.matrix);
            });
            inst.instanceMatrix.needsUpdate = true;
            grp.add(inst);
          }
        });
      }

      const projectTrees = (landscapeData.trees || []).filter(
        ([sx, sy]) => sy >= 590 && sy <= 1540 && sx >= 140 && sx <= 2900
      );
      if (projectTrees.length > 0) {
        if (!landscapeAssetCacheRef.current.sculptedTrees) {
          landscapeAssetCacheRef.current.sculptedTrees = createSculptedTropicalTreeGeometries();
        }
        const { crownGeo, trunkGeo } = landscapeAssetCacheRef.current.sculptedTrees;
        const treeCrownMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          color: isSunset ? "#d9c29e" : "#ffffff",
          roughness: 0.86,
          metalness: 0.02,
        });
        const treeTrunkMat = new THREE.MeshStandardMaterial({
          color: isSunset ? "#4d3826" : "#59422e",
          roughness: 0.9,
        });

        const treeCrownInst = new THREE.InstancedMesh(crownGeo, treeCrownMat, projectTrees.length);
        const treeTrunkInst = new THREE.InstancedMesh(trunkGeo, treeTrunkMat, projectTrees.length);
        treeCrownInst.castShadow = true;
        treeCrownInst.receiveShadow = true;

        projectTrees.forEach(([sx, sy, sc, rot], idx) => {
          const [wx, wz] = svgToWorld(sx, sy);
          const s = sc * 0.64;
          dummy.position.set(wx, 0, wz);
          dummy.rotation.set(0, rot, 0);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          treeCrownInst.setMatrixAt(idx, dummy.matrix);
          treeTrunkInst.setMatrixAt(idx, dummy.matrix);
        });
        treeCrownInst.instanceMatrix.needsUpdate = true;
        treeTrunkInst.instanceMatrix.needsUpdate = true;
        grp.add(treeTrunkInst);
        grp.add(treeCrownInst);
      }

      if (sceneRefs.current.renderer) {
        sceneRefs.current.renderer.shadowMap.needsUpdate = true;
      }
      setBootMilestones((m) => (m.palms ? m : { ...m, palms: true }));
    };

    if (landscapeAssetCacheRef.current.palmScene) {
      buildLandscapeInstances(landscapeAssetCacheRef.current.palmScene);
    } else {
      const loader = new GLTFLoader();
      loader.load(
        "/loom/models/palmera_caribe_hd.glb",
        (gltf) => {
          landscapeAssetCacheRef.current.palmScene = gltf.scene;
          buildLandscapeInstances(gltf.scene);
        },
        undefined,
        (err) => {
          console.warn("Fallback palm loader:", err);
          setBootMilestones((m) => (m.palms ? m : { ...m, palms: true }));
        }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [landscapeData, showTrees3D, isSunset]);

  // ==========================================================================
  // PASO 3: CACHÉ DE GEOMETRÍAS BASE DE LOS 318 LOTES Y PARÁMETROS DE VILLA
  // Se calcula 1 sola vez al cargar unifiedLots (evita 318 ExtrudeGeometry en cada clic de filtro/etapa)
  // ==========================================================================
  const cachedLotsGeometryRef = useRef<{
    sourceLots: Unified3DLot[] | null;
    items: {
      pLot: Unified3DLot;
      lotIndex: number;
      wx: number;
      wz: number;
      ww: number;
      wd: number;
      extrudeHeight: number;
      geometry: THREE.BufferGeometry;
      borderCoords: number[];
      hasValidPolygon: boolean;
      vwx: number;
      vwz: number;
      L: number;
      W: number;
      H: number;
      zHouse: number;
      wHouse: number;
      rotY: number;
    }[];
  }>({
    sourceLots: null,
    items: [],
  });

  if (cachedLotsGeometryRef.current.sourceLots !== unifiedLots && unifiedLots.length > 0) {
    cachedLotsGeometryRef.current.items.forEach((it) => it.geometry.dispose());
    const extrudeHeight = 0.014;
    cachedLotsGeometryRef.current.items = unifiedLots.map((pLot, lotIndex) => {
      const [wx, wz] = svgToWorld(pLot.cx, pLot.cy);
      const ww = (pLot.width / 3840) * WORLD_W;
      const wd = (pLot.height / 2160) * WORLD_D;

      let geometry: THREE.BufferGeometry;
      const borderPoints: THREE.Vector3[] = [];
      const worldVerts: [number, number][] = [];

      if (pLot.vertices.length >= 3) {
        const shape = new THREE.Shape();
        pLot.vertices.forEach(([vx, vy], idx) => {
          const [px, pz] = svgToWorld(vx, vy);
          worldVerts.push([px, pz]);
          const localX = px - wx;
          const localY = -(pz - wz);
          if (idx === 0) shape.moveTo(localX, localY);
          else shape.lineTo(localX, localY);
          borderPoints.push(new THREE.Vector3(px, extrudeHeight + 0.005, pz));
        });
        shape.closePath();
        geometry = new THREE.ExtrudeGeometry(shape, {
          depth: extrudeHeight,
          bevelEnabled: false,
        });
      } else {
        geometry = new THREE.BoxGeometry(ww * 0.85, wd * 0.85, extrudeHeight);
      }

      geometry.rotateX(-Math.PI / 2);
      geometry.translate(wx, 0.004, wz);

      const borderCoords: number[] = [];
      if (borderPoints.length >= 3) {
        for (let i = 0; i < borderPoints.length; i++) {
          const pA = borderPoints[i];
          const pB = borderPoints[(i + 1) % borderPoints.length];
          borderCoords.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
        }
      }

      let bestLen = 0;
      let lotAngle = -0.68;
      for (let i = 0; i < worldVerts.length; i++) {
        const [x1, z1] = worldVerts[i];
        const [x2, z2] = worldVerts[(i + 1) % worldVerts.length];
        const segLen = Math.hypot(x2 - x1, z2 - z1);
        if (segLen > bestLen) {
          bestLen = segLen;
          lotAngle = Math.atan2(z2 - z1, x2 - x1);
        }
      }

      const L = pLot.villaL ? (pLot.villaL / 100) * 0.98 : Math.max(0.52, bestLen * 0.92);
      const W = pLot.villaW ? (pLot.villaW / 100) * 0.98 : L * 0.47;
      const H = L * 0.3583;
      const zHouse = -W * 0.016;
      const wHouse = W * 0.653;
      const [vwx, vwz] =
        pLot.villaCx !== undefined && pLot.villaCy !== undefined
          ? svgToWorld(pLot.villaCx, pLot.villaCy)
          : [wx, wz];
      const rotY = pLot.backAngle !== undefined ? -pLot.backAngle : -lotAngle;

      return {
        pLot,
        lotIndex,
        wx,
        wz,
        ww,
        wd,
        extrudeHeight,
        geometry,
        borderCoords,
        hasValidPolygon: worldVerts.length >= 3,
        vwx,
        vwz,
        L,
        W,
        H,
        zHouse,
        wHouse,
        rotY,
      };
    });
    cachedLotsGeometryRef.current.sourceLots = unifiedLots;
  }

  // ==========================================================================
  // CAPA 3 (DESACOPLADA - PASO 3): LOS 318 LOTES Y BORDES PERIMETRALES (< 1.5 ms)
  // Cambiar etapa, modo de color o filtro de área SOLO actualiza los lotes sin tocar las villas
  // ==========================================================================
  useEffect(() => {
    const { lotsGroup } = sceneRefs.current;
    if (!lotsGroup) return;
    // Congelar reconstrucciones de lotes durante el vuelo inaugural de dron para mantener 60 FPS clavados
    if (isIntroFlying && lotsGroup.children.length > 0) return;

    while (lotsGroup.children.length > 0) {
      const obj = lotsGroup.children[0] as THREE.Mesh | THREE.LineSegments;
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material?.dispose();
      lotsGroup.remove(obj);
    }

    const cachedItems = cachedLotsGeometryRef.current.items;
    if (cachedItems.length === 0) return;

    const lotMatPool = new Map<string, THREE.MeshLambertMaterial>();
    const lineMatPool = new Map<string, THREE.LineBasicMaterial>();
    const batchedBorderSegments = new Map<string, { col: string; op: number; coords: number[] }>();
    const batchedLotGeos = new Map<string, { mat: THREE.MeshLambertMaterial; geos: THREE.BufferGeometry[] }>();

    const hasLiveLotsData = Object.keys(lotsMap).length > 0;

    for (let idx = 0; idx < cachedItems.length; idx++) {
      const item = cachedItems[idx];
      const { pLot, lotIndex, geometry, borderCoords } = item;
      const lotData = lotsMap[pLot.id];
      if (hasLiveLotsData && !lotData) continue;

      const isAmenity = Boolean(pLot.isAmenity || lotData?.status === "common");
      const effectiveStatus = lotData?.status || (isAmenity ? "common" : "available");
      const isCurrentStage = focusMode === "all" || pLot.stageId === stageId;
      const isShowcaseVilla =
        villaMode === "all" ||
        (villaMode === "showcase" && (lotIndex * 7 + 3) % 11 < 5);

      let fillColor = "#10b981";
      let dimmed = !isCurrentStage;

      if (isAmenity) {
        fillColor = "#c27838";
      } else if (colorMode === "status") {
        if (effectiveStatus === "available") fillColor = "#10b981";
        else if (effectiveStatus === "blocked" || effectiveStatus === "reserved")
          fillColor = "#f59e0b";
        else fillColor = "#ef4444";
      } else if (colorMode === "area") {
        const tier = getAreaTier(lotData?.areaNumeric || 250);
        fillColor = tier.fillHex;
        if (activeAreaFilter !== "all" && tier.key !== activeAreaFilter) {
          dimmed = true;
        }
      } else if (colorMode === "typology") {
        const isCorner = (lotData?.location || "").toUpperCase().includes("ESQUINERO");
        fillColor = isCorner ? "#f59e0b" : "#14b8a6";
      }

      const opacity = dimmed ? 0.08 : isShowcaseVilla ? 0.18 : 0.34;
      const emissiveInt = isSunset ? 0.35 : 0.22;
      const matKey = `${fillColor}_${emissiveInt}_${opacity}`;

      let mat = lotMatPool.get(matKey);
      if (!mat) {
        mat = new THREE.MeshLambertMaterial({
          color: fillColor,
          emissive: fillColor,
          emissiveIntensity: emissiveInt,
          transparent: true,
          opacity,
        });
        lotMatPool.set(matKey, mat);
      }

      let lotBatch = batchedLotGeos.get(matKey);
      if (!lotBatch) {
        lotBatch = { mat, geos: [] };
        batchedLotGeos.set(matKey, lotBatch);
      }
      lotBatch.geos.push(geometry);

      if (borderCoords.length > 0) {
        const lOp = dimmed ? 0.22 : 0.92;
        const lKey = `${fillColor}_${lOp}`;
        let bucket = batchedBorderSegments.get(lKey);
        if (!bucket) {
          bucket = { col: fillColor, op: lOp, coords: [] };
          batchedBorderSegments.set(lKey, bucket);
        }
        for (let k = 0; k < borderCoords.length; k++) {
          bucket.coords.push(borderCoords[k]);
        }
      }
    }

    // 1. Añadir lotes fusionados por material (4-5 draw calls en lugar de 318)
    batchedLotGeos.forEach((batch) => {
      if (batch.geos.length === 0) return;
      // Si solo hay 1 geometría en el lote, clonar para no hacer dispose de la caché base al limpiar lotsGroup
      const mergedLotGeo =
        batch.geos.length === 1 ? batch.geos[0].clone() : mergeSimpleBufferGeometries(batch.geos);
      const batchMesh = new THREE.Mesh(mergedLotGeo, batch.mat);
      batchMesh.matrixAutoUpdate = false;
      lotsGroup.add(batchMesh);
    });

    // 2. Renderizar todos los bordes perimetrales de los 318 lotes en 2-3 llamadas agrupadas (LineSegments)
    batchedBorderSegments.forEach((bucket, lKey) => {
      if (bucket.coords.length === 0) return;
      const segGeo = new THREE.BufferGeometry();
      segGeo.setAttribute("position", new THREE.Float32BufferAttribute(bucket.coords, 3));
      let lineMat = lineMatPool.get(lKey);
      if (!lineMat) {
        lineMat = new THREE.LineBasicMaterial({
          color: bucket.col,
          transparent: true,
          opacity: bucket.op,
        });
        lineMatPool.set(lKey, lineMat);
      }
      const lineSegs = new THREE.LineSegments(segGeo, lineMat);
      lineSegs.matrixAutoUpdate = false;
      lotsGroup.add(lineSegs);
    });
  }, [unifiedLots, lotsMap, stageId, focusMode, colorMode, activeAreaFilter, villaMode, isSunset, isIntroFlying]);

  // ==========================================================================
  // CAPA 5A (DESACOPLADA): VILLAS LUXURY & GARDEN + ETIQUETAS (1 SOLA CONSTRUCCIÓN)
  // Independiente de carTemplates, stageId, focusMode, colorMode y activeAreaFilter
  // ==========================================================================
  useEffect(() => {
    const { villasGroup } = sceneRefs.current;
    if (!villasGroup) return;

    while (villasGroup.children.length > 0) {
      const child = villasGroup.children[0];
      if ((child as THREE.Sprite).isSprite) {
        const sp = child as THREE.Sprite;
        sp.material.map?.dispose();
        sp.material.dispose();
        sp.geometry?.dispose();
      }
      villasGroup.remove(child);
    }

    const cachedItems = cachedLotsGeometryRef.current.items;
    if (cachedItems.length === 0) return;

    if (!villaMatsCacheRef.current.unitBox) {
      villaMatsCacheRef.current.unitBox = new THREE.BoxGeometry(1, 1, 1);
    }
    const cacheKey = isSunset ? "sunset" : "day";
    if (!villaMatsCacheRef.current[cacheKey]) {
      villaMatsCacheRef.current[cacheKey] = createVillaReplicaMaterials(isSunset);
    }
    const villaMats = villaMatsCacheRef.current[cacheKey]!;

    // Etiquetas Píldora Principales
    const [beachX, beachZ] = svgToWorld(2885, 895);
    const beachPill = createFloatingPillSprite("Alma Beach Club", "#EBD9AB", 1.55, 0.38);
    beachPill.position.set(beachX + 0.15, 0.56, beachZ - 0.05);
    villasGroup.add(beachPill);

    const [chX, chZ] = svgToWorld(2196, 972);
    const clubHousePill = createFloatingPillSprite("Club House & Oasis", "#EBD9AB", 1.55, 0.38);
    clubHousePill.position.set(chX, 0.56, chZ);
    villasGroup.add(clubHousePill);

    const [lakeX, lakeZ] = svgToWorld(2835, 1218);
    const lakePill = createFloatingPillSprite("Lago Central • Oasis", "#22d3ee", 1.48, 0.36);
    lakePill.position.set(lakeX, 0.48, lakeZ);
    villasGroup.add(lakePill);

    const [porteriaX, porteriaZ] = svgToWorld(92, 1095);
    const porteriaPill = createFloatingPillSprite(isEn ? "Loom Gatehouse" : "Portería Loom", "#EBD9AB", 1.38, 0.35);
    porteriaPill.position.set(porteriaX, 0.38, porteriaZ);
    villasGroup.add(porteriaPill);

    const [viaX, viaZ] = svgToWorld(-136, 830);
    const viaPill = createFloatingPillSprite(
      isEn ? "Vía del Mar Kilometer 23" : "Vía del Mar Kilómetro 23",
      "#fbbf24",
      1.95,
      0.38
    );
    viaPill.position.set(viaX, 0.45, viaZ);
    villasGroup.add(viaPill);

    const instAllVillaMatrices: THREE.Matrix4[] = [];
    const instLuxuryVillaMatrices: THREE.Matrix4[] = [];
    const instGardenVillaMatrices: THREE.Matrix4[] = [];
    const instPatioPalmMatrices: THREE.Matrix4[] = [];

    const dummyVilla = new THREE.Object3D();
    const dummyChild = new THREE.Object3D();
    const mat4VillaBase = new THREE.Matrix4();

    if (villaMode !== "off") {
      for (let idx = 0; idx < cachedItems.length; idx++) {
        const item = cachedItems[idx];
        const { pLot, lotIndex, extrudeHeight, hasValidPolygon, vwx, vwz, L, W, H, zHouse, wHouse, rotY } = item;
        if (pLot.isAmenity || !hasValidPolygon) continue;

        const isShowcaseVilla =
          villaMode === "all" || (villaMode === "showcase" && (lotIndex * 7 + 3) % 11 < 5);
        if (!isShowcaseVilla) continue;

        dummyVilla.position.set(vwx, extrudeHeight + 0.005, vwz);
        dummyVilla.rotation.set(0, rotY, 0);
        dummyVilla.scale.set(1, 1, 1);
        dummyVilla.updateMatrix();
        mat4VillaBase.copy(dummyVilla.matrix);

        dummyVilla.scale.set(L, H, W);
        dummyVilla.updateMatrix();
        const villaScaledMat = dummyVilla.matrix.clone();
        instAllVillaMatrices.push(villaScaledMat);
        if (lotIndex % 2 === 1) {
          instGardenVillaMatrices.push(villaScaledMat);
        } else {
          instLuxuryVillaMatrices.push(villaScaledMat);
        }

        if (villaMats.palmCrownTexMat) {
          const palmX = L * 0.005;
          const palmZ = zHouse + wHouse * 0.12;
          dummyChild.position.set(palmX + L * 0.01, H * 1.15, palmZ + W * 0.006);
          dummyChild.rotation.set(0, 0, 0);
          dummyChild.scale.set(L * 0.46, L * 0.46, L * 0.46);
          dummyChild.updateMatrix();
          dummyChild.matrix.premultiply(mat4VillaBase);
          instPatioPalmMatrices.push(dummyChild.matrix.clone());
        }
      }
    }

    // 1. Añadir el 95% de geometría compartida en 1 solo grupo de InstancedMesh (ahorra 16 draw calls)
    if (instAllVillaMatrices.length > 0) {
      const splitSpecs = getOrBuildSplitInstancedVillaMeshes(villaMats);
      const allCount = instAllVillaMatrices.length;
      for (let s = 0; s < splitSpecs.sharedSpecs.length; s++) {
        const spec = splitSpecs.sharedSpecs[s];
        const instMesh = new THREE.InstancedMesh(spec.geo, spec.mat, allCount);
        instMesh.castShadow = spec.castShadow;
        instMesh.receiveShadow = true;
        for (let i = 0; i < allCount; i++) {
          instMesh.setMatrixAt(i, instAllVillaMatrices[i]);
        }
        instMesh.instanceMatrix.needsUpdate = true;
        villasGroup.add(instMesh);
      }

      // 2a. Piezas exclusivas de Villa Luxury (planta baja con piscina + agua de piscina 1er piso)
      if (instLuxuryVillaMatrices.length > 0) {
        const lCount = instLuxuryVillaMatrices.length;
        for (let s = 0; s < splitSpecs.luxuryOnlySpecs.length; s++) {
          const spec = splitSpecs.luxuryOnlySpecs[s];
          const instMesh = new THREE.InstancedMesh(spec.geo, spec.mat, lCount);
          instMesh.castShadow = spec.castShadow;
          instMesh.receiveShadow = true;
          for (let i = 0; i < lCount; i++) {
            instMesh.setMatrixAt(i, instLuxuryVillaMatrices[i]);
          }
          instMesh.instanceMatrix.needsUpdate = true;
          villasGroup.add(instMesh);
        }
      }

      // 2b. Piezas exclusivas de Villa Garden (planta baja Garden + césped y arbustos del patio 1er piso)
      if (instGardenVillaMatrices.length > 0) {
        const gCount = instGardenVillaMatrices.length;
        for (let s = 0; s < splitSpecs.gardenOnlySpecs.length; s++) {
          const spec = splitSpecs.gardenOnlySpecs[s];
          const instMesh = new THREE.InstancedMesh(spec.geo, spec.mat, gCount);
          instMesh.castShadow = spec.castShadow;
          instMesh.receiveShadow = true;
          for (let i = 0; i < gCount; i++) {
            instMesh.setMatrixAt(i, instGardenVillaMatrices[i]);
          }
          instMesh.instanceMatrix.needsUpdate = true;
          villasGroup.add(instMesh);
        }
      }
    }

    // 3. Añadir coronas de palmera de patio interior en 1 solo InstancedMesh
    if (instPatioPalmMatrices.length > 0 && villaMats.palmCrownTexMat) {
      const palmInst = new THREE.InstancedMesh(
        villaMats.palmCrownGeo,
        villaMats.palmCrownTexMat,
        instPatioPalmMatrices.length
      );
      palmInst.castShadow = true;
      for (let i = 0; i < instPatioPalmMatrices.length; i++) {
        palmInst.setMatrixAt(i, instPatioPalmMatrices[i]);
      }
      palmInst.instanceMatrix.needsUpdate = true;
      villasGroup.add(palmInst);
    }

    if (sceneRefs.current.renderer) {
      sceneRefs.current.renderer.shadowMap.needsUpdate = true;
    }
  }, [unifiedLots, villaMode, isSunset, isEn]);

  // ==========================================================================
  // CAPA 5B (DESACOPLADA): VEHÍCULOS 3D ESTACIONADOS Y EN CIRCULACIÓN
  // Independiente de villasGroup (0 reconstrucción de las 145 villas) y protegido durante el vuelo
  // ==========================================================================
  useEffect(() => {
    const { carsGroup } = sceneRefs.current;
    if (!carsGroup) return;
    // Si una red lenta entrega los autos después de abrir la cortina, esperar a que aterrice el dron (0 tirones)
    if (hasTriggeredRevealRef.current && isIntroFlying) return;

    const transientDisposables: { dispose: () => void }[] = [];
    while (carsGroup.children.length > 0) {
      carsGroup.remove(carsGroup.children[0]);
    }
    animatedTrafficRef.current = [];

    const cachedItems = cachedLotsGeometryRef.current.items;
    if (cachedItems.length === 0) return;

    if (!villaMatsCacheRef.current.unitBox) {
      villaMatsCacheRef.current.unitBox = new THREE.BoxGeometry(1, 1, 1);
    }
    const unitBox = villaMatsCacheRef.current.unitBox;
    const cacheKey = isSunset ? "sunset" : "day";
    if (!villaMatsCacheRef.current[cacheKey]) {
      villaMatsCacheRef.current[cacheKey] = createVillaReplicaMaterials(isSunset);
    }
    const villaMats = villaMatsCacheRef.current[cacheKey]!;

    // Tráfico continuo a 60 FPS por el Bulevar Principal y avenidas internas
    animatedTrafficRef.current = buildAnimatedTrafficCars(
      carTemplates,
      villaMats,
      unitBox,
      carsGroup
    );

    if (carTemplates.length === 0 || villaMode === "off") {
      return () => {
        transientDisposables.forEach((d) => d.dispose());
      };
    }

    const instCarShadows: THREE.Matrix4[] = [];
    const instParkedCarsByModel: { matrix: THREE.Matrix4; paintColor: THREE.Color }[][] = carTemplates.map(() => []);

    const dummyVilla = new THREE.Object3D();
    const dummyChild = new THREE.Object3D();
    const mat4VillaBase = new THREE.Matrix4();

    for (let idx = 0; idx < cachedItems.length; idx++) {
      const item = cachedItems[idx];
      const { pLot, lotIndex, extrudeHeight, hasValidPolygon, vwx, vwz, L, W, zHouse, wHouse, rotY } = item;
      if (pLot.isAmenity || !hasValidPolygon) continue;

      const isShowcaseVilla =
        villaMode === "all" || (villaMode === "showcase" && (lotIndex * 7 + 3) % 11 < 5);
      if (!isShowcaseVilla) continue;

      dummyVilla.position.set(vwx, extrudeHeight + 0.005, vwz);
      dummyVilla.rotation.set(0, rotY, 0);
      dummyVilla.scale.set(1, 1, 1);
      dummyVilla.updateMatrix();
      mat4VillaBase.copy(dummyVilla.matrix);

      const carSlots = [zHouse - wHouse * 0.225, zHouse + wHouse * 0.215];
      // Distribución residencial ligera (-57% vehículos): 30% garaje despejado, 60% 1 vehículo, 10% 2 vehículos
      const carRoll = (lotIndex * 13 + 5) % 10;
      const activeSlots =
        carRoll < 3
          ? []
          : carRoll < 9
          ? [carSlots[lotIndex % 2]]
          : carSlots;

      activeSlots.forEach((carZ, slotIdx) => {
        const modelIdx = (lotIndex + slotIdx * 2 + (slotIdx === 1 ? 1 : 0)) % carTemplates.length;
        const paintMat =
          villaMats.carPaintPalette[
            (lotIndex * 3 + slotIdx * 5 + modelIdx) % villaMats.carPaintPalette.length
          ];

        dummyChild.position.set(-L * 0.352, 0.0145, carZ);
        dummyChild.rotation.set(0, 0, 0);
        dummyChild.scale.set(L * 0.142, 0.002, W * 0.118);
        dummyChild.updateMatrix();
        dummyChild.matrix.premultiply(mat4VillaBase);
        instCarShadows.push(dummyChild.matrix.clone());

        const carScale = L * 0.0415;
        dummyChild.position.set(-L * 0.352, 0.015, carZ);
        dummyChild.rotation.set(0, (lotIndex + slotIdx) % 2 === 0 ? Math.PI : 0, 0);
        dummyChild.scale.set(carScale, carScale, carScale);
        dummyChild.updateMatrix();
        dummyChild.matrix.premultiply(mat4VillaBase);
        instParkedCarsByModel[modelIdx].push({
          matrix: dummyChild.matrix.clone(),
          paintColor: paintMat.color,
        });
      });
    }

    if (instCarShadows.length > 0) {
      const shadowInst = new THREE.InstancedMesh(unitBox, villaMats.darkBronzeMat, instCarShadows.length);
      shadowInst.castShadow = false;
      shadowInst.receiveShadow = false;
      for (let i = 0; i < instCarShadows.length; i++) {
        shadowInst.setMatrixAt(i, instCarShadows[i]);
      }
      shadowInst.instanceMatrix.needsUpdate = true;
      carsGroup.add(shadowInst);
    }

    const instBodyPaintBaseMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.16,
      metalness: 0.42,
      envMapIntensity: 1.35,
    });
    transientDisposables.push(instBodyPaintBaseMat);

    instParkedCarsByModel.forEach((instances, modelIdx) => {
      if (instances.length === 0 || !carTemplates[modelIdx]) return;
      const tpl = carTemplates[modelIdx];
      tpl.updateMatrixWorld(true);
      const count = instances.length;
      const combinedMat = new THREE.Matrix4();

      tpl.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          const mName = (mesh.material as THREE.Material)?.name || "";
          const isBodyPaint = mName === "BodyPaint";
          const useMat = isBodyPaint ? instBodyPaintBaseMat : mesh.material;
          const inst = new THREE.InstancedMesh(mesh.geometry, useMat, count);
          inst.castShadow = false;
          inst.receiveShadow = false;

          for (let i = 0; i < count; i++) {
            combinedMat.multiplyMatrices(instances[i].matrix, mesh.matrixWorld);
            inst.setMatrixAt(i, combinedMat);
            if (isBodyPaint) {
              inst.setColorAt(i, instances[i].paintColor);
            }
          }
          inst.instanceMatrix.needsUpdate = true;
          if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
          carsGroup.add(inst);
        }
      });
    });

    return () => {
      transientDisposables.forEach((d) => d.dispose());
    };
  }, [unifiedLots, villaMode, isSunset, carTemplates, isIntroFlying]);

  // Efecto ultra-rápido (< 1ms) exclusivo para el lote seleccionado: no reconstruye las 145 villas ni los 318 lotes
  useEffect(() => {
    const { telemetryGroup } = sceneRefs.current;
    if (!telemetryGroup) return;

    const telemetryDisposables: { dispose: () => void }[] = [];
    while (telemetryGroup.children.length > 0) {
      const child = telemetryGroup.children[0];
      if ((child as THREE.Sprite).isSprite) {
        const sp = child as THREE.Sprite;
        sp.material.map?.dispose();
        sp.material.dispose();
        sp.geometry?.dispose();
      }
      telemetryGroup.remove(child);
    }
    if (telemetryAnimRef.current.windTex) {
      telemetryAnimRef.current.windTex.dispose();
      telemetryAnimRef.current.windTex = null;
    }

    if (!selectedLot || unifiedLots.length === 0) return;

    const lotIndex = unifiedLots.findIndex((p) => p.id === selectedLot.id);
    if (lotIndex === -1) return;
    const pLot = unifiedLots[lotIndex];
    const lotData = lotsMap[pLot.id];
    if (!lotData) return;

    const [wx, wz] = svgToWorld(pLot.cx, pLot.cy);
    const ww = (pLot.width / 3840) * WORLD_W;
    const wd = (pLot.height / 2160) * WORLD_D;
    const isAmenity = pLot.isAmenity || lotData.status === "common";
    const [beachX, beachZ] = svgToWorld(2885, 895);

    if (pLot.vertices.length >= 3) {
      const selBorderPts = pLot.vertices.map(([vx, vy]) => {
        const [px, pz] = svgToWorld(vx, vy);
        return new THREE.Vector3(px, 0.048, pz);
      });
      const selLineGeo = new THREE.BufferGeometry().setFromPoints(selBorderPts);
      const selLineMat = new THREE.LineBasicMaterial({ color: "#fde047" });
      telemetryDisposables.push(selLineGeo, selLineMat);
      telemetryGroup.add(new THREE.LineLoop(selLineGeo, selLineMat));
    }

    if (!isAmenity) {
      const labelStr = `${lotData.rawId} • ${lotData.areaNumeric || lotData.area} m²`;
      const selPill = createFloatingPillSprite(labelStr, "#fde047", 0.88, 0.22);
      selPill.position.set(wx, villaMode !== "off" ? 0.44 : 0.16, wz);
      telemetryGroup.add(selPill);
    }

    // Si en modo "showcase" el lote seleccionado no tenía villa de muestra, renderizar su villa en telemetryGroup
    const alreadyHasVilla =
      villaMode === "all" || (villaMode === "showcase" && (lotIndex * 7 + 3) % 11 < 5);
    if (villaMode === "showcase" && !alreadyHasVilla && !isAmenity && pLot.vertices.length >= 3) {
      const cacheKey = isSunset ? "sunset" : "day";
      const villaMats = villaMatsCacheRef.current[cacheKey];
      const unitBox = villaMatsCacheRef.current.unitBox;
      if (villaMats && unitBox) {
        const L = pLot.villaL ? (pLot.villaL / 100) * 0.98 : 0.72;
        const W = pLot.villaW ? (pLot.villaW / 100) * 0.98 : L * 0.47;
        const villaGrp = new THREE.Group();
        const [vwx, vwz] =
          pLot.villaCx !== undefined && pLot.villaCy !== undefined
            ? svgToWorld(pLot.villaCx, pLot.villaCy)
            : [wx, wz];
        villaGrp.position.set(vwx, 0.05, vwz);
        villaGrp.rotation.y = pLot.backAngle !== undefined ? -pLot.backAngle : 0;
        villaGrp.matrixAutoUpdate = false;
        villaGrp.updateMatrix();
        buildLoomVillaReplica3D(villaGrp, L, W, villaMats, unitBox, lotIndex, carTemplates);
        telemetryGroup.add(villaGrp);
        if (sceneRefs.current.renderer) {
          sceneRefs.current.renderer.shadowMap.needsUpdate = true;
        }
      }
    }

    // ========================================================================
    // 1. ARCO SOLAR BIOCLIMÁTICO 3D (ESTE -> MEDIODÍA -> OESTE MAR CARIBE — PLANO A001)
    // ========================================================================
    const radius = Math.max(ww, wd) * 1.02;
    const solarCurvePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 44; i++) {
      const { dx, dy, dz } = sampleLoomSolarArcOffset(i / 44, radius);
      solarCurvePts.push(new THREE.Vector3(wx + dx, 0.055 + dy, wz + dz));
    }
    const solarCurve = new THREE.CatmullRomCurve3(solarCurvePts);

    const solarCoreGeo = new THREE.TubeGeometry(solarCurve, 48, 0.0055, 8, false);
    const solarCoreMat = new THREE.MeshBasicMaterial({
      color: isSunset ? "#fed7aa" : "#fef08a",
    });
    telemetryDisposables.push(solarCoreGeo, solarCoreMat);
    telemetryGroup.add(new THREE.Mesh(solarCoreGeo, solarCoreMat));

    const solarHaloGeo = new THREE.TubeGeometry(solarCurve, 48, 0.018, 8, false);
    const solarHaloMat = new THREE.MeshBasicMaterial({
      color: isSunset ? "#f97316" : "#f59e0b",
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    telemetryDisposables.push(solarHaloGeo, solarHaloMat);
    telemetryGroup.add(new THREE.Mesh(solarHaloGeo, solarHaloMat));

    // Anillo de Brújula 3D real sobre el terreno (círculo 360° sin deformación elíptica + marcas cardinales A001)
    const compassPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      compassPts.push(new THREE.Vector3(wx + Math.cos(a) * radius, 0.052, wz + Math.sin(a) * radius));
    }
    const compassGeo = new THREE.BufferGeometry().setFromPoints(compassPts);
    const compassMat = new THREE.LineBasicMaterial({
      color: "#fbbf24",
      transparent: true,
      opacity: 0.42,
    });
    telemetryDisposables.push(compassGeo, compassMat);
    telemetryGroup.add(new THREE.Line(compassGeo, compassMat));

    // Marcas radiales de rumbo (8 rumbos de la Rosa de los Vientos A001)
    const tickCoords: number[] = [];
    for (let k = 0; k < 8; k++) {
      const ang = LOOM_NORTH_MAP_ANGLE_RAD + (k * Math.PI) / 4;
      const isMain = k % 2 === 0;
      const rIn = radius * (isMain ? 0.91 : 0.95);
      const rOut = radius * (isMain ? 1.07 : 1.03);
      tickCoords.push(
        wx + Math.cos(ang) * rIn,
        0.053,
        wz + Math.sin(ang) * rIn,
        wx + Math.cos(ang) * rOut,
        0.053,
        wz + Math.sin(ang) * rOut
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickCoords, 3));
    telemetryDisposables.push(tickGeo);
    telemetryGroup.add(new THREE.LineSegments(tickGeo, compassMat));

    // Aguja Norte (N) en el suelo + micro-etiquetas cardinales N / E (Amanecer) / O (Ocaso)
    const northPerpX = -LOOM_DIR_NORTH.z;
    const northPerpZ = LOOM_DIR_NORTH.x;
    const nArrowGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        wx + LOOM_DIR_NORTH.x * (radius * 1.13),
        0.056,
        wz + LOOM_DIR_NORTH.z * (radius * 1.13)
      ),
      new THREE.Vector3(
        wx + LOOM_DIR_NORTH.x * (radius * 0.94) + northPerpX * (radius * 0.07),
        0.056,
        wz + LOOM_DIR_NORTH.z * (radius * 0.94) + northPerpZ * (radius * 0.07)
      ),
      new THREE.Vector3(
        wx + LOOM_DIR_NORTH.x * (radius * 0.94) - northPerpX * (radius * 0.07),
        0.056,
        wz + LOOM_DIR_NORTH.z * (radius * 0.94) - northPerpZ * (radius * 0.07)
      ),
    ]);
    nArrowGeo.setIndex([0, 1, 2]);
    const nArrowMat = new THREE.MeshBasicMaterial({
      color: "#EBD9AB",
      side: THREE.DoubleSide,
    });
    telemetryDisposables.push(nArrowGeo, nArrowMat);
    telemetryGroup.add(new THREE.Mesh(nArrowGeo, nArrowMat));

    const labelDist = radius * 1.24;
    const northPill = createFloatingPillSprite("N", "#EBD9AB", 0.24, 0.14);
    northPill.position.set(
      wx + LOOM_DIR_NORTH.x * labelDist,
      0.11,
      wz + LOOM_DIR_NORTH.z * labelDist
    );
    telemetryGroup.add(northPill);

    const eastPill = createFloatingPillSprite(
      isEn ? "E • Sunrise" : "E • Amanecer",
      "#fde047",
      0.56,
      0.15
    );
    eastPill.position.set(
      wx + LOOM_DIR_EAST.x * (radius * 1.16),
      0.12,
      wz + LOOM_DIR_EAST.z * (radius * 1.16)
    );
    telemetryGroup.add(eastPill);

    const westPill = createFloatingPillSprite(
      isEn ? "W • Sunset" : "O • Atardecer",
      "#fb923c",
      0.58,
      0.15
    );
    westPill.position.set(
      wx + LOOM_DIR_WEST.x * (radius * 1.16),
      0.12,
      wz + LOOM_DIR_WEST.z * (radius * 1.16)
    );
    telemetryGroup.add(westPill);

    const sunT = isSunset ? LOOM_SUN_PROGRESS.sunset : LOOM_SUN_PROGRESS.day;
    const sunPos = solarCurve.getPointAt(sunT);

    const sunOrbGeo = new THREE.SphereGeometry(0.036, 20, 20);
    const sunOrbMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    telemetryDisposables.push(sunOrbGeo, sunOrbMat);
    const sunOrb = new THREE.Mesh(sunOrbGeo, sunOrbMat);
    sunOrb.position.copy(sunPos);
    telemetryGroup.add(sunOrb);

    const sunCorona = createSunCoronaFlareSprite(isSunset);
    sunCorona.position.copy(sunPos);
    telemetryGroup.add(sunCorona);

    const sunBeamGeo = new THREE.CylinderGeometry(0.012, 0.16, Math.max(0.08, sunPos.y - 0.06), 16, 1, true);
    const sunBeamMat = new THREE.MeshBasicMaterial({
      color: isSunset ? "#fb923c" : "#fde047",
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    telemetryDisposables.push(sunBeamGeo, sunBeamMat);
    const sunBeam = new THREE.Mesh(sunBeamGeo, sunBeamMat);
    sunBeam.position.set(
      (sunPos.x + wx) * 0.5,
      (sunPos.y + 0.06) * 0.5,
      (sunPos.z + wz) * 0.5
    );
    sunBeam.lookAt(wx, 0.08, wz);
    sunBeam.rotateX(Math.PI / 2);
    telemetryGroup.add(sunBeam);

    // ========================================================================
    // 2. FLUJO DE BRISA MARINA DEL CARIBE (DESDE NNO/NORTE MAR CARIBE -> TIERRA ADENTRO)
    // ========================================================================
    const windTex = createAnimatedWindFlowTexture();
    const windStreamMat = new THREE.MeshBasicMaterial({
      map: windTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    telemetryDisposables.push(windStreamMat);

    const bPerpX = -LOOM_DIR_BREEZE_FROM.z;
    const bPerpZ = LOOM_DIR_BREEZE_FROM.x;
    const streamOffsets = [
      { dLat: -0.14, yStart: 0.42, yMid: 0.34, yEnd: 0.26, rad: 0.0095 },
      { dLat: 0.0, yStart: 0.48, yMid: 0.39, yEnd: 0.31, rad: 0.0125 },
      { dLat: 0.14, yStart: 0.37, yMid: 0.29, yEnd: 0.22, rad: 0.0085 },
    ];

    streamOffsets.forEach((st, idx) => {
      const waveS = (idx === 1 ? 1 : -1) * 0.065;
      const ptAlongBreeze = (along: number, lat: number, y: number) =>
        new THREE.Vector3(
          wx + LOOM_DIR_BREEZE_FROM.x * along + bPerpX * lat,
          y,
          wz + LOOM_DIR_BREEZE_FROM.z * along + bPerpZ * lat
        );

      const curve = new THREE.CatmullRomCurve3([
        ptAlongBreeze(radius * 1.28, st.dLat, st.yStart),
        ptAlongBreeze(radius * 0.48, st.dLat + waveS, st.yMid + 0.03),
        ptAlongBreeze(-radius * 0.18, st.dLat - waveS, st.yMid - 0.02),
        new THREE.Vector3(
          wx + LOOM_DIR_BREEZE_TO.x * (radius * 0.88) + bPerpX * st.dLat,
          st.yEnd,
          wz + LOOM_DIR_BREEZE_TO.z * (radius * 0.88) + bPerpZ * st.dLat
        ),
      ]);
      const streamGeo = new THREE.TubeGeometry(curve, 44, st.rad, 8, false);
      telemetryDisposables.push(streamGeo);
      telemetryGroup.add(new THREE.Mesh(streamGeo, windStreamMat));

      if (idx === 1) {
        const endPt = curve.getPointAt(0.96);
        const tangent = curve.getTangentAt(0.96).normalize();
        const coneGeo = new THREE.ConeGeometry(0.026, 0.075, 12);
        coneGeo.rotateX(Math.PI / 2);
        const coneMat = new THREE.MeshBasicMaterial({
          color: "#a5f3fc",
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        telemetryDisposables.push(coneGeo, coneMat);
        const arrowMesh = new THREE.Mesh(coneGeo, coneMat);
        arrowMesh.position.copy(endPt);
        arrowMesh.lookAt(endPt.clone().add(tangent));
        telemetryGroup.add(arrowMesh);

        const breezeStartPt = curve.getPointAt(0.08);
        const breezePill = createFloatingPillSprite(
          isEn ? "Sea Breeze" : "Brisa Marina",
          "#38bdf8",
          0.74,
          0.18
        );
        breezePill.position.set(breezeStartPt.x, breezeStartPt.y + 0.11, breezeStartPt.z);
        telemetryGroup.add(breezePill);
      }
    });

    telemetryAnimRef.current = {
      windTex,
      sunCorona,
      sunCore: sunOrb,
      solarCurve,
    };

    // ========================================================================
    // 3. ARCO DE CONEXIÓN A PLAYA ALMA (SIN SUPERPONERSE CON EL PILL DEL LOTE)
    // ========================================================================
    if (!isAmenity) {
      const distWorld = Math.hypot(beachX - wx, beachZ - wz);
      const distMeters = Math.max(25, Math.round(distWorld * 22));
      const midX = (wx + beachX) * 0.5;
      const midZ = (wz + beachZ) * 0.5;
      const walkArc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(wx, 0.16, wz),
        new THREE.Vector3(midX, 0.45 + distWorld * 0.04, midZ),
        new THREE.Vector3(beachX, 0.18, beachZ),
      ]);
      const walkTubeGeo = new THREE.TubeGeometry(walkArc, 40, 0.0045, 6, false);
      const walkTubeMat = new THREE.MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      telemetryDisposables.push(walkTubeGeo, walkTubeMat);
      telemetryGroup.add(new THREE.Mesh(walkTubeGeo, walkTubeMat));

      const labelPos = walkArc.getPointAt(0.26);
      const walkPill = createFloatingPillSprite(
        isEn ? `~${distMeters}m to Alma Beach` : `A ~${distMeters}m de Playa Alma`,
        "#38bdf8",
        1.18,
        0.25
      );
      walkPill.position.set(labelPos.x, Math.max(0.68, labelPos.y + 0.16), labelPos.z);
      telemetryGroup.add(walkPill);
    }

    return () => {
      telemetryDisposables.forEach((d) => d.dispose());
    };
  }, [selectedLot, unifiedLots, lotsMap, villaMode, isSunset, isEn, carTemplates]);

  const isFirstPresetEffectRef = useRef(true);
  useEffect(() => {
    if (isFirstPresetEffectRef.current) {
      isFirstPresetEffectRef.current = false;
      return;
    }
    cancelAndDisposeIntroFlight();
    sceneRefs.current.desiredPos.set(...activePreset.position);
    sceneRefs.current.desiredTarget.set(...activePreset.target);
    sceneRefs.current.isFlying = true;
  }, [activePreset]);

  useEffect(() => {
    if (!selectedLot) return;
    const found = unifiedLots.find((p) => p.id === selectedLot.id);
    if (!found) return;
    const [wx, wz] = svgToWorld(found.cx, found.cy);
    if (hasTriggeredRevealRef.current) {
      cancelAndDisposeIntroFlight();
    }
    sceneRefs.current.desiredTarget.set(wx, 0.18, wz);
    sceneRefs.current.desiredPos.set(wx + 2.8, 3.8, wz + 4.4);
    sceneRefs.current.isFlying = true;
  }, [selectedLot, unifiedLots]);

  const [isExportingMap, setIsExportingMap] = useState(false);

  const handleDownloadAvailabilityMap = async () => {
    if (isExportingMap || unifiedLots.length === 0) return;
    setIsExportingMap(true);
    try {
      await exportLoomAvailabilityMapPng({
        unifiedLots,
        lotsMap,
        selectedLot,
        stageId,
        isEn,
      });
    } catch (e) {
      console.error("Error exporting availability map:", e);
    } finally {
      setIsExportingMap(false);
    }
  };

  const handleFlyToStage = (targetStage: string) => {
    cancelAndDisposeIntroFlight();
    if (targetStage === "all") {
      setFocusMode("all");
      const tgt = STAGE_CAMERA_TARGETS.all;
      sceneRefs.current.desiredPos.set(...tgt.pos);
      sceneRefs.current.desiredTarget.set(...tgt.target);
      sceneRefs.current.isFlying = true;
      return;
    }
    setFocusMode("stage");
    onChangeStage(targetStage);
    const tgt = STAGE_CAMERA_TARGETS[targetStage] || STAGE_CAMERA_TARGETS.all;
    sceneRefs.current.desiredPos.set(...tgt.pos);
    sceneRefs.current.desiredTarget.set(...tgt.target);
    sceneRefs.current.isFlying = true;
  };

  const hasLiveLotsReady = Object.keys(lotsMap).length > 0 || bootMilestones.lotsStatusGrace;
  const hasCarsReady = bootMilestones.cars || bootMilestones.carsGrace;
  const rawSceneReady =
    bootMilestones.forceReady ||
    (bootMilestones.renderer &&
      bootMilestones.masterTex &&
      bootMilestones.masksTex &&
      bootMilestones.unifiedLots &&
      (bootMilestones.palms || !showTrees3D) &&
      hasCarsReady &&
      hasLiveLotsReady);

  const loaderProgress = isSceneReady
    ? 100
    : Math.min(
        98,
        12 +
          (bootMilestones.renderer ? 8 : 0) +
          (bootMilestones.masterTex ? 28 : 0) +
          (bootMilestones.masksTex ? 12 : 0) +
          (bootMilestones.westTex ? 8 : 0) +
          (bootMilestones.unifiedLots ? 12 : 0) +
          (bootMilestones.palms || !showTrees3D ? 6 : 0) +
          (hasCarsReady ? 7 : 0) +
          (hasLiveLotsReady ? 5 : 0)
      );

  useEffect(() => {
    if (!rawSceneReady || hasTriggeredRevealRef.current) return;
    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      const { scene, camera, controls, renderer } = sceneRefs.current;
      if (!scene || !camera || !controls || !renderer) {
        hasTriggeredRevealRef.current = true;
        setIsSceneReady(true);
        return;
      }

      let endPos = new THREE.Vector3(...activePreset.position);
      let endTarget = new THREE.Vector3(
        activePreset.target[0],
        Math.max(0.02, activePreset.target[1]),
        activePreset.target[2]
      );

      if (selectedLot) {
        const found = unifiedLots.find((p) => p.id === selectedLot.id);
        if (found) {
          const [wx, wz] = svgToWorld(found.cx, found.cy);
          endTarget = new THREE.Vector3(wx, 0.18, wz);
          endPos = new THREE.Vector3(wx + 2.8, 3.8, wz + 4.4);
        }
      }

      // Trayectoria curva 3D: Nubes altas sobre el Mar Caribe -> Rompiente Playa Alma -> Alma Beach Club -> Villas
      const posCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(26.8, 19.8, 14.4),
        new THREE.Vector3(17.6, 9.2, 10.8),
        new THREE.Vector3(9.8, 6.2, 8.5),
        endPos.clone(),
      ]);

      const targetCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(15.4, 1.35, -1.1),
        new THREE.Vector3(11.2, 0.36, -0.95),
        new THREE.Vector3(8.8, 0.08, -0.74),
        endTarget.clone(),
      ]);

      // Cúmulos 3D volumétricos escalonados sobre el mar que el dron atraviesa a 60 FPS reales
      const cloudTex = createAtmosphericCloudWispTexture();
      const cloudGroup = new THREE.Group();
      const cloudMaterials: { mat: THREE.SpriteMaterial; baseOpacity: number }[] = [];
      const wispSpecs: [number, number, number, number, number, number][] = [
        [24.4, 18.6, 12.0, 16.5, 8.2, 0.78],
        [26.2, 17.8, 15.6, 17.2, 8.4, 0.74],
        [22.4, 16.6, 10.4, 15.0, 7.4, 0.66],
        [23.8, 15.8, 14.4, 15.4, 7.6, 0.64],
        [20.2, 14.2, 9.4, 13.8, 6.8, 0.54],
        [21.6, 13.6, 13.6, 14.0, 6.9, 0.52],
        [18.2, 11.8, 11.8, 12.0, 5.8, 0.40],
        [19.2, 12.0, 8.2, 12.2, 5.9, 0.38],
      ];

      for (const [cx, cy, cz, sx, sy, op] of wispSpecs) {
        const mat = new THREE.SpriteMaterial({
          map: cloudTex,
          transparent: true,
          opacity: op,
          depthWrite: false,
        });
        const sp = new THREE.Sprite(mat);
        sp.position.set(cx, cy, cz);
        sp.scale.set(sx, sy, 1);
        sp.renderOrder = 24;
        cloudGroup.add(sp);
        cloudMaterials.push({ mat, baseOpacity: op });
      }
      scene.add(cloudGroup);

      // Fotograma 1 (oculto tras las nubes): Pre-compilar TODOS los shaders, texturas 4K, autos, villas y sombras
      // desactivando temporalmente el frustum culling para evitar cualquier micro-tirón a mitad del vuelo
      const savedCulling: { obj: THREE.Object3D; culled: boolean }[] = [];
      scene.traverse((obj) => {
        if (obj.frustumCulled) {
          savedCulling.push({ obj, culled: true });
          obj.frustumCulled = false;
        }
      });
      camera.position.set(1.5, 26.0, 22.0);
      camera.lookAt(1.5, 0.0, 0.0);
      camera.updateMatrixWorld();
      renderer.shadowMap.needsUpdate = true;
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
      for (let i = 0; i < savedCulling.length; i++) {
        savedCulling[i].obj.frustumCulled = savedCulling[i].culled;
      }

      // Fotograma 2 (GPU ya 100% caliente): Posicionar en el punto inicial de las nubes sobre el mar y abrir cortina
      raf2 = requestAnimationFrame(() => {
        if (hasTriggeredRevealRef.current) return;
        hasTriggeredRevealRef.current = true;

        posCurve.getPointAt(0, camera.position);
        targetCurve.getPointAt(0, controls.target);
        camera.lookAt(controls.target);
        renderer.render(scene, camera);

        introFlightRef.current = {
          active: true,
          elapsed: 0,
          skipFirstDelta: true,
          duration: 3.15,
          posCurve,
          targetCurve,
          cloudGroup,
          cloudMaterials,
          cloudTex,
        };
        sceneRefs.current.isFlying = false;
        setIsIntroFlying(true);
        setIsSceneReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [rawSceneReady, selectedLot, activePreset, unifiedLots]);

  return (
    <div className="relative w-full h-dvh bg-[#CBE7F5] text-[#EDE7E0] overflow-hidden select-none font-sans">
      <LoomMaquetaLoader
        progress={loaderProgress}
        isReady={isSceneReady}
        isEn={isEn}
      />

      <div
        ref={mountRef}
        onPointerDown={() => {
          if (mobileMenuOpen) setMobileMenuOpen(null);
        }}
        className="w-full h-full"
      />

      {hoveredLot && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed top-0 left-0 z-30 px-3 py-2 rounded-xl bg-[#0A0D0B]/95 border border-[#B35F27]/70 text-[#EDE7E0] shadow-2xl backdrop-blur-md flex items-center gap-2.5 will-change-transform"
          style={{
            transform: `translate3d(${Math.min(hoveredLot.x + 16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230)}px, ${Math.max(16, hoveredLot.y - 48)}px, 0)`,
          }}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              hoveredLot.lot.status === "available"
                ? "bg-emerald-400"
                : hoveredLot.lot.status === "blocked" || hoveredLot.lot.status === "reserved"
                ? "bg-amber-400"
                : "bg-red-400"
            }`}
          />
          <div>
            <div className="text-xs font-serif font-bold tracking-wider text-white">
              {hoveredLot.lot.status === "common"
                ? hoveredLot.lot.rawId
                : `${isEn ? "Lot" : "Lote"} ${hoveredLot.lot.rawId} • ${getStageDisplayName(hoveredLot.stageId, isEn)}`}
            </div>
            {hoveredLot.lot.status !== "common" && (
              <div className="text-[10px] font-mono text-[#EBD9AB]">
                {hoveredLot.lot.area} m² • {hoveredLot.lot.totalPrice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BARRA SUPERIOR MÓVIL (< lg): MENÚS DESPLEGABLES SIN OPCIONES OCULTAS */}
      {/* ==================================================================== */}
      <div className="lg:hidden absolute top-3 left-14 right-3 z-30 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center justify-between gap-1 bg-[#0b1210]/55 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto">
          <button
            onClick={onExit3D}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/12 active:bg-[#B35F27] border border-white/15 text-[#EDE7E0] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isEn ? "2D Plan" : "Plano 2D"}</span>
          </button>

          {/* Selector desplegable de Etapas */}
          <button
            onClick={() => setMobileMenuOpen((prev) => (prev === "stages" ? null : "stages"))}
            className="flex-1 flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl bg-[#B35F27]/85 border border-[#EBD9AB]/45 text-white text-[10px] font-extrabold uppercase tracking-wider truncate shadow-sm"
          >
            <span className="truncate">
              {focusMode === "all"
                ? isEn
                  ? "All (318)"
                  : "Todo (318)"
                : getStageDisplayName(stageId, isEn)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#EBD9AB] shrink-0 transition-transform duration-200 ${
                mobileMenuOpen === "stages" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú desplegable de Capas y Opciones */}
          <button
            onClick={() => setMobileMenuOpen((prev) => (prev === "options" ? null : "options"))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
              mobileMenuOpen === "options"
                ? "bg-white/25 border-[#EBD9AB]/60 text-white"
                : "bg-white/10 border-white/18 text-[#EDE7E0]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#EBD9AB]" />
            <span>{isEn ? "Options" : "Capas"}</span>
            <ChevronDown
              className={`w-3 h-3 text-[#EBD9AB] transition-transform duration-200 ${
                mobileMenuOpen === "options" ? "rotate-180" : ""
              }`}
            />
          </button>

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title={isEn ? "3D Satellite" : "Satélite 3D"}
              className="flex items-center justify-center p-1.5 rounded-xl bg-white/12 border border-white/18 text-[#EBD9AB] shrink-0"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desplegable de Etapas en Celular */}
        {mobileMenuOpen === "stages" && (
          <div className="bg-[#0b1210]/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl pointer-events-auto grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                handleFlyToStage("all");
                setMobileMenuOpen(null);
              }}
              className={`col-span-2 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-center border transition-all ${
                focusMode === "all"
                  ? "bg-[#B35F27] text-white border-[#EBD9AB]/50 shadow"
                  : "bg-white/8 text-[#EDE7E0]/85 border-white/10"
              }`}
            >
              {isEn ? "All Loom Masterplan (318 Lots)" : "Todo Loom • Masterplan (318 Lotes)"}
            </button>
            {["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"].map((st) => {
              const active = focusMode === "stage" && stageId === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    handleFlyToStage(st);
                    setMobileMenuOpen(null);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    active
                      ? "bg-[#B35F27] text-white border-[#EBD9AB]/50 shadow"
                      : "bg-white/8 text-[#EDE7E0]/85 border-white/10"
                  }`}
                >
                  {getStageDisplayName(st, isEn)}
                </button>
              );
            })}
          </div>
        )}

        {/* Desplegable de Capas / Herramientas en Celular (Auto-cierre al seleccionar) */}
        {mobileMenuOpen === "options" && (
          <div className="bg-[#0b1210]/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl pointer-events-auto flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#EBD9AB]">
                {isEn ? "Color Lots By" : "Colorear Lotes Por"}
              </div>
              <button
                onClick={() => setMobileMenuOpen(null)}
                aria-label={isEn ? "Close menu" : "Cerrar menú"}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-white/8 p-1 rounded-xl border border-white/10">
              {(
                [
                  { id: "status", es: "Estado", en: "Status" },
                  { id: "area", es: "Área m²", en: "Area" },
                  { id: "typology", es: "Tipología", en: "Type" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setColorMode(mode.id);
                    if (mode.id === "area") {
                      setIsAreaCardCollapsed(false);
                    } else {
                      setActiveAreaFilter("all");
                    }
                    setMobileMenuOpen(null);
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    colorMode === mode.id
                      ? "bg-[#B35F27] text-white shadow"
                      : "text-white/75"
                  }`}
                >
                  {isEn ? mode.en : mode.es}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setVillaMode((prev) =>
                    prev === "showcase" ? "all" : prev === "all" ? "off" : "showcase"
                  );
                  setMobileMenuOpen(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  villaMode !== "off"
                    ? "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
                    : "bg-white/8 border-white/15 text-white/75"
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {villaMode === "showcase"
                    ? isEn
                      ? "Villas: Sample"
                      : "Villas: Muestra"
                    : villaMode === "all"
                    ? isEn
                      ? "Villas: 318"
                      : "Villas: 318"
                    : isEn
                    ? "Lots Only"
                    : "Solo Lotes"}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsSunset(!isSunset);
                  setMobileMenuOpen(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  !isSunset
                    ? "bg-amber-500/25 border-amber-400/55 text-amber-100"
                    : "bg-sky-500/15 border-sky-400/35 text-sky-100"
                }`}
              >
                {!isSunset ? (
                  <Sunset className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                )}
                <span>{!isSunset ? (isEn ? "Sunset" : "Atardecer") : (isEn ? "Daylight" : "Día")}</span>
              </button>

              <button
                onClick={() => {
                  setShowTrees3D(!showTrees3D);
                  setMobileMenuOpen(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  showTrees3D
                    ? "bg-teal-500/20 border-teal-400/45 text-teal-200"
                    : "bg-white/8 border-white/15 text-white/70"
                }`}
              >
                <Trees className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? "3D Palms" : "Vegetación 3D"}</span>
              </button>

              <button
                onClick={() => {
                  setShowDronePins(!showDronePins);
                  setMobileMenuOpen(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  showDronePins
                    ? "bg-[#B35F27]/25 border-[#B35F27]/55 text-[#EBD9AB]"
                    : "bg-white/8 border-white/15 text-white/65"
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? "Real Views" : "Vistas Reales"}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(null);
                handleDownloadAvailabilityMap();
              }}
              disabled={isExportingMap}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/35 border border-emerald-300/50 text-emerald-50 text-[10px] font-bold uppercase tracking-wider shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>
                {isExportingMap
                  ? isEn
                    ? "Generating Map..."
                    : "Generando Mapa..."
                  : isEn
                  ? "Download Availability Map (WhatsApp)"
                  : "Descargar Mapa Disponibilidad (WA)"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* BARRA SUPERIOR DESKTOP (lg:flex): GLASSMORPHISM 1 SOLA FILA AJUSTADA */}
      {/* ==================================================================== */}
      <div className="hidden lg:flex absolute top-3 left-16 right-3 z-20 flex-wrap xl:flex-nowrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <button
            onClick={onExit3D}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/12 hover:bg-[#B35F27]/85 border border-white/15 text-[#EDE7E0] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isEn ? "2D Plan" : "Plano 2D"}</span>
          </button>

          <div className="h-4 w-[1px] bg-white/15 shrink-0" />

          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFlyToStage("all")}
              className={`px-2 py-1 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                focusMode === "all"
                  ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/40 shadow-sm"
                  : "text-[#EDE7E0]/80 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              {isEn ? "All (318)" : "Todo (318)"}
            </button>
            {["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"].map((st) => {
              const active = focusMode === "stage" && stageId === st;
              return (
                <button
                  key={st}
                  onClick={() => handleFlyToStage(st)}
                  className={`px-2 py-1 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/40 shadow-sm"
                      : "text-[#EDE7E0]/80 hover:bg-white/10 hover:text-white border border-transparent"
                  }`}
                >
                  {getStageDisplayName(st, isEn)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center flex-nowrap gap-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-white/8 rounded-xl p-0.5 border border-white/12 shrink-0">
            <span className="text-[8.5px] uppercase tracking-wider text-[#EBD9AB] font-mono font-bold px-1.5 hidden 2xl:inline">
              {isEn ? "Color:" : "Color:"}
            </span>
            {(
              [
                { id: "status", es: "Estado", en: "Status" },
                { id: "area", es: "Área", en: "Area" },
                { id: "typology", es: "Tipo", en: "Type" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setColorMode(mode.id);
                  if (mode.id === "area") {
                    setIsAreaCardCollapsed(false);
                  } else {
                    setActiveAreaFilter("all");
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  colorMode === mode.id
                    ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/35 shadow-sm"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {isEn ? mode.en : mode.es}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setVillaMode((prev) =>
                prev === "showcase" ? "all" : prev === "all" ? "off" : "showcase"
              )
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              villaMode !== "off"
                ? "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
                : "bg-white/8 border-white/15 text-white/75 hover:text-white"
            }`}
          >
            <Home className="w-3 h-3 shrink-0" />
            <span>
              {villaMode === "showcase"
                ? isEn
                  ? "Villas: Sample"
                  : "Villas: Muestra"
                : villaMode === "all"
                ? isEn
                  ? "Villas: 318"
                  : "Villas: 318"
                : isEn
                ? "Lots Only"
                : "Solo Lotes"}
            </span>
          </button>

          <button
            onClick={() => setShowTrees3D(!showTrees3D)}
            title={isEn ? "Toggle 3D Vegetation" : "Mostrar/Ocultar Vegetación 3D"}
            className={`flex items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              showTrees3D
                ? "bg-teal-500/20 border-teal-400/45 text-teal-200"
                : "bg-white/8 border-white/15 text-white/70 hover:text-white"
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsSunset(!isSunset)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              !isSunset
                ? "bg-amber-500/25 border-amber-400/55 text-amber-100 hover:bg-amber-500/35"
                : "bg-sky-500/15 border-sky-400/35 text-sky-100 hover:bg-sky-500/25"
            }`}
          >
            {!isSunset ? (
              <Sunset className="w-3 h-3 text-amber-300 shrink-0" />
            ) : (
              <Sun className="w-3 h-3 text-sky-300 shrink-0" />
            )}
            <span>{!isSunset ? (isEn ? "Sunset" : "Atardecer") : (isEn ? "Day" : "Día")}</span>
          </button>

          <button
            onClick={() => setShowDronePins(!showDronePins)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              showDronePins
                ? "bg-[#B35F27]/25 border-[#B35F27]/55 text-[#EBD9AB]"
                : "bg-white/8 border-white/15 text-white/65"
            }`}
          >
            <Camera className="w-3 h-3 shrink-0" />
            <span>{isEn ? "Views" : "Vistas"}</span>
          </button>

          <button
            onClick={handleDownloadAvailabilityMap}
            disabled={isExportingMap}
            title={
              isEn
                ? "Download lightweight HD Availability Map for WhatsApp / CRM"
                : "Descargar Mapa de Disponibilidad oficial para WhatsApp / CRM"
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/45 border border-emerald-300/45 text-emerald-50 text-[9.5px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3 h-3 text-emerald-200 shrink-0" />
            <span>
              {isExportingMap
                ? isEn
                  ? "Exporting..."
                  : "Generando..."
                : isEn
                ? "Download Map"
                : "Descargar Plano"}
            </span>
          </button>

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title={isEn ? "Open 3D Satellite Location" : "Abrir Ubicación Satelital 3D"}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-[#B35F27]/80 border border-white/18 text-white text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              <span className="hidden 2xl:inline">{isEn ? "Satellite" : "Satélite"}</span>
            </button>
          )}
        </div>
      </div>

      {colorMode === "area" && (
        <div className="absolute top-16 lg:top-20 left-3 z-20 pointer-events-auto">
          {isAreaCardCollapsed && activeAreaFilter !== "all" ? (
            /* Píldora compacta cuando ya se eligió un rango para no tapar las villas */
            (() => {
              const currentTier = AREA_TIERS.find((t) => t.key === activeAreaFilter);
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0b1210]/65 backdrop-blur-2xl border border-white/25 shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentTier?.fillHex || "#10b981" }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                    {currentTier ? (isEn ? currentTier.labelEn : currentTier.labelEs) : ""}
                  </span>
                  <button
                    onClick={() => setIsAreaCardCollapsed(false)}
                    className="px-2 py-0.5 rounded-lg bg-white/12 hover:bg-white/20 text-[9px] font-bold uppercase tracking-wider text-[#EBD9AB] cursor-pointer"
                  >
                    {isEn ? "Change" : "Cambiar"}
                  </button>
                  <button
                    onClick={() => {
                      setActiveAreaFilter("all");
                      setColorMode("status");
                      setIsAreaCardCollapsed(false);
                    }}
                    title={isEn ? "Remove area filter" : "Quitar filtro de área"}
                    aria-label={isEn ? "Remove area filter" : "Quitar filtro de área"}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#B35F27] flex items-center justify-center text-white/85 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()
          ) : (
            /* Tarjeta Glassmorphism de selección de rango con botón X para cerrarla */
            <div className="bg-[#0b1210]/65 border border-white/22 rounded-2xl p-3 shadow-[0_12px_36px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl max-w-xs">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#EBD9AB] font-bold">
                  {isEn ? "Filter by Lot Area" : "Filtrar por Rango de Área"}
                </span>
                <div className="flex items-center gap-1.5">
                  {activeAreaFilter !== "all" && (
                    <button
                      onClick={() => setActiveAreaFilter("all")}
                      className="text-[9px] text-[#EBD9AB] hover:underline font-bold uppercase cursor-pointer"
                    >
                      {isEn ? "All" : "Todos"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveAreaFilter("all");
                      setColorMode("status");
                      setIsAreaCardCollapsed(false);
                    }}
                    title={isEn ? "Close area filter" : "Cerrar filtro de área"}
                    aria-label={isEn ? "Close area filter" : "Cerrar filtro de área"}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#B35F27] flex items-center justify-center text-white/85 hover:text-white border border-white/15 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {AREA_TIERS.map((tier) => {
                  const isSelectedTier = activeAreaFilter === tier.key;
                  return (
                    <button
                      key={tier.key}
                      onClick={() => {
                        if (isSelectedTier) {
                          setActiveAreaFilter("all");
                          setIsAreaCardCollapsed(false);
                        } else {
                          setActiveAreaFilter(tier.key);
                          setIsAreaCardCollapsed(true);
                        }
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelectedTier
                          ? "bg-white/20 border-white text-white shadow-md"
                          : "bg-white/8 border-white/12 text-white/80 hover:bg-white/15"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tier.fillHex }}
                      />
                      <span className="text-[10px] font-bold truncate">
                        {isEn ? tier.labelEn : tier.labelEs}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COLUMNA INFERIOR IZQUIERDA: ATRIBUCIÓN OFICIAL + ROSA DE LOS VIENTOS A001 + RADAR MASTERPLAN 3D */}
      <div className="absolute bottom-16 left-3 sm:left-4 z-30 flex flex-col gap-2 w-auto md:w-52 pointer-events-none">
        {assignedAdvisor && onOpenContact && (
          <button
            type="button"
            onClick={onOpenContact}
            title={
              isInstitutionalAdvisor(assignedAdvisor)
                ? isEn
                  ? `Go to ${assignedAdvisor.name} registration form`
                  : `Ir al formulario de ${assignedAdvisor.name}`
                : isEn
                ? `Contact your advisor ${assignedAdvisor.name} via WhatsApp`
                : `Contactar a tu asesor ${assignedAdvisor.name} por WhatsApp`
            }
            className="flex items-center justify-between gap-2 bg-[#EDE7E0]/95 hover:bg-white text-[#0A0D0B] border border-[#B35F27]/45 rounded-2xl px-3 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl pointer-events-auto w-fit md:w-full transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider truncate">
                <span className="text-[#0A0D0B]/70">{getAdvisorRolePrefix(assignedAdvisor, isEn)} </span>
                <strong className="text-[#B35F27]">{getAdvisorDisplayLabel(assignedAdvisor)}</strong>
              </span>
            </div>
            {isInstitutionalAdvisor(assignedAdvisor) ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#B35F27] shrink-0" />
            ) : (
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
            )}
          </button>
        )}

        {/* BRÚJULA ARQUITECTÓNICA A001 EN VIVO (SINCRONIZADA A 60 FPS CON LA CÁMARA 3D Y EL SOL) */}
        <div className="flex items-center gap-2.5 bg-[#0b1210]/55 backdrop-blur-2xl border border-white/20 rounded-2xl p-1.5 pr-3 shadow-[0_12px_36px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto w-fit md:w-full">
          <button
            type="button"
            onClick={() => {
              // Alinear cámara mirando hacia el Norte Real del Plano A001
              const tgt = sceneRefs.current.controls?.target;
              const tx = tgt ? tgt.x : 0;
              const tz = tgt ? tgt.z : 0;
              const dist = 12.5;
              cancelAndDisposeIntroFlight();
              sceneRefs.current.desiredTarget.set(tx, 0, tz);
              sceneRefs.current.desiredPos.set(
                tx - LOOM_DIR_NORTH.x * dist,
                6.8,
                tz - LOOM_DIR_NORTH.z * dist
              );
              sceneRefs.current.isFlying = true;
            }}
            title={
              isEn
                ? "Official A001 Compass Rose — Click to face True North"
                : "Rosa de los Vientos Oficial Plano A001 — Clic para orientar al Norte"
            }
            className="relative w-11 h-11 shrink-0 rounded-full bg-[#070b09]/85 border border-[#B35F27]/60 hover:border-[#EBD9AB] transition-colors flex items-center justify-center cursor-pointer shadow-inner"
          >
            <svg viewBox="0 0 56 56" className="w-10 h-10 overflow-visible">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(235,217,171,0.22)" strokeWidth="1" />
              <circle cx="28" cy="28" r="20.5" fill="none" stroke="rgba(235,217,171,0.12)" strokeWidth="0.75" strokeDasharray="2 2" />
              <g ref={compassDialRef} transform="rotate(118.4 28 28)">
                {/* Agujas secundarias NE / SE / SO / NO */}
                <line x1="17" y1="17" x2="39" y2="39" stroke="rgba(235,217,171,0.28)" strokeWidth="1" />
                <line x1="39" y1="17" x2="17" y2="39" stroke="rgba(235,217,171,0.28)" strokeWidth="1" />
                {/* Eje Este (Amanecer) — Oeste (Atardecer sobre el Mar Caribe) */}
                <polygon points="46,28 31,25.5 28,28 31,30.5" fill="#fde047" fillOpacity="0.85" />
                <polygon points="10,28 25,25.5 28,28 25,30.5" fill="#fb923c" fillOpacity="0.9" />
                {/* Aguja Sur */}
                <polygon points="28,46 25.2,31 28,28 30.8,31" fill="rgba(237,231,224,0.38)" />
                {/* Aguja Principal NORTE (estilo Plano A001 en Cobre & Marfil) */}
                <polygon points="28,7 24.4,28 28,25.5" fill="#EBD9AB" />
                <polygon points="28,7 31.6,28 28,25.5" fill="#B35F27" />
                <circle cx="28" cy="28" r="2.2" fill="#0b1210" stroke="#EBD9AB" strokeWidth="1" />
                {/* Letras Cardinales solidarias a la Rosa A001 */}
                <text x="28" y="5.2" textAnchor="middle" fill="#EBD9AB" fontSize="6.8" fontWeight="800" fontFamily="monospace">
                  N
                </text>
                <text x="50.2" y="30" textAnchor="middle" fill="#fde047" fontSize="5.6" fontWeight="700" fontFamily="monospace">
                  E
                </text>
                <text x="5.8" y="30" textAnchor="middle" fill="#fb923c" fontSize="5.6" fontWeight="700" fontFamily="monospace">
                  {isEn ? "W" : "O"}
                </text>
              </g>
            </svg>
          </button>

          <div className="hidden md:flex flex-col min-w-0 leading-tight">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#EBD9AB] font-bold">
                {isEn ? "Compass A001" : "Brújula A001"}
              </span>
              <span ref={compassHeadingLabelRef} className="text-[8.5px] font-mono text-white/90 font-semibold tabular-nums">
                332° NNO
              </span>
            </div>
            <span className="text-[8px] text-white/70 truncate mt-0.5">
              {isSunset
                ? isEn
                  ? "Sunset: West (Caribbean Sea)"
                  : "Ocaso: Oeste (Mar Caribe)"
                : isEn
                ? "Day Sun: East → West (Sea)"
                : "Sol: Este → Oeste (Mar)"}
            </span>
          </div>
        </div>

        {/* MINI-MAPA RADAR EQUILIBRADO Y SINCRONIZADO EN TIEMPO REAL (60 FPS) */}
        <div className="hidden md:flex flex-col bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-[0_12px_36px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] w-full pointer-events-auto">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#EBD9AB]" />
            <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#EDE7E0]/90 font-bold">
              {isEn ? "Masterplan Radar" : "Radar Masterplan 3D"}
            </span>
          </div>
          <span ref={radarYawLabelRef} className="text-[8.5px] font-mono text-[#EBD9AB] tabular-nums">
            332° NNO
          </span>
        </div>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const u = (e.clientX - rect.left) / rect.width;
            const v = (e.clientY - rect.top) / rect.height;
            const wx = (u - 0.5) * WORLD_W;
            const wz = (v - 0.5) * WORLD_D;
            cancelAndDisposeIntroFlight();
            sceneRefs.current.desiredTarget.set(wx, 0, wz);
            sceneRefs.current.desiredPos.set(wx - 2.5, 7.5, wz + 9.2);
            sceneRefs.current.isFlying = true;
          }}
          title={isEn ? "Click anywhere on radar to fly camera" : "Haz clic en cualquier punto del radar para volar ahí"}
          className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/15 bg-[#051415] cursor-crosshair"
        >
          <img
            src="/loom/loom_masterplan_bg.webp?v=8"
            alt="Masterplan Radar"
            className="w-full h-full object-fill opacity-85"
          />
          <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <radialGradient id="radarConeGrad" cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#B35F27" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#EBD9AB" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#EBD9AB" stopOpacity="0.0" />
              </radialGradient>
            </defs>
            {/* Contorno sutil del polígono de Loom para referencia visual equilibrada */}
            <polygon
              points="7,42 118,30 129,56 12,62"
              fill="rgba(235, 217, 171, 0.05)"
              stroke="rgba(235, 217, 171, 0.45)"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
            />
            <g ref={radarMarkerRef} transform="translate(112, 42) rotate(25)">
              <path
                d="M 0 0 L -13 -22 A 25 25 0 0 1 13 -22 Z"
                fill="url(#radarConeGrad)"
                stroke="#EBD9AB"
                strokeWidth="0.9"
                strokeOpacity="0.8"
              />
              <circle cx="0" cy="0" r="6" fill="none" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1" />
              <circle cx="0" cy="0" r="3.2" fill="#10b981" stroke="#ffffff" strokeWidth="1.4" />
            </g>
          </svg>
        </div>
        <div className="mt-1 flex items-center justify-between text-[8.5px] text-white/65 px-1">
          <span>{isEn ? "Left click: Orbit" : "Clic izq: Orbitar 360°"}</span>
          <span>{isEn ? "Scroll: Zoom" : "Scroll: Zoom"}</span>
        </div>
        </div>
      </div>

      {/* BARRA INFERIOR GLASSMORPHISM CON FLECHAS INDICADORAS EN CELULAR */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] max-w-[96vw] pointer-events-auto">
        {/* Flecha izquierda en pantallas pequeñas para indicar más opciones */}
        <button
          onClick={() => bottomBarScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
          aria-label="Anterior"
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-xl bg-white/10 active:bg-[#B35F27] border border-white/15 text-[#EBD9AB] shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={bottomBarScrollRef}
          className="flex items-center flex-nowrap gap-1 overflow-x-auto no-scrollbar"
        >
          {CAMERA_PRESETS.map((preset) => {
            const isCurrent = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset);
                  setMobileMenuOpen(null);
                  if (preset.id === "general" || preset.id === "planta") {
                    setFocusMode("all");
                  }
                  if (preset.renderPreview && showDronePins) {
                    setDroneRenderModal(preset.renderPreview);
                  } else {
                    setDroneRenderModal(null);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? "bg-[#B35F27]/85 backdrop-blur-md text-white border border-[#EBD9AB]/45 shadow-[0_4px_14px_rgba(179,95,39,0.4)]"
                    : "text-[#EDE7E0]/85 hover:bg-white/12 hover:text-white border border-transparent"
                }`}
              >
                {preset.renderPreview ? (
                  <Camera className="w-3 h-3 text-[#EBD9AB] shrink-0" />
                ) : (
                  <Box className="w-3 h-3 text-[#EBD9AB] shrink-0" />
                )}
                <span>{isEn ? preset.labelEn : preset.labelEs}</span>
              </button>
            );
          })}
        </div>

        {/* Flecha derecha en pantallas pequeñas para indicar que hay más cámaras */}
        <button
          onClick={() => bottomBarScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
          aria-label="Siguiente"
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-xl bg-[#B35F27]/45 active:bg-[#B35F27] border border-[#EBD9AB]/40 text-[#EBD9AB] shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {droneRenderModal && (
        <div className="absolute top-16 lg:top-20 right-3 sm:right-4 z-20 w-80 sm:w-96 bg-[#0b1210]/65 border border-white/25 rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl pointer-events-auto">
          <div className="relative aspect-[16/10] w-full bg-black">
            <img
              src={droneRenderModal.src}
              alt={isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0b1210]/75 backdrop-blur-md border border-[#EBD9AB]/40 text-[9px] font-mono font-bold uppercase tracking-wider text-[#EBD9AB]">
              {isEn ? droneRenderModal.badgeEn : droneRenderModal.badgeEs}
            </div>
            <button
              onClick={() => setDroneRenderModal(null)}
              title={isEn ? "Close preview" : "Cerrar imagen"}
              aria-label={isEn ? "Close preview" : "Cerrar imagen"}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/75 hover:bg-[#B35F27] text-white flex items-center justify-center border border-white/25 backdrop-blur-md shadow-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-serif font-bold text-white">
                {isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              </h4>
              <p className="text-[10px] text-[#EDE7E0]/75 mt-0.5">
                {isEn
                  ? "Camera synchronized with the 3D Interactive Maqueta"
                  : "Ángulo sincronizado con la cámara de la Maqueta 3D"}
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-[#EBD9AB] shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
