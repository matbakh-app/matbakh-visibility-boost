
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { SeoMeta } from '@/components/SeoMeta';

const AdminPanel: React.FC = () => {
  const { t } = useTranslation('admin');
  
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select(`
          *,
          service_prices (
            normal_price_cents,
            promo_price_cents,
            promo_active,
            currency
          )
        `)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: ['admin-addons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Helper function to format price from cents
  const formatPrice = (priceInCents: number | null | undefined, currency = 'EUR') => {
    if (!priceInCents) return t('noPrice');
    return `${(priceInCents / 100).toFixed(2)} €`;
  };

  // Helper function to get period text
  const getPeriodText = (isRecurring: boolean, intervalMonths: number | null) => {
    if (!isRecurring) return t('period.oneTime');
    if (intervalMonths === 1) return t('period.monthly');
    if (intervalMonths === 12) return t('period.yearly');
    return `${intervalMonths} ${t('period.months')}`;
  };

  return (
    <>
      <SeoMeta
        title={t('title')}
        description={t('subtitle')}
        namespace="admin"
      />
      <AdminLayout>
        <div className="space-y-6 container mx-auto px-6 py-8">
          <div>
            <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
          </div>

          <Tabs defaultValue="packages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">{t('tabs.packages')}</TabsTrigger>
              <TabsTrigger value="addons">{t('tabs.addons')}</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{t('packages.title')}</h2>
                <Button>{t('packages.add')}</Button>
              </div>

              {packagesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {packages?.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{pkg.default_name}</CardTitle>
                            <CardDescription className="mt-2">
                              {t('packages.code')}: {pkg.code}
                            </CardDescription>
                          </div>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? t('status.active') : t('status.inactive')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('packages.price')}:</span>{' '}
                              {pkg.service_prices && pkg.service_prices.length > 0 ? (
                                <>
                                  {formatPrice(pkg.service_prices[0].normal_price_cents)}
                                  {pkg.service_prices[0].promo_active && pkg.service_prices[0].promo_price_cents && (
                                    <span className="ml-2 line-through text-gray-400">
                                      {formatPrice(pkg.service_prices[0].promo_price_cents)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                t('noPrice')
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('packages.period')}:</span>{' '}
                              {getPeriodText(pkg.is_recurring || false, pkg.interval_months)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('packages.type')}:</span>{' '}
                              {pkg.is_recurring ? t('packages.recurring') : t('packages.oneTime')}
                            </p>
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              {t('actions.edit')}
                            </Button>
                            <Button variant="outline" size="sm">
                              {t('packages.pricing')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addons" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{t('addons.title')}</h2>
                <Button>{t('addons.add')}</Button>
              </div>

              {addonsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {addons?.map((addon) => (
                    <Card key={addon.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{addon.name}</CardTitle>
                            <CardDescription className="mt-2">
                              {addon.description || t('addons.noDescription')}
                            </CardDescription>
                          </div>
                          <Badge variant={addon.is_active ? "default" : "secondary"}>
                            {addon.is_active ? t('status.active') : t('status.inactive')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('addons.category')}:</span> {addon.category}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('addons.price')}:</span> €{addon.price}
                              {addon.original_price && (
                                <span className="ml-2 line-through text-gray-400">
                                  €{addon.original_price}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('addons.period')}:</span> {addon.period}
                            </p>
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              {t('actions.edit')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPanel;
