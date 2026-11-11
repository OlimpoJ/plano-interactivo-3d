/**
 * Tipos compartidos de lotes para Loom Luxury Residence y Luwana Alma Beach.
 * Centraliza las interfaces de lotes e inventario para todos los visores 2D, 3D y paneles.
 */

export interface LoomLot {
  id: string;
  rawId: string;
  area: string;
  location: string;
  status: string;
  statusRaw: string;
  totalPrice: string;
  downPayment: string;
  financing: string;
  finalPayment: string;
  pricePerM2?: string;
  separation?: string;
}

export type Lot = LoomLot;

export interface MaquetaLot extends LoomLot {
  areaNumeric: number | null;
}

export interface StageLotData {
  id: string;
  rawId: string;
  area: string;
  location?: string;
  status: "available" | "reserved" | "sold" | "blocked" | "common";
  statusRaw?: string;
  pricePerM2?: string;
  totalPrice?: string;
  separation?: string;
  downPayment?: string;
  financing?: string;
  finalPayment?: string;
}

