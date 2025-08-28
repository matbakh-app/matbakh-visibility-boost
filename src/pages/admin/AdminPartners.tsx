import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Partner {
  id: string;
  name: string;
  status: string;
  credits_balance: number;
  leads_count: number;
  created_at: string;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in production this would fetch from /functions/v1/admin-partners
    setTimeout(() => {
      setPartners([
        {
          id: "AUGUSTINER",
          name: "Augustiner Bräu",
          status: "active",
          credits_balance: 85,
          leads_count: 15,
          created_at: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
          id: "SPATEN",
          name: "Spaten Bräu",
          status: "active", 
          credits_balance: 42,
          leads_count: 8,
          created_at: new Date(Date.now() - 86400000 * 15).toISOString()
        },
        {
          id: "LOEWENBRAEU",
          name: "Löwenbräu",
          status: "pending",
          credits_balance: 200,
          leads_count: 0,
          created_at: new Date(Date.now() - 86400000 * 7).toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "outline",
      suspended: "destructive"
    };
    
    const labels: Record<string, string> = {
      active: "Active",
      pending: "Pending",
      suspended: "Suspended"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getCreditsBadge = (balance: number) => {
    if (balance <= 0) return <Badge variant="destructive">{balance}</Badge>;
    if (balance < 20) return <Badge variant="outline">{balance}</Badge>;
    return <Badge variant="default">{balance}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Partners</h1>
        <div className="text-center py-8">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partners</h1>
        <div className="text-sm text-gray-500">
          {partners.length} partners total
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No partners found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Partner ID</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Credits</th>
                    <th className="text-left p-3">Leads</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {partner.id}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{partner.name}</td>
                      <td className="p-3">{getStatusBadge(partner.status)}</td>
                      <td className="p-3">{getCreditsBadge(partner.credits_balance)}</td>
                      <td className="p-3">{partner.leads_count}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(partner.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Credits
                          </Button>
                        </div>
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