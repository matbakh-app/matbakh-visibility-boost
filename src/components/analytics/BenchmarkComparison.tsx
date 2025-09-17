/**
 * Benchmark Comparison Component
 * Displays business performance compared to industry and regional benchmarks
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Award, AlertTriangle } from 'lucide-react';
import { BenchmarkComparisonService, BenchmarkComparison, IndustryBenchmarkRequest } from '../../services/benchmark-comparison';
import { supabase } from '../../lib/supabase';

interface BenchmarkComparisonProps {
  businessId: string;
  industryId: string;
  regionId: string;
  scoreType: string;
  currentScore: number;
  businessMetadata?: {
    size?: string;
    type?: string;
    location_count?: number;
  };
  className?: string;
}

interface BenchmarkIndicatorProps {
  comparison: BenchmarkComparison;
  scoreType: string;
}

const BenchmarkIndicator: React.FC<BenchmarkIndicatorProps> = ({ comparison, scoreType }) => {
  const getPerformanceColor = (category: BenchmarkComparison['performance_category']) => {
    switch (category) {
      case 'well_above': return 'text-green-600 bg-green-50 border-green-200';
      case 'above': return 'text-green-500 bg-green-50 border-green-200';
      case 'average': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'below': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'well_below': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceIcon = (category: BenchmarkComparison['performance_category']) => {
    switch (category) {
      case 'well_above': return <Award className="w-5 h-5" />;
      case 'above': return <TrendingUp className="w-5 h-5" />;
      case 'average': return <Minus className="w-5 h-5" />;
      case 'below': return <TrendingDown className="w-5 h-5" />;
      case 'well_below': return <AlertTriangle className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getPerformanceText = (category: BenchmarkComparison['performance_category']) => {
    switch (category) {
      case 'well_above': return 'Deutlich überdurchschnittlich';
      case 'above': return 'Überdurchschnittlich';
      case 'average': return 'Durchschnittlich';
      case 'below': return 'Unterdurchschnittlich';
      case 'well_below': return 'Deutlich unterdurchschnittlich';
      default: return 'Unbekannt';
    }
  };

  const colorClasses = getPerformanceColor(comparison.performance_category);
  const icon = getPerformanceIcon(comparison.performance_category);
  const performanceText = getPerformanceText(comparison.performance_category);

  return (
    <div className={`rounded-lg border p-4 ${colorClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium">{performanceText}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{comparison.percentile_rank}. Perzentil</div>
          <div className="text-sm opacity-75">{comparison.business_score} / {comparison.benchmark_value}</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Branchenposition:</span>
          <span className="font-medium">{comparison.industry_position}</span>
        </div>
        <div className="flex justify-between">
          <span>Regionale Position:</span>
          <span className="font-medium">{comparison.regional_position}</span>
        </div>
        {comparison.improvement_potential > 0 && (
          <div className="flex justify-between">
            <span>Verbesserungspotential:</span>
            <span className="font-medium">+{comparison.improvement_potential} Punkte</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-current h-2 rounded-full transition-all duration-500"
            style={{ width: `${comparison.percentile_rank}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const RecommendationsList: React.FC<{ recommendations: string[] }> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
        <Target className="w-4 h-4 mr-2" />
        Empfehlungen zur Verbesserung
      </h4>
      <ul className="space-y-1 text-sm text-blue-800">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
            {recommendation}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  businessId,
  industryId,
  regionId,
  scoreType,
  currentScore,
  businessMetadata,
  className = ''
}) => {
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBenchmarkComparison = async () => {
      try {
        setLoading(true);
        setError(null);

        const benchmarkService = new BenchmarkComparisonService(supabase);
        
        const request: IndustryBenchmarkRequest = {
          business_id: businessId,
          industry_id: industryId,
          region_id: regionId,
          score_type: scoreType,
          current_score: currentScore,
          business_metadata: businessMetadata
        };

        const result = await benchmarkService.compareToBenchmark(request);
        
        if (result) {
          setComparison(result);
        } else {
          setError('Benchmark-Daten für diese Branche/Region nicht verfügbar');
        }
      } catch (err) {
        console.error('Error fetching benchmark comparison:', err);
        setError('Fehler beim Laden der Benchmark-Daten');
      } finally {
        setLoading(false);
      }
    };

    if (businessId && industryId && regionId && scoreType && currentScore !== undefined) {
      fetchBenchmarkComparison();
    }
  }, [businessId, industryId, regionId, scoreType, currentScore, businessMetadata]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center text-yellow-800">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-gray-600 text-center">
          Keine Benchmark-Daten verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Benchmark-Vergleich
        </h3>
        <div className="text-sm text-gray-500">
          {scoreType.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      <BenchmarkIndicator comparison={comparison} scoreType={scoreType} />
      
      <RecommendationsList recommendations={comparison.recommendations} />
    </div>
  );
};

export default BenchmarkComparison;