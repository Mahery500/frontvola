/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ASINAState, Diagnostique_def, Specialite } from '@/core/types';

interface AdminReferentielsTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export default function AdminReferentielsTab({ state, updateState, triggerNotification }: AdminReferentielsTabProps) {
  const [newDiagCode, setNewDiagCode] = useState('');
  const [newDiagLibelle, setNewDiagLibelle] = useState('');

  const [newSpecCode, setNewSpecCode] = useState('');
  const [newSpecLibelle, setNewSpecLibelle] = useState('');

  const handleCreateDiagDef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagCode || !newDiagLibelle) return;

    const nextId = state.Diagnostique_def.length > 0 ? Math.max(...state.Diagnostique_def.map(d => d.Id_Diagnostique_def)) + 1 : 1;
    const newDiag: Diagnostique_def = {
      Id_Diagnostique_def: nextId,
      Code: newDiagCode.toUpperCase(),
      Libelle: newDiagLibelle
    };

    updateState({
      Diagnostique_def: [...state.Diagnostique_def, newDiag]
    });

    triggerNotification('success', `Codification diagnostic [${newDiag.Code}] ajoutée.`);
    setNewDiagCode('');
    setNewDiagLibelle('');
  };

  const handleCreateSpec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecCode || !newSpecLibelle) return;

    const nextId = state.Specialite.length > 0 ? Math.max(...state.Specialite.map(s => s.Id_Specialite)) + 1 : 1;
    const newSpec: Specialite = {
      Id_Specialite: nextId,
      Code: newSpecCode.toUpperCase(),
      Libelle: newSpecLibelle
    };

    updateState({
      Specialite: [...state.Specialite, newSpec]
    });

    triggerNotification('success', `Spécialité "${newSpec.Libelle}" créée.`);
    setNewSpecCode('');
    setNewSpecLibelle('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Enregistrer un code diagnostic (CIM-10)
        </h3>

        <form onSubmit={handleCreateDiagDef} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-750 font-semibold mb-1">Code CIM-10</label>
            <input
              type="text"
              required
              placeholder="EX: I10, E11, M54.5"
              value={newDiagCode}
              onChange={e => setNewDiagCode(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-1.5 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-gray-750 font-semibold mb-1">Libellé clinique exact</label>
            <input
              type="text"
              required
              placeholder="EX: Diabète sucré de type 2"
              value={newDiagLibelle}
              onChange={e => setNewDiagLibelle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-1.5 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2 text-xs font-bold"
          >
            Injecter dans le thésaurus CIM-10
          </button>
        </form>

        <div className="border-t border-gray-150 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-750 uppercase">Créer une spécialité</h4>
          <form onSubmit={handleCreateSpec} className="space-y-3 text-xs">
            <input type="text" placeholder="Code (EX: CARD)" value={newSpecCode} onChange={e => setNewSpecCode(e.target.value)} className="w-full bg-white border border-gray-300 rounded p-1 focus:outline-hidden" />
            <input type="text" placeholder="Spécialité libellé" value={newSpecLibelle} onChange={e => setNewSpecLibelle(e.target.value)} className="w-full bg-white border border-gray-300 rounded p-1 focus:outline-hidden" />
            <button type="submit" className="w-full px-2 py-1.5 bg-secondary text-white font-bold rounded cursor-pointer">Sauvegarder</button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100">
           Thésaurus Clinique & CIM-10 Actif
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96 overflow-y-auto">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Diagnostics hospitaliers ({state.Diagnostique_def.length})</h4>
            {state.Diagnostique_def.map(df => (
              <div key={df.Id_Diagnostique_def} className="p-2.5 bg-gray-50 rounded border border-gray-150 text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono text-gray-500 font-bold block">[{df.Code}]</span>
                  <span className="font-semibold text-gray-900">{df.Libelle}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Spécialités de consultation ({state.Specialite.length})</h4>
            {state.Specialite.map(sp => (
              <div key={sp.Id_Specialite} className="p-2.5 bg-gray-50 rounded border border-gray-150 text-xs">
                <span className="font-mono text-asina-700 font-bold block">{sp.Code}</span>
                <span className="font-semibold text-gray-900">{sp.Libelle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
