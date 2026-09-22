/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_STATE } from '@/core/constants';
import { ASINAState, StaffProfile, role } from '@/core/types';
import { formatRoleLabel, formatUserDisplayName } from '@/core/utils/formatters';
import { MainLayout } from './layouts/MainLayout';
import { AppProviders } from './providers';
import { AppView } from './router';
import { AuthenticatedUser } from '@/modules/authentication/domain/auth.types';
import { authApi } from '@/modules/authentication/infrastructure/auth.api';
import { getStoredJwtToken, clearStoredAuth, onAuthUnauthorized } from '@/core/http';
import { checkSymfonyPermission } from '@/core/http';
import { patientsRepository } from '@/modules/patients/infrastructure/patients.repository';
import { companiesRepository } from '@/modules/companies/infrastructure/companies.repository';
import { administrationApi } from '@/modules/administration/infrastructure/administration.api';

// Importing Page Components from pages/
import { AdministrationPage } from '../pages/Administration/AdministrationPage';
import { ReceptionPage } from '../pages/Reception/ReceptionPage';
import { InfirmeriePage } from '../pages/Infirmerie/InfirmeriePage';
import { ConsultationPage } from '../pages/Consultation/ConsultationPage';
import { StockPage } from '../pages/Stock/StockPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ApiConfigPage } from '../pages/ApiConfig/ApiConfigPage';
import { LoginPage } from '../pages/Login/LoginPage';

const getDefaultViewForUser = (user: AuthenticatedUser | null): AppView => {
  if (!user) return 'admin';
  const roles = [
    ...(user.roles || []),
    ...(user.role ? [user.role] : []),
  ].map(r => r.toUpperCase());

  if (roles.some(r => r.includes('ADMIN'))) return 'admin';
  if (roles.some(r => r.includes('MEDECIN') || r.includes('DOCTOR') || r.includes('MED_GEN') || r.includes('MED_SPEC') || r.includes('MED_CHEF'))) return 'doctor';
  if (roles.some(r => r.includes('INFIRMIER') || r.includes('INFIRMIERE') || r.includes('NURSE'))) return 'infirmerie';
  if (roles.some(r => r.includes('ACCUEIL') || r.includes('RECEPTION') || r.includes('SECRETAIRE'))) return 'accueil';
  if (roles.some(r => r.includes('STOCK') || r.includes('PHARMACIEN') || r.includes('DISPENSATEUR'))) return 'stock';
  return 'doctor';
};

