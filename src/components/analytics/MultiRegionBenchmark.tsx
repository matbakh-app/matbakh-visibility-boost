/**
 * Multi-Region Benchmark Component
 * Displays benchmark comparisons across multiple regions for franchise operations
 */

import React, { useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { useMultiRegionBenchmark } from '../../hooks/useBenchmarkComparison';
import { ScoreBenchmark, REGION_MAPPINGS } from '../../services/benchmark-comparison';

interface MultiRegionBenchmarkProps {
  industryId: string;
  regionIds: string[];
  scoreType: string;
  businessScores?: { [regionId: string]: number };
  className?: string;
}

interface RegionComparisonCardProps {
  regionId: string;
  benchmark: ScoreBenchmark;
  businessScore?: number;
}

const RegionComparisonCard: React.FC<RegionComparisonCardProps> = ({
  regionId,
  benchmark,
  businessScore
}) => {
  const regionName = REGION_MAPPINGS[regionId as keyof typeof REGION_MAPPINGS] || regionId;
  
  const calculatePercentile = (score: number, benchmark: ScoreBenchmark) => {
    if (score <= benchmark.percentile_25) {
      return 25 * (score / benchmark.percentile_25);
    } else if (score <= benchmark.percentile_50) {
      return 25 + 25 * ((score - benchmark.percentile_25) / (benchmark.percentile_50 - benchmark.percentile_25));
    } else if (score <= benchmark.percentile_75) {
      return 50 + 25 * ((score - benchmark.percentile_50) / (benchmark.percentile_75 - benchmark.percentile_50));
    } else if (score <= benchmark.percentile_90) {
      return 75 + 15 * ((score - benchmark.percentile_75) / (benchmark.percentile_90 - benchmark.percentile_75));
    } else {
      return 90 + 10 * Math.min(1, (score - benchmark.percentile_90) / (benchmark.percentile_90 * 0.1));
    }
  };

  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentile >= 25) return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  const getPerformanceIcon = (percentile: number) => {
    if (percentile >= 75) return <Award className="w-4 h-4" />;
    if (percentile >= 50) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const percentile = businessScore ? calculatePercentile(businessScore, benchmark) : null;
  const colorClasses = percentile ? getPerformanceColor(percentile) : 'text-gray-500 bg-gray-50 border-gray-200';
  const icon = percentile ? getPerformanceIcon(percentile) : <Target className="w-4 h-4" />;

  return (
    <div className={`rounded-lg border p-4 ${colorClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{regionName}</span>
        </div>
        {percentile && (
          <div className="flex items-center space-x-1">
            {icon}
            <span className="text-sm font-medium">{Math.round(percentile)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Benchmark:</span>
          <span className="font-medium">{benchmark.benchmark_value}</span>
        </div>
        {businessScore && (
          <div className="flex justify-between">
            <span>Ihr Score:</span>
            <span className="font-medium">{businessScore}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Top 25%:</span>
          <span className="font-medium">{benchmark.percentile_75}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Stichprobe:</span>
          <span>{benchmark.sample_size} Betriebe</span>
        </div>
      </div>

      {businessScore && percentile && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-current h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, percentile)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const RegionRankingTable: React.FC<{
  benchmarks: { [regionId: string]: ScoreBenchmark };
  businessScores?: { [regionId: string]: number };
}> = ({ benchmarks, businessScores }) => {
  const regionData = Object.entries(benchmarks).map(([regionId, benchmark]) => {
    const businessScore = businessScores?.[regionId];
    const regionName = REGION_MAPPINGS[regionId as keyof typeof REGION_MAPPINGS] || regionId;
    
    let percentile = null;
    if (businessScore) {
      if (businessScore <= benchmark.percentile_25) {
        percentile = 25 * (businessScore / benchmark.percentile_25);
      } else if (businessScore <= benchmark.percentile_50) {
        percentile = 25 + 25 * ((businessScore - benchmark.percentile_25) / (benchmark.percentile_50 - benchmark.percentile_25));
      } else if (businessScore <= benchmark.percentile_75) {
        percentile = 50 + 25 * ((businessScore - benchmark.percentile_50) / (benchmark.percentile_75 - benchmark.percentile_50));
      } else if (businessScore <= benchmark.percentile_90) {
        percentile = 75 + 15 * ((businessScore - benchmark.percentile_75) / (benchmark.percentile_90 - benchmark.percentile_75));
      } else {
        percentile = 90 + 10 * Math.min(1, (businessScore - benchmark.percentile_90) / (benchmark.percentile_90 * 0.1));
      }
    }

    return {
      regionId,
      regionName,
      benchmark: benchmark.benchmark_value,
      businessScore,
      percentile,
      top25: benchmark.percentile_75
    };
  });

  // Sort by percentile (highest first) if business scores are available
  if (businessScores) {
    regionData.sort((a, b) => (b.percentile || 0) - (a.percentile || 0));
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Benchmark
            </th>
            {businessScores && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ihr Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perzentil
                </th>
              </>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Top 25%
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {regionData.map((region, index) => (
            <tr key={region.regionId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{region.regionName}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {region.benchmark}
              </td>
              {businessScores && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {region.businessScore || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {region.percentile ? (
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          region.percentile >= 75 ? 'text-green-600' :
                          region.percentile >= 50 ? 'text-yellow-600' :
                          region.percentile >= 25 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {Math.round(region.percentile)}%
                        </span>
                        {region.percentile >= 75 && <Award className="w-4 h-4 text-green-600 ml-1" />}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </>
              )}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {region.top25}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MultiRegionBenchmark: React.FC<MultiRegionBenchmarkProps> = ({
  industryId,
  regionIds,
  scoreType,
  businessScores,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const { benchmarks, loading, error } = useMultiRegionBenchmark({
    industryId,
    regionIds,
    scoreType,
    autoFetch: true
  });

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {regionIds.map((regionId) => (
          <div key={regionId} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  const availableRegions = Object.keys(benchmarks);
  
  if (availableRegions.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-gray-600 text-center">
          Keine Benchmark-Daten für die ausgewählten Regionen verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Multi-Region Benchmark Vergleich
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'cards' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Karten
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'table' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tabelle
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRegions.map((regionId) => (
            <RegionComparisonCard
              key={regionId}
              regionId={regionId}
              benchmark={benchmarks[regionId]}
              businessScore={businessScores?.[regionId]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <RegionRankingTable 
            benchmarks={benchmarks} 
            businessScores={businessScores}
          />
        </div>
      )}

      {businessScores && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Franchise-Optimierung Empfehlungen
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Identifizieren Sie Ihre leistungsstärksten Standorte als Best-Practice-Beispiele</li>
            <li>• Übertragen Sie erfolgreiche Strategien auf unterperformende Regionen</li>
            <li>• Berücksichtigen Sie regionale Besonderheiten bei der Strategieanpassung</li>
            <li>• Nutzen Sie lokale Benchmarks für realistische Zielsetzungen</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiRegionBenchmark;