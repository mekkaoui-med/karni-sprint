import { state } from "./state.js";
import { validateClient } from "./validation.js";
import { calculerSolde } from "./calculs.js";

export function trouverClient(id) {
  return state.clients.find((client) => client.id === id) || null;
}

export function ajoutClient(newClient) {
  // Validation en passant la liste actuelle pour tester l'unicité du nom
  const resultat = validateClient(newClient, state.clients);
  if (resultat.status === "invalid") {
    return {
      ok: false,
      erreurs: resultat.errors, // Ex: { nom: "Ce nom existe déjà." }
    };
  }

  state.clients.push(newClient);
  return {
    ok: true,
    client: newClient,
  };
}

export function modifieClient(id, nouvellData) {
  const client = trouverClient(id);
  if (!client) {
    return {
      ok: false,
      erreurs: { general: "Client introuvable." },
    };
  }

  // On valide les données mises à jour
  const clientModifie = { ...client, ...nouvellData };
  const resultat = validateClient(clientModifie, state.clients);
  if (resultat.status === "invalid") {
    return {
      ok: false,
      erreurs: resultat.errors,
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
      erreurs: { general: "Client introuvable." },
    };
  }

  // US-01 : Un client qui doit de l'argent ne peut pas être supprimé
  const solde = calculerSolde(id, state.operations);
  if (solde > 0) {
    return {
      ok: false,
      erreurs: {
        general: "Impossible de supprimer un client qui doit encore de l'argent.",
      },
    };
  }

  // Supprimer les opérations associées puis le client
  state.operations = state.operations.filter(
    (operation) => operation.clientId !== id,
  );
  state.clients = state.clients.filter((c) => c.id !== id);

  return {
    ok: true,
  };
}