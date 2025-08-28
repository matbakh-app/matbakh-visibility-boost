import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Instagram, Facebook, Globe, ArrowRight, Check } from 'lucide-react';

export default function StepChannels() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);

  const channels = [
    {
      id: 'gmb',
      name: t('channels.gmb'),
      icon: MapPin,
      description: 'Für lokale Suche und Maps',
      color: 'bg-red-500'
    },
    {
      id: 'instagram',
      name: t('channels.instagram'),
      icon: Instagram,
      description: 'Für visuelle Inhalte und Stories',
      color: 'bg-pink-500'
    },
    {
      id: 'facebook',
      name: t('channels.facebook'),
      icon: Facebook,
      description: 'Für Community und Events',
      color: 'bg-blue-500'
    },
    {
      id: 'website',
      name: t('channels.website'),
      icon: Globe,
      description: 'Ihre eigene Website',
      color: 'bg-gray-500'
    }
  ];

  const handleConnect = async (channelId: string) => {
    // Simulate connection process
    setConnectedChannels(prev => [...prev, channelId]);
    
    // In real implementation, this would trigger OAuth flows
    console.log(`Connecting to ${channelId}`);
  };

  const handleSubmit = async () => {
    try {
      // Save connected channels
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'channels',
          data: {
            connectedChannels
          },
          next: 'quickwins'
        })
      });

      if (response.ok) {
        navigate('/onboarding/quickwins');
      }
    } catch (error) {
      console.error('Error saving channels:', error);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/quickwins');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('channels.title')}</h1>
        <p className="text-muted-foreground">{t('channels.subtitle')}</p>
      </div>

      <div className="grid gap-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isConnected = connectedChannels.includes(channel.id);
          
          return (
            <Card key={channel.id} className={`transition-all ${isConnected ? 'ring-2 ring-green-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${channel.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{channel.name}</h3>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Verbunden
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(channel.id)}
                        className="flex items-center gap-1"
                      >
                        Verbinden
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {connectedChannels.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {connectedChannels.length} Kanal{connectedChannels.length !== 1 ? 'e' : ''} verbunden
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/onboarding/menu')}
        >
          {t('navigation.previous')}
        </Button>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
          >
            {t('channels.connectLater')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('navigation.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}