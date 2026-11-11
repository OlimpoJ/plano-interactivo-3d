"use client";

import { useEffect, useState } from "react";
import {
  initReferralTracking,
  getActiveAdvisor,
  type Advisor,
} from "@/lib/referralTracking";

export interface AdvisorAttributionState {
  assignedAdvisor: Advisor | null;
  referrer: string | null;
  isPatrimofy: boolean;
}

/**
 * Hook compartido de atribución comercial para Loom y Luwana.
 * Resuelve asesor asignado (?asesor=, cookie/localStorage), agencia referidora y dominio Patrimofy.
 */
export function useAdvisorAttribution(
  storageKey: "loom_ref" | "luwana_ref" = "loom_ref"
): AdvisorAttributionState {
  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [isPatrimofy, setIsPatrimofy] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const adv = initReferralTracking();
    if (adv) {
      const agencyLower = adv.agency.toLowerCase();
      setAssignedAdvisor(adv);
      setReferrer(agencyLower);
      if (agencyLower === "patrimofy") setIsPatrimofy(true);
      return;
    }

    const active = getActiveAdvisor();
    if (active) {
      const agencyLower = active.agency.toLowerCase();
      setAssignedAdvisor(active);
      setReferrer(agencyLower);
      if (agencyLower === "patrimofy") setIsPatrimofy(true);
      return;
    }

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        setReferrer(stored);
        if (stored.toLowerCase() === "patrimofy") setIsPatrimofy(true);
        return;
      }

      if (window.location.hostname.includes("patrimofy.com")) {
        sessionStorage.setItem(storageKey, "patrimofy");
        setReferrer("patrimofy");
        setIsPatrimofy(true);
      }
    } catch {
      if (window.location.hostname.includes("patrimofy.com")) {
        setReferrer("patrimofy");
        setIsPatrimofy(true);
      }
    }
  }, [storageKey]);

  return { assignedAdvisor, referrer, isPatrimofy };
}

