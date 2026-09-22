/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Package, ShoppingCart, Clipboard, ShoppingBag, Activity, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { ASINAState } from '@/core/types';
import { 
  StockTabType,
  StockVisualizerTab,
  StockOrdersTab,
  StockAdjustmentsTab,
  StockDispensationTab,
  StockMovementsTab
} from '@/modules/stock';

export interface StockPageProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  activeSiteId: number;
  activeRoleCode: string;
  overrideTab?: StockTabType;
}

export const StockPage: React.FC<StockPageProps> = ({
  state,
  updateState,
  activeSiteId,
  activeRoleCode,
  overrideTab,
}) => {
  const [internalTab, setInternalTab] = useState<StockTabType>('visualiser');
  const activeTab = overrideTab || internalTab;

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
          <span className="text-sm font-medium">{notification.text}</span>
        </div>
      )}

      {/* Tabs */}
      {!overrideTab && (
        <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 -mb-px min-w-max pb-0.5">
            <button
              type="button"
              onClick={() => setInternalTab('visualiser')}
              className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'visualiser' ? 'border-asina-600 text-asina-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package className="h-4 w-4 text-slate-400" />
              <span>Niveaux de Stocks & Expirations (Multi-site)</span>
            </button>
            
            {(activeRoleCode === 'ADMIN' || activeRoleCode === 'STOCK_CENTRAL') && (
              <button
                type="button"
                onClick={() => setInternalTab('commandes')}
                className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'commandes' ? 'border-asina-600 text-asina-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <span>Commandes Fournisseurs & Réceptions ({state.Commande.filter(c => c.Statut === 'Commandée').length})</span>
              </button>
            )}

            {(activeRoleCode === 'ADMIN' || activeRoleCode === 'STOCK_SITE' || activeRoleCode === 'STOCK_CENTRAL') && (
              <button
                type="button"
                onClick={() => setInternalTab('ajustements')}
                className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'ajustements' ? 'border-asina-600 text-asina-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clipboard className="h-4 w-4 text-slate-400" />
                <span>Inventaires Physiques & Ajustements</span>
              </button>
            )}

            {(activeRoleCode === 'ADMIN' || activeRoleCode === 'DISPENSATEUR') && (
              <button
                type="button"
                onClick={() => setInternalTab('dispensation')}
                className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'dispensation' ? 'border-asina-600 text-asina-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <span>Dispensations / Pharmacie ({state.Prescription.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInternalTab('mouvements')}
              className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'mouvements' ? 'border-asina-600 text-asina-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="h-4 w-4 text-slate-400" />
              <span>Audit Trail Mouvements</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'visualiser' && (
        <StockVisualizerTab state={state} activeSiteId={activeSiteId} />
      )}

      {activeTab === 'commandes' && (
        <StockOrdersTab
          state={state}
          updateState={updateState}
          activeSiteId={activeSiteId}
          triggerNotification={triggerNotification}
        />
      )}

      {activeTab === 'ajustements' && (
        <StockAdjustmentsTab
          state={state}
          updateState={updateState}
          activeSiteId={activeSiteId}
          triggerNotification={triggerNotification}
        />
      )}

      {activeTab === 'dispensation' && (
        <StockDispensationTab
          state={state}
          updateState={updateState}
          activeSiteId={activeSiteId}
          triggerNotification={triggerNotification}
        />
      )}

      {activeTab === 'mouvements' && (
        <StockMovementsTab state={state} activeSiteId={activeSiteId} />
      )}
    </div>
  );
};

export default StockPage;
