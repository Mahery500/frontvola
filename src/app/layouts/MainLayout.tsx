/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppHeader } from '@/core/layout/AppHeader';
import { AppSidebar } from '@/core/layout/AppSidebar';
import { AppFooter } from '@/core/layout/AppFooter';
import { NotificationToast } from '@/core/layout/NotificationToast';
import { User_, role, Service } from '@/core/types';

export interface MainLayoutProps {
  children: React.ReactNode;
  activeView: string;
  activeSubTab: string;
  onNavigate: (view: any, subTab?: string) => void;
  activeUser: User_ | null;
  activeRole: role | null | undefined;
  activeServiceId: number;
  onServiceChange: (serviceId: number) => void;
  currentSiteServices: Service[];
  isAuthorized: (panelName: any) => boolean;
  onLogout: () => void;
  notification: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null;
  onCloseNotification?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeView,
  activeSubTab,
  onNavigate,
  activeUser,
  activeRole,
  activeServiceId,
  onServiceChange,
  currentSiteServices,
  isAuthorized,
  onLogout,
  notification,
  onCloseNotification,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 tracking-normal scroll-smooth">
      {/* Top Header */}
      <AppHeader
        activeView={activeView}
        activeUser={activeUser}
        activeRole={activeRole}
        activeServiceId={activeServiceId}
        onServiceChange={onServiceChange}
        currentSiteServices={currentSiteServices}
        onToggleMobileSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
        sidebarOpenMobile={sidebarOpenMobile}
      />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Sidebar */}
        <AppSidebar
          activeView={activeView}
          activeSubTab={activeSubTab}
          onNavigate={onNavigate}
          activeUser={activeUser}
          activeRole={activeRole}
          isAuthorized={isAuthorized}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarOpenMobile={sidebarOpenMobile}
          setSidebarOpenMobile={setSidebarOpenMobile}
          onLogout={onLogout}
        />

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Floating Notification */}
      <NotificationToast notification={notification} onClose={onCloseNotification} />
    </div>
  );
};

export default MainLayout;
