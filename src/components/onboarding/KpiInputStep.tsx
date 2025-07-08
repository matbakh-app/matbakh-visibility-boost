import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';

interface KpiInputStepProps {
  onComplete: (kpiData: any) => void;
  onBack: () => void;
  language?: 'de' | 'en';
}

export const KpiInputStep: React.FC<KpiInputStepProps> = ({
  onComplete,
  onBack,
  language = 'de'
}) => {
  const { t } = useTranslation('onboarding');
  
  const [kpiData, setKpiData] = useState({
    annual_revenue: '',
    seating_capacity: '',
    food_cost_ratio: '',
    labor_cost_ratio: '',
    employee_count: '',
    opening_hours: '',
    additional_kpis: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setKpiData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!kpiData.annual_revenue.trim()) {
      newErrors.annual_revenue = t('kpiInput.validation.annualRevenueRequired', 'Jahresumsatz ist erforderlich');
    }
    
    if (!kpiData.seating_capacity.trim()) {
      newErrors.seating_capacity = t('kpiInput.validation.seatingCapacityRequired', 'Sitzkapazität ist erforderlich');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Convert strings to appropriate types
      const processedData = {
        annual_revenue: parseFloat(kpiData.annual_revenue) || null,
        seating_capacity: parseInt(kpiData.seating_capacity) || null,
        food_cost_ratio: parseFloat(kpiData.food_cost_ratio) || null,
        labor_cost_ratio: parseFloat(kpiData.labor_cost_ratio) || null,
        employee_count: parseInt(kpiData.employee_count) || null,
        opening_hours: kpiData.opening_hours.trim() || null,
        additional_kpis: kpiData.additional_kpis.trim() || null
      };
      
      onComplete(processedData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {t('kpiInput.title', 'Ihre Betriebskennzahlen')}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {t('kpiInput.description', 'Geben Sie Ihre wichtigsten Kennzahlen ein, um ein personalisiertes Dashboard zu erhalten')}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                {t('kpiInput.hint.title', 'Tipp für beste Ergebnisse:')}
              </p>
              <p>
                {t('kpiInput.hint.description', 'Je mehr Werte Sie eintragen, desto personalisierter ist Ihr Dashboard-Erlebnis.')}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mandatory Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="annual_revenue" className="flex items-center gap-2">
                {t('kpiInput.fields.annualRevenue', 'Jahresumsatz')}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="annual_revenue"
                type="number"
                placeholder={t('kpiInput.placeholders.annualRevenue', 'z.B. 500000')}
                value={kpiData.annual_revenue}
                onChange={(e) => handleInputChange('annual_revenue', e.target.value)}
                className={errors.annual_revenue ? 'border-red-500' : ''}
              />
              {errors.annual_revenue && (
                <p className="text-sm text-red-600 mt-1">{errors.annual_revenue}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('kpiInput.hints.annualRevenue', 'Euro pro Jahr')}
              </p>
            </div>

            <div>
              <Label htmlFor="seating_capacity" className="flex items-center gap-2">
                {t('kpiInput.fields.seatingCapacity', 'Sitzkapazität')}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="seating_capacity"
                type="number"
                placeholder={t('kpiInput.placeholders.seatingCapacity', 'z.B. 50')}
                value={kpiData.seating_capacity}
                onChange={(e) => handleInputChange('seating_capacity', e.target.value)}
                className={errors.seating_capacity ? 'border-red-500' : ''}
              />
              {errors.seating_capacity && (
                <p className="text-sm text-red-600 mt-1">{errors.seating_capacity}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('kpiInput.hints.seatingCapacity', 'Anzahl Sitzplätze')}
              </p>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">
              {t('kpiInput.optionalSection', 'Optionale Angaben')}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="food_cost_ratio">
                  {t('kpiInput.fields.foodCostRatio', 'Wareneinsatzquote')}
                </Label>
                <Input
                  id="food_cost_ratio"
                  type="number"
                  step="0.01"
                  placeholder={t('kpiInput.placeholders.foodCostRatio', 'z.B. 30.5')}
                  value={kpiData.food_cost_ratio}
                  onChange={(e) => handleInputChange('food_cost_ratio', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('kpiInput.hints.foodCostRatio', 'Prozent des Umsatzes')}
                </p>
              </div>

              <div>
                <Label htmlFor="labor_cost_ratio">
                  {t('kpiInput.fields.laborCostRatio', 'Personalquote')}
                </Label>
                <Input
                  id="labor_cost_ratio"
                  type="number"
                  step="0.01"
                  placeholder={t('kpiInput.placeholders.laborCostRatio', 'z.B. 35.0')}
                  value={kpiData.labor_cost_ratio}
                  onChange={(e) => handleInputChange('labor_cost_ratio', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('kpiInput.hints.laborCostRatio', 'Prozent des Umsatzes')}
                </p>
              </div>

              <div>
                <Label htmlFor="employee_count">
                  {t('kpiInput.fields.employeeCount', 'Anzahl Mitarbeiter')}
                </Label>
                <Input
                  id="employee_count"
                  type="number"
                  placeholder={t('kpiInput.placeholders.employeeCount', 'z.B. 8')}
                  value={kpiData.employee_count}
                  onChange={(e) => handleInputChange('employee_count', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="opening_hours">
                  {t('kpiInput.fields.openingHours', 'Öffnungszeiten')}
                </Label>
                <Input
                  id="opening_hours"
                  placeholder={t('kpiInput.placeholders.openingHours', 'z.B. Mo-So 11:00-22:00')}
                  value={kpiData.opening_hours}
                  onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional KPIs */}
          <div className="border-t pt-6">
            <div>
              <Label htmlFor="additional_kpis">
                {t('kpiInput.fields.additionalKpis', 'Weitere bekannte KPIs')}
              </Label>
              <Textarea
                id="additional_kpis"
                placeholder={t('kpiInput.placeholders.additionalKpis', 'z.B. Durchschnittlicher Bon: 25€, Tischrotation: 2.5x pro Abend')}
                rows={3}
                value={kpiData.additional_kpis}
                onChange={(e) => handleInputChange('additional_kpis', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('kpiInput.hints.additionalKpis', 'Freies Textfeld für weitere Kennzahlen')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('navigation.back', 'Zurück')}
            </Button>
            
            <Button 
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              {t('kpiInput.submit', 'KPIs speichern & Dashboard öffnen')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};