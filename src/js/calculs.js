
export const STATUT_A_JOUR = "a-jour";
export const STATUT_EN_DETTE = "en-dette";
export const STATUT_EN_RETARD = "en-retard";
 

 

export const JOURS_AVANT_RETARD = 30;
 

export function dateDuJour() {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0"); 
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return maintenant.getFullYear() + "-" + mois + "-" + jour;
}
 

export function calculerSolde(clientId, operations) {
  let solde = 0;
 
  for (const op of operations) {
    if (op.clientId === clientId) {
      if (op.type === "achat") {
        solde = solde + op.montant;
      } else if (op.type === "remboursement") {
        solde = solde - op.montant;
      }
    }
  }
 
  return solde;
}
 
export function calculerCreditDisponible(client, operations) {
  const credit = client.plafond - calculerSolde(client.id, operations);
  if (credit < 0) {
    return 0;
  }
  return credit;
}
 

export function estAuPlafond(client, operations) {
  return calculerCreditDisponible(client, operations) === 0;
}
 
 

export function joursDepuis(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const msParJour = 24 * 60 * 60 * 1000;
  return Math.round((fin - debut) / msParJour);
}
 

export function dateReferenceRetard(clientId, operations) {
  let dernierRemboursement = null;
  let premierAchat = null;
 
  for (const op of operations) {
    if (op.clientId === clientId) {
      if (op.type === "remboursement") {
        if (dernierRemboursement === null || op.date > dernierRemboursement) {
          dernierRemboursement = op.date; 
        }
      } else {
        if (premierAchat === null || op.date < premierAchat) {
          premierAchat = op.date; 
        }
      }
    }
  }
 
  if (dernierRemboursement !== null) {
    return dernierRemboursement;
  }
  return premierAchat;
}
 

export function derniereOperation(clientId, operations) {
  let derniere = null;
 
  for (const op of operations) {
    if (op.clientId === clientId) {
      if (derniere === null || op.date > derniere) {
        derniere = op.date;
      }
    }
  }
 
  return derniere;
}
 

export function calculerStatut(client, operations, aujourdhui) {
  if (aujourdhui === undefined) {
    aujourdhui = dateDuJour();
  }
 
  const solde = calculerSolde(client.id, operations);
  if (solde <= 0) {
    return STATUT_A_JOUR; // il ne doit rien
  }
 
  const reference = dateReferenceRetard(client.id, operations);
  // "Plus de 30 jours" : 30 jours exactement n'est PAS en retard, 31 jours oui.
  if (reference !== null && joursDepuis(reference, aujourdhui) > JOURS_AVANT_RETARD) {
    return STATUT_EN_RETARD;
  }
  return STATUT_EN_DETTE;
}
 
 

export function calculerTableauDeBord(clients, operations, aujourdhui) {
  if (aujourdhui === undefined) {
    aujourdhui = dateDuJour();
  }
 
  let totalDu = 0;
  let clientsEnDette = 0;
  let clientsEnRetard = 0;
 
  for (const client of clients) {
    const solde = calculerSolde(client.id, operations);
    totalDu = totalDu + solde;
 
   
    if (solde > 0) {
      clientsEnDette = clientsEnDette + 1;
    }
    if (calculerStatut(client, operations, aujourdhui) === STATUT_EN_RETARD) {
      clientsEnRetard = clientsEnRetard + 1;
    }
  }
 
  return {
    totalDu: totalDu,
    nombreClients: clients.length,
    clientsEnDette: clientsEnDette,
    clientsEnRetard: clientsEnRetard,
  };
}
 
 

export function normaliserTexte(texte) {
  let resultat = String(texte);
  resultat = resultat.normalize("NFD");                 
  resultat = resultat.replace(/[̀-ͯ]/g, ""); 
  resultat = resultat.toLowerCase();
  resultat = resultat.trim();
  return resultat;
}
 

export function rechercherClients(clients, texte) {
  const recherche = normaliserTexte(texte || "");
  const resultat = [];
 
  for (const client of clients) {
    const dansLeNom = normaliserTexte(client.nom).includes(recherche);
    const dansLeTelephone = String(client.telephone || "").includes(recherche);
 
    if (dansLeNom || dansLeTelephone) {
      resultat.push(client);
    }
  }
 
  return resultat;
}
 

export function filtrerClients(clients, statut, operations, aujourdhui) {
  if (aujourdhui === undefined) {
    aujourdhui = dateDuJour();
  }
  if (statut === "tous" || statut === undefined) {
    return [...clients];
  }
 
  const resultat = [];
  for (const client of clients) {
    let garder;
    if (statut === STATUT_EN_DETTE) {
      garder = calculerSolde(client.id, operations) > 0; 
    } else {
      garder = calculerStatut(client, operations, aujourdhui) === statut;
    }
 
    if (garder) {
      resultat.push(client);
    }
  }
 
  return resultat;
}
 

export function trierClients(clients, critere, operations) {
  const copie = [...clients]; // 
 
  copie.sort(function (a, b) {
    let resultat = 0;
 
    if (critere === "solde") {
      resultat = calculerSolde(b.id, operations) - calculerSolde(a.id, operations);
    } else if (critere === "recent") {
    
      const dateA = derniereOperation(a.id, operations) || "";
      const dateB = derniereOperation(b.id, operations) || "";
      resultat = dateB.localeCompare(dateA);
    }
 
    if (resultat !== 0) {
      return resultat;
    }
   
    return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
  });
 
  return copie;
}
 
 

export function formaterMontant(centimes) {
  let signe = "";
  let absolu = centimes;
  if (centimes < 0) {
    signe = "-";
    absolu = -centimes; 
  }
 
  const dirhams = Math.floor(absolu / 100);
  const reste = String(absolu % 100).padStart(2, "0"); 
 
  return signe + dirhams.toLocaleString("fr-FR") + "," + reste + " MAD";
}