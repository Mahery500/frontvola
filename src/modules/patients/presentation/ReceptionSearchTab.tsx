/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Eye, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { ASINAState, Patient } from '@/core/types';
import { patientsRepository } from '../infrastructure/patients.repository';

interface ReceptionSearchTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export default function ReceptionSearchTab({ state, updateState, triggerNotification }: ReceptionSearchTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDetailPatient, setViewDetailPatient] = useState<Patient | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      const list = await patientsRepository.findAll();
      if (Array.isArray(list) && list.length > 0) {
        // GET /api/patients renvoie `PatientOutput` (id: string, ex "pat_xxx"),
        // alors que le store legacy attend `Patient` (Id_Patient: number) —
        // voir docs/API_CONTRACTS.md. En l'absence d'un identifiant numérique
        // stable dans PatientOutput, on utilise l'index comme identifiant
        // local temporaire : suffisant pour l'affichage, mais à corriger dès
        // que le backend expose un identifiant numérique ou que le store
        // legacy est migré vers des id de type string.
        const mapped: Patient[] = list.map((raw, idx) => ({
          Id_Patient: idx + 1,
          Matricule: raw.matricule || raw.matriculeAgent || `PAT-${idx + 1}`,
          Nom: raw.nom || '',
          Prenom: raw.prenom || '',
          DateN: raw.dateNaissance || '',
          GS: raw.groupeSanguin || '',
        }));
        updateState({ Patient: mapped });
        triggerNotification('success', `${list.length} patients synchronisés depuis GET /api/patients.`);
      } else {
        triggerNotification('success', 'Base patients synchronisée.');
      }
    } catch {
      triggerNotification('error', 'Erreur lors de la récupération des patients depuis l\'API.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: number, matricule: string) => {
    try {
      await patientsRepository.remove(id);
      updateState({
        Patient: state.Patient.filter(p => p.Id_Patient !== id)
      });
      triggerNotification('success', `Patient [${matricule}] supprimé (DELETE /api/patients/${id}).`);
    } catch {
      triggerNotification('error', `Échec de la suppression du patient [${matricule}] sur l'API.`);
    }
  };

  const filteredPatients = state.Patient.filter(p => {
    const searchString = `${p.Matricule} ${p.Nom} ${p.Prenom}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par matricule, nom ou prénom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 font-mono">
            Patients répertoriés: {filteredPatients.length} / {state.Patient.length}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualiser depuis GET /api/patients"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Actualiser (API)</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Matricule ASINA</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Nom & Prénom</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Date Naissance</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Type / Affiliation</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Groupe Sanguin</th>
              <th className="p-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredPatients.map(p => {
              const isAgent = state.Agent.some(a => a.Id_Patient === p.Id_Patient);
              const isAyantDroit = state.Ayant_Droit.find(d => d.Id_Patient_1 === p.Id_Patient);
              return (
                <tr key={p.Id_Patient} className="hover:bg-gray-50/50">
                  <td className="p-3 font-mono text-xs font-semibold text-gray-900">{p.Matricule}</td>
                  <td className="p-3 text-gray-950 font-medium">{p.Nom} {p.Prenom}</td>
                  <td className="p-3 text-gray-500">{p.DateN}</td>
                  <td className="p-3 text-xs">
                    {isAgent && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        Agent Salarié
                      </span>
                    )}
                    {isAyantDroit && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                        Ayant Droit ({isAyantDroit.Relation === 'CJ' ? 'Conjoint' : `Enfant ${isAyantDroit.Relation}`})
                      </span>
                    )}
                    {!isAgent && !isAyantDroit && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                        Patient Simple
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 text-xs font-bold">{p.GS}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewDetailPatient(p)}
                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        Fiche
                      </button>
                      <button
                        onClick={() => handleDelete(p.Id_Patient, p.Matricule)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        title="Supprimer de l'API (DELETE /api/patients)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal / Preview Detail Patient Card */}
      {viewDetailPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-xl max-w-lg w-full p-6 space-y-6 animate-fade-in">
            <div id="print-area" className="border-4 border-primary/20 rounded-xl p-5 bg-stone-50 space-y-4">
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ASINA MEDICAL</h2>
                  <p className="text-xs text-gray-400">Système Hospitalier & Pharmaceutique</p>
                </div>
                <span className="px-3 py-1 font-mono text-xs bg-primary text-white font-bold rounded">
                  {viewDetailPatient.Matricule}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <span className="block text-xs text-gray-400 font-semibold uppercase">Nom</span>
                  <span className="font-bold text-gray-900">{viewDetailPatient.Nom}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 font-semibold uppercase">Prénom</span>
                  <span className="font-bold text-gray-900">{viewDetailPatient.Prenom}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 font-semibold uppercase">Date de Naissance</span>
                  <span className="font-medium text-gray-800">{viewDetailPatient.DateN}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 font-semibold uppercase">Groupe Sanguin</span>
                  <span className="text-sm font-bold text-red-600">{viewDetailPatient.GS}</span>
                </div>
              </div>

              {state.Agent.some(a => a.Id_Patient === viewDetailPatient.Id_Patient) && (
                <div className="mt-4 pt-3 border-t border-gray-200/60 bg-blue-50/50 -mx-5 -mb-5 p-5 rounded-b-xl grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-gray-400 font-semibold">Employeur</span>
                    {(() => {
                      const ag = state.Agent.find(a => a.Id_Patient === viewDetailPatient.Id_Patient);
                      const ent = state.Entreprise.find(e => e.Id_Entreprise === ag?.Id_Entreprise);
                      return <span className="font-bold text-blue-900">{ent?.Nom || 'N/A'}</span>;
                    })()}
                  </div>
                  <div>
                    <span className="block text-gray-400 font-semibold">N° CNAPS</span>
                    {(() => {
                      const ag = state.Agent.find(a => a.Id_Patient === viewDetailPatient.Id_Patient);
                      return <span className="font-mono font-bold text-blue-900">{ag?.Cnaps || 'N/A'}</span>;
                    })()}
                  </div>
                </div>
              )}

              {state.Ayant_Droit.some(d => d.Id_Patient_1 === viewDetailPatient.Id_Patient) && (
                <div className="mt-4 pt-3 border-t border-gray-200/60 bg-amber-50/50 -mx-5 -mb-5 p-5 rounded-b-xl text-xs">
                  <div>
                    <span className="block text-gray-400 font-semibold">Affiliation Parentale (Bénéficiaire Dépendant)</span>
                    {(() => {
                      const d = state.Ayant_Droit.find(d => d.Id_Patient_1 === viewDetailPatient.Id_Patient);
                      const parent = state.Patient.find(p => p.Id_Patient === d?.Id_Patient);
                      return (
                        <span className="font-semibold text-amber-900">
                          Lien: {d?.Relation === 'CJ' ? 'Conjoint(e)' : `Enfant (${d?.Relation})`} du Salarié {parent?.Nom} {parent?.Prenom} ({parent?.Matricule})
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Imprimer (Système)
              </button>
              <button
                onClick={() => setViewDetailPatient(null)}
                className="btn-primary px-5 py-2 text-sm cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
