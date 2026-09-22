/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/core/http';
import type { PatientOutput } from '@/core/api-contracts';
import { patientsRepository } from '../infrastructure/patients.repository';

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erreur inattendue.';
}

/**
 * Couche applicative "données" du module Patients : orchestre le
 * repository et expose un état loading/error clair. Contrairement à
 * `usePatients` (hook UI de filtrage/onglet), celui-ci est la source de
 * vérité des données — c'est l'équivalent frontend d'une UseCase Symfony
 * (ici : ListPatients / GetPatient uniquement, voir plus bas).
 *
 * L'API backend n'expose aujourd'hui que la lecture (`GET /api/patients`,
 * `GET /api/patients/{id}`) : il n'y a pas de POST/PUT/DELETE sur cette
 * ressource. La création d'un patient passe par le module `agents`
 * (`POST /api/agents`) ou par l'import de masse
 * (`POST /api/import-patients`) — voir api-manquantes.md pour ce qui
 * manque encore (patient "simple", ayant droit isolé, suppression...).
 */
export function usePatientsData() {
  const [patients, setPatients] = useState<PatientOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await patientsRepository.findAll();
      setPatients(list);
      return list;
    } catch (err) {
      setError(toMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      /* erreur déjà exposée via `error` */
    });
  }, [refresh]);

  return {
    patients,
    isLoading,
    error,
    refresh,
  };
}
