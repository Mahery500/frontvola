/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getApiBaseUrl, getStoredJwtToken } from '@/core/http';
import { ApiError } from '@/core/http';

/**
 * POST /api/import-patients — confirmé par l'OpenAPI comme un vrai upload
 * de fichier (`multipart/form-data`, champs `file` [.xlsx] + `idEntreprise`),
 * PAS un endpoint JSON. Règle métier imposée par le backend lui-même
 * (description du schéma `ImportPatients`) :
 *   - chaque AGENT doit être placé AVANT ses ayants droit dans le fichier ;
 *   - une colonne "Agent/Conjoint/Enfant" indique le rôle de chaque ligne ;
 *   - tout ou rien : la moindre erreur annule tout l'import, toutes les
 *     erreurs sont listées dans la réponse.
 *
 * On ne peut pas passer par apiClient() (qui force Content-Type: application/json) :
 * FormData a besoin que le navigateur pose lui-même le boundary multipart.
 */
export interface ImportPatientsResult {
  id?: number;
  [key: string]: unknown;
}

export const patientsImportRepository = {
  async uploadFile(file: File, idEntreprise: number): Promise<ImportPatientsResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idEntreprise', String(idEntreprise));

    const token = getStoredJwtToken();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${getApiBaseUrl()}/import-patients`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let message = `Échec de l'import (HTTP ${response.status})`;
      let data: unknown = null;
      try {
        data = await response.json();
        const body = data as Record<string, unknown>;
        if (typeof body?.detail === 'string') message = body.detail;
        else if (typeof body?.message === 'string') message = body.message;
      } catch {
        /* réponse non-JSON, on garde le message générique */
      }
      throw new ApiError(response.status, message, data, '/import-patients');
    }

    return response.status === 204 ? {} : await response.json();
  },
};
