/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { ASINAState } from '@/core/types';

export interface StockMovementsTabProps {
  state: ASINAState;
  activeSiteId: number;
}

export const StockMovementsTab: React.FC<StockMovementsTabProps> = ({ state, activeSiteId }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
        <Activity className="h-5 w-5 text-asina-600" />
        Traçabilité des Mouvements de Stocks du Site courant
      </h3>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-2.5 font-sans font-bold text-gray-700">Date & Heure</th>
              <th className="p-2.5 font-sans font-bold text-gray-700">Type de flux</th>
              <th className="p-2.5 font-sans font-bold text-gray-700">Lot concerné</th>
              <th className="p-2.5 font-sans font-bold text-gray-700">Médicament</th>
              <th className="p-2.5 font-sans font-bold text-gray-700">Quantité impactée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.Mouvement.filter(m => m.Id_Site === activeSiteId).map(mvt => {
              const mvtType = state.Mouvement_Type.find(mt => mt.Id_Mouvement_Type === mvt.Id_Mouvement_Type);
              const lot = state.Lot.find(l => l.Id_Lot === mvt.Id_Lot);
              const prod = lot ? state.Produit.find(p => p.Id_Produit === lot.Id_Produit) : null;

              return (
                <tr key={mvt.Id_Mouvement} className="hover:bg-gray-50/40">
                  <td className="p-2.5 text-stone-500 font-semibold">{mvt.DateM}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      mvt.Type === 'ENTREE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                    }`}>
                      {mvtType?.Libelle || mvt.Type}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-gray-650">{lot?.NumLot}</td>
                  <td className="p-2.5 font-sans font-semibold text-gray-900">{prod?.Nom_Commercial}</td>
                  <td className="p-2.5 font-bold text-stone-850">
                    {mvt.Type === 'ENTREE' ? '+' : '-'}{mvt.qte} boîtes
                  </td>
                </tr>
              );
            })}
            {state.Mouvement.filter(m => m.Id_Site === activeSiteId).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400 font-sans italic text-xs">
                  Aucun mouvement de stock enregistré sur ce site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovementsTab;
