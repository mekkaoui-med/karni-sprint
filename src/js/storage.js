// Clés utilisées pour enregistrer les données dans le navigateur.
const CLE_STOCKAGE = "karni:v1";
const CLE_SAUVEGARDE = "karni:sauvegarde-illisible";

// Structure vide utilisée lorsque le carnet n'a pas encore de données.
const donneesVides = () => ({
  app: "karni",
  version: 1,
  clients: [],
  operations: [],
});

// Sauvegarder l'état de l'application.
export function sauvegarder(state) {
  try {
    if (
      !state ||
      !Array.isArray(state.clients) ||
      !Array.isArray(state.operations)
    ) {
      return {
        ok: false,
        erreur: "Les données à sauvegarder sont invalides.",
      };
    }

    const donnees = {
      app: "karni",
      version: 1,
      clients: state.clients,
      operations: state.operations,
    };

    const contenu = JSON.stringify(donnees);

    globalThis.localStorage.setItem(CLE_STOCKAGE, contenu);

    return { ok: true };
  } catch (erreur) {
    return {
      ok: false,
      erreur: "Impossible de sauvegarder les données localement.",
    };
  }
}

// Mettre de côté les données corrompues.
function mettreEnSauvegarde(stockage, contenu) {
  try {
    if (stockage.getItem(CLE_SAUVEGARDE) === null) {
      stockage.setItem(CLE_SAUVEGARDE, contenu);
    }

    stockage.removeItem(CLE_STOCKAGE);
    return true;
  } catch (erreur) {
    return false;
  }
}

// Restaurer les données sauvegardées.
export function restaurer(validerDonnees) {
  const vide = donneesVides();

  let stockage;

  try {
    stockage = globalThis.localStorage;
    const contenu = stockage.getItem(CLE_STOCKAGE);

    // Aucun carnet enregistré : démarrer avec des données vides.
    if (contenu === null) {
      return { ok: true, data: vide };
    }

    // Lire le JSON.
    let donnees;

    try {
      donnees = JSON.parse(contenu);
    } catch (erreur) {
      const sauvegarde = mettreEnSauvegarde(stockage, contenu);

      return {
        ok: false,
        data: vide,
        erreur: sauvegarde
          ? "Les données sauvegardées étaient corrompues. Une copie a été conservée."
          : "Les données sont corrompues et leur copie de secours a échoué.",
      };
    }

    // Vérifier que la fonction de validation existe.
    if (typeof validerDonnees !== "function") {
      return {
        ok: false,
        data: vide,
        erreur: "Le module de validation n'est pas encore disponible.",
      };
    }

    // Vérifier les données avec validation.js.
    let erreurs;

    try {
      erreurs = validerDonnees(donnees);
    } catch (erreur) {
      return {
        ok: false,
        data: vide,
        erreur: "Une erreur est survenue pendant la validation des données.",
      };
    }

    if (!Array.isArray(erreurs)) {
      return {
        ok: false,
        data: vide,
        erreur: "Le résultat de la validation est invalide.",
      };
    }

    // Si les données ne sont pas valides, conserver une copie.
    if (erreurs.length > 0) {
      const sauvegarde = mettreEnSauvegarde(stockage, contenu);

      return {
        ok: false,
        data: vide,
        erreur: sauvegarde
          ? "Les données enregistrées sont invalides. Une copie a été conservée."
          : "Les données sont invalides et leur copie de secours a échoué.",
      };
    }

    return {
      ok: true,
      data: donnees,
    };
  } catch (erreur) {
    return {
      ok: false,
      data: vide,
      erreur: "Le stockage local est inaccessible.",
    };
  }
}
