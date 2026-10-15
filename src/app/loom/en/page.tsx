import { LoomShowroomApp } from "@/app/loom/page";

export const metadata = {
  title: "LOOM Luxury Residence — Interactive 3D Masterplan & Showroom",
  description: "Explore the 318 luxury residential lots, stages, 360° virtual tours, and interest-free financing simulator for LOOM Luxury Residence in Cartagena.",
};

export default function LoomSubEnPage() {
  return <LoomShowroomApp defaultLang="en" />;
}
