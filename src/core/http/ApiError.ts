/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Erreur HTTP normalisée levée par l'ApiClient pour toute réponse non 2xx.
 * `data` contient le corps JSON brut renvoyé par le backend (Symfony / API Platform)
 * quand disponible, pour permettre un traitement fin (ex: erreurs de validation).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  readonly endpoint: string;

  constructor(status: number, message: string, data: unknown = null, endpoint: string = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}
