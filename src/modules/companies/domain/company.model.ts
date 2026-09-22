/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Entreprise } from '@/core/types';

/**
 * Modèle de domaine "Entreprise contractuelle" côté frontend.
 *
 * On réutilise volontairement la forme `Entreprise` déjà connue du reste de
 * l'application (voir `@/core/types`) : ce module ne renomme pas les champs
 * pour ne pas casser les nombreux écrans qui affichent encore une entreprise
 * via le store legacy (voir MIGRATION.md). Ce qui change, c'est *où* et
 * *comment* cette forme est produite : un seul mapping, dans le repository
 * (`companies.repository.ts`), au lieu d'une fonction de normalisation
 * dupliquée un peu partout dans les composants.
 */
export type Company = Entreprise;

export interface ImportPatientsResult {
  imported: number;
  logs?: string[];
}
