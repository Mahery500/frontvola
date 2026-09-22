/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingCart, Truck } from 'lucide-react';
import { ASINAState, Commande, Detail_Commande, Appro, Lot, Stock, Detail_appro, Mouvement } from '@/core/types';
import { CommandBasketItem } from '../domain/stock.types';

export interface StockOrdersTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export const StockOrdersTab: React.FC<StockOrdersTabProps> = ({
  state,
  updateState,
  activeSiteId,
  triggerNotification,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(state.Fournisseur[0]?.Id_Fournisseur || 1);
  const [commandBasket, setCommandBasket] = useState<CommandBasketItem[]>([]);
  const [basketProdId, setBasketProdId] = useState<number>(state.Produit[0]?.Id_Produit || 1);
  const [basketQte, setBasketQte] = useState<number>(100);

  const [lotCodeToCreate, setLotCodeToCreate] = useState('');
  const [lotExpiryToSet, setLotExpiryToSet] = useState('2028-12-31');

  const handleAddProductToBasket = () => {
    const existing = commandBasket.find(x => x.Id_Produit === basketProdId);
    if (existing) {
      setCommandBasket(commandBasket.map(x => x.Id_Produit === basketProdId ? { ...x, qte: x.qte + basketQte } : x));
    } else {
      setCommandBasket([...commandBasket, { Id_Produit: basketProdId, qte: basketQte }]);
    }
    triggerNotification('success', 'Médicament ajouté au dossier de commande.');
  };

  const handlePlaceOrder = () => {
    if (commandBasket.length === 0) {
      triggerNotification('error', 'Le panier de commande est vide.');
      return;
    }

    const nextCmdId = state.Commande.length > 0 
      ? Math.max(...state.Commande.map(c => c.Id_Commande)) + 1 
      : 1;

    let nextDetailId = state.Detail_Commande.length > 0
      ? Math.max(...state.Detail_Commande.map(dc => dc.Id_Detail_Commande)) + 1
      : 1;

    const numCmd = `CMD-2026-${String(nextCmdId).padStart(3, '0')}`;

    const newCommand: Commande = {
      Id_Commande: nextCmdId,
      DateC: '2026-05-20',
      Num: numCmd,
      Statut: 'Commandée',
      Id_Fournisseur: selectedSupplierId
    };

    const detailsToInsert: Detail_Commande[] = [];
    commandBasket.forEach(item => {
      detailsToInsert.push({
        Id_Detail_Commande: nextDetailId++,
        Qte: item.qte,
        Id_Produit: item.Id_Produit,
        Id_Commande: nextCmdId
      });
    });

    updateState({
      Commande: [...state.Commande, newCommand],
      Detail_Commande: [...state.Detail_Commande, ...detailsToInsert]
    });

    triggerNotification('success', `Bon de commande ${numCmd} transmis avec succès au fournisseur.`);
    setCommandBasket([]);
  };

  const handleExecuteReceiving = (cmd: Commande) => {
    const cmdDetails = state.Detail_Commande.filter(dc => dc.Id_Commande === cmd.Id_Commande);
    if (cmdDetails.length === 0) {
      triggerNotification('error', 'Aucune ligne de commande localisée.');
      return;
    }

    const updatedCommands = state.Commande.map(c => {
      if (c.Id_Commande === cmd.Id_Commande) {
        return { ...c, Statut: 'Livrée' as const };
      }
      return c;
    });

    const nextApproId = state.Appro.length > 0 
      ? Math.max(...state.Appro.map(a => a.Id_Appro)) + 1 
      : 1;

    const invoiceNum = `REC-INVOICE-${String(nextApproId).padStart(4, '0')}`;
    const newAppro: Appro = {
      Id_Appro: nextApproId,
      NumFac: invoiceNum,
      Date_: '2026-05-20',
      Id_Commande: cmd.Id_Commande,
      Id_Fournisseur: cmd.Id_Fournisseur
    };

    let nextLotId = state.Lot.length > 0 ? Math.max(...state.Lot.map(l => l.Id_Lot)) + 1 : 1;
    let nextStockId = state.Stock.length > 0 ? Math.max(...state.Stock.map(s => s.Id_Stock)) + 1 : 1;
    let nextDetailApproId = state.Detail_appro.length > 0 ? Math.max(...state.Detail_appro.map(da => da.Id_Detail_appro)) + 1 : 1;
    let nextMvtId = state.Mouvement.length > 0 ? Math.max(...state.Mouvement.map(m => m.Id_Mouvement)) + 1 : 1;

    const createdLots: Lot[] = [];
    const addedStocks: Stock[] = [];
    const createdDetailAppros: Detail_appro[] = [];
    const createdMovements: Mouvement[] = [];

    cmdDetails.forEach((dc) => {
      const generatedNumLot = lotCodeToCreate || `LOT-${dc.Id_Produit}-AUTO-${nextLotId}`;
      const newLot: Lot = {
        Id_Lot: nextLotId,
        Id_Produit: dc.Id_Produit,
        NumLot: generatedNumLot,
        DateExpiration: lotExpiryToSet
      };
      createdLots.push(newLot);

      addedStocks.push({
        Id_Stock: nextStockId++,
        qte: dc.Qte,
        Id_Site: activeSiteId,
        Id_Lot: nextLotId
      });

      createdDetailAppros.push({
        Id_Detail_appro: nextDetailApproId++,
        qte: dc.Qte,
        prix: 1200,
        Id_Lot: nextLotId,
        Id_Appro: nextApproId
      });

      createdMovements.push({
        Id_Mouvement: nextMvtId++,
        Type: 'ENTREE',
        qte: dc.Qte,
        Id_Mouvement_Type: 1,
        Id_Lot: nextLotId,
        Id_Site: activeSiteId,
        DateM: '2026-05-20 16:41:52'
      });

      nextLotId++;
    });

    updateState({
      Commande: updatedCommands,
      Appro: [...state.Appro, newAppro],
      Lot: [...state.Lot, ...createdLots],
      Stock: [...state.Stock, ...addedStocks],
      Detail_appro: [...state.Detail_appro, ...createdDetailAppros],
      Mouvement: [...state.Mouvement, ...createdMovements]
    });

    triggerNotification('success', `Réception de la commande ${cmd.Num} finalisée. Lots créés et injectés en stock.`);
    setLotCodeToCreate('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Create command */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingCart className="h-4.5 w-4.5 text-gray-500" />
          Brouillonner un Bon d'Achat
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Fournisseur attitré</label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded p-1.5"
            >
              {state.Fournisseur.map(f => (
                <option key={f.Id_Fournisseur} value={f.Id_Fournisseur}>{f.Nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Produit à réapprovisionner</label>
            <select
              value={basketProdId}
              onChange={e => setBasketProdId(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded p-1.5"
            >
              {state.Produit.map(p => (
                <option key={p.Id_Produit} value={p.Id_Produit}>{p.Nom_Commercial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Quantité requise (Conditionnements)</label>
            <input
              type="number"
              value={basketQte}
              onChange={e => setBasketQte(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded p-1.5 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleAddProductToBasket}
            className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded cursor-pointer transition"
          >
            Ajouter à la commande locale
          </button>

          {/* Basket list view */}
          {commandBasket.length > 0 && (
            <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2 mt-4">
              <span className="font-bold text-stone-700 block">Détails de la demande :</span>
              {commandBasket.map((item, idx) => {
                const pr = state.Produit.find(x => x.Id_Produit === item.Id_Produit);
                return (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-1.5 rounded">
                    <span>{pr?.Nom_Commercial}</span>
                    <span className="font-mono font-bold text-gray-900">{item.qte} unités</span>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full bg-asina-600 hover:bg-asina-700 text-white py-2 text-xs font-bold rounded mt-2 cursor-pointer transition"
              >
                Transmettre le bon de commande
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Incoming shipments and receiving */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Truck className="h-4.5 w-4.5 text-asina-600" />
          Réceptions de Commandes en cours
        </h3>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg my-1 border border-gray-200 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Code Lot à attribuer</label>
            <input 
              type="text" 
              placeholder="Ex: LOT-DOLIP-099" 
              value={lotCodeToCreate} 
              onChange={e => setLotCodeToCreate(e.target.value)} 
              className="w-full bg-white p-1.5 rounded border border-gray-300" 
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Date d'Expiration</label>
            <input 
              type="date" 
              value={lotExpiryToSet} 
              onChange={e => setLotExpiryToSet(e.target.value)} 
              className="w-full bg-white p-1.5 rounded border border-gray-300" 
            />
          </div>
        </div>

        <div className="space-y-3">
          {state.Commande.filter(c => c.Statut === 'Commandée').map(cmd => {
            const supp = state.Fournisseur.find(f => f.Id_Fournisseur === cmd.Id_Fournisseur);
            const items = state.Detail_Commande.filter(dc => dc.Id_Commande === cmd.Id_Commande);

            return (
              <div key={cmd.Id_Commande} className="p-4 rounded-xl border border-gray-200 bg-stone-50/50 flex justify-between items-center flex-wrap gap-4 text-xs">
                <div>
                  <span className="font-mono font-bold text-gray-400">CMD: {cmd.Num}</span>
                  <h4 className="font-bold text-sm text-gray-900 mt-0.5">Fournisseur : {supp?.Nom}</h4>
                  <p className="text-stone-500 text-[11px] font-medium mt-1">Lignes commandées : {items.length} références</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteReceiving(cmd)}
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition"
                >
                  Enregistrer Livré (Faire entrer en stock)
                </button>
              </div>
            );
          })}

          {state.Commande.filter(c => c.Statut === 'Commandée').length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Aucun ordre de commande fournisseur en cours d'acheminement.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockOrdersTab;
