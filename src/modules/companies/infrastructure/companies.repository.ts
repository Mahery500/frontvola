/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository, ApiError, extractCollectionItems } from '@/core/http';
import type { EntrepriseOutput, CreateEntrepriseInput } from '@/core/api-contracts';
import type { Company } from '../domain/company.model';

/**
 * Endpoint réel confirmé (routing + OpenAPI /api/docs.json) :
 *   GET  /api/entreprises            (collection)
 *   GET  /api/entreprises/{id}
 *   POST /api/entreprises
 * Pas de PUT ni DELETE exposés pour l'instant — voir docs/API_MANQUANTES.md.
 * `update()`/`remove()` sont donc surchargées pour échouer clairement.
 *
 * Le mapping EntrepriseOutput -> Company (legacy PascalCase, voir
 * @/core/types) est fait UNE SEULE FOIS ici, à partir du contrat réel
 * (@/core/api-contracts/identity.contracts.ts), au lieu d'être deviné.
 */
class CompaniesRepository extends HttpRepository<Company, EntrepriseOutput> {
  constructor() {
    super('/entreprises');
  }

  protected toDomain(raw: EntrepriseOutput, indexFallback = 1): Company {
    if (!raw) {
      return { Id_Entreprise: indexFallback, Nom: `Entreprise ${indexFallback}`, Adresse: '', Contact: '' };
    }
    return {
      Id_Entreprise: raw.id ?? indexFallback,
      Nom: raw.nom ?? raw.raisonSociale ?? `Entreprise ${indexFallback}`,
      Adresse: raw.adresse ?? '',
      Contact: raw.contact ?? '',
      RaisonSociale: raw.raisonSociale,
      NumeroCnaps: raw.numeroCnaps,
      MatriculeAsina: raw.matriculeAsina,
      NombreAgents: raw.nombreAgents,
    };
  }

  async findAll(): Promise<Company[]> {
    const raw = await this.request<unknown>(this.resourcePath);
    const items = extractCollectionItems<EntrepriseOutput>(raw);
    return items.map((item, idx) => this.toDomain(item, idx + 1));
  }

  /** POST /api/entreprises avec le contrat réel CreateEntrepriseInput. */
  async create(payload: CreateEntrepriseInput): Promise<Company> {
    const raw = await this.request<EntrepriseOutput>(this.resourcePath, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.toDomain(raw);
  }

  async save(_id: number, _company: CreateEntrepriseInput): Promise<Company> {
    throw new ApiError(
      501,
      "PUT /api/entreprises/{id} n'existe pas encore côté backend — voir docs/API_MANQUANTES.md."
    );
  }

  async remove(_id: number | string): Promise<{ success: boolean }> {
    throw new ApiError(
      501,
      "DELETE /api/entreprises/{id} n'existe pas encore côté backend — voir docs/API_MANQUANTES.md."
    );
  }
}

export const companiesRepository = new CompaniesRepository();
