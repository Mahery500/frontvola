/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { StockTabType } from '../domain/stock.types';

export function useStock(initialTab: StockTabType = 'visualiser') {
  const [internalTab, setInternalTab] = useState<StockTabType>(initialTab);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  return {
    internalTab,
    setInternalTab,
    notification,
    triggerNotification,
  };
}
