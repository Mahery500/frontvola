/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository } from '@/core/http';
import type { FournisseurRequest, FournisseurResponse } from '@/core/api-contracts';

/** CRUD complet confirmé : /api/fournisseur_resources */
class FournisseursRepository extends HttpRepository<FournisseurResponse, FournisseurResponse> {
  constructor() { super('/fournisseur_resources'); }
  create(payload: FournisseurRequest) { return super.create(payload); }
  update(id: number | string, payload: FournisseurRequest) { return super.update(id, payload); }
}

export const fournisseursRepository = new FournisseursRepository();
