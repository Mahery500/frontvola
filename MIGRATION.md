# Architecture ASINA — Frontend

> **Mise à jour** : les contrats API sont maintenant centralisés dans
> `src/core/api-contracts/` (un fichier par domaine, généré à partir du vrai
> `/api/docs.json`). Voir `docs/API_CONTRACTS.md` pour le mode d'emploi et
> `docs/API_MANQUANTES.md` pour la liste précise des endpoints backend qui
> manquent encore. Plusieurs hypothèses de ce document (endpoints, formes de
> payload) ont été corrigées suite à ça — se fier en priorité aux docs/.

## Ce qui a changé

Le frontend (généré initialement via Google AI Studio) reposait sur :
- un seul objet global `ASINAState` (~70 entités) passé en `props` (`state` / `updateState`)
  à travers toutes les pages et tous les onglets ;
- des types mêlant les noms de colonnes Merise bruts (`Id_Patient`, `Nom`, `GS`...) et des
  tentatives de noms REST, avec des fonctions `normalizeXFromApi` qui devinaient les deux ;
- des actions qui fabriquaient des identifiants/matricules côté client (`Math.max(...) + 1`)
  et affichaient un message de succès même quand l'appel API échouait.

La nouvelle architecture reprend, côté frontend, les mêmes couches que le backend Symfony
(voir `smie-management-system` : ApiResource / DTO / Repository / UseCase) :

```
src/
  core/                     # noyau technique partagé (ex "shared/" + "api/")
    http/
      ApiClient.ts          # le seul endroit qui parle fetch()
      ApiError.ts
      HttpRepository.ts     # classe de base — équivalent du RepositoryInterface Symfony
      session.ts            # JWT / URL de l'API
      collection.ts         # extraction des collections API Platform / Hydra
    ui/ layout/ hooks/ theme/ utils/ constants/ types/
  modules/
    <nom>/
      domain/               # types métier (ex "types/")
      infrastructure/       # <nom>.repository.ts — étend HttpRepository (ex "api/")
      application/          # use<Nom>.ts — la "UseCase" frontend (ex "hooks/")
      presentation/         # composants (ex "components/")
      index.ts              # barrel public du module
```

L'alias `@/` pointe maintenant sur `src/` (voir `vite.config.ts` / `tsconfig.json`), donc tous
les imports inter-modules s'écrivent `@/modules/patients/...` plutôt qu'en `../../../`.

## Modules entièrement migrés (référence)

**`patients`** et **`companies`** sont les deux modules de référence, à imiter pour la suite :

- `infrastructure/*.repository.ts` étend `HttpRepository<TEntity>` : plus de `fetch` dispersé,
  un seul endroit par module qui sait parler à l'API.
- `application/use*.ts` est la UseCase frontend : elle expose `{ data, isLoading, error, ... }`
  et ne dépend jamais de `fetch` directement — seulement du repository, exactement comme une
  UseCase Symfony ne dépend jamais d'un DTO API mais d'une `RepositoryInterface`.
- Le matricule et l'identifiant patient ne sont plus fabriqués côté client : le composant
  attend la réponse du serveur (qui applique le `MatriculeService`) et l'utilise comme source
  de vérité. Un échec réseau affiche une vraie erreur au lieu d'un faux message de succès.
- `AdminCompaniesTab` a été migré pour consommer `useCompanies()` au lieu de manipuler
  directement `state.Entreprise`. Il continue à appeler `updateState({ Entreprise: ... })`
  après chaque opération, pour que les écrans pas encore migrés (Réception, Import) restent
  synchronisés — c'est le pont temporaire vers le store legacy, à retirer module par module.

## Modules restructurés mais pas encore migrés en profondeur

`administration`, `authentication`, `consultations`, `dashboard`, `infirmerie`, `stock` ont
la même arborescence (`domain/infrastructure/application/presentation`), leurs imports ont été
mis à jour, et l'app compile et se build (`tsc --noEmit` + `vite build` passent). En revanche :

- leurs `infrastructure/*.api.ts` n'ont pas été convertis en classes `HttpRepository` ;
- `administration/infrastructure/administration.api.ts` (782 lignes) garde ses fonctions
  `normalizeXFromApi` avec des paramètres `any` — elles sont fonctionnellement correctes et
  documentées (schéma `UserOutput`, etc.) mais mériteraient le même traitement que
  `companies.repository.ts` : un seul mapping typé, extension de `HttpRepository` ;
- ces onglets continuent de lire/écrire directement `state`/`updateState`.

## Prochaine étape recommandée

Migrer `administration` en suivant exactement la même méthode que côté backend
(« architecture cible appliquée à Agent, puis la même appliquée à Entreprise ») :
un sous-module à la fois — Utilisateurs, puis Sites/Services, puis Affectations — en
s'appuyant sur `companies` comme modèle.

## Point ouvert à vérifier avec le backend

Le payload envoyé par `ReceptionRegisterTab` (`POST /api/patients` avec `type` +
`agent`/`ayantDroit` imbriqués) est une hypothèse raisonnable au vu du modèle Merise
(CIF Agent/AyantDroit sous Patient) mais n'a pas été vérifié contre le contrôleur Symfony
réel. C'est le seul endroit du frontend qui fait cette hypothèse — à ajuster si le contrat
exact du endpoint diffère.
