// starter of the project

import { state } from "./state.js";
import { validateClient } from "./validation.js";
//  just testing the github
function normalizeName(nom) {
  return nom
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ajoutClient(newClient) {
  const erreurs = validateClient(newClient);
  if (erreurs.length > 0) {
    return {
      ok: false,
      erreurs,
    };
  }
  const nomNormalize = normalizeName(newClient.nom);
  const nameExiste = state.clients.some(
    (client) => normalizeName(client.nom) === nomNormalize,
  );
  if (nameExiste) {
    return {
      ok: false,
      erreurs: ["Un client avec ce nom existe déjà."],
    };
  }
  state.clients.push(newClient);
  return {
    ok: true,
    client: newClient,
  };
}

export function trouverClient(id) {
  return state.clients.find((client) => client.id === id) || null;
}

export function modifieClient(id, nouvellData) {
  const client = trouverClient(id);
  if (!client) {
    return {
      ok: false,
      erreurs: ["clinet don't exist"],
    };
  }
  const erreurs = validateClient(nouvellData);
  if (erreurs.length > 0) {
    return {
      ok: false,
      erreurs,
    };
  }
  const nameExiste = state.clients.some(
    (aoutherClient) =>
      aoutherClient.id !== id &&
      normalizeName(aoutherClient.nom) === normalizeName(nouvellData.nom),
  );
  if (nameExiste) {
    return {
      ok: false,
      erreurs: ["Un autre client utilise déjà ce nom."],
    };
  }
  Object.assign(client, nouvellData);
  return {
    ok: true,
    client,
  };
}

export function supprimeClient(id) {
  const client = trouverClient(id);
  if (!client) {
    return {
      ok: false,
      erreurs: ["Client introuvable."],
    };
  }
  const solde = state.operations
    .filter((operation) => operation.clientId === id)
    .reduce((total, operation) => {
      if (operation.type === "achat") {
        return total + operation.montant;
      }

      return total - operation.montant;
    }, 0);
  if (solde > 0) {
    return {
      ok: false,
      erreurs: [
        "Impossible de supprimer un client qui doit encore de l'argent.",
      ],
    };
  }
  state.operations = state.operations.filter(
    (operation) => operation.clientId !== id,
  );
  state.clients = state.clients.filter((client) => client.id !== id);

  return {
    ok: true,
  };
}
