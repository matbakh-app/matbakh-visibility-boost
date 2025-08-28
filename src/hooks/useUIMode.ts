import { useState, useEffect } from "react";

type UIMode = "standard" | "invisible" | "system";

const UI_MODE_KEY = "matbakh_ui_mode";

export function useUIMode() {
  const [mode, setMode] = useState<UIMode>(() => {
    // Initialize from localStorage or default to system
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(UI_MODE_KEY) as UIMode;
      return stored || "system";
    }
    return "system";
  });

  const [effectiveMode, setEffectiveMode] = useState<UIMode>("standard");

  useEffect(() => {
    // Determine effective mode based on user choice and system preference
    let effective: UIMode = "standard";
    
    if (mode === "system") {
      // Use system preference - could check for reduced motion, screen size, etc.
      const preferReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      effective = (preferReduced || isMobile) ? "invisible" : "standard";
    } else {
      effective = mode;
    }
    
    setEffectiveMode(effective);
  }, [mode]);

  const setUIMode = (newMode: UIMode) => {
    setMode(newMode);
    localStorage.setItem(UI_MODE_KEY, newMode);
    
    // Fire analytics event
    try {
      window.dispatchEvent(new CustomEvent("analytics", { 
        detail: { 
          name: "ui_mode_changed", 
          from: mode, 
          to: newMode, 
          source: "settings" 
        } 
      }));
    } catch {}
  };

  return {
    mode,
    effectiveMode,
    setUIMode,
    isInvisible: effectiveMode === "invisible",
    isStandard: effectiveMode === "standard",
  };
}