export function App() {
  // Initialisation propre : nettoyage des anciennes fausses données de démonstration du cache
  const [state, setState] = useState<ASINAState>(() => {
    const cached = localStorage.getItem('asina_database_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Détecter et purger les anciens faux patients ou faux utilisateurs en dur
        const hasMockData =
          parsed?.User_?.some((u: any) => u.login === 'doc.jean' || (u.login === 'admin' && u.nom === 'RAVELO')) ||
          parsed?.Patient?.some((p: any) => p.Nom === 'Dupont' || p.Nom === 'Rasoa');

        if (hasMockData) {
          localStorage.removeItem('asina_database_v1');
          return INITIAL_STATE;
        }
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        console.error('Erreur de lecture du cache local:', e);
      }
    }
    return INITIAL_STATE;
  });

  // Utilisateur connecté via JWT Symfony
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    const token = getStoredJwtToken();
    if (!token) {
      clearStoredAuth();
      return null;
    }
    const cached = localStorage.getItem('asina_logged_in_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Si ancien utilisateur mock sans jeton ou sans rôles
        if (!parsed.token && !parsed.roles) {
          clearStoredAuth();
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Erreur lecture utilisateur connecté:', e);
      }
    }
    return null;
  });

  const [activeSiteId] = useState<number>(1);
  const [activeServiceId, setActiveServiceId] = useState<number>(1);
  const [activeView, setActiveView] = useState<AppView>(() => getDefaultViewForUser(currentUser));
  const [activeSubTab, setActiveSubTab] = useState<string>(() => (currentUser && getDefaultViewForUser(currentUser) === 'doctor' ? 'attente' : 'utilisateurs'));
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Synchronisation avec le stockage local
  useEffect(() => {
    localStorage.setItem('asina_database_v1', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<ASINAState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Écoute de l'invalidation automatique du token JWT (401 Unauthorized de Symfony)
  useEffect(() => {
    const unsubscribe = onAuthUnauthorized(() => {
      setCurrentUser(null);
      setNotification({
        type: 'warning',
        text: 'Session expirée ou jeton JWT invalidé par le backend Symfony. Veuillez vous reconnecter.',
      });
    });
    return unsubscribe;
  }, []);

  // Consommation en arrière-plan des endpoints réels de l'API Symfony lors de la connexion
  useEffect(() => {
    if (!currentUser) return;

    const fetchSymfonyData = async () => {
      try {
        const [
          patientsRes,
          companiesRes,
          sitesRes,
          servicesRes,
          typeServicesRes,
          assignmentsRes,
          usersRes,
          staffsRes
        ] = await Promise.allSettled([
          patientsRepository.findAll(),               // GET /api/patients
          companiesRepository.findAll(),              // GET /api/companies
          administrationApi.getSites(),       // GET /api/sites
          administrationApi.getServices(),    // GET /api/services
          administrationApi.getTypeServices(),// GET /api/type-services
          administrationApi.getAssignments(), // GET /api/assignments
          administrationApi.getUsers(),       // GET /api/users
          administrationApi.getStaffs(),      // GET /api/staffs
        ]);

        setState(prev => {
          let updatedUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0
            ? usersRes.value
            : (currentUser ? [currentUser] : prev.User_);

          let updatedStaffProfiles = prev.StaffProfile;

          if (staffsRes.status === 'fulfilled' && staffsRes.value) {
            const { profiles, users: staffUsers } = staffsRes.value;
            if (profiles && profiles.length > 0) {
              const profileMap = new Map(updatedStaffProfiles.map(sp => [sp.Id_staff_profile, sp]));
              profiles.forEach(p => profileMap.set(p.Id_staff_profile, p));
              updatedStaffProfiles = Array.from(profileMap.values());
            }
            if (staffUsers && staffUsers.length > 0) {
              const usersMap = new Map(updatedUsers.map(u => [u.Id_User, u]));
              staffUsers.forEach(su => usersMap.set(su.Id_User, su));
              updatedUsers = Array.from(usersMap.values());
            }
          }

          return {
            ...prev,
            Patient: patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value) && patientsRes.value.length > 0 ? patientsRes.value : prev.Patient,
            Entreprise: companiesRes.status === 'fulfilled' && Array.isArray(companiesRes.value) && companiesRes.value.length > 0 ? companiesRes.value : prev.Entreprise,
            Site: sitesRes.status === 'fulfilled' && Array.isArray(sitesRes.value) && sitesRes.value.length > 0 ? sitesRes.value : prev.Site,
            Service: servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) && servicesRes.value.length > 0 ? servicesRes.value : prev.Service,
            TypeService: typeServicesRes.status === 'fulfilled' && Array.isArray(typeServicesRes.value) && typeServicesRes.value.length > 0 ? typeServicesRes.value : prev.TypeService,
            Affectation: assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value) && assignmentsRes.value.length > 0 ? assignmentsRes.value : prev.Affectation,
            User_: updatedUsers,
            StaffProfile: updatedStaffProfiles,
          };
        });
      } catch (e) {
        console.info('[Symfony API] Synchronisation des endpoints réels:', e);
      }
    };

    fetchSymfonyData();
  }, [currentUser]);

  // Résolution du rôle actif basé sur les rôles JWT Symfony ou la table locale
  const activeRole: role | null = currentUser
    ? state.role.find(r => r.Id_role === currentUser.Id_role) || {
        Id_role: currentUser.Id_role || 1,
        code: (currentUser.roles?.[0] || 'ROLE_USER').replace(/^ROLE_/, ''),
        libelle: formatRoleLabel(currentUser.role || currentUser.roles?.[0]),
      }
    : null;

  const currentSiteServices = state.Service.filter(s => s.Id_Site === activeSiteId);

  useEffect(() => {
    if (currentSiteServices.length > 0) {
      const exists = currentSiteServices.some(s => s.Id_Service === activeServiceId);
      if (!exists) {
        setActiveServiceId(currentSiteServices[0].Id_Service);
      }
    }
  }, [activeSiteId, currentSiteServices, activeServiceId]);

  // Contrôle des permissions RBAC pour Symfony (avec support direct des rôles ROLE_*)
  const isAuthorized = useCallback(
    (panelName: AppView): boolean => {
      if (!currentUser) return false;
      if (panelName === 'api_config') return true;

      // 1. Contrôle par rôles Symfony JWT (ex: ROLE_ADMIN, ROLE_MEDECIN, ROLE_INFIRMIER...)
      if (currentUser.roles && currentUser.roles.length > 0) {
        return checkSymfonyPermission(currentUser.roles, panelName);
      }

      // 2. Contrôle de repli par table locale des rôles
      const userRole = state.role.find(r => r.Id_role === currentUser.Id_role);
      if (!userRole) return false;

      const roleCode = userRole.code;
      if (roleCode === 'ADMIN') return true;

      switch (panelName) {
        case 'admin':
          return roleCode === 'ADMIN';
        case 'accueil':
          return roleCode === 'ACCUEIL' || roleCode === 'SECRETAIRE';
        case 'doctor':
          return roleCode === 'MED_GEN' || roleCode === 'MED_SPEC_INT' || roleCode === 'MED_SPEC_EXT' || roleCode === 'MED_CHEF';
        case 'stock':
          return roleCode === 'STOCK_CENTRAL' || roleCode === 'STOCK_SITE' || roleCode === 'DISPENSATEUR';
        case 'analysis':
          return roleCode === 'MED_CHEF';
        case 'infirmerie':
          return roleCode === 'INFIRMIER' || roleCode === 'MED_GEN' || roleCode === 'MED_SPEC_INT' || roleCode === 'MED_SPEC_EXT';
        default:
          return false;
      }
    },
    [currentUser, state.role]
  );

  const handleNavigate = (view: AppView, subTab?: string) => {
    setActiveView(view);
    setActiveSubTab(subTab || '');
  };

  // Redirection automatique vers le module autorisé pour ce rôle Symfony
  useEffect(() => {
    if (!currentUser) return;
    if (isAuthorized('admin')) {
      setActiveView('admin');
      setActiveSubTab('utilisateurs');
    } else if (isAuthorized('doctor')) {
      setActiveView('doctor');
      setActiveSubTab('attente');
    } else if (isAuthorized('infirmerie')) {
      setActiveView('infirmerie');
      setActiveSubTab('vitals');
    } else if (isAuthorized('accueil')) {
      setActiveView('accueil');
      setActiveSubTab('enregistrer');
    } else if (isAuthorized('stock')) {
      setActiveView('stock');
      setActiveSubTab('visualiser');
    } else if (isAuthorized('analysis')) {
      setActiveView('analysis');
      setActiveSubTab('');
    } else {
      setActiveView('api_config');
    }
  }, [currentUser, isAuthorized]);

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setNotification({
      type: 'info',
      text: 'Vous avez été déconnecté du portail Symfony.',
    });
  };

  // Écran de connexion si non authentifié avec JWT
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          const targetView = getDefaultViewForUser(user);
          setActiveView(targetView);
          setActiveSubTab(targetView === 'doctor' ? 'attente' : 'utilisateurs');

          // Mise à jour de la liste locale des utilisateurs et profils de santé
          setState(prev => {
            const existingIdx = prev.User_.findIndex(u => u.Id_User === user.Id_User || u.login === user.login);
            const updatedUsers = [...prev.User_];
            if (existingIdx >= 0) {
              updatedUsers[existingIdx] = { ...updatedUsers[existingIdx], ...user };
            } else {
              updatedUsers.push(user);
            }

            const roles = [
              ...(user.roles || []),
              ...(user.role ? [user.role] : []),
            ].map(r => r.toUpperCase());

            const isDoctor = roles.some(r =>
              r.includes('MEDECIN') ||
              r.includes('DOCTOR') ||
              r.includes('MED_GEN') ||
              r.includes('MED_SPEC') ||
              r.includes('MED_CHEF')
            );

            let updatedStaffProfiles = [...prev.StaffProfile];
            if (isDoctor && !updatedStaffProfiles.some(sp => sp.Id_User === user.Id_User)) {
              updatedStaffProfiles.push({
                Id_staff_profile: 100 + (user.Id_User || 2),
                Type: 'Médecin',
                Id_Specialite: 1, // Médecine Générale
                Id_User: user.Id_User || 2,
              });
            }

            return {
              ...prev,
              User_: updatedUsers,
              StaffProfile: updatedStaffProfiles,
            };
          });

          setNotification({
            type: 'success',
            text: `Authentification réussie ! Bienvenue, ${formatUserDisplayName(user)} (${formatRoleLabel(user.role || user.roles?.[0])}).`,
          });
        }}
      />
    );
  }

  // Profils par défaut sécurisés pour éviter les erreurs d'index sur listes vides
  const defaultProfile: StaffProfile = {
    Id_staff_profile: currentUser.Id_User || 1,
    Type: currentUser.roles?.includes('ROLE_ADMIN')
      ? 'Administrateur'
      : (currentUser.roles?.some(r => r.includes('MED')) ? 'Médecin' : 'Personnel'),
    Id_Specialite: 1,
    Id_User: currentUser.Id_User || 1,
  };

  const activeStaffProfile = state.StaffProfile.find(p => p.Id_User === currentUser.Id_User) || defaultProfile;
  const activeDrProfile = state.StaffProfile.find(p => p.Id_User === currentUser.Id_User) || defaultProfile;

  return (
    <AppProviders>
      <MainLayout
        activeView={activeView}
        activeSubTab={activeSubTab}
        onNavigate={handleNavigate}
        activeUser={currentUser}
        activeRole={activeRole}
        activeServiceId={activeServiceId}
        onServiceChange={setActiveServiceId}
        currentSiteServices={currentSiteServices}
        isAuthorized={isAuthorized}
        onLogout={handleLogout}
        notification={notification}
        onCloseNotification={() => setNotification(null)}
      >
        {activeView === 'admin' && (
          <AdministrationPage
            state={state}
            updateState={updateState}
            activeSiteId={activeSiteId}
            overrideTab={activeSubTab as any}
          />
        )}

        {activeView === 'accueil' && (
          <ReceptionPage
            state={state}
            updateState={updateState}
            activeSiteId={activeSiteId}
            overrideTab={activeSubTab as any}
          />
        )}

        {activeView === 'infirmerie' && (
          <InfirmeriePage
            state={state}
            updateState={updateState}
            activeSiteId={activeSiteId}
            activeStaffProfile={activeStaffProfile}
            overrideTab={activeSubTab as any}
          />
        )}

        {activeView === 'doctor' && (
          <ConsultationPage
            state={state}
            updateState={updateState}
            activeSiteId={activeSiteId}
            activeServiceId={activeServiceId}
            activeDrProfile={activeDrProfile}
            overrideTab={activeSubTab as any}
          />
        )}

        {activeView === 'stock' && (
          <StockPage
            state={state}
            updateState={updateState}
            activeSiteId={activeSiteId}
            activeRoleCode={activeRole?.code || ''}
            overrideTab={activeSubTab as any}
          />
        )}

        {activeView === 'analysis' && (
          <DashboardPage
            state={state}
            activeSiteId={activeSiteId}
          />
        )}

        {activeView === 'api_config' && (
          <ApiConfigPage
            state={state}
            updateState={updateState}
          />
        )}
      </MainLayout>
    </AppProviders>
  );
}

export default App;
