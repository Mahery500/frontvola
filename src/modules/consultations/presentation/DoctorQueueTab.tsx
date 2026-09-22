/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, HeartPulse, ArrowRight } from 'lucide-react';
import { ASINAState, Encounter } from '@/core/types';

export interface DoctorQueueTabProps {
  state: ASINAState;
  activeSiteId: number;
  activeServiceId: number;
  onStartConsultation: (encounter: Encounter) => void;
}

export const DoctorQueueTab: React.FC<DoctorQueueTabProps> = ({
  state,
  activeSiteId,
  activeServiceId,
  onStartConsultation,
}) => {
  const waitingPatientsEncounters = state.Encounter.filter(enc => 
    enc.Statut === 'En attente' && 
    enc.Id_Site === activeSiteId && 
    enc.Id_Service === activeServiceId
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-cyan-700" />
          Derniers arrivés dans le service
        </h3>
        <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
          {waitingPatientsEncounters.length} patient(s) en attente
        </span>
      </div>

      {waitingPatientsEncounters.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          <HeartPulse className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          Aucun patient en attente dans ce service pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waitingPatientsEncounters.map(enc => {
            const p = state.Patient.find(patient => patient.Id_Patient === enc.Id_Patient);
            const queueService = state.Service.find(s => s.Id_Service === enc.Id_Service);
            const vitals = state.Observation.filter(o => o.Id_Encounter === enc.Id_Encounter || (o.Id_Patient === enc.Id_Patient && o.DateObs.startsWith('2026-05-20')));

            return (
              <div key={enc.Id_Encounter} className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 transition">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] font-bold text-slate-400">Matricule: {p?.Matricule}</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-rose-50 text-rose-700 rounded font-bold">{p?.GS}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{p?.Nom} {p?.Prenom}</h4>
                  <span className="text-xs text-slate-600 block leading-relaxed line-clamp-2">
                    Motif : <strong className="text-slate-800">{enc.Motif}</strong>
                  </span>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Arrivée : {enc.DateE.split(' ')[1] || enc.DateE}</span>
                    <span className="text-cyan-800 font-semibold">{queueService?.Libelle}</span>
                  </div>

                  {/* Vitals quick preview if taken by nurse */}
                  {vitals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                      {vitals.slice(0, 3).map(v => (
                        <span key={v.Id_Observation} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                          {v.Type}: {v.Valeur}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStartConsultation(enc)}
                  className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Prendre en Consultation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorQueueTab;
