# Contrats API — comment ça marche

## Le problème que ça résout

Avant, la "forme" de chaque endpoint (quels champs, quels types, quels verbes
HTTP) était devinée un peu partout dans le frontend : des fonctions
`normalizeXFromApi` qui essayaient plusieurs noms de champs, des payloads
envoyés à l'aveugle. Résultat : si le backend change, il fallait renvoyer
tout le projet pour que je retrouve où corriger.

## La solution : un seul dossier source de vérité

**`src/core/api-contracts/`** contient une interface TypeScript par schéma
OpenAPI (`PatientOutput`, `CreateAgentInput`, `EntrepriseOutput`...), organisées
en 5 fichiers par domaine :

- `auth.contracts.ts` — login, refresh, logout
- `identity.contracts.ts` — User, Patient, Agent, Entreprise, ImportPatients
- `organisation.contracts.ts` — Site, Service, TypeService, Assignment, Staff
- `clinical.contracts.ts` — Encounter, Diagnostic, ActeDefinition, ActeRealise, CategorieActe
- `pharmacy.contracts.ts` — tous les `*_resources` (stock/pharmacie)

Chaque `infrastructure/*.repository.ts` importe SES types depuis ce dossier
au lieu de les redéfinir. C'est la seule couche qui doit changer quand un
contrat change côté backend.

## Quand tu modifies le backend

**Tu n'as plus besoin de renvoyer tout le projet.** Il suffit de me donner :

1. Un export à jour de `/api/docs.json` (ou juste les schémas OpenAPI des
   ressources que tu as changées) — c'est ce que tu m'as donné cette fois-ci ;
2. Ou directement le contenu du fichier `.contracts.ts` concerné si tu
   préfères l'éditer toi-même et me demander de répercuter le changement
   dans les repositories qui l'utilisent.

Je mets à jour le fichier de contrat concerné, puis les repositories qui
l'importent, sans avoir besoin de revoir l'ensemble de l'arborescence.

## État au moment de la centralisation (à partir du vrai `/api/docs.json`)

Points importants découverts en comparant aux hypothèses précédentes :

- **`Patient.id` est une `string`**, pas un `number` — le reste du frontend
  (store legacy `ASINAState`, `core/types`) utilise encore `Id_Patient:
  number` un peu partout. C'est une incohérence connue, pas encore résolue
  partout (voir `MIGRATION.md`).
- **`POST /api/agents` ne crée PAS une nouvelle personne** : `CreateAgentInput`
  ne prend que `{ cnaps, fonction, idPatient, idEntreprise }` — il faut un
  `idPatient` d'un Patient qui existe déjà. Créer un Agent = donner un rôle
  "salarié" à un Patient déjà en base, pas créer quelqu'un de nouveau.
- **`POST /api/import-patients` est un upload de fichier Excel**
  (`multipart/form-data`, champs `file` + `idEntreprise`), pas un endpoint
  JSON — et règle métier imposée par le backend lui-même : chaque agent doit
  précéder ses ayants droit dans le fichier, tout-ou-rien à l'import.
- Il n'existe donc **aucun moyen aujourd'hui de créer un Patient totalement
  nouveau autrement que par cet import Excel** — voir `API_MANQUANTES.md`.
- `SiteResource` (`/api/site_resources`, champs `libelle/adresse/contact`)
  est un référentiel distinct de `Site` (`/api/sites`, champs
  `code/name/city/address/phone`) — deux entités "site" différentes, l'une
  pour l'organisation (RH/planning), l'autre pour le contexte stock/pharmacie.
