/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository, ApiError } from '@/core/http';
import type { MouvementTypeRequest, MouvementTypeResponse, CreateMouvementRequest, MouvementResponse } from '@/core/api-contracts';

/** Référentiel des types de mouvement — CRUD complet : /api/mouvement_type_resources */
class MouvementTypesRepository extends HttpRepository<MouvementTypeResponse, MouvementTypeResponse> {
  constructor() { super('/mouvement_type_resources'); }
  create(payload: MouvementTypeRequest) { return super.create(payload); }
  update(id: number | string, payload: MouvementTypeRequest) { return super.update(id, payload); }
}

/**
 * Grand livre des mouvements — /api/mouvement_resources.
 * Confirmé : GET (collection + item) et POST uniquement, pas de PUT/DELETE
 * (ledger immuable : on corrige par un mouvement inverse).
 * NB : `lotId` existe dans le contrat mais /api/lot_resources n'existe pas
 * encore côté backend — voir docs/API_MANQUANTES.md.
 */
class MouvementsRepository extends HttpRepository<MouvementResponse, MouvementResponse> {
  constructor() { super('/mouvement_resources'); }

  create(payload: CreateMouvementRequest) { return super.create(payload); }

  async update(): Promise<MouvementResponse> {
    throw new ApiError(501, "PUT /api/mouvement_resources/{id} n'existe pas — créez un mouvement inverse.");
  }

  async remove(): Promise<{ success: boolean }> {
    throw new ApiError(501, "DELETE /api/mouvement_resources/{id} n'existe pas — créez un mouvement inverse.");
  }
}

export const mouvementTypesRepository = new MouvementTypesRepository();
export const mouvementsRepository = new MouvementsRepository();
