import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Zap } from "lucide-react";

type ModeNudgeProps = {
  onAccept: () => void;
  onDismiss: () => void;
  className?: string;
};

const fire = (name: string, payload: Record<string, unknown>) => {
  try {
    window.dispatchEvent(new CustomEvent("analytics", { detail: { name, ...payload } }));
  } catch {}
};

export function ModeNudge({ onAccept, onDismiss, className }: ModeNudgeProps) {
  const { t } = useTranslation();

  React.useEffect(() => {
    fire("ui_mode_nudge_shown", { persona: "zeitknapp" });
  }, []);

  const handleAccept = () => {
    fire("ui_mode_changed", { from: "standard", to: "invisible", source: "nudge" });
    onAccept();
  };

  const handleDismiss = () => {
    fire("ui_mode_nudge_dismissed", { persona: "zeitknapp" });
    onDismiss();
  };

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className ?? ""}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-blue-900">
            {t("vc_microcopy:ui.invisible.nudge.title", { defaultValue: "Schneller zum Punkt?" })}
          </h3>
          <p className="text-sm text-blue-800">
            {t("vc_microcopy:ui.invisible.nudge.body", { 
              defaultValue: "Probiere kompakte Antworten mit gezielten Nachfragen. Listen sind jederzeit einblendbar." 
            })}
          </p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAccept} className="bg-blue-600 hover:bg-blue-700">
              Ausprobieren
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-blue-700 hover:bg-blue-100">
              Später
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-blue-600 hover:bg-blue-100 p-1 h-auto"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}