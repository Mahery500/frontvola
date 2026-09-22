/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isJwtExpired } from './jwt';

/**
 * Gestion de la session HTTP : URL de base de l'API Symfony, jeton JWT
 * et notification d'expiration de session. Isolé de l'ApiClient pour que
 * chaque responsabilité (transport HTTP vs état de session) reste séparée.
 */

const DEFAULT_SYMFONY_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:8000/api';

export const JWT_STORAGE_KEY = 'asina_jwt_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'asina_refresh_token';
export const USER_STORAGE_KEY = 'asina_logged_in_user';
export const API_URL_STORAGE_KEY = 'asina_api_base_url';

const isBrowser = typeof window !== 'undefined';

export function getApiBaseUrl(): string {
  if (isBrowser) {
    const custom = localStorage.getItem(API_URL_STORAGE_KEY);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_SYMFONY_URL.replace(/\/+$/, '');
}

export function setApiBaseUrl(url: string): void {
  if (isBrowser) {
    localStorage.setItem(API_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getStoredJwtToken(): string | null {
  if (!isBrowser) return null;
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  if (!token) return null;

  if (isJwtExpired(token)) {
    clearStoredAuth();
    return null;
  }
  return token;
}

export function setStoredJwtToken(token: string): void {
  if (isBrowser) {
    localStorage.setItem(JWT_STORAGE_KEY, token);
  }
}

export function clearStoredAuth(): void {
  if (isBrowser) {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

type AuthListener = () => void;
const unauthorizedListeners = new Set<AuthListener>();

export function onAuthUnauthorized(listener: AuthListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function notifyUnauthorized(): void {
  clearStoredAuth();
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('[Session] Erreur dans un listener "unauthorized":', e);
    }
  });
}
