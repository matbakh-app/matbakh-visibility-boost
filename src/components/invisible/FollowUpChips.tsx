import * as React from "react";
import { useTranslation } from "react-i18next";

type Chip = {
  id: string;                // e.g. "evidence" | "impact" | "howto"
  label?: string;            // optional – falls i18n Key genutzt wird
  i18nKey?: string;          // e.g. "vc_microcopy:ui.invisible.chips.evidence"
  onClick: () => void;
  disabled?: boolean;
};

type FollowUpChipsProps = {
  contextId: string;         // e.g. related cardId
  specId?: string;
  chips: Chip[];
  className?: string;
};

const fire = (name: string, payload: Record<string, unknown>) => {
  try {
    window.dispatchEvent(new CustomEvent("analytics", { detail: { name, ...payload } }));
  } catch {}
};

export function FollowUpChips({ contextId, specId, chips, className }: FollowUpChipsProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`} role="list" aria-label="Follow-up Optionen">
      {chips.map((chip) => {
        const text = chip.label ?? (chip.i18nKey ? t(chip.i18nKey) : "");
        return (
          <button
            key={chip.id}
            role="listitem"
            type="button"
            disabled={chip.disabled}
            className="px-3 py-1 rounded-full border text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              fire("inv_followup_click", { chip_id: chip.id, context_id: contextId, spec_id: specId });
              chip.onClick();
            }}
            aria-label={text}
            title={text}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}