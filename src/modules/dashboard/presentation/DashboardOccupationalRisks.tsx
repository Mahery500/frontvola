/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { ChartDataItem } from '../domain/dashboard.types';

export interface DashboardOccupationalRisksProps {
  data: ChartDataItem[];
}

export const DashboardOccupationalRisks: React.FC<DashboardOccupationalRisksProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(x => x.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2 space-y-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
        Médecine du Travail : Prévalence des Facteurs de Sûreté & Risques Professionnels
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3">
          {data.map(rf => {
            const pct = (rf.value / maxVal) * 100;
            return (
              <div key={rf.label} className="space-y-1">
                <div className="flex justify-between text-xs text-stone-700 font-semibold">
                  <span>{rf.label}</span>
                  <span className="font-mono font-bold text-amber-700">{rf.value} cas signalés</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-xs text-gray-400 py-4 text-center">Aucun risque professionnel répertorié.</p>
          )}
        </div>

        <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block text-sm">Rapport de Sûreté Mensuel</span>
            <p className="mt-1">
              Les consultations de médecine du travail détectent des prévalences d'affections musculo-squelettiques particulièrement élevées sur les sites liés aux zones industrielles (Antenne Ivato). 
              Le service recommande d'adapter l'ergonomie des postes de manutention manuelle et d'organiser des séances de sensibilisation préventive pour les équipes d'emballage et de logistique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOccupationalRisks;
