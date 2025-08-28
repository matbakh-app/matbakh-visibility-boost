import * as React from "react";
import { useTranslation } from "react-i18next";
import { AnswerCard } from "./AnswerCard";
import { FollowUpChips } from "./FollowUpChips";

type VCResultInvisibleProps = {
  result: {
    confidence?: number;
    topActions?: Array<{
      id: string;
      title: string;
      description: string;
      impact?: string;
    }>;
    score?: number;
  };
  onExpandDetails?: () => void;
  onApplyAction?: (actionId: string) => void;
  onShowEvidence?: () => void;
  onShowImpact?: () => void;
  onShowHowTo?: () => void;
};

export function VCResultInvisible({ 
  result, 
  onExpandDetails,
  onApplyAction,
  onShowEvidence,
  onShowImpact,
  onShowHowTo 
}: VCResultInvisibleProps) {
  const { t } = useTranslation();

  const topAction = result.topActions?.[0];
  const scoreText = result.score ? `${result.score}/100 Punkte` : "";

  return (
    <section className="space-y-4 px-4 py-2">
      <AnswerCard
        cardId="top-actions"
        specId="VC-DASH-OWN-01"
        title={topAction?.title || t("vc_microcopy:result.top_actions.title", { 
          defaultValue: "Das bringt dir heute am meisten" 
        })}
        body={topAction?.description || t("vc_microcopy:result.top_actions.body", { 
          defaultValue: "Diese 3 Schritte steigern deine Sichtbarkeit spürbar." 
        })}
        primaryCta={{
          id: "apply-first-action",
          label: t("vc_microcopy:ui.invisible.cta.primary", { defaultValue: "Jetzt umsetzen" }),
          onClick: async () => {
            const actionId = topAction?.id || "first";
            
            // Check if posting hooks are enabled and offer to enqueue
            if (window.confirm("Diese Maßnahme in die Posting-Queue stellen?")) {
              try {
                const response = await fetch("/functions/v1/posting-enqueue", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    business_id: "SELF", // TODO: get from user context
                    channel: "gmb",
                    payload: { 
                      action_id: actionId, 
                      type: "post", 
                      text: "Auto-Post Vorschlag basierend auf VC-Analyse", 
                      media: [] 
                    }
                  })
                });
                
                const result = await response.json();
                
                if (result.disabled) {
                  alert("Posting-Hooks sind derzeit deaktiviert.");
                } else if (result.success) {
                  alert("In die Queue gestellt. (Admin → Content Queue)");
                } else {
                  alert("Fehler beim Einreihen in die Queue.");
                }
              } catch (error) {
                console.error('Posting enqueue error:', error);
                alert("Fehler beim Einreihen in die Queue.");
              }
            } else {
              // Fallback to original handler
              onApplyAction?.(actionId);
            }
          },
        }}
        secondaryLink={{
          id: "see-details",
          label: t("vc_microcopy:common.see_details", { defaultValue: "Mehr Details" }),
          onClick: () => onExpandDetails?.(),
        }}
        confidence={result.confidence}
      />

      {scoreText && (
        <AnswerCard
          cardId="visibility-score"
          specId="VC-DASH-OWN-01"
          title={t("vc_microcopy:result.score.title", { defaultValue: "Deine Sichtbarkeit" })}
          body={`${scoreText} - ${result.score && result.score >= 70 ? 'Sehr gut!' : result.score && result.score >= 50 ? 'Ausbaufähig' : 'Viel Potenzial'}`}
          secondaryLink={{
            id: "score-details",
            label: t("vc_microcopy:result.score.breakdown", { defaultValue: "Aufschlüsselung" }),
            onClick: () => onExpandDetails?.(),
          }}
          confidence={result.confidence}
        />
      )}

      <FollowUpChips
        contextId="top-actions"
        specId="VC-DASH-OWN-01"
        chips={[
          {
            id: "evidence",
            i18nKey: "vc_microcopy:ui.invisible.chips.evidence",
            onClick: () => onShowEvidence?.(),
          },
          {
            id: "impact",
            i18nKey: "vc_microcopy:ui.invisible.chips.impact",
            onClick: () => onShowImpact?.(),
          },
          {
            id: "howto",
            i18nKey: "vc_microcopy:ui.invisible.chips.howto",
            onClick: () => onShowHowTo?.(),
          },
        ]}
      />
    </section>
  );
}