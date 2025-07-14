
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
        .select('*')
        .order('sort_order', { ascending: true });
      
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

  return (
    <>
      <SeoMeta
        title={t('title')}
        description={t('subtitle')}
        namespace="admin"
      />
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
          </div>

          <Tabs defaultValue="packages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">{t('navigation.packages')}</TabsTrigger>
              <TabsTrigger value="addons">{t('navigation.services')}</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{t('packages.title')}</h2>
                <Button>{t('packages.add')}</Button>
              </div>

              {packagesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading', { ns: 'common' })}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {packages?.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{pkg.name}</CardTitle>
                            <CardDescription className="mt-2">
                              {pkg.description}
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
                              <span className="font-medium">Preis:</span> €{pkg.base_price}
                              {pkg.original_price && (
                                <span className="ml-2 line-through text-gray-400">
                                  €{pkg.original_price}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Zeitraum:</span> {pkg.period}
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
                <h2 className="text-2xl font-semibold">{t('navigation.services')}</h2>
                <Button>{t('packages.add')}</Button>
              </div>

              {addonsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading', { ns: 'common' })}</p>
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
                              {addon.description}
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
                              <span className="font-medium">Kategorie:</span> {addon.category}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Preis:</span> €{addon.price}
                              {addon.original_price && (
                                <span className="ml-2 line-through text-gray-400">
                                  €{addon.original_price}
                                </span>
                              )}
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
