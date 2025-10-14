import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  email: string;
  business_name: string;
  partner_id?: string;
  status: string;
  created_at: string;
  verified_at?: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/functions/v1/admin-leads")
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => {
        setLeads([]);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      doi_sent: "secondary", 
      verified: "default",
      completed: "default"
    };
    
    const labels: Record<string, string> = {
      pending: "Ausstehend",
      doi_sent: "DOI gesendet",
      verified: "Bestätigt",
      completed: "Abgeschlossen"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="text-center py-8">Lade Leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="text-sm text-gray-500">
          {leads.length} Leads insgesamt
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Leads vorhanden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">E-Mail</th>
                    <th className="text-left p-3">Business</th>
                    <th className="text-left p-3">Partner</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Erstellt</th>
                    <th className="text-left p-3">Bestätigt</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{lead.email}</td>
                      <td className="p-3">{lead.business_name}</td>
                      <td className="p-3">
                        {lead.partner_id ? (
                          <Badge variant="outline">{lead.partner_id}</Badge>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="p-3">{getStatusBadge(lead.status)}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-3 text-gray-600">
                        {lead.verified_at ? 
                          new Date(lead.verified_at).toLocaleDateString('de-DE') : 
                          '–'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}