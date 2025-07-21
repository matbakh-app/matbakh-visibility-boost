
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, TestTube, Activity } from 'lucide-react';

interface FacebookConfig {
  id: string;
  partner_id: string;
  pixel_id: string;
  access_token: string;
  is_active: boolean;
}

interface ConversionLog {
  id: string;
  event_name: string;
  pixel_id: string;
  success: boolean;
  sent_at: string;
  error_message?: string;
}

export const FacebookConversionsConfig: React.FC<{ partnerId: string }> = ({ partnerId }) => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const [config, setConfig] = useState<FacebookConfig | null>(null);
  const [logs, setLogs] = useState<ConversionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    pixel_id: '',
    access_token: '',
    is_active: true
  });

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, [partnerId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fb_conversions_config')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        setFormData({
          pixel_id: data.pixel_id,
          access_token: data.access_token,
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error loading Facebook config:', error);
      toast({
        title: 'Fehler',
        description: 'Facebook-Konfiguration konnte nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('fb_conversion_logs')
        .select('id, event_name, pixel_id, success, sent_at, error_message')
        .eq('partner_id', partnerId)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading conversion logs:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        partner_id: partnerId,
        pixel_id: formData.pixel_id,
        access_token: formData.access_token,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('fb_conversions_config')
        .upsert(configData, { onConflict: 'partner_id' });

      if (error) throw error;

      toast({
        title: 'Gespeichert',
        description: 'Facebook Conversions API Konfiguration wurde gespeichert.'
      });

      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Fehler',
        description: 'Konfiguration konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.pixel_id || !formData.access_token) {
      toast({
        title: 'Fehler',
        description: 'Pixel ID und Access Token sind erforderlich.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('facebook-conversions', {
        body: {
          partner_id: partnerId,
          event_data: { event_name: 'Test' },
          test_event_code: 'TEST12345'
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Test erfolgreich',
        description: 'Facebook Conversions API Verbindung funktioniert.'
      });

      loadLogs();
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test fehlgeschlagen',
        description: 'Verbindung zur Facebook API konnte nicht hergestellt werden.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div>Lade Konfiguration...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Facebook Conversions API
        </CardTitle>
        <CardDescription>
          Konfiguration für das Senden von Events an die Facebook Conversions API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Konfiguration</TabsTrigger>
            <TabsTrigger value="logs">Event Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="pixel_id"
                  value={formData.pixel_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixel_id: e.target.value }))}
                  placeholder="123456789012345"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="access_token">Access Token</Label>
                <div className="relative">
                  <Input
                    id="access_token"
                    type={showToken ? 'text' : 'password'}
                    value={formData.access_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                    placeholder="Ihr Facebook App Access Token"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Aktiv</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Speichern...' : 'Speichern'}
                </Button>
                <Button variant="outline" onClick={testConnection}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Verbindung testen
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Events gesendet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.event_name}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(log.sent_at).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{log.pixel_id}</div>
                      {log.error_message && (
                        <div className="text-xs text-red-600">{log.error_message}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
