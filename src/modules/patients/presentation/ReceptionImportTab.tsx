/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ASINAState } from '@/core/types';
import { patientsImportRepository, ImportPatientsResult } from '../infrastructure/patients-import.repository';

interface ReceptionImportTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

/**
 * Onglet "Import en masse".
 *
 * Avant : un simulateur qui parsait du texte collé façon CSV et calculait
 * des matricules côté client, avec un envoi JSON fire-and-forget vers un
 * endpoint imaginaire.
 *
 * Maintenant, d'après le schéma OpenAPI réel de `POST /api/import-patients` :
 * c'est un vrai upload de fichier Excel (.xlsx) en `multipart/form-data`,
 * avec une règle métier imposée par le backend (chaque agent doit précéder
 * ses ayants droit dans le fichier ; tout-ou-rien à la moindre erreur).
 * Le frontend ne fait plus de simulation : il envoie le fichier tel quel et
 * affiche fidèlement la réponse du backend (succès ou liste d'erreurs).
 */
export default function ReceptionImportTab({ state, triggerNotification }: ReceptionImportTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<number>(state.Entreprise[0]?.Id_Entreprise || 0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportPatientsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setResult(null);
    setErrorMessage(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      triggerNotification('error', 'Veuillez sélectionner un fichier Excel (.xlsx).');
      return;
    }
    if (!selectedEntreprise) {
      triggerNotification('error', 'Veuillez sélectionner une entreprise.');
      return;
    }

    setIsUploading(true);
    setResult(null);
    setErrorMessage(null);
    try {
      // POST /api/import-patients — multipart/form-data réel.
      const response = await patientsImportRepository.uploadFile(selectedFile, selectedEntreprise);
      setResult(response);
      triggerNotification('success', 'Fichier envoyé et traité par POST /api/import-patients.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de l'import.";
      setErrorMessage(message);
      triggerNotification('error', message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <form onSubmit={handleUpload} className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          <UploadCloud className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Import Excel de salariés</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-xs text-blue-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Règle imposée par le backend : chaque <strong>Agent</strong> doit être placé{' '}
            <strong>avant</strong> ses ayants droit dans le fichier, avec une colonne
            "Agent/Conjoint/Enfant" indiquant le rôle de chaque ligne. À la moindre erreur,
            rien n'est enregistré et toutes les erreurs sont listées.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Entreprise concernée
          </label>
          <select
            required
            value={selectedEntreprise}
            onChange={e => setSelectedEntreprise(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value={0}>Sélectionner une entreprise</option>
            {state.Entreprise.map(ent => (
              <option key={ent.Id_Entreprise} value={ent.Id_Entreprise}>{ent.Nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Fichier Excel (.xlsx)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              required
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer"
            />
            {selectedFile && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} Ko)
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="btn-primary flex items-center gap-2 text-sm justify-center py-2 px-6 hover:cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            {isUploading ? 'Envoi en cours...' : 'Envoyer (POST /api/import-patients)'}
          </button>
        </div>

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Import traité par le backend.</div>
              <pre className="text-xs mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex gap-2 text-sm text-rose-800">
            <XCircle className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Import refusé.</div>
              <p className="text-xs mt-1">{errorMessage}</p>
            </div>
          </div>
        )}
      </form>

      <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-3">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Format attendu</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          Une ligne par personne. Une colonne indique le rôle
          ("Agent", "Conjoint" ou "Enfant"). Les colonnes exactes (noms
          d'en-tête) restent à confirmer avec le backend — voir{' '}
          <code>docs/API_MANQUANTES.md</code>. L'ordre importe : chaque agent
          doit précéder les lignes de ses ayants droit.
        </p>
      </div>
    </div>
  );
}
