/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, Stethoscope, Heart, BriefcaseMedical, TrendingUp } from 'lucide-react';
import { ASINAState } from '@/core/types';

export interface DashboardOverviewCardsProps {
  state: ASINAState;
}

export const DashboardOverviewCards: React.FC<DashboardOverviewCardsProps> = ({ state }) => {
  const totalPatients = state.Patient.length;
  const totalEncounters = state.Encounter.length;
  const totalPrescriptions = state.Prescription.length;
  const totalDispensations = state.Dipensation.length;

  const getDaysBetween = (expDate: string) => {
    const d1 = new Date('2026-05-20');
    const d2 = new Date(expDate);
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const expiredOrNearCount = state.Lot.filter(l => {
    const days = getDaysBetween(l.DateExpiration);
    return days <= 90;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex justify-between items-start text-asina-600">
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Actif</span>
        </div>
        <span className="block text-2xl font-mono font-bold text-gray-950 mt-2">{totalPatients}</span>
        <span className="text-[10px] uppercase font-bold text-stone-400 mt-1 block">Patients Répertoriés</span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex justify-between items-start text-blue-600">
          <Stethoscope className="h-5 w-5" />
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Cumulé</span>
        </div>
        <span className="block text-2xl font-mono font-bold text-gray-950 mt-2">{totalEncounters}</span>
        <span className="text-[10px] uppercase font-bold text-stone-400 mt-1 block">Consultations Clôturées</span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex justify-between items-start text-pink-600">
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Alerte</span>
        </div>
        <span className="block text-2xl font-mono font-bold text-gray-950 mt-2">{expiredOrNearCount} lot(s)</span>
        <span className="text-[10px] uppercase font-bold text-stone-400 mt-1 block">Lots Périmant à 90 j</span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex justify-between items-start text-emerald-600">
          <BriefcaseMedical className="h-5 w-5" />
        </div>
        <span className="block text-2xl font-mono font-bold text-gray-950 mt-2">{totalPrescriptions}</span>
        <span className="text-[10px] uppercase font-bold text-stone-400 mt-1 block">Prescriptions Ordonnées</span>
      </div>

      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex justify-between items-start text-amber-600">
          <TrendingUp className="h-5 w-5" />
        </div>
        <span className="block text-2xl font-mono font-bold text-gray-950 mt-2">{totalDispensations}</span>
        <span className="text-[10px] uppercase font-bold text-stone-400 mt-1 block">Dispensations Effectuées</span>
      </div>
    </div>
  );
};

export default DashboardOverviewCards;
