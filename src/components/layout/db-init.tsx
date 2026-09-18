"use client";

import { useEffect } from "react";
import { seedInspirationGallery } from "@/lib/seed";

export function DbInit() {
  useEffect(() => {
    seedInspirationGallery().catch((err) =>
      console.error("[db-init] failed to seed inspiration gallery:", err)
    );
  }, []);

  return null;
}
