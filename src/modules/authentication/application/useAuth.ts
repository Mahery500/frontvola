/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { authApi } from '../infrastructure/auth.api';
import { AuthenticatedUser } from '../domain/auth.types';
import { getApiBaseUrl, setApiBaseUrl } from '@/core/http';

export function useAuth(onLoginSuccess: (user: AuthenticatedUser) => void) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrlState] = useState(() => getApiBaseUrl());
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApiUrlChange = (newUrl: string) => {
    setApiUrlState(newUrl);
    setApiBaseUrl(newUrl);
  };

  const login = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError(null);

      if (!username.trim()) {
        setError("Veuillez saisir votre identifiant (ex: admin).");
        return;
      }
      if (!password) {
        setError('Veuillez saisir votre mot de passe.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await authApi.login({
          identifier: username.trim(),
          username: username.trim(),
          password,
        });

        onLoginSuccess(result.user);
        setPassword('');
      } catch (err: any) {
        console.error('[Auth Hook] Erreur lors de la connexion Symfony:', err);
        setError(err.message || 'Échec de la connexion au serveur Symfony. Vérifiez vos identifiants.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, onLoginSuccess]
  );

  return {
    username,
    setUsername,
    password,
    setPassword,
    apiUrl,
    handleApiUrlChange,
    showConfig,
    setShowConfig,
    error,
    isSubmitting,
    login,
  };
}
