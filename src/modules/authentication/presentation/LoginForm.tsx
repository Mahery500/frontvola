/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KeyRound, User, Lock, RefreshCw, Server, AlertCircle, Settings2, ShieldCheck } from 'lucide-react';
import { AuthenticatedUser } from '../domain/auth.types';
import { useAuth } from '../application/useAuth';

export interface LoginFormProps {
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const {
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
  } = useAuth(onLoginSuccess);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Connexion au Portail
          </h3>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            title="Configurer l'URL du Backend Symfony"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Authentification sécurisée par jeton <strong>JWT</strong> via votre API backend Symfony.
        </p>
      </div>

      {/* Configuration URL Symfony */}
      {showConfig && (
        <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-primary" />
              URL Backend Symfony (API)
            </span>
            <span className="text-[10px] text-slate-400">LexikJWT / REST</span>
          </div>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => handleApiUrlChange(e.target.value)}
            placeholder="http://localhost:8000/api"
            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-slate-500 leading-tight">
            Par défaut : <code>http://localhost:8000/api</code>. Les requêtes de login sont envoyées sur <code>POST /api/login</code>.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Échec d'authentification</span>
            <span className="text-[11px] leading-relaxed block">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={login} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Identifiant (Identifier)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex: admin"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition"
            disabled={isSubmitting}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe sécurisé..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition"
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full btn-primary py-3 rounded-lg text-xs font-bold transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Vérification du JWT en cours...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Se Connecter avec JWT</span>
            </>
          )}
        </button>
      </form>

      {/* Info compatibilité Symfony */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-slate-400" />
          Backend : <code className="text-slate-600 font-mono text-[10px] truncate max-w-[170px]">{apiUrl}</code>
        </span>
        <span className="font-semibold text-emerald-600 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LexikJWT ready
        </span>
      </div>
    </div>
  );
};

export default LoginForm;
