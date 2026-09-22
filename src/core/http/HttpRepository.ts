/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, RequestOptions } from './ApiClient';
import { extractCollectionItems } from './collection';

/**
 * Base commune à tous les repositories du frontend.
 *
 * Elle joue côté React le même rôle que l'interface de repository côté
 * Symfony (`CompanyRepositoryInterface`, etc.) : une UseCase / un hook
 * applicatif ne dépend jamais de `fetch` ou d'`apiClient` directement, il
 * dépend d'un repository typé qui sait où et comment aller chercher la
 * ressource. Chaque module (`modules/<x>/infrastructure/<x>.repository.ts`)
 * étend cette classe et n'a plus qu'à définir son `resourcePath` et, si
 * besoin, ses endpoints spécifiques.
 *
 * `TEntity`   : la forme du modèle de domaine tel qu'exposé au reste de l'app.
 * `TRawEntity`: la forme brute renvoyée par l'API avant normalisation
 *               (par défaut identique à TEntity quand aucune normalisation
 *               n'est nécessaire).
 */
export abstract class HttpRepository<TEntity, TRawEntity = TEntity> {
  protected constructor(protected readonly resourcePath: string) {}

  /**
   * Convertit un objet brut renvoyé par l'API en modèle de domaine.
   * Par défaut, identité (aucune conversion) — à surcharger dans les
   * repositories dont la forme API diverge du modèle de domaine.
   */
  protected toDomain(raw: TRawEntity): TEntity {
    return raw as unknown as TEntity;
  }

  protected request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, options);
  }

  async findAll(params?: RequestOptions['params']): Promise<TEntity[]> {
    const raw = await this.request<unknown>(this.resourcePath, { params });
    const items = extractCollectionItems<TRawEntity>(raw);
    return items.map((item) => this.toDomain(item));
  }

  async findById(id: number | string): Promise<TEntity> {
    const raw = await this.request<TRawEntity>(`${this.resourcePath}/${id}`);
    return this.toDomain(raw);
  }

  async create(payload: unknown): Promise<TEntity> {
    const raw = await this.request<TRawEntity>(this.resourcePath, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.toDomain(raw);
  }

  async update(id: number | string, payload: unknown): Promise<TEntity> {
    const raw = await this.request<TRawEntity>(`${this.resourcePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return this.toDomain(raw);
  }

  async patch(id: number | string, payload: unknown): Promise<TEntity> {
    const raw = await this.request<TRawEntity>(`${this.resourcePath}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(payload),
    });
    return this.toDomain(raw);
  }

  async remove(id: number | string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`${this.resourcePath}/${id}`, { method: 'DELETE' });
  }
}
