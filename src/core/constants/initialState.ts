/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASINAState } from '../types';

/**
 * État initial de l'application ASINA
 * Toutes les entités dynamiques sont initialisées à vide et alimentées via l'API Symfony JWT.
 */
export const INITIAL_STATE: ASINAState = {
  Medicament: [],
  Principe_Actif: [],
  Famille: [],
  Presentation: [],
  Conditionnement: [],
  
  Site: [
    { Id_Site: 1, Libelle: 'Centre Médical Principal', code: 'CMP-01', name: 'Centre Médical Principal', city: 'Antananarivo', isActive: true },
  ],

  Service: [
    { Id_Site: 1, Id_Service: 1, Libelle: 'Consultation & Médecine', siteId: 1, typeServiceId: 1, typeServiceName: 'Consultation & Médecine', isActive: true },
    { Id_Site: 1, Id_Service: 2, Libelle: 'Accueil & Admissions', siteId: 1, typeServiceId: 2, typeServiceName: 'Accueil & Admissions', isActive: true },
    { Id_Site: 1, Id_Service: 3, Libelle: 'Infirmerie & Soins', siteId: 1, typeServiceId: 3, typeServiceName: 'Infirmerie & Soins', isActive: true },
    { Id_Site: 1, Id_Service: 4, Libelle: 'Pharmacie & Dépôt', siteId: 1, typeServiceId: 4, typeServiceName: 'Pharmacie & Dépôt', isActive: true },
  ],

  TypeService: [
    { id: 1, Id_Type_Service: 1, code: 'MED-GEN', name: 'Consultation & Médecine', Libelle: 'Consultation & Médecine', description: 'Consultations générales et spécialisées', isActive: true },
    { id: 2, Id_Type_Service: 2, code: 'ACCUEIL', name: 'Accueil & Admissions', Libelle: 'Accueil & Admissions', description: 'Gestion des admissions et orientation', isActive: true },
    { id: 3, Id_Type_Service: 3, code: 'SOINS-INF', name: 'Infirmerie & Soins', Libelle: 'Infirmerie & Soins', description: 'Soins infirmiers et gestes d’urgence', isActive: true },
    { id: 4, Id_Type_Service: 4, code: 'PHARMA', name: 'Pharmacie & Dépôt', Libelle: 'Pharmacie & Dépôt', description: 'Délivrance de médicaments et gestion des stocks', isActive: true },
  ],

  Patient: [],

  Type_Encounter: [
    { Id_Type_Encounter: 1, Code: 'CONS_GEN', Libelle: 'Consultation Générale' },
    { Id_Type_Encounter: 2, Code: 'URGENCE', Libelle: 'Urgence Médicale' },
    { Id_Type_Encounter: 3, Code: 'SOINS_INF', Libelle: 'Soins Infirmiers' },
    { Id_Type_Encounter: 4, Code: 'SUIVI', Libelle: 'Visite de Contrôle' },
  ],

  Acte_Domain: [],
  Acte_Purpose: [],
  Acte_Procedure: [],
  Diagnostique_def: [],
  Maladie: [],
  Type_D_Travail: [],
  Acte_Def: [],
  Type_detail_encounter: [
    { Id_Type_detail_encounter: 1, Code: 'TA', Type: 'Tension Artérielle (mmHg)' },
    { Id_Type_detail_encounter: 2, Code: 'TEMP', Type: 'Température (°C)' },
    { Id_Type_detail_encounter: 3, Code: 'POIDS', Type: 'Poids (Kg)' },
    { Id_Type_detail_encounter: 4, Code: 'GLYC', Type: 'Glycémie (g/L)' },
  ],
  Specialite: [
    { Id_Specialite: 1, Code: 'MED_GEN', Libelle: 'Médecine Générale' },
    { Id_Specialite: 2, Code: 'CARDIO', Libelle: 'Cardiologie' },
    { Id_Specialite: 3, Code: 'PEDIATRIE', Libelle: 'Pédiatrie' },
    { Id_Specialite: 4, Code: 'MED_TRAVAIL', Libelle: 'Médecine du Travail' },
  ],
  Entreprise: [],
  Agent: [],
  Ayant_Droit: [],

  role: [
    { Id_role: 1, code: 'ADMIN', libelle: 'Administrateur Système' },
    { Id_role: 2, code: 'ACCUEIL', libelle: 'Accueil & Admissions' },
    { Id_role: 3, code: 'MED_GEN', libelle: 'Médecin Généraliste' },
    { Id_role: 4, code: 'MED_SPEC_INT', libelle: 'Médecin Spécialiste Interne' },
    { Id_role: 5, code: 'MED_SPEC_EXT', libelle: 'Médecin Spécialiste Externe' },
    { Id_role: 6, code: 'MED_CHEF', libelle: 'Médecin Chef' },
    { Id_role: 7, code: 'STOCK_CENTRAL', libelle: 'Gestionnaire Stock Central' },
    { Id_role: 8, code: 'STOCK_SITE', libelle: 'Responsable Stock de Site' },
    { Id_role: 9, code: 'DISPENSATEUR', libelle: 'Dispensateur / Pharmacien' },
    { Id_role: 10, code: 'SECRETAIRE', libelle: 'Secrétaire Médicale' },
    { Id_role: 11, code: 'INFIRMIER', libelle: 'Infirmier(ère)' },
  ],

  Fournisseur: [],
  Ajustement_Type: [
    { Id_Ajustement_Type: 1, Libelle: 'Inventaire Physique' },
    { Id_Ajustement_Type: 2, Libelle: 'Perte ou Casse' },
    { Id_Ajustement_Type: 3, Libelle: 'Périmé / Destruction' },
    { Id_Ajustement_Type: 4, Libelle: 'Ajustement d\'entrée' },
  ],
  Mouvement_Type: [
    { Id_Mouvement_Type: 1, Libelle: 'Entrée Approvisionnement' },
    { Id_Mouvement_Type: 2, Libelle: 'Sortie Dispensation' },
    { Id_Mouvement_Type: 3, Libelle: 'Correction Inventaire' },
    { Id_Mouvement_Type: 4, Libelle: 'Transfert de Site' },
    { Id_Mouvement_Type: 5, Libelle: 'Rebut / Périmé' },
  ],

  // Données dynamiques vides : chargées depuis les endpoints du backend Symfony
  User_: [],
  Produit: [],
  Travail: [],
  StaffProfile: [],
  Affectation: [],
  Lot: [],
  Stock: [],
  Stock_Ajustement: [],
  Stock_Ajustement_Detail: [],
  Commande: [],
  Detail_Commande: [],
  Prescription: [],
  Encounter: [],
  Diagnostique: [],
  Observation: [],
  Detail_encounter: [],
  prescription_medicament: [],
  prescription_referral: [],
  prescription_acte: [],
  Appro: [],
  Detail_appro: [],
  Dipensation: [],
  Detail_Dispensation: [],
  Mouvement: [],
  Rendez_vous: [],
  Actes: [],
  Act_Result: [],
  Asso_1: [],
  Appartenir: [],
  Asso_6: [],
};
