import { validateData } from "./validation.js";
import { state } from "./state.js";
import { sauvegarder } from "./storage.js";

export function preparerImport(fichier) {
  // A Promise allows us to return a result later, when the reading and validation are finished.
  // We use resolve when we finish processing the file.
  return new Promise(function (resolve) {
    if (!fichier) {
      resolve({
        ok: false,
        errors: ["Aucun fichier sélectionné."],
      });
      return;
    }

    if (!fichier.name.toLowerCase().endsWith(".json")) {
      resolve({
        ok: false,
        errors: ["Le fichier doit être au format JSON."],
      });
      return;
    }

    // FileReader is a built-in JavaScript browser object used to read files selected by the user.
    const lecteur = new FileReader();

    // onerror is an event handler "If an error happens while reading this file, execute this function."
    lecteur.onerror = function () {
      resolve({
        ok: false,
        errors: ["Impossible de lire le fichier."],
      });
    };

    //executes when reading succeeds.
    lecteur.onload = function () {
      let donnees;

      try {
        donnees = JSON.parse(lecteur.result);
      } catch {
        resolve({
          ok: false,
          errors: ["Le fichier JSON est invalide."],
        });
        return;
      }

      const validation = validateData(donnees);

      if (validation.status === "invalid") {
        const erreurs = Object.entries(validation.errors).map(
          function ([champ, message]) {
            return `${champ} : ${message}`;
          },
          // champ = "clients[0].nom";
          // // message = "Nom invalide";
        );

        resolve({
          ok: false,
          errors: erreurs.slice(0, 10),
        });
        return;
      }

      // Return the valid data and its summary
      resolve({
        ok: true,
        donnees,
        resume: {
          nombreClients: donnees.clients.length,
          nombreOperations: donnees.operations.length,
        },
      });
    };

    lecteur.readAsText(fichier);
  });
}

export function confirmerImport(donnees) {
  state.clients = donnees.clients;
  state.operations = donnees.operations;

  const resultat = sauvegarder(state); //The function saves those data in localStorage.

  if (!resultat.ok) {
    return resultat;
  }

  return { ok: true };
}
