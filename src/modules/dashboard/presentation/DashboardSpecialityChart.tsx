/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { ChartDataItem } from '../domain/dashboard.types';

export interface DashboardSpecialityChartProps {
  data: ChartDataItem[];
}

export const DashboardSpecialityChart: React.FC<DashboardSpecialityChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(x => x.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <Activity className="h-4.5 w-4.5 text-blue-500" />
        Répartition par Spécialité Praticien
      </h4>

      <div className="space-y-3 pt-2">
        {data.map(spec => {
          const pct = (spec.value / maxVal) * 100;
          return (
            <div key={spec.label} className="space-y-1">
              <div className="flex justify-between text-xs text-stone-700 font-semibold">
                <span>{spec.label}</span>
                <span className="font-mono font-bold text-gray-950">{spec.value} actes</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Aucune spécialité trouvée.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardSpecialityChart;
