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
 
  if (typeof plafond === "number" && Number.isInteger(plafond)) {
    if (plafond >= 5000 && plafond <= 1000000) {
      return { status: "valid" };
    }
    return { status: "invalid" };
  }

  const texte = String(plafond || "").trim();
  if (!montantRegex.test(texte)) {
    return { status: "invalid" };
  }

  const valeurMAD = Number(texte.replace(",", "."));
  if (valeurMAD < 50.0 || valeurMAD > 10000.0) {
    return { status: "invalid" };
  }

  return { status: "valid" };
}


export function validateDate(date) {
  date = new Date(date);
  if (date > today) {
    return { status: "invalid" };
  }
  return { status: "valid" };
}

export function validateClient(client, clients) {
  const errors = {};

  if (validateName(client.nom).status === "invalid") {
    errors.nom = "Nom invalide";
  }

  if (validatePlafond(client.plafond).status === "invalid") {
    errors.plafond = "Plafond invalide";
  }

  if (validatePhone(client.telephone).status === "invalid") {
    errors.telephone = "Téléphone invalide";
  }

  if (validateDate(client.creeLe).status === "invalid") {
    errors.creeLe = "Date invalide";
  }

  const nomNormalise = client.nom.toLowerCase().replaceAll(" ", "");
  let exist = false;

  for (let i = 0; i < clients.length; i++) {
    const nomExistant = clients[i].nom.toLowerCase().replaceAll(" ", "");

    if (nomExistant === nomNormalise && clients[i].id !== client.id) {
      exist = true;
    }
  }

  if (exist === true) {
    errors.nom = "Ce nom existe déjà";
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

function validateStructure(data, errors) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.data = "Format des données invalide";
    return false;
  }

  if (data.app !== "karni" || data.version !== 1)
    errors.app = "Application ou version invalide";

  if (!Array.isArray(data.clients) || !Array.isArray(data.operations)) {
    errors.data = "Clients ou opérations invalides";
    return false;
  }

  return true;
}

function validateClients(clients, errors) {
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];

    if (!client || typeof client !== "object") {
      errors[`clients[${i}]`] = "Client invalide";
      continue;
    }

    if (typeof client.id !== "string" || client.id === "")
      errors[`clients[${i}].id`] = "ID invalide";

    const result = validateClient(client, clients);

    if (result.status === "invalid") {
      for (const key in result.errors) {
        errors[`clients[${i}].${key}`] = result.errors[key];
      }
    }

    for (let j = 0; j < i; j++) {
      if (client.id === clients[j].id)
        errors[`clients[${i}].id`] = "ID déjà utilisé";
    }
  }
}

function validateOperations(operations, clients, errors) {
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    if (!operation || typeof operation !== "object") {
      errors[`operations[${i}]`] = "Opération invalide";
      continue;
    }

    if (typeof operation.id !== "string" || operation.id === "")
      errors[`operations[${i}].id`] = "ID invalide";

    const result = validateOperation(operation, clients, operations);

    if (result.status === "invalid") {
      for (const key in result.errors) {
        errors[`operations[${i}].${key}`] = result.errors[key];
      }
    }

    for (let j = 0; j < i; j++) {
      if (operation.id === operations[j].id)
        errors[`operations[${i}].id`] = "ID déjà utilisé";
    }
  }
}

export function validateData(data) {
  const errors = {};

  if (validateStructure(data, errors)) {
    validateClients(data.clients, errors);
    validateOperations(data.operations, data.clients, errors);
  }

  if (Object.keys(errors).length > 0)
    return { status: "invalid", errors };

  return { status: "valid" };
}