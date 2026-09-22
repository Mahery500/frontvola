/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ASINAState, Stock_Ajustement, Stock_Ajustement_Detail, Mouvement } from '@/core/types';
import { StockAdjustmentItem } from '../domain/stock.types';

export interface StockAdjustmentsTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export const StockAdjustmentsTab: React.FC<StockAdjustmentsTabProps> = ({
  state,
  updateState,
  activeSiteId,
  triggerNotification,
}) => {
  const [adjustReason, setAdjustReason] = useState('Ajustement inventaire tournant mensuel');
  const [adjustTypeId, setAdjustTypeId] = useState<number>(1);
  const [adjustmentsList, setAdjustmentsList] = useState<StockAdjustmentItem[]>([]);

  const handleGenerateCountingSheet = () => {
    const prefilled = state.Stock.filter(s => s.Id_Site === activeSiteId).map(st => ({
      Id_Lot: st.Id_Lot,
      systeme_q: st.qte,
      actual_q: st.qte
    }));
    setAdjustmentsList(prefilled);
    triggerNotification('success', 'Feuille de comptage chargée avec succès.');
  };

  const handleSaveInventoryAdjustment = () => {
    if (adjustmentsList.length === 0) {
      triggerNotification('error', 'Aucune ligne d\'ajustement déclarée.');
      return;
    }

    const nextAdjustId = state.Stock_Ajustement.length > 0 
      ? Math.max(...state.Stock_Ajustement.map(sa => sa.Id_Stock_Ajustement)) + 1 
      : 1;

    let nextDetailId = state.Stock_Ajustement_Detail.length > 0
      ? Math.max(...state.Stock_Ajustement_Detail.map(sad => sad.Id_Stock_Ajustement_Detail)) + 1
      : 1;

    let nextMvtId = state.Mouvement.length > 0 ? Math.max(...state.Mouvement.map(m => m.Id_Mouvement)) + 1 : 1;

    const newAjustement: Stock_Ajustement = {
      Id_Stock_Ajustement: nextAdjustId,
      Date_: '2026-05-20',
      Raison: adjustReason,
      Id_Ajustement_Type: Number(adjustTypeId)
    };

    const detailsToInsert: Stock_Ajustement_Detail[] = [];
    const movementsToInsert: Mouvement[] = [];

    const updatedStocks = state.Stock.map(currStock => {
      const correction = adjustmentsList.find(x => x.Id_Lot === currStock.Id_Lot && currStock.Id_Site === activeSiteId);
      if (correction) {
        const difference = correction.actual_q - correction.systeme_q;

        detailsToInsert.push({
          Id_Stock_Ajustement_Detail: nextDetailId++,
          systeme_quantity: correction.systeme_q,
          actually_quantity: correction.actual_q,
          difference: difference,
          qte: difference,
          Id_Lot: correction.Id_Lot,
          Id_Stock_Ajustement: nextAdjustId
        });

        movementsToInsert.push({
          Id_Mouvement: nextMvtId++,
          Type: 'AJUSTEMENT',
          qte: Math.abs(difference),
          Id_Mouvement_Type: 3,
          Id_Lot: correction.Id_Lot,
          Id_Site: activeSiteId,
          DateM: '2026-05-20 16:41:52'
        });

        return { ...currStock, qte: correction.actual_q };
      }
      return currStock;
    });

    updateState({
      Stock: updatedStocks,
      Stock_Ajustement: [...state.Stock_Ajustement, newAjustement],
      Stock_Ajustement_Detail: [...state.Stock_Ajustement_Detail, ...detailsToInsert],
      Mouvement: [...state.Mouvement, ...movementsToInsert]
    });

    triggerNotification('success', `Ajustement de stock enregistré. La base locale reflète désormais les quantités physiques réelles.`);
    setAdjustmentsList([]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-start pb-4 border-b border-gray-100 flex-wrap gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Module de Correction et d'Audit de Stock d'Inventaire</h3>
          <p className="text-xs text-gray-400 mt-1">Saisissez les écarts constatés physiquement sur le site actif afin que la base s'aligne automatiquement.</p>
        </div>
        
        <button
          type="button"
          onClick={handleGenerateCountingSheet}
          className="text-xs text-asina-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Générer la Feuille de Comptage Globale du Site
        </button>
      </div>

      {adjustmentsList.length > 0 && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 font-bold tracking-wide uppercase mb-1">Raison ergonomique</label>
              <input 
                type="text" 
                value={adjustReason} 
                onChange={e => setAdjustReason(e.target.value)} 
                className="w-full bg-white border border-gray-300 rounded p-1.5" 
              />
            </div>
            <div>
              <label className="block text-gray-600 font-bold tracking-wide uppercase mb-1">Type d'ajustement</label>
              <select 
                value={adjustTypeId} 
                onChange={e => setAdjustTypeId(Number(e.target.value))} 
                className="w-full bg-white border border-gray-300 rounded p-1.5"
              >
                {state.Ajustement_Type.map(a => (
                  <option key={a.Id_Ajustement_Type} value={a.Id_Ajustement_Type}>{a.Libelle}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-2.5">Médicament</th>
                  <th className="p-2.5">N° Lot</th>
                  <th className="p-2.5 text-center">Quantité Système</th>
                  <th className="p-2.5 text-center">Quantité Physique Comptée</th>
                  <th className="p-2.5 text-center">Écart diagnostiqué</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustmentsList.map((item, idx) => {
                  const lot = state.Lot.find(l => l.Id_Lot === item.Id_Lot);
                  const prod = lot ? state.Produit.find(p => p.Id_Produit === lot.Id_Produit) : null;
                  const diff = item.actual_q - item.systeme_q;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/40">
                      <td className="p-2.5 font-sans font-bold text-gray-900">{prod?.Nom_Commercial}</td>
                      <td className="p-2.5 font-semibold text-stone-500">{lot?.NumLot}</td>
                      <td className="p-2.5 text-center font-bold text-stone-700">{item.systeme_q} btes</td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          value={item.actual_q}
                          onChange={e => {
                            const newval = Number(e.target.value);
                            setAdjustmentsList(adjustmentsList.map((x, i) => i === idx ? { ...x, actual_q: newval } : x));
                          }}
                          className="w-16 bg-white border border-gray-300 text-center py-0.5 rounded text-xs"
                        />
                      </td>
                      <td className={`p-2.5 text-center font-bold font-mono text-xs ${diff === 0 ? 'text-gray-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {diff === 0 ? '0' : diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveInventoryAdjustment}
              className="bg-asina-600 hover:bg-asina-700 text-white py-2 px-6 text-xs font-bold rounded cursor-pointer transition"
            >
              Valider et Enregistrer l'Écart d'Inventaire
            </button>
          </div>
        </div>
      )}

      {adjustmentsList.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          Cliquez sur "Générer la Feuille de Comptage" ci-dessus pour lancer la saisie d'un relevé d'inventaire.
        </div>
      )}
    </div>
  );
};

export default StockAdjustmentsTab;
