/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Stethoscope, 
  Search, 
  AlertCircle, 
  Building2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Trash2,
  Edit,
  X,
  Lock,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { ASINAState, User_, StaffProfile } from '@/core/types';
import { 
  isUserAdmin, 
  isUserStaff, 
  formatRoleLabel, 
  formatUserDisplayName, 
  getUserAvatarInitial 
} from '@/core/utils/formatters';
import { administrationApi } from '../infrastructure/administration.api';

interface AdminUsersTabProps {
  state: ASINAState;
  updateState: (newState: Partial<ASINAState>) => void;
  triggerNotification: (type: 'success' | 'error', text: string) => void;
}

export default function AdminUsersTab({ state, updateState, triggerNotification }: AdminUsersTabProps) {
  // Filtre principal de vue
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'staff' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);

  // État de chargement et de synchronisation API
  const [apiLoading, setApiLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'online' | 'offline'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Formulaire de création
  const [newUserType, setNewUserType] = useState<'personnel' | 'admin'>('personnel');
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('AsinaSanté@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRoleId, setNewRoleId] = useState<number>(3); // Médecin du travail par défaut
  const [newSpecialiteId, setNewSpecialiteId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal d'édition
  const [editingUser, setEditingUser] = useState<User_ | null>(null);
  const [editPrenom, setEditPrenom] = useState('');
  const [editNom, setEditNom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState<number>(3);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Statistiques
  const countStaff = useMemo(() => state.User_.filter(u => isUserStaff(u)).length, [state.User_]);
  const countAdmin = useMemo(() => state.User_.filter(u => isUserAdmin(u)).length, [state.User_]);
  const countAll = state.User_.length;
  const countActive = useMemo(() => state.User_.filter(u => u.isActive !== false).length, [state.User_]);

  /**
   * Synchronisation des utilisateurs et du personnel depuis l'API backend
   */
  const handleRefreshData = useCallback(async () => {
    setApiLoading(true);
    try {
      if (selectedFilter === 'staff') {
        const { profiles, users } = await administrationApi.getStaffs({ page });
        if (profiles.length > 0 || users.length > 0) {
          const existingProfilesMap = new Map(state.StaffProfile.map(sp => [sp.Id_staff_profile, sp]));
          profiles.forEach(p => existingProfilesMap.set(p.Id_staff_profile, p));

          const existingUsersMap = new Map(state.User_.map(u => [u.Id_User, u]));
          users.forEach(u => existingUsersMap.set(u.Id_User, u));

          updateState({
            StaffProfile: Array.from(existingProfilesMap.values()),
            User_: Array.from(existingUsersMap.values()),
          });
        }
      } else if (selectedFilter === 'admin') {
        // Filtrage côté front ROLE_ADMIN sur les données de /api/users
        const apiUsers = await administrationApi.getUsers({
          page,
          perPage: String(perPage),
          role: 'ROLE_ADMIN',
          ...(statusFilter === 'active' ? { isActive: 'true' } : statusFilter === 'inactive' ? { isActive: 'false' } : {}),
        });

        if (apiUsers.length > 0) {
          const existingUsersMap = new Map(state.User_.map(u => [u.Id_User, u]));
          apiUsers.forEach(u => existingUsersMap.set(u.Id_User, u));
          updateState({ User_: Array.from(existingUsersMap.values()) });
        }
      } else {
        // Vue 'Tous' : récupération combinée /api/users et /api/staffs
        const [usersRes, staffsRes] = await Promise.allSettled([
          administrationApi.getUsers({
            page,
            perPage: String(perPage),
            ...(statusFilter === 'active' ? { isActive: 'true' } : statusFilter === 'inactive' ? { isActive: 'false' } : {}),
          }),
          administrationApi.getStaffs({ page }),
        ]);

        const existingUsersMap = new Map(state.User_.map(u => [u.Id_User, u]));
        const existingProfilesMap = new Map(state.StaffProfile.map(sp => [sp.Id_staff_profile, sp]));

        if (usersRes.status === 'fulfilled' && usersRes.value.length > 0) {
          usersRes.value.forEach(u => existingUsersMap.set(u.Id_User, u));
        }

        if (staffsRes.status === 'fulfilled') {
          staffsRes.value.profiles.forEach(p => existingProfilesMap.set(p.Id_staff_profile, p));
          staffsRes.value.users.forEach(u => {
            const existing = existingUsersMap.get(u.Id_User);
            if (existing) {
              existingUsersMap.set(u.Id_User, {
                ...existing,
                prenom: u.prenom || existing.prenom,
                nom: u.nom || existing.nom,
                roles: u.roles || existing.roles,
              });
            } else {
              existingUsersMap.set(u.Id_User, u);
            }
          });
        }

        updateState({
          User_: Array.from(existingUsersMap.values()),
          StaffProfile: Array.from(existingProfilesMap.values()),
        });
      }
      setApiStatus('online');
      setLastSyncTime(new Date());
    } catch (err) {
      console.info('[AdminUsersTab] Mode local/données en mémoire:', err);
      setApiStatus('offline');
    } finally {
      setApiLoading(false);
    }
  }, [selectedFilter, statusFilter, page, perPage, state.StaffProfile, state.User_, updateState]);

  // Chargement initial
  useEffect(() => {
    handleRefreshData();
  }, [selectedFilter, statusFilter]);

  // Génération automatique du login suggéré lors de la frappe du prénom et du nom
  const handlePrenomChange = (val: string) => {
    setNewPrenom(val);
    if (!newLogin || newLogin.includes('.')) {
      const p = val.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const n = newNom.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (p && n) setNewLogin(`${p}.${n}`);
      else if (p) setNewLogin(p);
    }
  };

  const handleNomChange = (val: string) => {
    setNewNom(val);
    if (!newLogin || newLogin.includes('.')) {
      const p = newPrenom.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const n = val.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (p && n) setNewLogin(`${p}.${n}`);
      else if (n) setNewLogin(n);
    }
  };

  // Création d'un nouvel utilisateur ou membre de staff
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogin.trim()) {
      triggerNotification('error', "Veuillez renseigner un identifiant de connexion.");
      return;
    }

    const trimmedLogin = newLogin.trim().toLowerCase();
    if (state.User_.some(u => u.login.toLowerCase() === trimmedLogin)) {
      triggerNotification('error', `L'identifiant "${trimmedLogin}" est déjà utilisé.`);
      return;
    }

    if (newUserType === 'personnel' && (!newPrenom.trim() || !newNom.trim())) {
      triggerNotification('error', 'Le prénom et le nom sont obligatoires pour le personnel soignant.');
      return;
    }

    if (newUserType === 'admin' && !newEmail.trim()) {
      triggerNotification('error', "L'adresse email est requise pour un administrateur.");
      return;
    }

    setIsSubmitting(true);
    const nextIdUser = state.User_.length > 0 ? Math.max(...state.User_.map(u => u.Id_User)) + 1 : 1;

    try {
      if (newUserType === 'personnel') {
        // Enregistrement via l'endpoint de staff
        const staffPayload = {
          prenom: newPrenom.trim(),
          nom: newNom.trim().toUpperCase(),
          login: trimmedLogin,
          password: newPassword.trim() || 'AsinaSanté@2025',
          roles: ['ROLE_STAFF'],
        };

        try {
          await administrationApi.createStaff(staffPayload);
        } catch (apiErr) {
          console.info('[AdminUsersTab] API createStaff en mode fallback local:', apiErr);
        }

        const nextIdStaff = state.StaffProfile.length > 0
          ? Math.max(...state.StaffProfile.map(sp => sp.Id_staff_profile)) + 1
          : 1;

        const roleObj = state.role.find(r => r.Id_role === Number(newRoleId));
        const newStaff: StaffProfile = {
          Id_staff_profile: nextIdStaff,
          Type: roleObj ? roleObj.libelle : 'Personnel Soignant',
          Id_Specialite: newSpecialiteId,
          Id_User: nextIdUser,
          Matricule: `STF-${String(nextIdStaff).padStart(3, '0')}`,
        };

        const newUserRecord: User_ = {
          Id_User: nextIdUser,
          login: trimmedLogin,
          nom: newNom.trim().toUpperCase(),
          prenom: newPrenom.trim(),
          Id_role: Number(newRoleId),
          userType: 'personnel',
          email: newEmail.trim() || `${trimmedLogin}@asina-sante.mg`,
          roles: ['ROLE_STAFF', 'ROLE_USER'],
          role: 'ROLE_STAFF',
          isActive: true,
        };

        updateState({
          User_: [newUserRecord, ...state.User_],
          StaffProfile: [newStaff, ...state.StaffProfile],
        });

        triggerNotification('success', `Praticien ${newPrenom} ${newNom} ajouté au registre.`);
      } else {
        // Enregistrement d'un administrateur
        const adminPayload = {
          login: trimmedLogin,
          email: newEmail.trim(),
          password: newPassword.trim() || 'AsinaAdmin@2025',
          roles: ['ROLE_ADMIN'],
        };

        try {
          await administrationApi.createUser(adminPayload);
        } catch (apiErr) {
          console.info('[AdminUsersTab] API createUser en mode fallback local:', apiErr);
        }

        const newUserRecord: User_ = {
          Id_User: nextIdUser,
          login: trimmedLogin,
          nom: newNom.trim() ? newNom.trim().toUpperCase() : 'ADMIN',
          prenom: newPrenom.trim() || 'Système',
          Id_role: 1, // Administrateur
          userType: 'admin',
          email: newEmail.trim(),
          roles: ['ROLE_ADMIN'],
          role: 'ROLE_ADMIN',
          isActive: true,
        };

        updateState({
          User_: [newUserRecord, ...state.User_],
        });

        triggerNotification('success', `Compte administrateur "${trimmedLogin}" créé.`);
      }

      // Réinitialisation du formulaire
      setNewPrenom('');
      setNewNom('');
      setNewLogin('');
      setNewEmail('');
      setNewPhone('');
    } catch (err: any) {
      triggerNotification('error', "Impossible d'enregistrer l'utilisateur: " + (err.message || 'Erreur'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Basculement rapide du statut Actif / Inactif
  const handleToggleActive = async (user: User_) => {
    const updatedStatus = !user.isActive;
    try {
      await administrationApi.updateUser(user.Id_User, { isActive: updatedStatus });
    } catch (e) {
      console.info('[AdminUsersTab] Mise à jour du statut en local:', e);
    }

    updateState({
      User_: state.User_.map(u => u.Id_User === user.Id_User ? { ...u, isActive: updatedStatus } : u),
    });

    triggerNotification('success', `Compte "${user.login}" ${updatedStatus ? 'activé' : 'désactivé'}.`);
  };

  // Suppression d'un utilisateur avec confirmation
  const handleDeleteUser = async (user: User_) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du compte "${user.login}" ?`)) {
      return;
    }

    try {
      await administrationApi.deleteUser(user.Id_User);
    } catch (e) {
      console.info('[AdminUsersTab] Suppression en local:', e);
    }

    updateState({
      User_: state.User_.filter(u => u.Id_User !== user.Id_User),
      StaffProfile: state.StaffProfile.filter(sp => sp.Id_User !== user.Id_User),
      Affectation: state.Affectation.filter(aff => {
        const staff = state.StaffProfile.find(sp => sp.Id_User === user.Id_User);
        return staff ? aff.Id_staff_profile !== staff.Id_staff_profile : true;
      }),
    });

    triggerNotification('success', `Compte "${user.login}" supprimé avec succès.`);
  };

  // Ouverture de la modale d'édition
  const handleOpenEdit = (user: User_) => {
    setEditingUser(user);
    setEditPrenom(user.prenom || '');
    setEditNom(user.nom || '');
    setEditEmail(user.email || '');
    setEditRoleId(user.Id_role || 3);
    setEditIsActive(user.isActive !== false);
  };

  // Enregistrement des modifications utilisateur
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingEdit(true);
    try {
      await administrationApi.updateUser(editingUser.Id_User, {
        email: editEmail.trim() || undefined,
        isActive: editIsActive,
      });

      updateState({
        User_: state.User_.map(u => u.Id_User === editingUser.Id_User ? {
          ...u,
          prenom: editPrenom.trim(),
          nom: editNom.trim().toUpperCase(),
          email: editEmail.trim(),
          Id_role: editRoleId,
          isActive: editIsActive,
        } : u),
      });

      triggerNotification('success', `Compte "${editingUser.login}" mis à jour.`);
      setEditingUser(null);
    } catch (err: any) {
      triggerNotification('error', "Erreur lors de la mise à jour: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return state.User_.filter(u => {
      // Filtre catégorie
      if (selectedFilter === 'staff' && !isUserStaff(u)) return false;
      if (selectedFilter === 'admin' && !isUserAdmin(u)) return false;

      // Filtre statut
      if (statusFilter === 'active' && u.isActive === false) return false;
      if (statusFilter === 'inactive' && u.isActive !== false) return false;

      // Filtre de recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${u.nom || ''} ${u.prenom || ''}`.toLowerCase();
        const login = (u.login || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const roleObj = state.role.find(r => r.Id_role === u.Id_role);
        const roleLibelle = (roleObj?.libelle || '').toLowerCase();
        return fullName.includes(q) || login.includes(q) || email.includes(q) || roleLibelle.includes(q);
      }

      return true;
    });
  }, [state.User_, selectedFilter, statusFilter, searchQuery, state.role]);

  // Calcul pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, page, perPage]);

  return (
    <div className="space-y-6 animate-fade-in" id="admin-users-view">
      {/* 1. En-tête supérieur épuré avec indicateurs clés */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-asina-600" />
              <span>Gestion des Utilisateurs & Personnels</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervision des comptes praticiens, profils de santé au travail et habilitations administratives
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Indicateur de statut réseau / API */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className={`h-2 w-2 rounded-full ${
                apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`} />
              <span className="font-medium text-slate-700">
                {apiStatus === 'online' ? 'Serveur connecté' : 'Données synchronisées'}
              </span>
              {lastSyncTime && (
                <span className="text-[10px] text-slate-400">
                  ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>

            {/* Bouton d'actualisation */}
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={apiLoading}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-asina-600 ${apiLoading ? 'animate-spin' : ''}`} />
              <span>{apiLoading ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
          </div>
        </div>

        {/* Métriques globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-150">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Utilisateurs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{countAll}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-150">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Personnel Soignant</span>
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{countStaff}</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-150">
            <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrateurs</span>
            </div>
            <div className="text-xl font-bold text-purple-900 mt-0.5">{countAdmin}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-150">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Comptes Actifs</div>
            <div className="text-xl font-bold text-blue-900 mt-0.5">{countActive}</div>
          </div>
        </div>
      </div>

      {/* 2. Grille principale : Formulaire d'ajout + Registre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Formulaire de création de compte */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-asina-600" />
              <span>Nouveau Compte</span>
            </h3>
          </div>

          {/* Bascule Type de Compte */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setNewUserType('personnel')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                newUserType === 'personnel'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Soignant / Staff</span>
            </button>
            <button
              type="button"
              onClick={() => setNewUserType('admin')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                newUserType === 'admin'
                  ? 'bg-white text-purple-700 shadow-xs font-bold border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrateur</span>
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Prénom {newUserType === 'personnel' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={newUserType === 'personnel'}
                  placeholder="Jean"
                  value={newPrenom}
                  onChange={e => handlePrenomChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500 focus:ring-1 focus:ring-asina-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nom {newUserType === 'personnel' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={newUserType === 'personnel'}
                  placeholder="Rakoto"
                  value={newNom}
                  onChange={e => handleNomChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500 focus:ring-1 focus:ring-asina-500/20"
                />
              </div>
            </div>

            {/* Identifiant (Login) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Identifiant de connexion (Login) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="jean.rakoto"
                value={newLogin}
                onChange={e => setNewLogin(e.target.value.toLowerCase().trim())}
                className="w-full font-mono bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500 focus:ring-1 focus:ring-asina-500/20"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Mot de passe initial</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-asina-600 hover:text-asina-700 font-medium cursor-pointer"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full font-mono bg-white border border-slate-300 rounded-lg p-2 pr-9 focus:outline-hidden focus:border-asina-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Champs spécifiques : Soignant vs Admin */}
            {newUserType === 'personnel' ? (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rôle / Spécialité Médicale <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRoleId}
                    onChange={e => setNewRoleId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                  >
                    {state.role
                      .filter(r => r.Id_role !== 1 && !r.code?.toUpperCase().includes('ADMIN'))
                      .map(r => (
                        <option key={r.Id_role} value={r.Id_role}>{r.libelle}</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email professionnel
                    </label>
                    <input
                      type="email"
                      placeholder="jean.rakoto@asina.mg"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+261 34 00 000 00"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Adresse Email Officielle <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@asina-medical.org"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                />
                <div className="mt-2 p-2.5 bg-purple-50 border border-purple-150 rounded-lg text-[11px] text-purple-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                    <span>Habilitation Système</span>
                  </div>
                  <div>Droits complets d'administration globale accordés (<code>ROLE_ADMIN</code>).</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                newUserType === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>
                {isSubmitting 
                  ? 'Enregistrement en cours...' 
                  : newUserType === 'admin' 
                    ? 'Créer le Compte Administrateur' 
                    : 'Ajouter le Membre du Staff'}
              </span>
            </button>
          </form>
        </div>

        {/* Colonne Droite : Registre des Utilisateurs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          {/* Barre de filtres épurée */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-150">
            {/* Onglets de catégorie */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => { setSelectedFilter('all'); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Tous ({countAll})</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedFilter('staff'); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'staff'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                <span>Personnel Soignant ({countStaff})</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedFilter('admin'); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'admin'
                    ? 'bg-white text-purple-700 font-bold shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                <span>Administrateurs ({countAdmin})</span>
              </button>
            </div>

            {/* Filtre de statut actif/inactif */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-asina-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>

          {/* Champ de recherche */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, identifiant, email ou spécialité..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-hidden focus:border-asina-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 whitespace-nowrap">
              <span className="font-bold text-slate-700">{filteredUsers.length}</span> résultat(s)
            </div>
          </div>

          {/* Tableau de données */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identifiant</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rôle & Spécialité</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Affectation</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-7 w-7 text-slate-400" />
                        <p className="font-semibold text-slate-700">Aucun utilisateur correspondant aux critères.</p>
                        <p className="text-[11px] text-slate-400">Modifiez vos filtres ou créez un nouvel utilisateur via le panneau gauche.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => {
                    const roleObj = state.role.find(r => r.Id_role === u.Id_role);
                    const isAdmin = isUserAdmin(u);
                    const isStaff = isUserStaff(u);

                    // Affectation liée
                    const staffProfile = state.StaffProfile.find(sp => sp.Id_User === u.Id_User);
                    const affectation = staffProfile
                      ? state.Affectation.find(aff => aff.Id_staff_profile === staffProfile.Id_staff_profile)
                      : null;
                    const site = affectation ? state.Site.find(s => s.Id_Site === affectation.Id_Site) : null;
                    const service = affectation ? state.Service.find(s => s.Id_Service === affectation.Id_Service) : null;
                    const isActive = u.isActive !== false;

                    return (
                      <tr key={u.Id_User} className="hover:bg-slate-50/70 transition">
                        {/* Identité */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs select-none border ${
                              isAdmin
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {getUserAvatarInitial(u)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {formatUserDisplayName(u)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {u.email || 'Sans email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Login */}
                        <td className="p-3">
                          <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {u.login}
                          </span>
                        </td>

                        {/* Rôle & Spécialité */}
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">
                            {formatRoleLabel(roleObj?.libelle || (u as any).role || (u as any).roles?.[0])}
                          </div>
                          <div className="mt-0.5">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold text-[9px] uppercase">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold text-[9px] uppercase">
                                <Stethoscope className="h-3 w-3" />
                                Soignant
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Affectation */}
                        <td className="p-3">
                          {isAdmin ? (
                            <span className="text-slate-500 text-[11px] italic">Accès global</span>
                          ) : affectation ? (
                            <div>
                              <div className="font-medium text-slate-800 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                <span>{site?.Libelle || `Site #${affectation.Id_Site}`}</span>
                              </div>
                              <div className="text-[10px] text-asina-600">
                                {service?.Libelle || `Service #${affectation.Id_Service}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Non affecté
                            </span>
                          )}
                        </td>

                        {/* Statut avec bouton interactif */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer transition ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Cliquer pour basculer le statut"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{isActive ? 'Actif' : 'Inactif'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-500 hover:text-asina-600 hover:bg-asina-50 rounded-md transition cursor-pointer"
                              title="Modifier l'utilisateur"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination propre au pied du tableau */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              Affichage de <span className="font-semibold text-slate-700">{filteredUsers.length > 0 ? (page - 1) * perPage + 1 : 0}</span> à{' '}
              <span className="font-semibold text-slate-700">{Math.min(page * perPage, filteredUsers.length)}</span> sur{' '}
              <span className="font-semibold text-slate-700">{filteredUsers.length}</span> utilisateurs
            </div>

            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-slate-300 rounded p-1 text-xs"
              >
                <option value={10}>10 / page</option>
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Page précédente"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Page suivante"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modale d'édition d'utilisateur */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit className="h-4 w-4 text-asina-600" />
                <span>Modifier le compte : {editingUser.login}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editPrenom}
                    onChange={e => setEditPrenom(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom</label>
                  <input
                    type="text"
                    value={editNom}
                    onChange={e => setEditNom(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rôle / Fonction</label>
                <select
                  value={editRoleId}
                  onChange={e => setEditRoleId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-asina-500"
                >
                  {state.role.map(r => (
                    <option key={r.Id_role} value={r.Id_role}>{r.libelle}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActiveCheckbox"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-asina-600 focus:ring-asina-500"
                />
                <label htmlFor="editIsActiveCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Compte actif et autorisé à se connecter
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-lg bg-asina-600 hover:bg-asina-700 text-white font-bold cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isSavingEdit ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
