import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VCRun {
  id: string;
  email: string;
  tracking_id: string;
  partner_id?: string;
  status: string;
  overall_score?: number;
  analysis_status: string;
  created_at: string;
}

export default function AdminVCRuns() {
  const [runs, setRuns] = useState<VCRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in production this would fetch from /functions/v1/admin-vc-runs
    setTimeout(() => {
      setRuns([
        {
          id: "1",
          email: "test@example.com",
          tracking_id: "vc_123456",
          partner_id: "AUGUSTINER",
          status: "completed",
          overall_score: 78,
          analysis_status: "completed",
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          email: "demo@restaurant.de",
          tracking_id: "vc_789012",
          status: "pending",
          analysis_status: "running",
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      running: "secondary",
      completed: "default",
      failed: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">VC Runs</h1>
        <div className="text-center py-8">Loading VC runs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VC Runs</h1>
        <div className="text-sm text-gray-500">
          {runs.length} runs total
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All VC Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No VC runs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Tracking ID</th>
                    <th className="text-left p-3">Partner</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Score</th>
                    <th className="text-left p-3">Analysis</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{run.email}</td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {run.tracking_id}
                        </code>
                      </td>
                      <td className="p-3">
                        {run.partner_id ? (
                          <Badge variant="outline">{run.partner_id}</Badge>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="p-3">{getStatusBadge(run.status)}</td>
                      <td className="p-3">
                        {run.overall_score ? (
                          <span className="font-medium">{run.overall_score}/100</span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                      <td className="p-3">{getStatusBadge(run.analysis_status)}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(run.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-3">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
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