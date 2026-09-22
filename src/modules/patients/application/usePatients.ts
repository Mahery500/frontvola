/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Patient } from '@/core/types';
import { ReceptionTabType } from '../domain/patient.types';

export function usePatients(patients: Patient[], initialTab: ReceptionTabType = 'enregistrer') {
  const [activeTab, setActiveTab] = useState<ReceptionTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) =>
      p.Nom.toLowerCase().includes(q) ||
      p.Prenom.toLowerCase().includes(q) ||
      p.Matricule.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredPatients,
  };
}
