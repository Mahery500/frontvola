/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ASINAState, Prescription, Dipensation, Detail_Dispensation, Mouvement } from '@/core/types';

export interface StockDispensationTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export const StockDispensationTab: React.FC<StockDispensationTabProps> = ({
  state,
  updateState,
  activeSiteId,
  triggerNotification,
}) => {
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number>(state.Prescription[0]?.Id_Prescription || 1);
  const [selectedLotForDispensing, setSelectedLotForDispensing] = useState<Record<number, number>>({});
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<number, number>>({});

  const handleProcessDispense = (presc: Prescription) => {
    const prescMeds = state.prescription_medicament.filter(m => m.Id_Prescription === presc.Id_Prescription);
    if (prescMeds.length === 0) {
      triggerNotification('error', 'Aucun médicament dans cette prescription.');
      return;
    }

    const nextDispId = state.Dipensation.length > 0 ? Math.max(...state.Dipensation.map(d => d.Id_Dipensation)) + 1 : 1;
    let nextDispDetId = state.Detail_Dispensation.length > 0 ? Math.max(...state.Detail_Dispensation.map(dd => dd.Id_Detail_Dispensation)) + 1 : 1;
    let nextMvtId = state.Mouvement.length > 0 ? Math.max(...state.Mouvement.map(m => m.Id_Mouvement)) + 1 : 1;

    const newDispensation: Dipensation = {
      Id_Dipensation: nextDispId,
      DateD: '2026-05-20 16:41:52',
      Id_Site: activeSiteId,
      Id_Prescription: presc.Id_Prescription,
      Id_Patient: presc.Id_Patient
    };

    const detailsToInsert: Detail_Dispensation[] = [];
    const movementsToInsert: Mouvement[] = [];

    let isSuccess = true;
    let errorMsg = '';
    const updatedStocks = [...state.Stock];

    prescMeds.forEach((pm, offset) => {
      const chosenLotId = selectedLotForDispensing[pm.Id_Produit] || state.Lot.find(l => l.Id_Produit === pm.Id_Produit)?.Id_Lot;
      const requestedQty = dispenseQuantities[pm.Id_Produit] || 1;

      if (!chosenLotId) {
        isSuccess = false;
        errorMsg = 'Lot non configuré pour le produit de type prescription.';
        return;
      }

      const stockItemIndex = updatedStocks.findIndex(st => st.Id_Lot === chosenLotId && st.Id_Site === activeSiteId);
      if (stockItemIndex === -1 || updatedStocks[stockItemIndex].qte < requestedQty) {
        isSuccess = false;
        errorMsg = `Rupture de Stock : Quantité disponible insuffisante pour le lot sélectionné.`;
        return;
      }

      updatedStocks[stockItemIndex] = {
        ...updatedStocks[stockItemIndex],
        qte: updatedStocks[stockItemIndex].qte - requestedQty
      };

      detailsToInsert.push({
        Id_Detail_Dispensation: nextDispDetId + offset,
        qte: requestedQty,
        Id_Lot: chosenLotId,
        Id_Dipensation: nextDispId
      });

      movementsToInsert.push({
        Id_Mouvement: nextMvtId++,
        Type: 'SORTIE',
        qte: requestedQty,
        Id_Mouvement_Type: 2,
        Id_Lot: chosenLotId,
        Id_Site: activeSiteId,
        DateM: '2026-05-20 16:41:52'
      });
    });

    if (!isSuccess) {
      triggerNotification('error', errorMsg);
      return;
    }

    updateState({
      Stock: updatedStocks,
      Dipensation: [...state.Dipensation, newDispensation],
      Detail_Dispensation: [...state.Detail_Dispensation, ...detailsToInsert],
      Mouvement: [...state.Mouvement, ...movementsToInsert]
    });

    triggerNotification('success', 'Médicaments préparés et dispensés au patient. Stock déduit et mouvements tracés.');
  };

  const activePresc = state.Prescription.find(p => p.Id_Prescription === selectedPrescriptionId);
  const activePatient = activePresc ? state.Patient.find(p => p.Id_Patient === activePresc.Id_Patient) : null;
  const prescMeds = activePresc ? state.prescription_medicament.filter(m => m.Id_Prescription === activePresc.Id_Prescription) : [];
  const prescActes = activePresc ? state.prescription_acte.filter(a => a.Id_Prescription === activePresc.Id_Prescription) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Active prescription picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sélectionner l'ordonnance</h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {state.Prescription.map(presc => {
            const patient = state.Patient.find(p => p.Id_Patient === presc.Id_Patient);
            const doctorProfile = state.StaffProfile.find(sp => sp.Id_staff_profile === presc.Id_staff_profile);
            const doctorUser = state.User_.find(u => u.Id_User === doctorProfile?.Id_User);

            return (
              <button
                key={presc.Id_Prescription}
                type="button"
                onClick={() => {
                  setSelectedPrescriptionId(presc.Id_Prescription);
                  setSelectedLotForDispensing({});
                  setDispenseQuantities({});
                }}
                className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition flex justify-between items-center cursor-pointer ${
                  selectedPrescriptionId === presc.Id_Prescription 
                    ? 'bg-asina-50 text-asina-900 border-asina-300 ring-1 ring-asina-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <span className="font-bold block">{patient?.Nom} {patient?.Prenom}</span>
                  <span className="text-stone-400 block font-normal text-[10px] mt-0.5">Par Dr. {doctorUser?.nom} — le {presc.DatePrescription}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active prescription preparator */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {activePresc ? (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Préparation en cours</span>
                <h4 className="font-bold text-sm text-gray-950">Patient : {activePatient?.Nom} {activePatient?.Prenom}</h4>
              </div>
              <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">PRESC-{activePresc.Id_Prescription}</span>
            </div>

            {/* Medicines table matching Stock availability inside this exact site! */}
            <div className="space-y-4">
              <h5 className="font-bold text-gray-700 tracking-wide uppercase">Composants médicamenteux prescrits</h5>
              <div className="space-y-3">
                {prescMeds.map(pm => {
                  const prod = state.Produit.find(p => p.Id_Produit === pm.Id_Produit);
                  const availableLots = state.Lot.filter(l => l.Id_Produit === pm.Id_Produit);
                  const chosenLotId = selectedLotForDispensing[pm.Id_Produit] || availableLots[0]?.Id_Lot;
                  const stockInfo = state.Stock.find(st => st.Id_Lot === chosenLotId && st.Id_Site === activeSiteId);

                  return (
                    <div key={pm.Id_prescription_medicament} className="bg-stone-50 border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="font-bold text-gray-900 block">{prod?.Nom_Commercial}</span>
                        <span className="text-gray-500 block text-[11px] font-medium mt-0.5">Indications : {pm.posologie} — {pm.frequence} ({pm.duree})</span>
                      </div>

                      <div className="flex gap-4 items-center flex-wrap shrink-0">
                        {/* Lot picker */}
                        <div>
                          <span className="block text-[9px] font-semibold text-gray-400 mb-0.5">LOT PHARMACEUTIQUE</span>
                          <select
                            value={chosenLotId}
                            onChange={e => {
                              const lId = Number(e.target.value);
                              setSelectedLotForDispensing({ ...selectedLotForDispensing, [pm.Id_Produit]: lId });
                            }}
                            className="bg-white border text-[11px] rounded p-1 font-semibold text-stone-700 focus:outline-hidden"
                          >
                            {availableLots.map(avLot => (
                              <option key={avLot.Id_Lot} value={avLot.Id_Lot}>{avLot.NumLot} ({avLot.DateExpiration})</option>
                            ))}
                          </select>
                        </div>

                        {/* Stock status indicator */}
                        <div className="text-center font-mono text-[11px] shrink-0">
                          <span className="block text-[9px] font-semibold text-gray-400 mb-0.5">DISPO SITE</span>
                          <span className={`font-bold ${!stockInfo || stockInfo.qte === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {stockInfo ? `${stockInfo.qte} unités` : 'Rupture'}
                          </span>
                        </div>

                        {/* Dispense Quantity selection */}
                        <div>
                          <span className="block text-[9px] font-semibold text-gray-400 mb-0.5">QTÉ À LIVRER</span>
                          <input
                            type="number"
                            min={1}
                            value={dispenseQuantities[pm.Id_Produit] || 1}
                            onChange={e => {
                              const count = Number(e.target.value);
                              setDispenseQuantities({ ...dispenseQuantities, [pm.Id_Produit]: count });
                            }}
                            className="w-12 bg-white border border-gray-300 text-center rounded p-1 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {prescActes.length > 0 && (
              <div className="bg-amber-50/30 p-3 rounded-lg border border-amber-200">
                <h5 className="font-bold text-amber-900 flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Remarque Infirmerie / Actes prescrits
                </h5>
                <div className="space-y-1">
                  {prescActes.map(act => {
                    const def = state.Acte_Def.find(d => d.Id_Acte_Def === act.Id_Acte_Def);
                    return (
                      <div key={act.Id_prescription_acte} className="p-1 border-b border-amber-100 last:border-0">
                        <span className="font-semibold">{def?.Libelle}</span> (Priorité : <span className="font-bold">{act.priority}</span>)
                        <p className="text-[10px] text-stone-600 mt-0.5">Instructions : {act.instruction}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => handleProcessDispense(activePresc)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmer et Délivrer l'Ordonnance
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-xs">Veuillez sélectionner une prescription.</div>
        )}
      </div>
    </div>
  );
};

export default StockDispensationTab;
