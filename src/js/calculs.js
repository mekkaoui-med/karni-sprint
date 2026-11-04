
export function calculerSolde(clientId,operations){
 return operations.reduce((solde,op) => {
    if (op.clientId !== clientId) return solde;
    if (op.type === "achat") {
  return solde + op.montant;
}
if (op.type === "remboursement") {
  return solde - op.montant;
}
return solde;
 }, 0);
}

export function calculerCreditDisponible(client, operations) {
  const solde = calculerSolde(client.id, operations);
  return client.plafond - solde;
}

export function joursDepuis(dateTexte,aujourdhuiTexte){
  const debut = new Date(dateTexte);
  const fin = new Date(aujourdhuiTexte);
  const msParJour = 24 * 60 * 60 * 1000;
  return Math.round((fin - debut) / msParJour);
}

export function dateReferenceRetard(clientId,operations){
    const opsClient = operations.filter(op => op.clientId === clientId);

    const remboursement = opsClient.filter(op => op.type === "remboursement");
    const achat = opsClient.filter(op => op.type !== "remboursement");

    if (remboursement.length > 0) {
        remboursement.sort((a,b) => new Date(b.date) - new Date(a.date));
        return remboursement[0].date;
    }
    if (achat.length > 0) {
        achat.sort((a,b) => new Date(a.date) - new Date(b.date));
        return achat[0].date;
    }
    return null;
}

export function calculerStatut(client, operations, aujourdhui) {
  const solde = calculerSolde(client.id, operations);

  if (solde === 0) {
    return "À jour";
  }

  const reference = dateReferenceRetard(client.id, operations);
  const jours = joursDepuis(reference, aujourdhui);

  if (jours > 30) {
    return "En retard";
  }

  return "En dette";
}

export function calculerTableauDeBord(clients, operations, aujourdhui) {
  let totalDu = 0;
  let clientsEnDette = 0;
  let clientsEnRetard = 0;
 
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const solde = calculerSolde(client.id, operations);
 
    totalDu = totalDu + solde;
 
    if (solde > 0) {
      clientsEnDette = clientsEnDette + 1;
    }
 
    if (calculerStatut(client, operations, aujourdhui) === "En retard") {
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
 
export function derniereOperation(clientId, operations) {
  const opsClient = operations.filter((op) => op.clientId === clientId);
 
  if (opsClient.length === 0) {
    return null;
  }
 
  opsClient.sort((a, b) => new Date(b.date) - new Date(a.date));
  return opsClient[0].date;
}

export function formaterMontant(centimes) {
  const dirhams = Math.floor(centimes / 100);
  const reste = centimes % 100;
  const resteTexte = String(reste).padStart(2, "0");
  return dirhams + "," + resteTexte + " MAD";
}

export function estAuPlafond(client, operations) {
  return calculerCreditDisponible(client, operations) <= 0;
}