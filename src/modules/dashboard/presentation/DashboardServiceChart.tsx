/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ChartDataItem } from '../domain/dashboard.types';

export interface DashboardServiceChartProps {
  data: ChartDataItem[];
}

export const DashboardServiceChart: React.FC<DashboardServiceChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(x => x.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <BarChart3 className="h-4.5 w-4.5 text-asina-600" />
        Consultations par Service Médical
      </h4>

      <div className="space-y-3 pt-2">
        {data.map(serv => {
          const pct = (serv.value / maxVal) * 100;
          return (
            <div key={serv.label} className="space-y-1">
              <div className="flex justify-between text-xs text-stone-700 font-semibold">
                <span>{serv.label}</span>
                <span className="font-mono font-bold text-gray-950">{serv.value} séances</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-asina-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Aucune donnée de service disponible.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardServiceChart;
