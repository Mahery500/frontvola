/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, Check, AlertTriangle } from 'lucide-react';
import { ASINAState } from '@/core/types';
import type { PatientOutput } from '@/core/api-contracts';
import { agentsRepository } from '@/modules/administration/infrastructure/agents.repository';
import { patientsRepository } from '../infrastructure/patients.repository';

interface ReceptionRegisterTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

/**
 * Onglet "Enregistrement".
 *
 * Découverte importante en comparant au schéma OpenAPI réel (voir
 * docs/API_CONTRACTS.md) : il n'existe AUCUN moyen de créer un patient
 * "de zéro" via l'API. `POST /api/agents` ne fait que rattacher un rôle
 * salarié (cnaps, fonction, idEntreprise) à un `idPatient` qui doit déjà
 * exister. Le seul moyen d'introduire une nouvelle personne est l'import
 * Excel en masse (`POST /api/import-patients`, voir ReceptionImportTab).
 *
 * Ce formulaire est donc repensé en "promotion" : on choisit un patient
 * déjà connu (venant de GET /api/patients) qui n'est pas encore agent, et
 * on lui attribue les informations professionnelles. Voir
 * docs/API_MANQUANTES.md pour la vraie création de patient à demander
 * côté backend.
 */
export default function ReceptionRegisterTab({ state, updateState, triggerNotification }: ReceptionRegisterTabProps) {
  const [patients, setPatients] = useState<PatientOutput[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [cnaps, setCnaps] = useState('');
  const [fonction, setFonction] = useState('');
  const [selectedEntreprise, setSelectedEntreprise] = useState<number>(state.Entreprise[0]?.Id_Entreprise || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPatients(true);
    patientsRepository.findAll()
      .then(list => { if (!cancelled) setPatients(list); })
      .catch(() => { if (!cancelled) triggerNotification('error', 'Impossible de charger les patients depuis GET /api/patients.'); })
      .finally(() => { if (!cancelled) setIsLoadingPatients(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un patient déjà agent (idAgent renseigné) n'a pas besoin d'être promu à nouveau.
  const promotablePatients = useMemo(
    () => patients.filter(p => !p.idAgent),
    [patients]
  );

  const executePromoteToAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      triggerNotification('error', 'Veuillez sélectionner un patient.');
      return;
    }
    if (!state.Entreprise.some(ent => ent.Id_Entreprise === selectedEntreprise)) {
      triggerNotification('error', 'Entreprise employeur non spécifiée ou inexistante.');
      return;
    }

    // ATTENTION : CreateAgentInput.idPatient est typé "integer" côté OpenAPI
    // alors que PatientOutput.id est une STRING (ex "pat_xxx") — écart de
    // contrat à vérifier avec le backend (voir docs/API_CONTRACTS.md et
    // docs/API_MANQUANTES.md). En attendant, on tente une conversion
    // numérique best-effort.
    const idPatientNumeric = Number(selectedPatientId);
    if (!Number.isFinite(idPatientNumeric)) {
      triggerNotification(
        'error',
        `Impossible de convertir l'identifiant patient "${selectedPatientId}" en entier pour POST /api/agents (idPatient attend un integer). À clarifier avec le backend — voir docs/API_MANQUANTES.md.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAgent = await agentsRepository.create({
        cnaps: cnaps || undefined,
        fonction: fonction || undefined,
        idPatient: idPatientNumeric,
        idEntreprise: selectedEntreprise,
      });

      updateState({
        Agent: [
          ...state.Agent.filter(a => a.Id_Patient !== createdAgent.idPatient),
          {
            Id_Patient: createdAgent.idPatient ?? idPatientNumeric,
            Cnaps: createdAgent.cnaps || cnaps || 'N/A',
            Matricule: createdAgent.matricule || '',
            Id_Entreprise: createdAgent.idEntreprise ?? selectedEntreprise,
          },
        ],
      });

      triggerNotification('success', `Salarié enregistré (POST /api/agents)${createdAgent.matricule ? ` — Matricule : ${createdAgent.matricule}` : ''}.`);
      setSelectedPatientId('');
      setCnaps('');
      setFonction('');
    } catch {
      triggerNotification('error', "Échec de l'enregistrement du salarié sur l'API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <form onSubmit={executePromoteToAgent} className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-500" />
            Rattacher un Salarié à une Entreprise
          </h3>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            L'API ne permet pas encore de créer un nouveau patient ici (voir <code>docs/API_MANQUANTES.md</code>).
            Ce formulaire sélectionne un patient déjà connu du système (import Excel) et lui attribue un statut de salarié.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Patient (déjà enregistré, pas encore salarié)
            </label>
            <select
              required
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              disabled={isLoadingPatients}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">{isLoadingPatients ? 'Chargement...' : 'Sélectionner un patient'}</option>
              {promotablePatients.map(p => (
                <option key={p.id} value={p.id ?? ''}>
                  {p.nom} {p.prenom} {p.matricule ? `(${p.matricule})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Entreprise Employeur</label>
              <select
                value={selectedEntreprise}
                onChange={e => setSelectedEntreprise(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
              >
                {state.Entreprise.map(ent => (
                  <option key={ent.Id_Entreprise} value={ent.Id_Entreprise}>{ent.Nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro CNAPS</label>
              <input
                type="text"
                placeholder="Ex: 501-83120"
                value={cnaps}
                onChange={e => setCnaps(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fonction</label>
              <input
                type="text"
                placeholder="Ex: Technicien"
                value={fonction}
                onChange={e => setFonction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || !selectedPatientId}
            className="btn-primary flex items-center gap-2 text-sm justify-center py-2 px-6 hover:cursor-pointer disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Enregistrement...' : "Rattacher comme salarié (POST /api/agents)"}
          </button>
        </div>
      </form>

      <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Entreprises Contractuelles</h4>
        <div className="space-y-3">
          {state.Entreprise.map(ent => (
            <div key={ent.Id_Entreprise} className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs animate-fade-in">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold mb-2 inline-block">ID: {ent.Id_Entreprise}</span>
              <div className="font-semibold text-sm text-gray-900">{ent.Nom}</div>
              <div className="text-xs text-gray-500 mt-1">{ent.Adresse}</div>
              <div className="text-xs text-gray-400 mt-0.5">Contact: {ent.Contact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
