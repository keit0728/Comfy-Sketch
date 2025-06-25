"use client";

import { useEffect } from "react";

export function DisableBrowserZoom() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Disable browser zoom when Ctrl/Cmd is pressed with wheel
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    // Add listener with passive: false to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}