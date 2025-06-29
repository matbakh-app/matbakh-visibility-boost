
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServicePackages } from '@/hooks/useServicePackages';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const { data: packages } = useServicePackages();
  const navigate = useNavigate();

  if (loading) return <div>Lädt...</div>;
  
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">Preise und Services verwalten</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packages?.map((pkg) => (
                <div key={pkg.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                      <div className="mt-2">
                        <span className="font-medium">Aktueller Preis: €{pkg.base_price}</span>
                        {pkg.original_price && (
                          <span className="ml-2 text-gray-500 line-through">
                            (war: €{pkg.original_price})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Bearbeiten
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
