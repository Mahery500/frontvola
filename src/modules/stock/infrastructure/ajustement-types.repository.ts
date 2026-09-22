/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository } from '@/core/http';
import type { AjustementTypeRequest, AjustementTypeResponse } from '@/core/api-contracts';

/**
 * Référentiel des motifs d'ajustement — CRUD complet : /api/ajustement_type_resources.
 * NB : uniquement le référentiel des TYPES. Il n'existe pas d'endpoint pour
 * enregistrer un ajustement de stock lui-même — voir docs/API_MANQUANTES.md.
 */
class AjustementTypesRepository extends HttpRepository<AjustementTypeResponse, AjustementTypeResponse> {
  constructor() { super('/ajustement_type_resources'); }
  create(payload: AjustementTypeRequest) { return super.create(payload); }
  update(id: number | string, payload: AjustementTypeRequest) { return super.update(id, payload); }
}

export const ajustementTypesRepository = new AjustementTypesRepository();
