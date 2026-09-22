/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu } from 'lucide-react';
import { User_, role, Service } from '../types';
import { formatRoleLabel, formatUserDisplayName, getUserAvatarInitial } from '../utils/formatters';

export interface AppHeaderProps {
  activeView: string;
  activeUser: User_ | null;
  activeRole: role | null | undefined;
  activeServiceId: number;
  onServiceChange: (serviceId: number) => void;
  currentSiteServices: Service[];
  onToggleMobileSidebar: () => void;
  sidebarOpenMobile: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  activeUser,
  activeRole,
  activeServiceId,
  onServiceChange,
  currentSiteServices,
  onToggleMobileSidebar,
  sidebarOpenMobile,
}) => {
  const getViewLabel = () => {
    switch (activeView) {
      case 'admin': return 'Admin';
      case 'accueil': return 'Accueil / Secrétariat';
      case 'infirmerie': return 'Infirmerie';
      case 'doctor': return 'Médecin';
      case 'stock': return 'Pharmacie & Stocks';
      case 'analysis': return 'Stats & Chef';
      case 'api_config': return 'Liaison API Backend';
      default: return '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-asina-600 rounded-lg flex items-center justify-center text-white text-xl font-extrabold tracking-wider select-none shadow-sm">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              ASINA <span className="text-slate-400 font-light font-sans">Medical</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none hidden sm:block">
                Plateforme Hospitalière & Stock
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 hidden sm:block"></span>
              <span className="text-[10px] text-asina-600 font-extrabold uppercase tracking-wide">
                {getViewLabel()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg bg-asina-50 border border-asina-100 hover:bg-asina-100 text-asina-800 transition duration-200 cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            title={sidebarOpenMobile ? "Fermer le menu" : "Afficher le menu"}
          >
            <Menu className="h-4.5 w-4.5" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Global Selectors & User Profile */}
      <div className="flex flex-wrap items-center gap-4.5">
        {/* Active Doctor Sub-Service Selector if in Doctor Mode */}
        {activeView === 'doctor' && (
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Service Clinique
            </span>
            <select
              value={activeServiceId}
              onChange={(e) => onServiceChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 py-1.5 px-3 focus:outline-hidden focus:ring-1 focus:ring-asina-600"
            >
              {currentSiteServices.map((serv) => (
                <option key={serv.Id_Service} value={serv.Id_Service}>
                  {serv.Libelle}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Connected User profile badge (Visible on desktop header) */}
        <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4 py-0.5">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {formatUserDisplayName(activeUser)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              {formatRoleLabel(activeRole?.libelle || activeUser?.role || activeUser?.roles?.[0])}
            </span>
          </div>
          <div className="h-9 w-9 shrink-0 rounded-lg bg-asina-50 text-asina-700 border border-asina-200/80 flex items-center justify-center font-bold text-sm select-none shadow-2xs">
            {getUserAvatarInitial(activeUser)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
