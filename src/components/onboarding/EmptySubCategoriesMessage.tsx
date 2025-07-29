import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Search } from 'lucide-react';

interface EmptySubCategoriesMessageProps {
  selectedMainCategories: string[];
}

const EmptySubCategoriesMessage: React.FC<EmptySubCategoriesMessageProps> = ({ 
  selectedMainCategories 
}) => {
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-3 rounded-full">
              <Search className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              Keine Unterkategorien verfügbar
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Für die ausgewählten Hauptkategorien sind derzeit keine passenden 
              Unterkategorien in unserem System verfügbar.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">
                  Was können Sie tun?
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Wählen Sie andere Hauptkategorien aus</li>
                  <li>• Fahren Sie ohne Unterkategorien fort</li>
                  <li>• Kontaktieren Sie uns für spezielle Kategorien</li>
                </ul>
              </div>
            </div>
          </div>

          {selectedMainCategories.length > 0 && (
            <div className="text-xs text-gray-500">
              Ausgewählte Kategorien: {selectedMainCategories.join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptySubCategoriesMessage;