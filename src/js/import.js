import { validateData } from "./validation.js";
import { state } from "./state.js";
import { sauvegarder } from "./storage.js";

export function preparerImport(fichier) {
  return new Promise(function (resolve) {
    if (!fichier) {
      resolve({
        ok: false,
        errors: ["Aucun fichier sélectionné."],
      });
      return;
    }

    if (!fichier.name.endsWith(".json")) {
      resolve({
        ok: false,
        errors: ["Le fichier doit être au format .json."],
      });
      return;
    }

    const lecteur = new FileReader();

    lecteur.onerror = function () {
      resolve({
        ok: false,
        errors: ["Impossible de lire le fichier."],
      });
    };

    lecteur.onload = function () {
      let donnees;

      try {
        donnees = JSON.parse(lecteur.result);
      } catch (e) {
        resolve({
          ok: false,
          errors: ["Le fichier JSON est invalide."],
        });
        return;
      }

      const resultat = validateData(donnees);
      let listeErreurs = [];

      if (Array.isArray(resultat)) {
        listeErreurs = resultat;
      }
      else if (resultat.status === "invalid") {
        for (const champ in resultat.errors) {
          listeErreurs.push(champ + " : " + resultat.errors[champ]);
        }
      }

      if (listeErreurs.length > 0) {
        resolve({
          ok: false,
          errors: listeErreurs.slice(0, 10),
        });
        return;
      }

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
  state.clients = donnees.clients;
  state.operations = donnees.operations;

  const resultatSauvegarde = sauvegarder(state);
  if (!resultatSauvegarde.ok) {
    return resultatSauvegarde;
  }

  return { ok: true };
}
