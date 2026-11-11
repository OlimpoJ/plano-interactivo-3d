/**
 * Orientación Geodésica y Solar Oficial — LOOM Luxury Residence
 * Fuente arquitectónica canónica: Plano General "LOOM Luxury Residences 23 oct -2026-A001.pdf"
 * (Maadga Group / Arq. Gary Ardila — Escala 1:1500, Coordenadas 10.635894° N, -75.418304° W).
 *
 * Correspondencia de ejes entre el Plano A001 (vertical) y la Maqueta 3D / Masterplan 16:9:
 * - +X (derecha en Masterplan / Maqueta 3D) = Hacia Playa Alma / Mar Caribe (Arriba en A001).
 * - -X (izquierda en Masterplan / Maqueta 3D) = Hacia Portería / Carretera Vía al Mar (Abajo en A001, "ESTE/FONDO").
 * - +Z (abajo en Masterplan / Maqueta 3D) = Hacia Lago Central y Servidumbre (Derecha en A001).
 * - -Z (arriba en Masterplan / Maqueta 3D) = Hacia Bulevar Principal y Club House (Izquierda en A001).
 *
 * En la brújula oficial del Plano A001, la aguja del Norte (N) apunta 28.38° en sentido horario
 * respecto al eje hacia la Playa (+X). Por tanto, en el plano horizontal 3D (wx, wz):
 *   Azimut 0°   (Norte N) = +28.38°  -> (+0.880, +0.475)
 *   Azimut 90°  (Este  E) = +118.38° -> (-0.475, +0.880)  [Salida del Sol / Mañana — lado Carretera/Fondo]
 *   Azimut 180° (Sur   S) = +208.38° -> (-0.880, -0.475)
 *   Azimut 270° (Oeste O) = +298.38° -> (+0.475, -0.880)  [Puesta del Sol / Atardecer — sobre el Mar Caribe]
 */

export const LOOM_NORTH_MAP_ANGLE_DEG = 28.38;
export const LOOM_NORTH_MAP_ANGLE_RAD = (LOOM_NORTH_MAP_ANGLE_DEG * Math.PI) / 180;

export interface Vec2XZ {
  x: number;
  z: number;
}

/**
 * Convierte un azimut geográfico real (0°=N, 90°=E, 180°=S, 270°=O/W, sentido horario)
 * en un vector unitario sobre el plano terrestre (wx, wz) de Three.js.
 */
export function azimuthToWorld2D(azimuthDeg: number): Vec2XZ {
  const rad = ((LOOM_NORTH_MAP_ANGLE_DEG + azimuthDeg) * Math.PI) / 180;
  return {
    x: Math.cos(rad),
    z: Math.sin(rad),
  };
}

export const LOOM_DIR_NORTH: Vec2XZ = azimuthToWorld2D(0);
export const LOOM_DIR_EAST: Vec2XZ = azimuthToWorld2D(90);
export const LOOM_DIR_SOUTH: Vec2XZ = azimuthToWorld2D(180);
export const LOOM_DIR_WEST: Vec2XZ = azimuthToWorld2D(270);

/**
 * Brisa Marina / Vientos Alisios del Caribe (entran desde el Mar Caribe NNO/N ~352° hacia tierra adentro SSO ~172°)
 */
export const LOOM_DIR_BREEZE_FROM: Vec2XZ = azimuthToWorld2D(352);
export const LOOM_DIR_BREEZE_TO: Vec2XZ = {
  x: -LOOM_DIR_BREEZE_FROM.x,
  z: -LOOM_DIR_BREEZE_FROM.z,
};

/**
 * Posición normalizada sobre el arco solar Este (0.0) -> Mediodía (0.5) -> Oeste (1.0):
 * - day (0.30): Sol caribeño de mañana/día (~10:00 AM, Este-Sureste, sombras nítidas).
 * - sunset (0.82): Golden Hour de atardecer (~5:15 PM, Oeste sobre el Mar Caribe / Sunset Dining).
 */
