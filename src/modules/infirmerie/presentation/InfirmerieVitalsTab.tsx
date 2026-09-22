/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gauge, Thermometer, Scale, Heart, Wind, Plus, Search } from 'lucide-react';
import { ASINAState, Observation } from '@/core/types';

export interface InfirmerieVitalsTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export const InfirmerieVitalsTab: React.FC<InfirmerieVitalsTabProps> = ({
  state,
  updateState,
  activeSiteId,
  triggerNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);

  // Vital sign state variables
  const [ta, setTa] = useState('12/8');
  const [temp, setTemp] = useState('37.0');
  const [poids, setPoids] = useState('70');
  const [fc, setFc] = useState('75');
  const [spo2, setSpo2] = useState('98');
  const [customType, setCustomType] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const activeEncounters = state.Encounter.filter(enc => 
    enc.Id_Site === activeSiteId && 
    (enc.Statut === 'En attente' || enc.Statut === 'En consultation')
  );

  const selectedEncounter = state.Encounter.find(e => e.Id_Encounter === selectedEncounterId);
  const selectedPatient = selectedEncounter 
    ? state.Patient.find(p => p.Id_Patient === selectedEncounter.Id_Patient)
    : null;

  const handleSaveObservations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter || !selectedPatient) {
      triggerNotification('error', "Veuillez sélectionner un patient en attente dans la liste.");
      return;
    }

    const nextObsId = state.Observation.length > 0 
      ? Math.max(...state.Observation.map(o => o.Id_Observation)) + 1 
      : 1;

    const dateStr = '2026-05-20 16:41:52';
    const newObservations: Observation[] = [
      { Id_Observation: nextObsId, Type: 'TA', Valeur: ta, Unite: 'mmHg', Recorded_at: dateStr, Id_Patient: selectedPatient.Id_Patient, Id_Encounter: selectedEncounter.Id_Encounter },
      { Id_Observation: nextObsId + 1, Type: 'TEMP', Valeur: temp, Unite: '°C', Recorded_at: dateStr, Id_Patient: selectedPatient.Id_Patient, Id_Encounter: selectedEncounter.Id_Encounter },
      { Id_Observation: nextObsId + 2, Type: 'POIDS', Valeur: poids, Unite: 'kg', Recorded_at: dateStr, Id_Patient: selectedPatient.Id_Patient, Id_Encounter: selectedEncounter.Id_Encounter },
      { Id_Observation: nextObsId + 3, Type: 'FC', Valeur: fc, Unite: 'bpm', Recorded_at: dateStr, Id_Patient: selectedPatient.Id_Patient, Id_Encounter: selectedEncounter.Id_Encounter },
      { Id_Observation: nextObsId + 4, Type: 'SPO2', Valeur: spo2, Unite: '%', Recorded_at: dateStr, Id_Patient: selectedPatient.Id_Patient, Id_Encounter: selectedEncounter.Id_Encounter },
    ];

    if (customType.trim() && customValue.trim()) {
      newObservations.push({
        Id_Observation: nextObsId + 5,
        Type: customType.toUpperCase(),
        Valeur: customValue,
        Unite: customUnit,
        Recorded_at: dateStr,
        Id_Patient: selectedPatient.Id_Patient,
        Id_Encounter: selectedEncounter.Id_Encounter
      });
    }

    updateState({
      Observation: [...state.Observation, ...newObservations],
      Encounter: state.Encounter.map(enc => 
        enc.Id_Encounter === selectedEncounter.Id_Encounter 
          ? { ...enc, Statut: 'En consultation' }
          : enc
      )
    });

    triggerNotification('success', `Signes vitaux enregistrés avec succès pour ${selectedPatient.Nom} ${selectedPatient.Prenom}.`);
    
    setCustomType('');
    setCustomValue('');
    setCustomUnit('');
    setSelectedEncounterId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* File d'attente Left column */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
          <span>Patients en attente d'observations</span>
          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
            {activeEncounters.length} en attente
          </span>
        </h3>

        <div className="relative">
          <input
            type="text"
            placeholder="Filtrer par nom ou matricule..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden pl-8"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {activeEncounters
            .filter(enc => {
              const pat = state.Patient.find(p => p.Id_Patient === enc.Id_Patient);
              if (!pat) return false;
              const terms = `${pat.Nom} ${pat.Prenom} ${pat.Matricule}`.toLowerCase();
              return terms.includes(searchQuery.toLowerCase());
            })
            .map(enc => {
              const pat = state.Patient.find(p => p.Id_Patient === enc.Id_Patient)!;
              const isSelected = selectedEncounterId === enc.Id_Encounter;
              const hasSomeVitals = state.Observation.some(obs => obs.Id_Encounter === enc.Id_Encounter);
              return (
                <button
                  key={enc.Id_Encounter}
                  type="button"
                  onClick={() => setSelectedEncounterId(enc.Id_Encounter)}
                  className={`w-full p-3 rounded-lg border text-left text-xs transition block cursor-pointer ${
                    isSelected 
                      ? 'border-cyan-600 bg-cyan-50/50 shadow-xs ring-1 ring-cyan-200' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 block">{pat.Nom} {pat.Prenom}</span>
                    <span className="font-mono text-[9px] text-cyan-700 font-bold">#{pat.Matricule}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                    <span className="block italic">Motif: "{enc.Motif}"</span>
                    <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-slate-100">
                      <span className="text-slate-400">Statut: {enc.Statut}</span>
                      {hasSomeVitals && (
                        <span className="text-emerald-600 font-semibold">✓ Constantes déjà saisies</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

          {activeEncounters.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Aucun patient en attente de consultation pour ce site.
            </div>
          )}
        </div>
      </div>

      {/* Saisie Constantes Form Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Formulaire Clinique d'Observations</h3>
          {selectedPatient ? (
            <div className="mt-2 p-3 bg-cyan-50/50 rounded-lg border border-cyan-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Patient sélectionné :</span>
                <strong className="text-slate-900 ml-1">{selectedPatient.Nom} {selectedPatient.Prenom}</strong>
                <span className="text-[10px] text-slate-400 font-mono ml-2">({selectedPatient.GS})</span>
              </div>
              <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Consultation #{selectedEncounterId}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Sélectionnez un patient à gauche pour démarrer la saisie des observations de signes vitaux.
            </p>
          )}
        </div>

        <form onSubmit={handleSaveObservations} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Tension */}
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Tension Artérielle</span>
                <Gauge className="h-3.5 w-3.5 text-cyan-600" />
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  required
                  disabled={!selectedPatient}
                  value={ta}
                  onChange={e => setTa(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold focus:outline-hidden"
                  placeholder="EX: 12/8"
                />
                <span className="text-[10px] font-semibold text-slate-400">mmHg</span>
              </div>
            </div>

            {/* Température */}
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Température</span>
                <Thermometer className="h-3.5 w-3.5 text-rose-500" />
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  required
                  disabled={!selectedPatient}
                  value={temp}
                  onChange={e => setTemp(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold focus:outline-hidden"
                  placeholder="EX: 37.2"
                />
                <span className="text-[10px] font-semibold text-slate-400">°C</span>
              </div>
            </div>

            {/* Poids */}
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Masse Corporelle</span>
                <Scale className="h-3.5 w-3.5 text-amber-500" />
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  required
                  disabled={!selectedPatient}
                  value={poids}
                  onChange={e => setPoids(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold focus:outline-hidden"
                  placeholder="EX: 68.5"
                />
                <span className="text-[10px] font-semibold text-slate-400">kg</span>
              </div>
            </div>

            {/* Pouls / Fréquence Cardiaque */}
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Fréquence Cardiaque</span>
                <Heart className="h-3.5 w-3.5 text-rose-600" />
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  required
                  disabled={!selectedPatient}
                  value={fc}
                  onChange={e => setFc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold focus:outline-hidden"
                  placeholder="EX: 72"
                />
                <span className="text-[10px] font-semibold text-slate-400">bpm</span>
              </div>
            </div>

            {/* Saturation en Oxygène (SpO2) */}
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Saturation Oxygène</span>
                <Wind className="h-3.5 w-3.5 text-cyan-600" />
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  required
                  disabled={!selectedPatient}
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold focus:outline-hidden"
                  placeholder="EX: 98"
                />
                <span className="text-[10px] font-semibold text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Autre Paramètre personnalisé */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Observation Complémentaire Optionnelle (ex: Glycémie capillaire, Bandelette)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Type de Constante</label>
                <input
                  type="text"
                  placeholder="EX: GLYCEMIE"
                  disabled={!selectedPatient}
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Valeur</label>
                <input
                  type="text"
                  placeholder="EX: 1.12"
                  disabled={!selectedPatient}
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Unité</label>
                <input
                  type="text"
                  placeholder="EX: g/L"
                  disabled={!selectedPatient}
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedPatient}
            className={`w-full py-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              selectedPatient 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="h-4 w-4" /> Injecter et Transmettre au Médecin
          </button>
        </form>
      </div>
    </div>
  );
};

export default InfirmerieVitalsTab;
