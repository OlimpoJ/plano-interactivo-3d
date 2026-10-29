import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata = {
  title: "LOOM Luxury Residence — 3D Interactive Maqueta & Showroom",
  description:
    "Explore the 3D Interactive Maqueta of LOOM Luxury Residence at Alma Beach, Cartagena: lots, 3D bioclimatic villas, Central Lake, and Alma Beach Club.",
};

export default function Loom3DMaquetaEnglishPage() {
  return <LoomShowroomApp defaultLang="en" enable3DMaqueta={true} />;
}
