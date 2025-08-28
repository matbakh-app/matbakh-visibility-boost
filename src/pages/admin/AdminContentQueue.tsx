import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QueueItem {
  id: string;
  business_id: string;
  channel: string;
  payload: {
    type: string;
    text: string;
    media?: string[];
  };
  status: string;
  scheduled_for?: string;
  created_at: string;
  processed_at?: string;
}

export default function AdminContentQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in production this would fetch from /functions/v1/admin-content-queue
    setTimeout(() => {
      setQueue([
        {
          id: "1",
          business_id: "SELF",
          channel: "gmb",
          payload: {
            type: "post",
            text: "Auto-Post Vorschlag basierend auf VC-Analyse",
            media: []
          },
          status: "pending",
          scheduled_for: new Date(Date.now() + 3600000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          business_id: "restaurant_123",
          channel: "facebook",
          payload: {
            type: "story",
            text: "Heute frische Pasta!",
            media: ["image1.jpg"]
          },
          status: "processed",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          processed_at: new Date(Date.now() - 1800000).toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      processed: "default",
      failed: "destructive",
      cancelled: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      gmb: "bg-blue-100 text-blue-800",
      facebook: "bg-blue-100 text-blue-800",
      instagram: "bg-pink-100 text-pink-800",
      twitter: "bg-sky-100 text-sky-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[channel] || "bg-gray-100 text-gray-800"}`}>
        {channel.toUpperCase()}
      </span>
    );
  };

  const handleProcessItem = (id: string) => {
    console.log('Processing queue item:', id);
    // In production, this would call the processing API
  };

  const handleCancelItem = (id: string) => {
    console.log('Cancelling queue item:', id);
    // In production, this would cancel the item
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Content Queue</h1>
        <div className="text-center py-8">Loading content queue...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Queue</h1>
        <div className="text-sm text-gray-500">
          {queue.length} items in queue
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {queue.filter(item => item.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {queue.filter(item => item.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-600">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {queue.filter(item => item.status === 'processed').length}
            </div>
            <div className="text-sm text-gray-600">Processed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {queue.filter(item => item.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in queue
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.id}
                      </code>
                      {getChannelBadge(item.channel)}
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString('de-DE')}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Business: {item.business_id}</div>
                    <div className="text-sm text-gray-600 mb-2">Type: {item.payload.type}</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      {item.payload.text}
                    </div>
                    {item.payload.media && item.payload.media.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Media: {item.payload.media.join(', ')}
                      </div>
                    )}
                  </div>

                  {item.scheduled_for && (
                    <div className="text-xs text-gray-500 mb-3">
                      Scheduled for: {new Date(item.scheduled_for).toLocaleString('de-DE')}
                    </div>
                  )}

                  {item.processed_at && (
                    <div className="text-xs text-gray-500 mb-3">
                      Processed at: {new Date(item.processed_at).toLocaleString('de-DE')}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {item.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProcessItem(item.id)}
                        >
                          Process Now
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelItem(item.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}