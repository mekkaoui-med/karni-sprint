import { validateData } from "./validation.js";
import { state } from "./state.js";
import { sauvegarder } from "./storage.js";

export function preparerImport(fichier) {
  return new Promise(function (resolve) {
    // 1. Vérifier si un fichier est sélectionné
    if (!fichier) {
      resolve({
        ok: false,
        errors: ["Aucun fichier sélectionné."],
      });
      return;
    }

    // 2. Vérifier que c'est un fichier JSON
    if (!fichier.name.endsWith(".json")) {
      resolve({
        ok: false,
        errors: ["Le fichier doit être au format .json."],
      });
      return;
    }

    // 3. Lire le contenu du fichier
    const lecteur = new FileReader();

    lecteur.onerror = function () {
      resolve({
        ok: false,
        errors: ["Impossible de lire le fichier."],
      });
    };

    lecteur.onload = function () {
      let donnees;

      // 4. Transformer le texte en objet JSON
      try {
        donnees = JSON.parse(lecteur.result);
      } catch (e) {
        resolve({
          ok: false,
          errors: ["Le fichier JSON est invalide."],
        });
        return;
      }

      // 5. Valider les données
      const resultat = validateData(donnees);
      let listeErreurs = [];

      // Si validateData renvoie un tableau
      if (Array.isArray(resultat)) {
        listeErreurs = resultat;
      }
      // Si validateData renvoie un objet { status: "invalid", errors: { ... } }
      else if (resultat.status === "invalid") {
        for (const champ in resultat.errors) {
          listeErreurs.push(champ + " : " + resultat.errors[champ]);
        }
      }

      // 6. Si des erreurs existent, renvoyer les 10 premières (US-07)
      if (listeErreurs.length > 0) {
        resolve({
          ok: false,
          errors: listeErreurs.slice(0, 10),
        });
        return;
      }

      // 7. Si tout est valide, préparer le résumé
      const nbClients = donnees.clients.length;
      const nbOperations = donnees.operations.length;

      resolve({
        ok: true,
        donnees: donnees,
        resume: {
          nombreClients: nbClients,
          nombreOperations: nbOperations,
          texte: nbClients + " clients, " + nbOperations + " opérations",
        },
      });
    };

    lecteur.readAsText(fichier);
  });
}

export function confirmerImport(donnees) {
  // Remplacer les données dans l'état
  state.clients = donnees.clients;
  state.operations = donnees.operations;

  // Sauvegarder dans localStorage
  const resultatSauvegarde = sauvegarder(state);
  if (!resultatSauvegarde.ok) {
    return resultatSauvegarde;
  }

  return { ok: true };
}
