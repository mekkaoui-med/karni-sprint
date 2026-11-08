import { calculerSolde, calculerCreditDisponible } from "./calculs.js";

const nameRegex = /^[\p{L} -']{2,40}$/u;
const phoneRegex = /^0[567][0-9]{8}$/;
const montantRegex = /^[0-9]+([.,][0-9]{1,2})?$/;
const today = new Date();

export function validateName(name) {
  if (nameRegex.test(name)) {
    return { status: "valid" };
  } else return { status: "invalid" };
}

export function validatePhone(phone) {
  if (phone == "") return { status: "valid" };
  if (phoneRegex.test(phone)) {
    return { status: "valid" };
  } else return { status: "invalid" };
}

export function validateLibelle(libelle, type) {
  libelle = libelle.trim();
  if (libelle.length > 60) return { status: "invalid" };
  if (type == "achat" && libelle.length < 2) return { status: "invalid" };
  return { status: "valid" };
}

export function validateMontant(montant) {
  montant = montant.trim();
  if (!montantRegex.test(montant)) return { status: "invalid" };
  montant = Number(montant.replace(",", "."));
  if (montant < 0.01 || montant > 10000) {
    return { status: "invalid" };
  }
  return { status: "valid" };
}

export function validatePlafond(plafond) {
  plafond = plafond.trim();
  if (!montantRegex.test(plafond)) return { status: "invalid" };
  plafond = Number(plafond.replace(",", "."));
  if (plafond < 50.0 || plafond > 10000) {
    return { status: "invalid" };
  }
  return { status: "valid" };
}

export function validateDate(date) {
  if (typeof date !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
    return { status: "invalid" };
  }

  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  const aujourdhui = `${maintenant.getFullYear()}-${mois}-${jour}`;

  if (date > aujourdhui) {
    return { status: "invalid" };
  }
  return { status: "valid" };
}

export function validateClient(client, clients = []) {
  const errors = {};

  if (validateName(client.nom).status === "invalid") {
    errors.nom = "Nom invalide (2 à 40 lettres, espaces, apostrophe ou tiret).";
  }

  if (validatePlafond(client.plafond).status === "invalid") {
    errors.plafond = "Plafond invalide (de 50 à 10 000 MAD).";
  }

  if (validatePhone(client.telephone).status === "invalid") {
    errors.telephone =
      "Téléphone invalide (vide ou 05, 06, 07 suivi de 8 chiffres).";
  }

  // Valide la date de création seulement si elle est fournie
  if (client.creeLe && validateDate(client.creeLe).status === "invalid") {
    errors.creeLe = "Date de création invalide ou future.";
  }

  // Vérification de l'unicité du nom (insensible à la casse et aux espaces)
  if (Array.isArray(clients) && clients.length > 0 && client.nom) {
    const nomNormalise = client.nom.trim().toLowerCase().replace(/\s+/g, "");
    const existe = clients.some(
      (c) =>
        c.id !== client.id &&
        c.nom.trim().toLowerCase().replace(/\s+/g, "") === nomNormalise,
    );
    if (existe) {
      errors.nom = "Un client avec ce nom existe déjà.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  return { status: "valid" };
}

export function validateOperation(operation, clients, operations) {
  const errors = {};

  if (operation.type !== "achat" && operation.type !== "remboursement") {
    errors.type = "Type d'opération invalide";
  }

  if (
    !Number.isInteger(operation.montant) ||
    operation.montant < 1 ||
    operation.montant > 1000000
  ) {
    errors.montant = "Montant invalide";
  }

  if (validateLibelle(operation.libelle, operation.type).status === "invalid") {
    errors.libelle = "Libellé invalide";
  }

  if (validateDate(operation.date).status === "invalid") {
    errors.date = "Date invalide";
  }

  let client = null;

  for (let i = 0; i < clients.length; i++) {
    if (clients[i].id === operation.clientId) client = clients[i];
  }

  if (client === null) {
    errors.clientId = "Client introuvable";
  }

  if (client !== null) {
    const solde = calculerSolde(client.id, operations);

    if (operation.type === "achat") {
      const creditDisponible = calculerCreditDisponible(client, operations);

      if (operation.montant > creditDisponible) {
        errors.montant = "Plafond de crédit dépassé";
      }
    }

    if (operation.type === "remboursement") {
      if (operation.montant > solde) {
        errors.montant = "Le remboursement dépasse le solde";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  return { status: "valid" };
}

export function convertToCents(montant) {
  montant = montant.replace(",", ".");
  return Math.round(Number(montant) * 100);
}

export function validateData(data) {
  const erreurs = [];

  // 1. Structure générale
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Format général invalide : un objet JSON est attendu."];
  }

  if (data.app !== "karni" || data.version !== 1) {
    erreurs.push("Format incompatible : l'application doit être 'karni' et la version 1.");
  }

  if (!Array.isArray(data.clients)) {
    erreurs.push("clients : doit être un tableau.");
  }

  if (!Array.isArray(data.operations)) {
    erreurs.push("operations : doit être un tableau.");
  }

  // Si la structure racine est cassée, on s'arrête là
  if (erreurs.length > 0) return erreurs;

  // 2. Validation de chaque client
  const clientIds = new Set();
  const nomsClients = new Set();

  data.clients.forEach((client, index) => {
    const repere = `clients[${index}]`;

    if (!client || typeof client !== "object") {
      erreurs.push(`${repere} : doit être un objet.`);
      return;
    }

    if (typeof client.id !== "string" || !client.id.trim()) {
      erreurs.push(`${repere}.id : ID manquant ou vide.`);
    } else if (clientIds.has(client.id)) {
      erreurs.push(`${repere}.id : identifiant '${client.id}' en doublon.`);
    } else {
      clientIds.add(client.id);
    }

    if (validateName(client.nom).status === "invalid") {
      erreurs.push(`${repere}.nom : doit contenir entre 2 et 40 lettres, espaces ou tirets.`);
    } else {
      const nomNorm = (client.nom || "").trim().toLowerCase().replace(/\s+/g, "");
      if (nomsClients.has(nomNorm)) {
        erreurs.push(`${repere}.nom : nom en doublon.`);
      } else {
        nomsClients.add(nomNorm);
      }
    }

    if (validatePhone(client.telephone).status === "invalid") {
      erreurs.push(`${repere}.telephone : vide ou 05, 06, 07 suivi de 8 chiffres.`);
    }

    if (validatePlafond(client.plafond).status === "invalid") {
      erreurs.push(`${repere}.plafond : doit être un entier entre 5 000 et 1 000 000 centimes (50 à 10 000 MAD).`);
    }

    if (validateDate(client.creeLe).status === "invalid") {
      erreurs.push(`${repere}.creeLe : date invalide ou dans le futur (AAAA-MM-JJ).`);
    }
  });

  // 3. Validation de chaque opération
  const opIds = new Set();

  data.operations.forEach((op, index) => {
    const repere = `operations[${index}]`;

    if (!op || typeof op !== "object") {
      erreurs.push(`${repere} : doit être un objet.`);
      return;
    }

    if (typeof op.id !== "string" || !op.id.trim()) {
      erreurs.push(`${repere}.id : ID manquant ou vide.`);
    } else if (opIds.has(op.id)) {
      erreurs.push(`${repere}.id : identifiant '${op.id}' en doublon.`);
    } else {
      opIds.add(op.id);
    }

    if (!clientIds.has(op.clientId)) {
      erreurs.push(`${repere}.clientId : fait référence à un client inexistant.`);
    }

    if (op.type !== "achat" && op.type !== "remboursement") {
      erreurs.push(`${repere}.type : doit être 'achat' ou 'remboursement'.`);
    }

    if (!Number.isInteger(op.montant) || op.montant < 1 || op.montant > 1000000) {
      erreurs.push(`${repere}.montant : doit être un entier positif entre 1 et 1 000 000 centimes.`);
    }

    if (validateLibelle(op.libelle || "", op.type).status === "invalid") {
      erreurs.push(`${repere}.libelle : maximum 60 caractères (au moins 2 pour un achat).`);
    }

    if (validateDate(op.date).status === "invalid") {
      erreurs.push(`${repere}.date : date invalide ou dans le futur (AAAA-MM-JJ).`);
    }
  });

  // Renvoie [] si valide, ou la liste des erreurs
  return erreurs;
}