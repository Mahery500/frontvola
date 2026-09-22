/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User_ } from '@/core/types';
import { LoginForm } from '@/modules/authentication';
import { AuthenticatedUser } from '@/modules/authentication/domain/auth.types';

export interface LoginPageProps {
  users?: User_[];
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 text-slate-800 font-sans selection:bg-asina-500/20">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
        
        {/* Brand/Welcome Column */}
        <div className="md:w-5/12 bg-emerald-800 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-emerald-850 to-asina-600 opacity-95" />
          <div className="absolute inset-y-0 right-0 w-32 bg-white/5 skew-x-12 transform origin-top-right pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center text-white text-xl font-black select-none shadow-sm">
              A
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-200 uppercase leading-none block">
                Plateforme SIH
              </span>
              <span className="text-xl font-bold tracking-tight block font-sans">
                ASINA Medical
              </span>
            </div>
          </div>
          
          <div className="relative z-10 my-10 space-y-4">
            <h2 className="text-2xl font-bold leading-tight">Système d'Information Hospitalier Intégré</h2>
            <p className="text-emerald-100 text-xs leading-relaxed">
              Consommation d'API REST & API Platform Symfony sécurisée par JWT (LexikJWTAuthenticationBundle) avec contrôle des permissions RBAC.
            </p>
            <div className="pt-2 text-[11px] text-emerald-200/90 space-y-1 bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="font-semibold text-white">Sécurité Symfony :</div>
              <div>• Authentification via <code>POST /api/login</code></div>
              <div>• Injection du header <code>Authorization: Bearer &lt;token&gt;</code></div>
              <div>• Gestion automatique des permissions <code>ROLE_*</code></div>
            </div>
          </div>
          
          <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-emerald-200/80 font-semibold space-y-1">
            <p>📍 Antananarivo • Ivato • Toamasina</p>
            <p>© 2026 ASINA Holding S.A.</p>
          </div>
        </div>
        
        {/* Form Column */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 bg-white flex flex-col justify-center">
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
        
      </div>
    </div>
  );
};

export default LoginPage;
