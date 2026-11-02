# Karni — le carnet de crédit de l'épicerie

_À compléter par vous : remplacez cette introduction par la description de **votre** projet, les membres du binôme et la répartition des user stories._

## Liens

- Site (GitHub Pages) : _à compléter_
- Tableau GitHub Projects : _à compléter_

## Installation et lancement

```bash
npm install
npm run build     # construit assets/style.css
npm run dev       # reconstruit le CSS à chaque modification
```

Le JavaScript est chargé comme **module ES** : ouvrir `index.html` directement (`file://`) ne fonctionne pas. Lancez un serveur local (extension « Live Server » de VS Code, ou équivalent).

## Ce qui est fourni, ce que vous faites

| Fourni | À faire |
| --- | --- |
| `index.html` (intégré avec Tailwind, modèles `<template>` compris), `src/input.css` (couleurs, classes d'état), `src/js/demo.js` (données de démonstration), `exemples/` (fichiers d'import de test) | `src/js/main.js` et vos modules : tout le JavaScript |

## Repères du HTML

| Besoin | Où |
| --- | --- |
| Actions générales | `#nouveau-client`, `#exporter`, `#importer` (ouvre `#import-fichier`, caché), `#charger-demo`, `#vider-carnet` |
| Notification et erreur de stockage | `#notification` (`aria-live`), `#erreur-stockage` (`role="alert"`, caché) et `#erreur-stockage-message` |
| Tableau de bord | `#total-du`, `#nb-clients`, `#nb-en-dette`, `#nb-en-retard` |
| Recherche, filtre, tri | `#recherche`, `#filtre-statut` (`tous`, `a-jour`, `en-dette`, `en-retard`), `#tri` (`nom`, `solde`, `recent`) |
| États vides | `#etat-vide` (carnet vide), `#etat-aucun-resultat` (caché) avec `#reinitialiser-filtres` |
| Liste des clients | `#liste-clients` (les `<li>` sont à créer depuis `#modele-client`) |
| Fenêtre client | `#dialog-client`, `#dialog-client-titre`, `#form-client` (`novalidate`), `#client-id` (caché), `#client-nom`, `#client-telephone`, `#client-plafond` et leurs `…-erreur`, `#client-annuler` |
| Fiche client | `#fiche-client`, `#fiche-nom`, `#fiche-telephone`, `#fiche-badges`, `#fiche-solde`, `#fiche-plafond`, `#fiche-disponible`, `#fiche-fermer` |
| Nouvelle opération | `#form-operation` (`novalidate`), radios `name="operation-type"` (`achat`, `remboursement`), `#operation-montant`, `#operation-date`, `#operation-libelle` et leurs `…-erreur` |
| Historique | `#historique` (les `<li>` sont à créer depuis `#modele-operation`), `#historique-vide` |
| Confirmation | `#dialog-confirmation` (`<form method="dialog">` : lire `dialog.returnValue`, `valider` ou `annuler`), `#confirmation-titre`, `#confirmation-message`, `#confirmation-details`, `#confirmation-valider`, `#confirmation-annuler` |

Les modèles `<template>` se clonent avec `modele.content.cloneNode(true)`, puis se remplissent avec `textContent` :

- `#modele-client` : `data-client-id`, `.client-nom`, `.client-telephone`, `.client-solde`, `.client-badges`, boutons `data-action="ouvrir-fiche"`, `"modifier-client"`, `"supprimer-client"` ;
- `#modele-operation` : `data-operation-id`, `.operation-libelle`, `.operation-date`, `.operation-montant`, bouton `data-action="supprimer-operation"`.

Les `<span class="nom-sr sr-only">` des boutons reçoivent le nom du client ou de l'opération : « Supprimer **Fatima Zahra Alaoui** » au lecteur d'écran, au lieu de dix boutons « Supprimer » identiques.

Classes d'état prêtes dans `src/input.css`, à ajouter ou retirer avec `classList` : `champ-invalide`, `badge` + `badge-a-jour` / `badge-en-dette` / `badge-en-retard` / `badge-plafond`, `operation-achat` / `operation-remboursement` (sur le `<li>` d'une opération).

## Format des données (commun à toute la promo)

Le même format en mémoire, dans `localStorage` (clé `karni:v1`) et dans les fichiers exportés. Un export d'une équipe doit s'importer chez n'importe quelle autre.

```json
{
  "app": "karni",
  "version": 1,
  "exporteLe": "2026-11-04T10:30:00.000Z",
  "clients": [
    { "id": "c-7f3a", "nom": "Fatima Zahra Alaoui", "telephone": "0612345678", "plafond": 150000, "creeLe": "2026-10-01" }
  ],
  "operations": [
    { "id": "o-91bc", "clientId": "c-7f3a", "type": "achat", "montant": 4550, "libelle": "Lait, pain, œufs", "date": "2026-10-03" }
  ]
}
```

| Champ | Règle |
| --- | --- |
| `app`, `version` | toujours `"karni"` et `1` |
| `exporteLe` | date et heure ISO de l'export (absent du `localStorage`) |
| `id` | texte non vide, **unique** dans sa liste (par exemple `crypto.randomUUID()`) |
| `nom` | 2 à 40 caractères : lettres accentuées, espaces, apostrophe, tiret |
| `telephone` | `""`, ou 10 chiffres commençant par `05`, `06` ou `07` |
| `plafond` | en **centimes**, entier de 5 000 (50 MAD) à 1 000 000 (10 000 MAD) |
| `creeLe`, `date` | date `AAAA-MM-JJ` valide, jamais dans le futur |
| `clientId` | `id` d'un client existant |
| `type` | `"achat"` (le client prend à crédit) ou `"remboursement"` (le client règle) |
| `montant` | en **centimes**, entier de 1 à 1 000 000 |
| `libelle` | 0 à 60 caractères ; au moins 2 pour un achat |

## Données de test

- `src/js/demo.js` exporte `creerDemo()`, qui retourne un carnet de démonstration au format commun (dates calculées par rapport à aujourd'hui).
- `exemples/karni-exemple.json` : un export **valide** (cas limites compris), à importer.
- `exemples/karni-casse.json` : un export **invalide**, qui contient plus de 10 erreurs différentes. Votre import doit le refuser sans rien modifier.

## Architecture

_À compléter : rôle de chaque module et schéma du flux « action → état → sauvegarde → `render()` »._

## Fonctionnalités réalisées

_À compléter : liste des user stories (US-01 à US-08) réalisées, avec le membre responsable._

## Jeu d'essai

| # | Donnée ou action | Résultat attendu | Résultat obtenu | Validé |
| --- | --- | --- | --- | --- |
| 1 | _à compléter (au moins 15 cas, dont les cas obligatoires du brief)_ | | | |

## Difficultés rencontrées

_À compléter : liens vers vos issues de bug._

## Captures d'écran

_À compléter : mobile et desktop._
