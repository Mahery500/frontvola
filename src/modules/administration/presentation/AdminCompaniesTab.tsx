/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Check, X, RefreshCw, Phone, MapPin } from 'lucide-react';
import { ASINAState, Entreprise } from '@/core/types';
import { useCompanies } from '@/modules/companies';

interface AdminCompaniesTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

/**
 * Onglet "Entreprises" de l'administration.
 *
 * La donnée et les actions CRUD passent désormais par `useCompanies()`
 * (module `companies`, couche application -> repository -> API Symfony),
 * au lieu de muter directement le store legacy avec des identifiants
 * fabriqués côté client. `updateState` n'est conservé que pour synchroniser
 * le store legacy (`state.Entreprise`) dont dépendent encore d'autres écrans
 * non migrés (Réception, Import) — voir MIGRATION.md.
 */
export default function AdminCompaniesTab({ updateState, triggerNotification }: AdminCompaniesTabProps) {
  const { companies, isLoading, refresh, createCompany, updateCompany, removeCompany } = useCompanies();

  // Pont vers le store legacy pour les écrans pas encore migrés.
  useEffect(() => {
    updateState({ Entreprise: companies });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);

  const [newNom, setNewNom] = useState('');
  const [newAdresse, setNewAdresse] = useState('');
  const [newContact, setNewContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editAdresse, setEditAdresse] = useState('');
  const [editContact, setEditContact] = useState('');

  const handleRefresh = async () => {
    try {
      const list = await refresh();
      triggerNotification('success', `${list.length} entreprise(s) synchronisée(s) depuis GET /api/companies.`);
    } catch {
      triggerNotification('error', "Erreur lors de la récupération des entreprises depuis l'API.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) {
      triggerNotification('error', "Le nom de l'entreprise est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCompany({
        nom: newNom.trim(),
        adresse: newAdresse.trim(),
        contact: newContact.trim(),
      });
      triggerNotification('success', `Entreprise "${created.Nom}" créée (POST /api/companies).`);
      setNewNom('');
      setNewAdresse('');
      setNewContact('');
    } catch {
      triggerNotification('error', "Échec de la création de l'entreprise sur l'API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (c: Entreprise) => {
    setEditingId(c.Id_Entreprise);
    setEditNom(c.Nom);
    setEditAdresse(c.Adresse || '');
    setEditContact(c.Contact || '');
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id: number) => {
    if (!editNom.trim()) return;
    try {
      await updateCompany(id, {
        nom: editNom.trim(),
        adresse: editAdresse.trim(),
        contact: editContact.trim(),
      });
      triggerNotification('success', `Entreprise mise à jour (PUT /api/companies/${id}).`);
    } catch {
      triggerNotification('error', "Échec de la mise à jour de l'entreprise sur l'API.");
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    try {
      await removeCompany(id);
      triggerNotification('success', `Entreprise "${nom}" supprimée (DELETE /api/companies/${id}).`);
    } catch {
      triggerNotification('error', `Échec de la suppression de "${nom}" sur l'API.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Formulaire de création */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Building2 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Ajouter une Entreprise Partenaire
          </h3>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Raison Sociale / Nom *</label>
            <input
              type="text"
              required
              placeholder="EX: Société Générale Madagascar"
              value={newNom}
              onChange={e => setNewNom(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Adresse Géographique</label>
            <input
              type="text"
              placeholder="EX: Rue Rainitovo, Antananarivo"
              value={newAdresse}
              onChange={e => setNewAdresse(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Téléphone / Contact RH</label>
            <input
              type="text"
              placeholder="EX: +261 20 22 000 00 / rh@entreprise.mg"
              value={newContact}
              onChange={e => setNewContact(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{isSubmitting ? 'Enregistrement...' : "Enregistrer l'Entreprise (POST /api/companies)"}</span>
          </button>
        </form>
      </div>

      {/* Liste des entreprises */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Entreprises sous Convention Médicale ASINA
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Source d'importation des salariés et de facturation des bilans d'aptitude.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser (GET /api/companies)</span>
          </button>
        </div>

        <div className="space-y-3">
          {companies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {isLoading ? 'Chargement des entreprises...' : 'Aucune entreprise partenaire enregistrée.'}
            </div>
          ) : (
            companies.map(comp => (
              <div
                key={comp.Id_Entreprise}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                {editingId === comp.Id_Entreprise ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editNom}
                      onChange={e => setEditNom(e.target.value)}
                      placeholder="Nom"
                      className="p-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={editAdresse}
                      onChange={e => setEditAdresse(e.target.value)}
                      placeholder="Adresse"
                      className="p-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={editContact}
                      onChange={e => setEditContact(e.target.value)}
                      placeholder="Contact"
                      className="p-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{comp.Nom}</span>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        ID: {comp.Id_Entreprise}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-slate-600 text-[11px]">
                      {comp.Adresse && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {comp.Adresse}
                        </span>
                      )}
                      {comp.Contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {comp.Contact}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {editingId === comp.Id_Entreprise ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(comp.Id_Entreprise)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                        title="Sauvegarder (PUT /api/companies)"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Valider</span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2.5 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Annuler</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(comp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
                        title="Modifier (PUT /api/companies/{id})"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comp.Id_Entreprise, comp.Nom)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Supprimer (DELETE /api/companies/{id})"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
