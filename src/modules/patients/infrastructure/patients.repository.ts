/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository, ApiError } from '@/core/http';
import type { PatientOutput } from '@/core/api-contracts';

/**
 * Endpoints réels confirmés (routing + OpenAPI) :
 *   GET /api/patients            (collection, filtrable par ?idEntreprise=)
 *   GET /api/patients/{id}
 *
 * Il n'existe PAS de POST/PUT/PATCH/DELETE sur /api/patients — voir
 * docs/API_MANQUANTES.md. `create`/`update`/`patch`/`remove` sont donc
 * surchargées pour échouer clairement plutôt que d'appeler un endpoint
 * inexistant en silence.
 *
 * NB : `PatientOutput.id` est une STRING (ex: "pat_xxx"), pas un number —
 * contrairement au reste du store legacy (`@/core/types`, `Id_Patient:
 * number`). Voir docs/API_CONTRACTS.md.
 */
class PatientsRepository extends HttpRepository<PatientOutput> {
  constructor() {
    super('/patients');
  }

  /** GET /api/patients?idEntreprise=... */
  async findByEntreprise(idEntreprise: number): Promise<PatientOutput[]> {
    return this.findAll({ idEntreprise });
  }

  async create(): Promise<PatientOutput> {
    throw new ApiError(
      501,
      "POST /api/patients n'existe pas côté backend. Utilisez POST /api/agents (rattacher un rôle salarié à un patient existant) ou POST /api/import-patients (import Excel) — voir docs/API_MANQUANTES.md."
    );
  }

  async update(): Promise<PatientOutput> {
    throw new ApiError(501, "PUT /api/patients/{id} n'existe pas côté backend — voir docs/API_MANQUANTES.md.");
  }

  async patch(): Promise<PatientOutput> {
    throw new ApiError(501, "PATCH /api/patients/{id} n'existe pas côté backend — voir docs/API_MANQUANTES.md.");
  }

  async remove(_id?: number | string): Promise<{ success: boolean }> {
    throw new ApiError(501, "DELETE /api/patients/{id} n'existe pas côté backend — voir docs/API_MANQUANTES.md.");
  }
}

export const patientsRepository = new PatientsRepository();
