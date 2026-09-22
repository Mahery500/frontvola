/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/core/http';
import type { CreateEntrepriseInput } from '@/core/api-contracts';
import { companiesRepository } from '../infrastructure/companies.repository';
import type { Company } from '../domain/company.model';

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erreur inattendue.';
}

/**
 * Couche applicative du module Entreprises : orchestre le repository et
 * expose un état prêt à consommer par la présentation (liste, chargement,
 * erreur, actions CRUD). C'est l'équivalent, côté frontend, d'une UseCase
 * Symfony : elle ne dépend jamais de `fetch` directement, seulement du
 * repository.
 */
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await companiesRepository.findAll();
      setCompanies(list);
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
      /* l'erreur est déjà exposée via `error` pour l'UI */
    });
  }, [refresh]);

  const createCompany = useCallback(async (payload: CreateEntrepriseInput) => {
    const created = await companiesRepository.create(payload);
    setCompanies((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCompany = useCallback(async (id: number, payload: CreateEntrepriseInput) => {
    const updated = await companiesRepository.save(id, payload);
    setCompanies((prev) => prev.map((c) => (c.Id_Entreprise === id ? updated : c)));
    return updated;
  }, []);

  const removeCompany = useCallback(async (id: number) => {
    await companiesRepository.remove(id);
    setCompanies((prev) => prev.filter((c) => c.Id_Entreprise !== id));
  }, []);

  return {
    companies,
    isLoading,
    error,
    refresh,
    createCompany,
    updateCompany,
    removeCompany,
  };
}