export const LOOM_SUN_PROGRESS = {
  day: 0.30,
  sunset: 0.82,
} as const;

/**
 * Evalúa el desplazamiento 3D (dx, dy, dz) de un punto sobre la trayectoria solar real de Cartagena (10.64° N)
 * según la brújula del Plano A001: nace en el Este (u=0), culmina con ligera inclinación tropical al Sur (u=0.5)
 * y se oculta en el Oeste sobre el Mar Caribe (u=1).
 */
export function sampleLoomSolarArcOffset(
  u: number,
  radius: number
): { dx: number; dy: number; dz: number } {
  const theta = Math.max(0, Math.min(1, u)) * Math.PI;
  const cosT = Math.cos(theta); // +1 en Este (amanecer) -> -1 en Oeste (atardecer)
  const sinT = Math.sin(theta); // 0 en horizonte -> 1 en cenit solar

  // En Cartagena (10.64° N, referencia oct-feb del plano A001), el arco solar se inclina ligeramente hacia el Sur
  const southLean = 0.24 * sinT;

  const dx = (LOOM_DIR_EAST.x * cosT + LOOM_DIR_SOUTH.x * southLean) * radius;
  const dy = sinT * (radius * 0.88);
  const dz = (LOOM_DIR_EAST.z * cosT + LOOM_DIR_SOUTH.z * southLean) * radius;

  return { dx, dy, dz };
}

/**
 * Devuelve la posición 3D de la luz direccional global del sol (DirectionalLight y uSunDir de cielo/agua)
 * sincronizada exactamente con el mismo azimut del arco solar 3D de los lotes.
 */
export function getLoomSceneSunPosition(
  isSunset: boolean,
  distance: number = 38
): [number, number, number] {
  const u = isSunset ? LOOM_SUN_PROGRESS.sunset : LOOM_SUN_PROGRESS.day;
  const { dx, dy, dz } = sampleLoomSolarArcOffset(u, distance);
  // En atardecer bajamos ligeramente la elevación para acentuar el reflejo dorado rasante sobre el Mar Caribe
  const adjustedY = isSunset ? dy * 0.76 : dy;
  return [dx, adjustedY, dz];
}

const CARDINALS_ES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
const CARDINALS_EN = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/**
 * A partir del vector horizontal de mirada de la cámara 3D (target - camera),
 * calcula el ángulo de rotación en pantalla para la Rosa de los Vientos en vivo
 * y el rumbo geográfico real (0°=Norte A001, 90°=Este, 180°=Sur, 270°=Oeste).
 */
export function cameraLookToCompassReading(
  lookDx: number,
  lookDz: number
): {
  dialNorthDeg: number;
  trueBearingDeg: number;
  cardinalEs: string;
  cardinalEn: string;
} {
  const len = Math.hypot(lookDx, lookDz) || 1;
  const fx = lookDx / len;
  const fz = lookDz / len;

  // En Three.js (Y arriba), si forward = (fx, 0, fz), el vector derecha de pantalla es (-fz, 0, fx)
  const nScreenRight = LOOM_DIR_NORTH.x * -fz + LOOM_DIR_NORTH.z * fx;
  const nScreenUp = LOOM_DIR_NORTH.x * fx + LOOM_DIR_NORTH.z * fz;

  // Ángulo horario en pantalla (0° = arriba 12 en punto) hacia donde apunta el Norte real
  const dialNorthDeg = (Math.atan2(nScreenRight, nScreenUp) * 180) / Math.PI;

  // Rumbo geográfico hacia donde mira la cámara: si Norte está a dialNorthDeg, el frente (0°) es -dialNorthDeg
  const trueBearingDeg = (((Math.round(-dialNorthDeg) % 360) + 360) % 360);
  const sectorIdx = Math.round(trueBearingDeg / 45) % 8;

  return {
    dialNorthDeg,
    trueBearingDeg,
    cardinalEs: CARDINALS_ES[sectorIdx],
    cardinalEn: CARDINALS_EN[sectorIdx],
  };
}
