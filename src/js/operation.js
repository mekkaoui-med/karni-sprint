
 
import { state } from "./state.js";
import { calculerSolde, calculerCreditDisponible, formaterMontant, dateDuJour } from "./calculs.js";
 
 

function convertirEnCentimes(texte) {
  const propre = String(texte).trim();
 

  if (!/^[0-9]{1,7}([.,][0-9]{1,2})?$/.test(propre)) {
    return null;
  }
 
  const morceaux = propre.replace(",", ".").split("."); 
  let centimes = morceaux[1] || "";
 
  if (centimes === "") {
    centimes = "00";           
  } else if (centimes.length === 1) {
    centimes = centimes + "0"; 
  }
 
  return Number(morceaux[0]) * 100 + Number(centimes);
}
 

function dateExiste(texte) {
  if (typeof texte !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(texte)) {
    return false;
  }
 
  const morceaux = texte.split("-");
  const annee = Number(morceaux[0]);
  const mois = Number(morceaux[1]);
  const jour = Number(morceaux[2]);
 
  
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return (
    date.getUTCFullYear() === annee &&
    date.getUTCMonth() === mois - 1 &&
    date.getUTCDate() === jour
  );
}
 
function verifierOperation(client, formData, aujourdhui) {
  const erreurs = {};
 
 
  const type = formData.type;
  if (type !== "achat" && type !== "remboursement") {
    erreurs.type = "Choisissez achat ou remboursement.";
  }
 
  
  const montant = convertirEnCentimes(formData.montant);
 
  if (montant === null) {
    if (String(formData.montant).trim() === "") {
      erreurs.montant = "Saisissez un montant.";
    } else {
      erreurs.montant = "Montant invalide : chiffres uniquement, 2 décimales au plus (ex. 19,99).";
    }
  } else if (montant < 1) {
    erreurs.montant = "Le montant doit être d'au moins 0,01 MAD.";
  } else if (montant > 1000000) {
    erreurs.montant = "Le montant ne peut pas dépasser 10 000 MAD.";
  } else if (type === "achat") {
    // Un achat ne doit pas dépasser le crédit disponible.
    const credit = calculerCreditDisponible(client, state.operations);
    if (montant > credit) {
      erreurs.montant = "Achat refusé : il reste seulement " + formaterMontant(credit) + " de crédit disponible.";
    }
  } else if (type === "remboursement") {
    // Un remboursement ne doit pas dépasser ce que le client doit.
    const solde = calculerSolde(client.id, state.operations);
    if (montant > solde) {
      erreurs.montant = "Remboursement refusé : le client ne doit que " + formaterMontant(solde) + ".";
    }
  }
 
 
  if (!dateExiste(formData.date)) {
    erreurs.date = "La date doit être valide (AAAA-MM-JJ).";
  } else if (formData.date > aujourdhui) {
    erreurs.date = "La date ne peut pas être dans le futur.";
  }
 
 
  const libelle = String(formData.libelle || "").trim();
  if (libelle.length > 60) {
    erreurs.libelle = "Le libellé ne peut pas dépasser 60 caractères.";
  } else if (type === "achat" && libelle.length < 2) {
    erreurs.libelle = "Le libellé doit contenir au moins 2 caractères pour un achat.";
  }
 
  if (Object.keys(erreurs).length > 0) {
    return { ok: false, erreurs: erreurs };
  }
 
  return {
    ok: true,
    operation: {
      id: "o-" + crypto.randomUUID(), 
      clientId: client.id,
      type: type,
      montant: montant,
      libelle: libelle,
      date: formData.date,
    },
  };
}
 
 

export function ajouterOperation(formData, aujourdhui) {
  if (aujourdhui === undefined) {
    aujourdhui = dateDuJour();
  }
 
 
  const client = state.clients.find((c) => c.id === formData.clientId);
  if (client === undefined) {
    return { ok: false, erreurs: { clientId: "Client introuvable." } };
  }
 
  const resultat = verifierOperation(client, formData, aujourdhui);
  if (!resultat.ok) {
    return resultat; 
  }
 
  state.operations.push(resultat.operation); 
  return { ok: true, operation: resultat.operation };
}
 

export function supprimerOperation(operationId) {
  const existe = state.operations.some((op) => op.id === operationId);
  if (!existe) {
    return { ok: false, erreurs: { operation: "Opération introuvable." } };
  }
 
 
  state.operations = state.operations.filter((op) => op.id !== operationId);
  return { ok: true };
}
 

export function supprimerOperationsDuClient(clientId) {
  state.operations = state.operations.filter((op) => op.clientId !== clientId);
  return { ok: true };
}
 
 

export function historiqueClient(clientId) {
  const liste = [];
 

  for (let i = state.operations.length - 1; i >= 0; i--) {
    if (state.operations[i].clientId === clientId) {
      liste.push(state.operations[i]);
    }
  }
 
  liste.sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
 
  return liste;
}
 
 

export function titreOperation(operation) {
  if (operation.libelle) {
    return operation.libelle;
  }
  if (operation.type === "achat") {
    return "Achat";
  }
  return "Remboursement";
}
 

export function texteMontantOperation(operation) {
  let signe = "-";
  if (operation.type === "achat") {
    signe = "+";
  }
  return signe + " " + formaterMontant(operation.montant);
}
 

export function descriptionOperation(operation) {
  return titreOperation(operation) + ", " + formaterMontant(operation.montant) + ", " + operation.date;
}