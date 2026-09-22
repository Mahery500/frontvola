/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { ASINAState } from '@/core/types';

export interface StockVisualizerTabProps {
  state: ASINAState;
  activeSiteId: number;
}

export const StockVisualizerTab: React.FC<StockVisualizerTabProps> = ({ state, activeSiteId }) => {
  const getDaysBetween = (expDate: string) => {
    const d1 = new Date('2026-05-20');
    const d2 = new Date(expDate);
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getExpirationBadge = (expDate: string) => {
    const days = getDaysBetween(expDate);
    if (days <= 0) {
      return <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">Expiré !</span>;
    }
    if (days <= 90) {
      return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">{days} j restants (Alerte !)</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">{days} j restants</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-gray-500" />
          État des Stocks sur le Site Actif
        </h3>
        <span className="text-xs bg-gray-100 px-3 py-1 text-gray-700 font-mono font-bold rounded-lg">
          Date de référence : 2026-05-20 (Simulée)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.Site.map(site => {
          const totalItems = state.Stock.filter(st => st.Id_Site === site.Id_Site).reduce((acc, curr) => acc + curr.qte, 0);
          return (
            <div key={site.Id_Site} className={`p-4 rounded-xl border text-center ${site.Id_Site === activeSiteId ? 'bg-cyan-50/50 border-cyan-200 shadow-xs' : 'bg-gray-50/50 border-gray-200'}`}>
              <span className="block text-xs uppercase tracking-wider font-bold text-gray-400">Site : {site.Libelle.split(' ')[0]}</span>
              <span className="block text-xl font-mono font-bold text-gray-950 mt-1">{totalItems} unités</span>
              <span className="block text-[10px] text-gray-400 font-medium">Quantité totale en stock</span>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-xs font-bold text-gray-700 uppercase">Médicament Commercial</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase">N° Lot</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase">Site de stockage</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase">Date Expiration</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase">État de péremption</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase text-right">Quantité En Main</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {state.Stock.map(currStock => {
              const lot = state.Lot.find(l => l.Id_Lot === currStock.Id_Lot);
              const prod = lot ? state.Produit.find(p => p.Id_Produit === lot.Id_Produit) : null;
              const site = state.Site.find(s => s.Id_Site === currStock.Id_Site);
              const cond = prod ? state.Conditionnement.find(c => c.Id_Conditionnement === prod.Id_Conditionnement) : null;

              return (
                <tr key={currStock.Id_Stock} className={`hover:bg-gray-50/40 ${currStock.qte < 20 ? 'bg-amber-50/10' : ''}`}>
                  <td className="p-3">
                    <span className="font-bold text-gray-900 block">{prod?.Nom_Commercial || 'Inconnu'}</span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      <span className="text-[10px] text-stone-400 font-medium">Code: PROD-00{prod?.Id_Produit}</span>
                      {cond && (
                        <span className="text-[10px] text-cyan-800 bg-cyan-50 px-1.5 tracking-wide rounded border border-cyan-200 font-semibold">
                          Format: {cond.Libelle} (1 x {cond.taux_conversion} {cond.Unite_Base})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-600">{lot?.NumLot}</td>
                  <td className="p-3 text-xs text-stone-700 font-semibold">{site?.Libelle}</td>
                  <td className="p-3 font-mono text-xs font-bold text-stone-600">{lot?.DateExpiration}</td>
                  <td className="p-3 text-xs">{lot ? getExpirationBadge(lot.DateExpiration) : 'No lot'}</td>
                  <td className="p-3 text-right">
                    <span className={`font-mono font-bold text-sm ${currStock.qte < 15 ? 'text-red-500' : 'text-gray-950'} block`}>
                      {currStock.qte} boîtes
                    </span>
                    {cond && cond.taux_conversion && (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5" title="Conversion en unité élémentaire de distribution">
                        {currStock.qte * cond.taux_conversion} {cond.Unite_Base}s
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockVisualizerTab;
