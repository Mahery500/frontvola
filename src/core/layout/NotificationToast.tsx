/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface NotificationToastProps {
  notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null;
  onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  const styles = {
    success: 'bg-emerald-900/90 text-emerald-100 border-emerald-700',
    error: 'bg-rose-900/90 text-rose-100 border-rose-700',
    warning: 'bg-amber-900/90 text-amber-100 border-amber-700',
    info: 'bg-cyan-900/90 text-cyan-100 border-cyan-700',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xs ${styles[notification.type]}`}>
        {icons[notification.type]}
        <p className="text-sm font-medium">{notification.text}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-md transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;
