/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { Encounter, Patient } from '@/core/types';
import { DoctorTabType } from '../domain/consultation.types';

export function useConsultations(initialTab: DoctorTabType = 'attente') {
  const [internalTab, setInternalTab] = useState<DoctorTabType>(initialTab);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);

  const startConsultation = useCallback((encounter: Encounter, allPatients: Patient[]) => {
    const patient = allPatients.find(p => p.Id_Patient === encounter.Id_Patient);
    if (!patient) return;

    setSelectedPatient(patient);
    setActiveEncounter(encounter);
    setInternalTab('consultation');
  }, []);

  const cancelConsultation = useCallback(() => {
    setSelectedPatient(null);
    setActiveEncounter(null);
    setInternalTab('attente');
  }, []);

  return {
    internalTab,
    setInternalTab,
    selectedPatient,
    setSelectedPatient,
    activeEncounter,
    setActiveEncounter,
    startConsultation,
    cancelConsultation,
  };
}
