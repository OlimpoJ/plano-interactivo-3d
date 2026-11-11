import * as THREE from "three";
import { svgToWorld } from "./presets";
import type { VillaReplicaMaterials } from "./villaBuilder";

export interface RoadRouteSpec {
  svgPoints: [number, number][];
  modelIdx: number;
  paintIdx: number;
  speed: number;
  phase: number;
}

export interface AnimatedTrafficItem {
  carObj: THREE.Object3D;
  shadowObj: THREE.Object3D;
  waypoints: [number, number][];
  segLengths: number[];
  totalLength: number;
  speed: number;
  phaseOffset: number;
}

export const LOOM_ROAD_ROUTES_SPECS: RoadRouteSpec[] = [
  // Circuito 1: Portería <-> Bulevar Principal Norte <-> Avenida Etapa 1/2 (Calle S3)
  {
    svgPoints: [
      [118, 1088], [218, 1074], [302, 892], [345, 884],
      [522.5, 878.9], [914.8, 1332], [925.6, 1339], [932.0, 1342],
      [933.2, 1339], [931.8, 1332], [531.3, 869.4], [338, 876],
      [292, 886], [208, 1064], [116, 1076], [104, 1082],
    ],
    modelIdx: 0,
    paintIdx: 0,
    speed: 0.34,
    phase: 0.5,
  },
  // Circuito 2: Etapa 2 / Etapa 3 (Calle S5 <-> Bulevar Principal <-> Calle S6)
  {
    svgPoints: [
      [1004.0, 851.0], [1238.2, 837.4], [1665.7, 1332], [1676.5, 1339],
      [1682.9, 1342], [1684.1, 1339], [1682.7, 1332], [1246.9, 827.9],
      [1012.9, 841.5], [1433.4, 1332], [1434.7, 1339], [1433.4, 1342],
      [1427.0, 1339], [1416.4, 1332],
    ],
    modelIdx: 1,
    paintIdx: 3,
    speed: 0.35,
    phase: 2.1,
  },
  // Circuito 3: Avenida Club House & Oasis <-> Bulevar Principal <-> Etapa 4
  {
    svgPoints: [
      [1475.1, 823.7], [1953.9, 795.9], [2357.2, 1260], [2367.9, 1267],
      [2374.3, 1270], [2375.6, 1267], [2374.2, 1260], [1962.7, 786.4],
      [1483.9, 814.2], [1932.3, 1332], [1933.7, 1339], [1932.5, 1342],
      [1926.0, 1339], [1915.3, 1332],
    ],
    modelIdx: 2,
    paintIdx: 1,
    speed: 0.36,
    phase: 3.4,
  },
  // Circuito 4: Etapa 5 & Lago Central <-> Gran Bulevar Principal Norte
  {
    svgPoints: [
      [2467.6, 766.1], [2658.6, 755.0], [2720.9, 1035], [2726.0, 1042],
      [2729.6, 1045], [2731.8, 1042], [2733.9, 1035], [2669.4, 745.4],
      [2478.4, 756.5], [2585.5, 1230], [2583.5, 1237], [2581.2, 1240],
      [2577.6, 1237], [2572.5, 1230],
    ],
    modelIdx: 3,
    paintIdx: 5,
    speed: 0.30,
    phase: 0.9,
  },
];

export function smoothClosedSvgLoop(
  controlPts: [number, number][],
  iterations: number = 2
): [number, number][] {
  let pts = controlPts.slice();
  for (let iter = 0; iter < iterations; iter++) {
    const nextPts: [number, number][] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      const segDist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const cut = Math.min(0.22, 14.0 / Math.max(1.0, segDist));
      nextPts.push([p0[0] + (p1[0] - p0[0]) * cut, p0[1] + (p1[1] - p0[1]) * cut]);
      nextPts.push([p0[0] + (p1[0] - p0[0]) * (1 - cut), p0[1] + (p1[1] - p0[1]) * (1 - cut)]);
    }
    pts = nextPts;
  }
  if (pts.length > 0) {
    pts.push([pts[0][0], pts[0][1]]);
  }
  return pts;
}

export function sampleTrafficLoopPoint(
  item: { waypoints: [number, number][]; segLengths: number[]; totalLength: number },
  rawDist: number
): [number, number] {
  const d = ((rawDist % item.totalLength) + item.totalLength) % item.totalLength;
  let acc = 0;
  let segIdx = 0;
  for (let s = 0; s < item.segLengths.length; s++) {
    if (d <= acc + item.segLengths[s] || s === item.segLengths.length - 1) {
      segIdx = s;
      break;
    }
    acc += item.segLengths[s];
  }
  const segLen = Math.max(0.0001, item.segLengths[segIdx]);
  const t = Math.max(0, Math.min(1, (d - acc) / segLen));
  const [x0, z0] = item.waypoints[segIdx];
  const [x1, z1] = item.waypoints[segIdx + 1];
  return [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t];
}

export function buildAnimatedTrafficCars(
  carTemplates: THREE.Group[],
  villaMats: VillaReplicaMaterials,
  unitBox: THREE.BoxGeometry,
  villasGroup: THREE.Group
): AnimatedTrafficItem[] {
  const items: AnimatedTrafficItem[] = [];
  if (carTemplates.length === 0) return items;

  LOOM_ROAD_ROUTES_SPECS.forEach((rc) => {
    const closedSvgPts = smoothClosedSvgLoop(rc.svgPoints, 2);
    const waypoints = closedSvgPts.map(([sx, sy]) => svgToWorld(sx, sy));
    const segLengths: number[] = [];
    let totalLength = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = Math.hypot(
        waypoints[i + 1][0] - waypoints[i][0],
        waypoints[i + 1][1] - waypoints[i][1]
      );
      segLengths.push(d);
      totalLength += d;
    }

    const tpl = carTemplates[rc.modelIdx % carTemplates.length];
    const paintMat = villaMats.carPaintPalette[rc.paintIdx % villaMats.carPaintPalette.length];
    const roadCar = tpl.clone(true);
    roadCar.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const m = node as THREE.Mesh;
        m.castShadow = false;
        m.receiveShadow = false;
        if (((m.material as THREE.Material)?.name || "") === "BodyPaint") {
          m.material = paintMat;
        }
      }
    });
    const roadCarScale = 0.0315;
    const [rx0, rz0] = waypoints[0];
    roadCar.scale.set(roadCarScale, roadCarScale, roadCarScale);
    roadCar.position.set(rx0, 0.005, rz0);
    roadCar.matrixAutoUpdate = false;
    roadCar.updateMatrix();
    villasGroup.add(roadCar);

    const shadowMesh = new THREE.Mesh(unitBox, villaMats.darkBronzeMat);
    shadowMesh.scale.set(0.105, 0.002, 0.044);
    shadowMesh.position.set(rx0, 0.004, rz0);
    shadowMesh.matrixAutoUpdate = false;
    shadowMesh.updateMatrix();
    villasGroup.add(shadowMesh);

    items.push({
      carObj: roadCar,
      shadowObj: shadowMesh,
      waypoints,
      segLengths,
      totalLength,
      speed: rc.speed,
      phaseOffset: rc.phase,
    });
  });

  return items;
}

