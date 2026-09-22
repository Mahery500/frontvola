/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { ASINAState, Actes, Act_Result } from '@/core/types';

export interface InfirmerieActesTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export const InfirmerieActesTab: React.FC<InfirmerieActesTabProps> = ({
  state,
  updateState,
  activeSiteId,
  triggerNotification,
}) => {
  const [executionNotes, setExecutionNotes] = useState('');
  const [execResultType, setExecResultType] = useState('SUCCES');
  const [execResultVal, setExecResultVal] = useState('Réalisé avec succès');

  const prescribedActes = state.prescription_acte.filter(pa => {
    const presc = state.Prescription.find(p => p.Id_Prescription === pa.Id_Prescription);
    if (!presc) return false;

    const relatedEnc = state.Encounter.find(enc => 
      enc.Id_Patient === presc.Id_Patient && 
      enc.Id_Site === activeSiteId &&
      enc.Statut !== 'Terminé'
    );
    if (!relatedEnc) return false;

    // Exclude if already executed in state.Actes for this encounter
    const alreadyDone = state.Actes.some(a => 
      a.Id_Encounter === relatedEnc.Id_Encounter && 
      a.Id_Acte_Def === pa.Id_Acte_Def
    );
    return !alreadyDone;
  });

  const handleExecuteActe = (paId: number) => {
    const prescActe = state.prescription_acte.find(pa => pa.Id_prescription_acte === paId);
    if (!prescActe) return;

    const prescription = state.Prescription.find(p => p.Id_Prescription === prescActe.Id_Prescription);
    if (!prescription) return;

    const activeEnc = state.Encounter.find(enc => 
      enc.Id_Patient === prescription.Id_Patient && 
      enc.Id_Site === activeSiteId &&
      enc.Statut !== 'Terminé'
    );

    if (!activeEnc) {
      triggerNotification('error', "Aucune consultation active trouvée pour ce patient sur ce site.");
      return;
    }

    const nextActeId = state.Actes.length > 0 ? Math.max(...state.Actes.map(a => a.Id_Actes)) + 1 : 1;
    const newActe: Actes = {
      Id_Actes: nextActeId,
      note: executionNotes || `Soin paramédical exécuté par le service d'infirmerie.`,
      Id_Encounter: activeEnc.Id_Encounter,
      Id_Acte_Def: prescActe.Id_Acte_Def,
      Id_Patient: prescription.Id_Patient
    };

    const nextResultId = state.Act_Result.length > 0 ? Math.max(...state.Act_Result.map(r => r.Id_Act_Result)) + 1 : 1;
    const newResult: Act_Result = {
      Id_Act_Result: nextResultId,
      Type: execResultType,
      result_: execResultVal || 'Effectué',
      Id_Actes: nextActeId
    };

    updateState({
      Actes: [...state.Actes, newActe],
      Act_Result: [...state.Act_Result, newResult]
    });

    const acteName = state.Acte_Def.find(ad => ad.Id_Acte_Def === prescActe.Id_Acte_Def)?.Libelle || 'Acte';
    triggerNotification('success', `Le soin paramédical "${acteName}" a été validé et archivé.`);
    setExecutionNotes('');
    setExecResultVal('Réalisé avec succès');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
      {/* Prescribed actes waiting execution */}
      <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between items-center">
          <span>Feuille d'Actes & Soins infirmiers prescrits</span>
          <span className="text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-full font-bold">
            {prescribedActes.length} Soins en attente
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {prescribedActes.map(pa => {
            const specActeDef = state.Acte_Def.find(ad => ad.Id_Acte_Def === pa.Id_Acte_Def);
            const presc = state.Prescription.find(p => p.Id_Prescription === pa.Id_Prescription)!;
            const patient = state.Patient.find(p => p.Id_Patient === presc.Id_Patient)!;
            const doc = state.StaffProfile.find(sp => sp.Id_staff_profile === presc.Id_staff_profile);
            const docUser = doc ? state.User_.find(u => u.Id_User === doc.Id_User) : null;
            
            return (
              <div key={pa.Id_prescription_acte} className="py-4 first:pt-0 hover:bg-slate-50/40 transition p-2 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                        pa.priority === 'Urgent' 
                          ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pa.priority}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Patient: {patient?.Nom} {patient?.Prenom}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({patient?.Matricule})</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                      Soin prescrit : {specActeDef?.Libelle || 'Soin général'}
                    </h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 italic">
                      Instruction prescripteur : "{pa.instruction}"
                    </p>
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Prescrit par :</span>
                    <span className="text-xs font-semibold text-slate-800">
                      Dr {docUser ? `${docUser.nom} ${docUser.prenom}` : 'Consultant'}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">{presc.DatePrescription}</span>
                  </div>
                </div>

                {/* Simple Execution block */}
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-300 mt-4 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-700">Rapport de Validation Clinique :</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Notes cliniques d'administration</label>
                      <input
                        type="text"
                        placeholder="EX: Soin fait sans réaction, pansement changé à blanc."
                        className="bg-white border border-slate-300 rounded p-1.5 w-full focus:outline-hidden text-xs"
                        onChange={e => setExecutionNotes(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 font-semibold">Statut résultat</label>
                        <select
                          className="bg-white border border-slate-300 rounded p-1.5 w-full text-xs"
                          value={execResultType}
                          onChange={e => setExecResultType(e.target.value)}
                        >
                          <option value="SUCCES">Succès / Administré</option>
                          <option value="OBSERVATION">Avec observation</option>
                          <option value="COMPLICATION">Incident / Réaction</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1 font-semibold">Symptômes liés</label>
                        <input
                          type="text"
                          value={execResultVal}
                          onChange={e => setExecResultVal(e.target.value)}
                          placeholder="EX: Constante stable"
                          className="bg-white border border-slate-300 rounded p-1.5 w-full text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleExecuteActe(pa.Id_prescription_acte)}
                      className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" /> Signer et clôturer l'acte paramédical
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {prescribedActes.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aucun soin paramédical prescrit en attente d'administration sur ce site.
            </div>
          )}
        </div>
      </div>

      {/* Guidelines info panel right column */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 h-fit">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-cyan-700" /> Protocoles cliniques de soins
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Chaque acte d'infirmerie réalisé est lié au dossier d'admission (Encounter). La validation de l'acte l'enregistre en temps réel afin que le médecin prescripteur puisse en consulter le résultat directement lors des examens de contrôle.
        </p>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[11px] text-slate-650 space-y-2">
          <h4 className="font-bold text-slate-800">Urgences Générales :</h4>
          <p className="text-slate-600 leading-relaxed">
            En cas de tension &lt; 90/60 ou &gt; 180/110, de SpO2 &lt; 92%, ou de température &gt; 39.5°C, alerter immédiatement le médecin d'astreinte.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfirmerieActesTab;
