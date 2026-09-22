/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-stone-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-400 shrink-0 select-none">
      <span>ASINA Medical Platform © 2026. Conçu pour le pilotage d'activité clinique & logistique.</span>
      <span className="font-mono mt-1 sm:mt-0">Architecture Modulaire v2.0 (Tana / Ivato / Tamatave)</span>
    </footer>
  );
};

export default AppFooter;
