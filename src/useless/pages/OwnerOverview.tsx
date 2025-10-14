import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUIMode } from "@/hooks/useUIMode";
import { AnswerCard, FollowUpChips, InvisibleModeToggle } from "@/components/invisible";
import { toCSV } from "@/utils/csv";

export default function OwnerOverview() {
  const { isInvisible, mode, setUIMode } = useUIMode();
  const [data, setData] = useState<any>(null);
  const businessId = "SELF"; // TODO: from session/user profile

  useEffect(() => {
    fetch(`/functions/v1/owner-overview?business_id=${encodeURIComponent(businessId)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ empty: true }));
  }, [businessId]);

  const quickWins = useMemo(() => (data?.actions_top3 ?? []).map((a: any) => ({
    id: a.id,
    title: a.title ?? a.id,
    why: a.why ?? "",
    roi_hint: a.roi_hint ?? "mittel",
    effort: a.effort ?? "niedrig"
  })), [data]);

  const downloadCSV = () => {
    const csv = toCSV(quickWins);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vc_quick_wins.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch('/functions/v1/generate-pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'owner-overview',
          data: {
            total_score: data?.total_score,
            trend_30d: data?.trend_30d,
            quick_wins: quickWins,
            business_id: businessId
          }
        })
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visibility-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Fehler beim PDF-Export');
    }
  };

  const handleFollowUp = (id: string) => {
    window.dispatchEvent(new CustomEvent("inv_followup_clicked", { detail: { id } }));
    console.log('Follow-up clicked:', id);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visibility Überblick</h1>
        <InvisibleModeToggle currentMode={mode} onModeChange={setUIMode} />
      </header>

      {isInvisible ? (
        <div className="space-y-3">
          <AnswerCard
            cardId="owner-overview"
            title={`Gesamtscore: ${data?.total_score ?? "–"}`}
            body={typeof data?.trend_30d === "number" ? 
              `30-Tage-Trend: ${data.trend_30d >= 0 ? "↑" : "↓"} ${Math.abs(data.trend_30d)}` : 
              "Trend: –"
            }
            primaryCta={{ 
              label: "Top-3 umsetzen", 
              onClick: downloadCSV 
            }}
            secondaryLink={{ 
              label: "PDF exportieren", 
              onClick: downloadPDF 
            }}
          />
          <FollowUpChips
            contextId="owner-overview"
            chips={[
              { id: "see-evidence", label: "Belege zeigen", onClick: () => handleFollowUp("see-evidence") },
              { id: "why-score", label: "Warum dieser Score?", onClick: () => handleFollowUp("why-score") },
              { id: "how-improve", label: "Schnell verbessern", onClick: () => handleFollowUp("how-improve") }
            ]}
          />
        </div>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{data?.total_score ?? "–"}</div>
            <div className="text-sm opacity-70">
              {typeof data?.trend_30d === "number" ? `Trend 30d: ${data.trend_30d}` : "Trend: –"}
            </div>
          </div>
          <div className="text-sm opacity-80">Top-3 Quick Wins</div>
          <div className="rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Empfehlung</th>
                  <th className="text-left p-2">ROI</th>
                  <th className="text-left p-2">Aufwand</th>
                </tr>
              </thead>
              <tbody>
                {quickWins.map((w) => (
                  <tr key={w.id} className="border-t">
                    <td className="p-2">{w.title}</td>
                    <td className="p-2">{w.roi_hint}</td>
                    <td className="p-2">{w.effort}</td>
                  </tr>
                ))}
                {!quickWins.length && (
                  <tr>
                    <td className="p-2" colSpan={3}>Keine Daten – bitte VC ausführen.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadCSV}>CSV exportieren</Button>
            <Button onClick={downloadPDF} variant="outline">PDF exportieren</Button>
          </div>
        </Card>
      )}
    </div>
  );
}