import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { KPI_PORTFOLIO, KpiOption } from './KpiPortfolio';

interface KpiEntry {
  key: string;
  value: string;
}

interface KpiSelectorProps {
  selectedKpis: KpiEntry[];
  onChange: (kpis: KpiEntry[]) => void;
  language: 'de' | 'en';
}

export const KpiSelector: React.FC<KpiSelectorProps> = ({
  selectedKpis,
  onChange,
  language
}) => {
  const { t } = useTranslation('onboarding');

  const addKpi = () => {
    onChange([...selectedKpis, { key: '', value: '' }]);
  };

  const removeKpi = (index: number) => {
    const newKpis = selectedKpis.filter((_, i) => i !== index);
    onChange(newKpis);
  };

  const updateKpi = (index: number, field: 'key' | 'value', value: string) => {
    const newKpis = [...selectedKpis];
    newKpis[index] = { ...newKpis[index], [field]: value };
    onChange(newKpis);
  };

  const getAvailableKpis = (currentIndex: number) => {
    const usedKeys = selectedKpis
      .map((kpi, index) => index !== currentIndex ? kpi.key : null)
      .filter(Boolean);
    
    return KPI_PORTFOLIO.filter(kpi => !usedKeys.includes(kpi.key));
  };

  const getKpiLabel = (kpiKey: string) => {
    const kpi = KPI_PORTFOLIO.find(k => k.key === kpiKey);
    return kpi ? kpi.label[language] : '';
  };

  const getKpiUnit = (kpiKey: string) => {
    const kpi = KPI_PORTFOLIO.find(k => k.key === kpiKey);
    return kpi?.unit || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {t('kpiInput.additionalKpis', 'Weitere KPIs')}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addKpi}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('kpiInput.addKpi', 'KPI hinzufügen')}
        </Button>
      </div>

      {selectedKpis.map((kpi, index) => (
        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="flex-1">
            <Select
              value={kpi.key}
              onValueChange={(value) => updateKpi(index, 'key', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('kpiInput.selectKpi', 'KPI auswählen')} />
              </SelectTrigger>
              <SelectContent>
                {getAvailableKpis(index).map((kpiOption) => (
                  <SelectItem key={kpiOption.key} value={kpiOption.key}>
                    {kpiOption.label[language]}
                    {kpiOption.unit && ` (${kpiOption.unit})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder={t('kpiInput.enterValue', 'Wert eingeben')}
                value={kpi.value}
                onChange={(e) => updateKpi(index, 'value', e.target.value)}
                disabled={!kpi.key}
              />
              {kpi.key && getKpiUnit(kpi.key) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {getKpiUnit(kpi.key)}
                </div>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeKpi(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {selectedKpis.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>{t('kpiInput.noKpis', 'Keine zusätzlichen KPIs ausgewählt')}</p>
          <p className="text-sm">
            {t('kpiInput.clickAdd', 'Klicken Sie auf "KPI hinzufügen" um zu beginnen')}
          </p>
        </div>
      )}
    </div>
  );
};