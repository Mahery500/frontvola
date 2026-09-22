/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domaine "pharmacie / stock" : tous les endpoints `*_resources`.
 * Voir header de auth.contracts.ts pour le mode d'emploi de ce dossier.
 */

// ---- Référentiels simples (CRUD complet, forme { id, libelle }) ----------
// /api/famille_resources, /api/principe_actif_resources

export interface FamilleResource {
  id: number | null;
  libelle: string;
}

export interface PrincipeActifResource {
  id: number | null;
  libelle: string;
}

// ---- PresentationResource (CRUD complet) — { id, libelle, code } --------

export interface PresentationResource {
  id: number | null;
  libelle: string;
  code: string;
}

// ---- ConditionnementResource (CRUD complet) — { id, libelle } -----------

export interface ConditionnementResource {
  id: number | null;
  libelle: string;
}

// ---- FournisseurResource (CRUD complet) ----------------------------------

export interface FournisseurRequest {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
}

export interface FournisseurResponse {
  id: number | null;
  nom: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}

// ---- MedicamentResource (CRUD complet) -----------------------------------

export interface MedicamentRequest {
  familleId: number;
  presentationId: number;
}

export interface MedicamentResponse {
  id: number | null;
  familleId: number | null;
  familleLibelle: string | null;
  presentationId: number | null;
  presentationLibelle: string | null;
  presentationCode: string | null;
}

// ---- ProduitResource (CRUD complet) --------------------------------------

export interface ProduitRequest {
  nomCommercial: string;
  medicamentId: number;
  conditionnementId?: number | null;
  principeActifIds?: number[];
}

export interface ProduitResponse {
  id: number | null;
  nomCommercial: string | null;
  medicamentId: number | null;
  conditionnementId: number | null;
  conditionnementLibelle: string | null;
  principeActifIds: number[];
  principeActifLibelles: string[];
}

// ---- AjustementTypeResource (référentiel des motifs, CRUD complet) ------
// NB : uniquement le référentiel des TYPES d'ajustement. Il n'existe pas
// encore d'endpoint pour enregistrer un ajustement de stock lui-même.

export interface AjustementTypeRequest {
  libelle: string;
}

export interface AjustementTypeResponse {
  id: number | null;
  libelle: string | null;
}

// ---- MouvementTypeResource (CRUD complet) --------------------------------

export interface MouvementTypeRequest {
  code: string;
  libelle: string;
  /** Sens du mouvement (ex : 1 = entrée, -1 = sortie — à confirmer). */
  sens: number;
}

export interface MouvementTypeResponse {
  id: number | null;
  code: string | null;
  libelle: string | null;
  sens: number | null;
}

// ---- MouvementResource (GET + POST uniquement — ledger immuable) -------

export interface CreateMouvementRequest {
  produitId: number;
  lotId?: number | null;
  siteId: number;
  mouvementTypeId: number;
  quantite: number;
}

export interface MouvementResponse {
  id: number | null;
  produitId: number | null;
  lotId: number | null;
  siteId: number | null;
  mouvementTypeId: number | null;
  quantite: number | null;
  dateMouvement: string | null;
}

// ---- SiteResource (CRUD complet) — distinct de /api/sites ! -------------
// Représentation "site" propre au contexte pharmacie/stock (bounded
// context séparé de l'Administration organisationnelle).

export interface StockSiteRequest {
  libelle: string;
  adresse?: string | null;
  contact?: string | null;
}

export interface StockSiteResponse {
  id: number | null;
  libelle: string | null;
  adresse: string | null;
  contact: string | null;
}

// ---- StockResource (GET uniquement — vue calculée) -----------------------

export interface StockLevelResponse {
  id: number | null;
  produitId: number | null;
  produitLibelle: string | null;
  siteId: number | null;
  siteLibelle: string | null;
  quantite: number | null;
}
