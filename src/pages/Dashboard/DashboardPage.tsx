/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ASINAState } from '@/core/types';
import { 
  DashboardOverviewCards, 
  DashboardServiceChart, 
  DashboardSpecialityChart, 
  DashboardOccupationalRisks 
} from '@/modules/dashboard';

export interface DashboardPageProps {
  state: ASINAState;
  activeSiteId: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ state, activeSiteId }) => {
  const activeSite = state.Site.find(s => s.Id_Site === activeSiteId);

  const encountersByService = state.Service.filter(s => s.Id_Site === activeSiteId).map(serv => {
    const count = state.Encounter.filter(enc => enc.Id_Service === serv.Id_Service).length;
    return {
      label: serv.Libelle,
      value: count,
    };
  });

  const encountersBySpec = state.Specialite.map(spec => {
    const count = state.Encounter.filter(enc => enc.Id_Specialite === spec.Id_Specialite).length;
    return {
      label: spec.Libelle,
      value: count,
    };
  });

  const riskFactors = state.Type_D_Travail.map(risk => {
    const count = state.Encounter.filter(enc => {
      const details = state.Detail_encounter.filter(
        d => d.Id_Encounter === enc.Id_Encounter && d.key === 'OCCUPATIONAL_HAZARD_ID' && Number(d.valeur) === risk.Id_Type_D_Travail
      );
      return details.length > 0;
    }).length;

    return {
      label: risk.Libelle,
      value: count,
    };
  });

  return (
    <div className="space-y-6">
      <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
        Tableau de bord de décision médicale — Site actif : <span className="text-asina-700 font-bold">{activeSite?.Libelle}</span>
      </h3>

      <DashboardOverviewCards state={state} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardServiceChart data={encountersByService} />
        <DashboardSpecialityChart data={encountersBySpec} />
        <DashboardOccupationalRisks data={riskFactors} />
      </div>
    </div>
  );
};

export default DashboardPage;
