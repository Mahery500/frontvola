/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { ASINAState, Patient } from '@/core/types';

export interface DoctorClinicalRecordsTabProps {
  state: ASINAState;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export const DoctorClinicalRecordsTab: React.FC<DoctorClinicalRecordsTabProps> = ({
  state,
  selectedPatient,
  onSelectPatient,
}) => {
  const [patientSearch, setPatientSearch] = useState('');

  const filteredPatients = state.Patient.filter(p => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase().trim();
    return p.Nom.toLowerCase().includes(q) ||
      p.Prenom.toLowerCase().includes(q) ||
      p.Matricule.toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List of patients on the left */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-700" />
            Sélectionner un dossier
          </h3>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              placeholder="Filtrer nom ou matricule..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-600"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredPatients.map(p => (
            <button
              key={p.Id_Patient}
              type="button"
              onClick={() => onSelectPatient(p)}
              className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition flex justify-between items-center cursor-pointer ${
                selectedPatient?.Id_Patient === p.Id_Patient 
                  ? 'bg-cyan-50 text-cyan-900 border-cyan-300 ring-1 ring-cyan-200' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div>
                <span className="font-bold block">{p.Nom} {p.Prenom}</span>
                <span className="text-stone-400 block font-mono text-[10px] mt-0.5">{p.Matricule}</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] bg-rose-50 text-rose-700 rounded font-bold">{p.GS}</span>
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Aucun patient correspondant.</p>
          )}
        </div>
      </div>

      {/* Patient medical file content on the right */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {selectedPatient ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Dossier Clinique Général Hospitalier</span>
                <h3 className="text-lg font-bold text-gray-900">{selectedPatient.Nom} {selectedPatient.Prenom}</h3>
              </div>
              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded font-bold">
                {selectedPatient.Matricule}
              </span>
            </div>

            {/* Grid stats/constants */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Historique des constantes vitales (Médecin + Infirmerie)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['TA', 'TEMP', 'POIDS', 'FC', 'SPO2'].map(type => {
                  const observationsOfType = state.Observation.filter(o => {
                    if (o.Id_Patient !== selectedPatient.Id_Patient) return false;
                    const t = o.Type.toUpperCase();
                    if (type === 'TA') return t === 'TA' || t.includes('TENSION') || t.includes('TAILLE');
                    if (type === 'TEMP') return t === 'TEMP' || t.includes('TEMPÉ');
                    if (type === 'POIDS') return t === 'POIDS' || t.includes('POID');
                    if (type === 'FC') return t === 'FC' || t.includes('FRÉQUENCE') || t.includes('POULS');
                    if (type === 'SPO2') return t === 'SPO2';
                    return false;
                  });
                  const lastObs = observationsOfType[observationsOfType.length - 1];
                  return (
                    <div key={type} className="bg-stone-50 p-3 rounded-lg border border-gray-200/60 text-center">
                      <span className="block text-[10px] font-bold text-stone-400">{type}</span>
                      <span className="block text-sm font-bold text-gray-900 mt-1">{lastObs?.valeur || '—'} {lastObs?.unite || ''}</span>
                      {lastObs && <span className="block text-[8px] text-emerald-600 font-semibold">le {lastObs.Recorded_at.split(' ')[0]}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostiques List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Diagnostics Posés ({state.Diagnostique.filter(d => d.Id_Patient === selectedPatient.Id_Patient).length})
              </h4>
              <div className="space-y-2">
                {state.Diagnostique.filter(d => d.Id_Patient === selectedPatient.Id_Patient).map(diag => {
                  const definition = state.Diagnostique_def.find(df => df.Id_Diagnostique_def === diag.Id_Diagnostique_def);
                  return (
                    <div key={diag.Id_Diagnostique} className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200 text-xs">
                      <div>
                        <span className="font-bold text-gray-800">[{definition?.Code}] {definition?.Libelle}</span>
                        <span className="block text-gray-400 font-medium text-[10px] sm:inline sm:ml-2">Degré de certitude : <strong>{diag.Certitude}</strong></span>
                      </div>
                    </div>
                  );
                })}
                {state.Diagnostique.filter(d => d.Id_Patient === selectedPatient.Id_Patient).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Aucun diagnostic antérieur enregistré.</p>
                )}
              </div>
            </div>

            {/* Past Encounters list */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chronologie des Consultations & Actes</h4>
              <div className="space-y-4">
                {state.Encounter.filter(enc => enc.Id_Patient === selectedPatient.Id_Patient).map(enc => {
                  const doctor = state.StaffProfile.find(sp => sp.Id_staff_profile === enc.Id_staff_profile);
                  const docUser = state.User_.find(u => u.Id_User === doctor?.Id_User);
                  const service = state.Service.find(s => s.Id_Service === enc.Id_Service);

                  return (
                    <div key={enc.Id_Encounter} className="bg-white p-4 rounded-xl border border-gray-150 shadow-2xs space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Date: {enc.DateE}</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-100 font-bold text-[10px]">
                          {service?.Libelle} (Dr {docUser?.nom})
                        </span>
                      </div>
                      <div>
                        <span className="block font-bold text-stone-800">Motif d'entrée :</span>
                        <p className="text-stone-600 mt-0.5 leading-relaxed">"{enc.Motif}"</p>
                      </div>
                      {enc.Note && (
                        <div>
                          <span className="block font-bold text-stone-800">Observations et conclusions cliniques :</span>
                          <p className="text-stone-600 mt-0.5 leading-relaxed bg-stone-50 p-2 rounded">"{enc.Note}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {state.Encounter.filter(enc => enc.Id_Patient === selectedPatient.Id_Patient).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Aucune consultation passée enregistrée.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 text-sm">
            Sélectionnez un patient à gauche pour afficher son dossier historique clinique complet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorClinicalRecordsTab;
