import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/functions/v1/admin-overview")
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({}));
  }, []);

  const statItems = [
    { key: "leads_24h", label: "Leads 24h", value: stats?.leads_24h ?? "–" },
    { key: "doi_confirmed_24h", label: "DOI bestätigt 24h", value: stats?.doi_confirmed_24h ?? "–" },
    { key: "vc_runs_24h", label: "VC Läufe 24h", value: stats?.vc_runs_24h ?? "–" },
    { key: "bedrock_fail_rate", label: "Bedrock Fehlerrate", value: stats?.bedrock_fail_rate ? `${Math.round(stats.bedrock_fail_rate * 100)}%` : "–" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <div className="text-sm text-gray-500">
          Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(item => (
          <Card key={item.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">DOI Mail Service</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Aktiv
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Business Identification</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Aktiv
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Bedrock Analysis</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Canary (10%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Partner Credits</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Aktiv
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Posting Hooks</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  Deaktiviert
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                → Leads verwalten
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                → VC Runs einsehen
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                → Partner Credits
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                → Content Queue
              </button>
              <button
                className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                onClick={() => window.location.href = '/admin/bedrock-activation'}
              >
                → Bedrock Activation
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}