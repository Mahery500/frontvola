# API manquantes côté backend

Établie en comparant les besoins du frontend au schéma OpenAPI réel
(`/api/docs.json`). Classée par urgence pour débloquer le front.

## Critique — bloque des écrans déjà construits

### 1. Création d'un Patient "de zéro"
Il n'existe **aucun endpoint** pour créer un Patient unitaire avec ses
informations personnelles (nom, prénom, date de naissance...). Les seules
portes d'entrée actuelles :
- `POST /api/import-patients` — mais c'est un **upload de fichier Excel**
  en masse, pas adapté à un enregistrement au guichet, un par un ;
- `POST /api/agents` — mais ça ne fait que rattacher un rôle "salarié" à un
  `idPatient` qui doit **déjà exister**.

**Suggestion** : `POST /api/patients` avec un `CreatePatientInput` (nom,
prenom, dateNaissance, sexe, groupeSanguin, telephone, adresse...) qui
retourne un `PatientOutput`. C'est ce qu'attend l'écran "Enregistrement
patient" de la Réception.

### 2. Ayant droit (conjoint / enfant) isolé
Aucun endpoint pour rattacher un ayant droit à un Agent. Nécessaire pour le
workflow "salarié + famille" déjà modélisé (Merise : CIF Agent/AyantDroit).

**Suggestion** : `POST /api/ayants-droit` avec `{ idPatient, idAgent,
relation: 'CJ'|'E1'|'E2'|'E3' }`, ou une extension de `CreateAgentInput`.

### 3. Mise à jour / suppression Patient et Entreprise
`PATCH`/`PUT`/`DELETE` absents sur `/api/patients/{id}` et
`/api/entreprises/{id}`. Nécessaire pour corriger une fiche ou désactiver
une entreprise qui ne renouvelle pas sa convention.

## Important — modules Stock/Pharmacie incomplets

Le référentiel (Famille, PrincipeActif, Médicament, Produit, Présentation,
Conditionnement, Fournisseur, types de mouvement, types d'ajustement) est
complet en CRUD. Mais les **transactions** elles-mêmes manquent :

### 4. Lot (gestion des péremptions)
`MouvementResource.CreateMouvementRequest` et `StockResource.StockResponse`
référencent tous les deux un `lotId`/aucun champ lot direct, mais il
n'existe **aucun endpoint `/api/lot_resources`** pour créer/lister des lots
(numéro de lot, date de péremption, fournisseur). Sans ça, `lotId` dans
`CreateMouvementRequest` ne peut jamais être renseigné correctement.

**Suggestion** : `GET/POST/PUT/DELETE /api/lot_resources` avec au minimum
`{ id, produitId, numeroLot, datePeremption, fournisseurId, quantiteInitiale }`.

### 5. Ajustement de stock (l'opération elle-même)
Le référentiel des motifs existe (`ajustement_type_resources`) mais pas
l'endpoint pour enregistrer un ajustement (perte, casse, inventaire...).

**Suggestion** : `POST /api/ajustement_resources` avec `{ produitId, lotId,
siteId, ajustementTypeId, quantiteSysteme, quantiteReelle, commentaire }` —
qui, côté backend, devrait probablement générer un `MouvementResource`
correspondant pour garder le ledger cohérent.

### 6. Commande fournisseur (bon de commande)
Aucun endpoint pour créer/suivre une commande auprès d'un fournisseur.

**Suggestion** : `GET/POST /api/commande_resources` (+ `/{id}/lignes`) avec
statut (brouillon/envoyée/reçue partiellement/reçue/annulée).

### 7. Réception de commande (approvisionnement)
Correspond à la réception physique d'une commande, qui devrait générer les
`MouvementResource` d'entrée en stock (et créer les `Lot` associés).

**Suggestion** : `POST /api/commande_resources/{id}/receptionner`.

### 8. Dispensation (sortie de stock vers un patient)
Aucun endpoint pour dispenser un médicament à un patient dans le cadre
d'une consultation. Devrait générer un `MouvementResource` de sortie.

**Suggestion** : `POST /api/dispensation_resources` avec `{ patientId,
encounterId, produitId, lotId, quantite }`.

## Confort — améliore l'expérience sans bloquer

### 9. Statut d'un job d'import
`GET /api/import_patients/{id}` existe dans le routing (`debug:router`)
mais n'apparaît pas dans le schéma OpenAPI (`/api/docs.json`) — à vérifier
si l'annotation API Platform est bien en place, sinon le frontend ne peut
pas suivre l'avancement d'un import en cours.

### 10. Recherche/filtre sur les collections
Beaucoup de collections (`GET /api/patients`, `/api/agents`, `/api/services`...)
n'ont qu'un paramètre `page`. Un filtre texte (nom, matricule) éviterait de
tout charger côté client pour filtrer localement.

---

*Ce document est mis à jour au fil des sessions de refactoring frontend.
Il complète `docs/API_CONTRACTS.md` qui explique comment centraliser les
mises à jour de contrat sans renvoyer tout le projet.*
