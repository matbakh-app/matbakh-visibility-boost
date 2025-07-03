import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServicePackages } from '@/hooks/useServicePackages';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PackageEditModal } from '@/components/admin/PackageEditModal';
import { AddonServiceEditModal } from '@/components/admin/AddonServiceEditModal';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Euro, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminPanel: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('adminPanel');

  const [packages, setPackages] = useState<any[]>([]);
  const [addonServices, setAddonServices] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedAddon, setSelectedAddon] = useState<any>(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from('service_packages')
        .select(`*, service_prices ( normal_price_cents, promo_price_cents, promo_active, currency )`)
        .order('default_name');

      if (packagesError) throw packagesError;

      const { data: addonsData, error: addonsError } = await supabase
        .from('addon_services')
        .select('*')
        .order('sort_order', { nullsFirst: false });

      if (addonsError) throw addonsError;

      setPackages(packagesData || []);
      setAddonServices(addonsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t('errorTitle'),
        description: t('errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div>{t('loading')}</div>;

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  const handleEditPackage = (pkg: any) => {
    setSelectedPackage({
      ...pkg,
      price: pkg.service_prices?.[0]?.normal_price_cents ? formatPrice(pkg.service_prices[0].normal_price_cents) : undefined,
      promo_price: pkg.service_prices?.[0]?.promo_price_cents ? formatPrice(pkg.service_prices[0].promo_price_cents) : undefined,
      promo_active: pkg.service_prices?.[0]?.promo_active || false
    });
    setPackageModalOpen(true);
  };

  const handleEditAddon = (addon: any) => {
    setSelectedAddon(addon);
    setAddonModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="packages">{t('packagesTab')}</TabsTrigger>
            <TabsTrigger value="addons">{t('addonsTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="packages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('packagesTitle')}
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newPackage')}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">{t('loadingPackages')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('code')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('price')}</TableHead>
                        <TableHead>{t('promo')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.default_name}</TableCell>
                          <TableCell><Badge variant="outline">{pkg.code}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={pkg.is_recurring ? 'default' : 'secondary'}>
                              {pkg.is_recurring ? `${pkg.interval_months}M` : t('oneTime')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pkg.service_prices?.[0] ? (
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4" />
                                <span className="font-medium">{formatPrice(pkg.service_prices[0].normal_price_cents)}</span>
                                {pkg.service_prices[0].promo_price_cents && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(pkg.service_prices[0].promo_price_cents)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t('noPrice')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pkg.service_prices?.[0]?.promo_active ? 'destructive' : 'outline'}>
                              {pkg.service_prices?.[0]?.promo_active ? t('active') : t('inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleEditPackage(pkg)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('edit')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addons">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {t('addonsTitle')}
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newAddon')}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">{t('loadingAddons')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('price')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('period')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addonServices.map((addon) => (
                        <TableRow key={addon.id}>
                          <TableCell className="font-medium">{addon.name}</TableCell>
                          <TableCell><Badge variant="outline">{addon.category}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4" />
                              <span className="font-medium">€{addon.price}</span>
                              {addon.original_price && (
                                <span className="text-sm text-muted-foreground line-through">€{addon.original_price}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={addon.is_active ? 'default' : 'secondary'}>
                              {addon.is_active ? t('active') : t('inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="outline">{addon.period}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleEditAddon(addon)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('edit')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PackageEditModal
          package={selectedPackage}
          isOpen={packageModalOpen}
          onClose={() => {
            setPackageModalOpen(false);
            setSelectedPackage(null);
          }}
          onSuccess={loadData}
        />

        <AddonServiceEditModal
          service={selectedAddon}
          isOpen={addonModalOpen}
          onClose={() => {
            setAddonModalOpen(false);
            setSelectedAddon(null);
          }}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
