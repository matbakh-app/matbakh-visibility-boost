import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, List, Zap } from "lucide-react";

type UIMode = "standard" | "invisible" | "system";

type InvisibleModeToggleProps = {
  currentMode: UIMode;
  onModeChange: (mode: UIMode) => void;
  className?: string;
};

const fire = (name: string, payload: Record<string, unknown>) => {
  try {
    window.dispatchEvent(new CustomEvent("analytics", { detail: { name, ...payload } }));
  } catch {}
};

const modeIcons = {
  standard: List,
  invisible: Zap,
  system: Monitor,
};

export function InvisibleModeToggle({ currentMode, onModeChange, className }: InvisibleModeToggleProps) {
  const { t } = useTranslation();

  const handleModeChange = (newMode: UIMode, source: string = "header") => {
    if (newMode !== currentMode) {
      fire("ui_mode_changed", { from: currentMode, to: newMode, source });
      onModeChange(newMode);
    }
  };

  const CurrentIcon = modeIcons[currentMode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${className ?? ""}`}
          aria-label={t("vc_microcopy:ui.mode.toggle.label", { defaultValue: "Darstellung" })}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t(`vc_microcopy:ui.mode.toggle.${currentMode}`, { 
              defaultValue: currentMode === "standard" ? "Standard" : 
                           currentMode === "invisible" ? "Kompakt" : "System" 
            })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleModeChange("standard")}
          className={currentMode === "standard" ? "bg-muted" : ""}
        >
          <List className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>{t("vc_microcopy:ui.mode.toggle.standard", { defaultValue: "Standard" })}</span>
            <span className="text-xs text-muted-foreground">
              Listen und Tabellen vollständig
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleModeChange("invisible")}
          className={currentMode === "invisible" ? "bg-muted" : ""}
        >
          <Zap className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>{t("vc_microcopy:ui.mode.toggle.invisible", { defaultValue: "Kompakt (ohne Scrollen)" })}</span>
            <span className="text-xs text-muted-foreground">
              Präzise Antworten mit Follow-ups
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleModeChange("system")}
          className={currentMode === "system" ? "bg-muted" : ""}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>{t("vc_microcopy:ui.mode.toggle.system", { defaultValue: "System" })}</span>
            <span className="text-xs text-muted-foreground">
              Folgt Geräte-Einstellung
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}