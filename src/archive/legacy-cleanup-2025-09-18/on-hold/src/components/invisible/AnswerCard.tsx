import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type AnswerCardProps = {
  cardId: string;            // e.g. "top-actions"
  specId?: string;           // e.g. "VC-DASH-OWN-01"
  title: string;             // short, punchy headline
  body: string;              // 1–2 sentences max
  primaryCta?: { label: string; onClick: () => void; id?: string };
  secondaryLink?: { label: string; onClick: () => void; id?: string };
  confidence?: number;       // 0..1 (optional)
  className?: string;
};

const fire = (name: string, payload: Record<string, unknown>) => {
  try {
    // simple, replace with your real analytics bus
    window.dispatchEvent(new CustomEvent("analytics", { detail: { name, ...payload } }));
  } catch {}
};

export function AnswerCard({
  cardId,
  specId,
  title,
  body,
  primaryCta,
  secondaryLink,
  confidence,
  className,
}: AnswerCardProps) {
  const { t } = useTranslation();

  React.useEffect(() => {
    fire("inv_answer_view", { card_id: cardId, spec_id: specId, confidence });
  }, [cardId, specId, confidence]);

  return (
    <Card className={`w-full shadow-sm rounded-2xl ${className ?? ""}`} role="region" aria-labelledby={`${cardId}-title`}>
      <CardHeader className="pb-2">
        <CardTitle id={`${cardId}-title`} className="text-xl font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6">
        <p>{body}</p>
        {typeof confidence === "number" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("vc_microcopy:evidence.confidence", { defaultValue: "Sicherheit: {{v}}%", v: Math.round(confidence * 100) })}
          </p>
        )}
      </CardContent>
      {(primaryCta || secondaryLink) && (
        <CardFooter className="gap-2 flex-wrap">
          {primaryCta && (
            <Button
              size="sm"
              onClick={() => {
                fire("inv_primary_cta_click", { cta_id: primaryCta.id ?? "primary", card_id: cardId, spec_id: specId });
                primaryCta.onClick();
              }}
            >
              {primaryCta.label || t("vc_microcopy:ui.invisible.cta.primary", { defaultValue: "Jetzt umsetzen" })}
            </Button>
          )}
          {secondaryLink && (
            <button
              type="button"
              className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
              onClick={() => {
                fire("inv_secondary_link_click", { link_id: secondaryLink.id ?? "secondary", card_id: cardId, spec_id: specId });
                secondaryLink.onClick();
              }}
            >
              {secondaryLink.label}
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}