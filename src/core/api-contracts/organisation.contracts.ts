/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domaine "organisation" : Site, Service, TypeService, Assignment, Staff.
 * Voir header de auth.contracts.ts pour le mode d'emploi de ce dossier.
 */

// ---- Site (CRUD complet /api/sites) --------------------------------------

export interface SiteInput {
  code: string;
  name: string;
  city: string;
  address?: string | null;
  phone?: string | null;
}

export interface SiteOutput {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---- Service (CRUD complet /api/services) --------------------------------

export interface ServiceInput {
  siteId: number;
  typeServiceId: number;
  description?: string | null;
}

export interface ServiceOutput {
  id: number;
  siteId: number;
  siteName: string;
  typeServiceId: number;
  typeServiceName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---- TypeService (CRUD complet /api/type-services) -----------------------

export interface TypeServiceInput {
  code: string;
  name: string;
  description?: string | null;
}

export interface TypeServiceOutput {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// ---- Assignment (POST/PATCH/DELETE /api/assignments — pas de PUT) -------

export interface AssignmentRequest {
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal?: boolean;
}

/** PATCH utilise application/merge-patch+json — tous les champs optionnels. */
export type AssignmentPatchRequest = Partial<AssignmentRequest>;

export interface AssignmentResponse {
  id: number;
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin: string | null;
  estPrincipal: boolean;
  active: boolean;
  createdAt: string;
}

// ---- Staff (POST/PATCH/DELETE /api/staffs — pas de PUT) ------------------

export interface CreateStaffRequest {
  prenom: string;
  nom: string;
  login: string;
  /** Doit contenir minuscule + majuscule + chiffre + caractère spécial (@$!%*?&), min 8 car. */
  password: string;
  roles?: (string | null)[];
}

/** PATCH utilise application/merge-patch+json. */
export interface UpdateStaffRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  roles?: (string | null)[] | null;
}

export interface StaffResponse {
  id: number;
  firstName: string;
  lastName: string;
  roles: (string | null)[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface StaffListResponse {
  items: StaffResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
