import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PartnerCredit {
  partner_id: string;
  billing_mode: string;
  overage_policy: string;
  unit_price_eur: number;
  credits_granted: number;
  credits_consumed: number;
  credits_expired: number;
  balance: number;
}

interface CreditTransaction {
  id: string;
  partner_id: string;
  kind: string;
  quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export default function AdminPartnerCredits() {
  const [credits, setCredits] = useState<PartnerCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [grantAmount, setGrantAmount] = useState<string>("");
  const [grantReason, setGrantReason] = useState<string>("");

  useEffect(() => {
    // Mock data for now - in production this would fetch from /functions/v1/partner-credits
    setTimeout(() => {
      setCredits([
        {
          partner_id: "AUGUSTINER",
          billing_mode: "issue",
          overage_policy: "allow_and_invoice",
          unit_price_eur: 0.00,
          credits_granted: 100,
          credits_consumed: 15,
          credits_expired: 0,
          balance: 85
        },
        {
          partner_id: "SPATEN",
          billing_mode: "redeem",
          overage_policy: "block_when_exhausted",
          unit_price_eur: 2.50,
          credits_granted: 50,
          credits_consumed: 8,
          credits_expired: 0,
          balance: 42
        },
        {
          partner_id: "LOEWENBRAEU",
          billing_mode: "issue",
          overage_policy: "allow_and_invoice",
          unit_price_eur: 1.80,
          credits_granted: 200,
          credits_consumed: 0,
          credits_expired: 0,
          balance: 200
        }
      ]);

      setTransactions([
        {
          id: "1",
          partner_id: "AUGUSTINER",
          kind: "grant",
          quantity: 100,
          reason: "Initial Promo Kontingent",
          created_by: "super_admin",
          created_at: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
          id: "2",
          partner_id: "AUGUSTINER", 
          kind: "consume",
          quantity: 15,
          reason: "VC runs",
          created_by: "system",
          created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const handleGrantCredits = async () => {
    if (!selectedPartner || !grantAmount || !grantReason) return;

    // Mock API call - in production this would call /functions/v1/partner-credits
    console.log('Granting credits:', {
      partner_id: selectedPartner,
      quantity: parseInt(grantAmount),
      reason: grantReason
    });

    // Reset form
    setSelectedPartner("");
    setGrantAmount("");
    setGrantReason("");
  };

  const getBillingModeBadge = (mode: string) => {
    return mode === "issue" ? 
      <Badge variant="default">Issue</Badge> : 
      <Badge variant="secondary">Redeem</Badge>;
  };

  const getOverageBadge = (policy: string) => {
    return policy === "allow_and_invoice" ?
      <Badge variant="outline">Allow & Invoice</Badge> :
      <Badge variant="destructive">Block</Badge>;
  };

  const getBalanceBadge = (balance: number) => {
    if (balance <= 0) return <Badge variant="destructive">{balance}</Badge>;
    if (balance < 20) return <Badge variant="outline">{balance}</Badge>;
    return <Badge variant="default">{balance}</Badge>;
  };

  const getTransactionBadge = (kind: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      grant: "default",
      consume: "secondary",
      adjust: "outline",
      expire: "destructive"
    };
    
    return <Badge variant={variants[kind] || "outline"}>{kind}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Partner Credits</h1>
        <div className="text-center py-8">Loading partner credits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partner Credits</h1>
        <div className="text-sm text-gray-500">
          {credits.length} partners with credits
        </div>
      </div>

      {/* Grant Credits Form */}
      <Card>
        <CardHeader>
          <CardTitle>Grant Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="partner">Partner</Label>
              <select
                id="partner"
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select partner...</option>
                {credits.map((credit) => (
                  <option key={credit.partner_id} value={credit.partner_id}>
                    {credit.partner_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="Credits to grant"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Grant reason"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGrantCredits} className="w-full">
                Grant Credits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Credits Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Partner</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-left p-3">Overage</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Granted</th>
                  <th className="text-left p-3">Consumed</th>
                  <th className="text-left p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.partner_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {credit.partner_id}
                      </code>
                    </td>
                    <td className="p-3">{getBillingModeBadge(credit.billing_mode)}</td>
                    <td className="p-3">{getOverageBadge(credit.overage_policy)}</td>
                    <td className="p-3">€{credit.unit_price_eur.toFixed(2)}</td>
                    <td className="p-3">{credit.credits_granted}</td>
                    <td className="p-3">{credit.credits_consumed}</td>
                    <td className="p-3">{getBalanceBadge(credit.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Partner</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Quantity</th>
                  <th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Created By</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {transaction.partner_id}
                      </code>
                    </td>
                    <td className="p-3">{getTransactionBadge(transaction.kind)}</td>
                    <td className="p-3 font-medium">
                      {transaction.kind === 'consume' ? '-' : '+'}{transaction.quantity}
                    </td>
                    <td className="p-3">{transaction.reason}</td>
                    <td className="p-3 text-gray-600">{transaction.created_by}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}