/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpRepository, ApiError } from '@/core/http';
import type { AgentOutput, CreateAgentInput } from '@/core/api-contracts';

/**
 * Endpoints réels (routing + OpenAPI) :
 *   GET  /api/agents            (collection)
 *   GET  /api/agents/{id}
 *   POST /api/agents
 * Pas de PUT/DELETE.
 *
 * IMPORTANT (voir docs/API_CONTRACTS.md) : `CreateAgentInput` ne prend PAS
 * de nom/prénom/date de naissance. Il faut un `idPatient` d'un Patient qui
 * EXISTE DÉJÀ. Créer un Agent = donner un rôle "salarié" à un Patient déjà
 * en base, pas créer une nouvelle personne — voir docs/API_MANQUANTES.md
 * pour ce qu'il manque afin de créer un Patient de zéro.
 */
class AgentsRepository extends HttpRepository<AgentOutput> {
  constructor() {
    super('/agents');
  }

  async create(payload: CreateAgentInput): Promise<AgentOutput> {
    return this.request<AgentOutput>(this.resourcePath, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(): Promise<AgentOutput> {
    throw new ApiError(501, "PUT /api/agents/{id} n'existe pas côté backend — voir docs/API_MANQUANTES.md.");
  }

  async remove(): Promise<{ success: boolean }> {
    throw new ApiError(501, "DELETE /api/agents/{id} n'existe pas côté backend — voir docs/API_MANQUANTES.md.");
  }
}

export const agentsRepository = new AgentsRepository();
