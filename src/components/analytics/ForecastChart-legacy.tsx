// Legacy ForecastChart - Redirects to TrendChart with forecast mode
// TODO: Remove after full migration (Q2/2025)

import type { FC } from 'react';
import type { ScorePoint } from '@/types/score-history';
import type { ForecastResult } from '@/lib/forecast';
import { TrendChart } from './TrendChart';

type ForecastChartProps = {
  historicalData: ScorePoint[];
  forecast: ForecastResult;
  showConfidenceInterval?: boolean;
  showTrendLine?: boolean;
  height?: number;
  className?: string;
};

export const ForecastChart: FC<ForecastChartProps> = (props) => {
  return (
    <TrendChart
      data={props.historicalData}
      mode="forecast"
      forecast={props.forecast}
      historicalData={props.historicalData}
      showConfidenceInterval={props.showConfidenceInterval}
      showTrendLine={props.showTrendLine}
      height={props.height}
      className={props.className}
    />
  );
};

export default ForecastChart;