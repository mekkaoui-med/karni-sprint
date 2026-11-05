import {
  historiqueClient,
  titreOperation,
  texteMontantOperation,
} from "./operations.js";
import {
  calculerTableauDeBord,
  formaterMontant,
  calculerStatut,
  estAuPlafond,
  calculerSolde,
  calculerCreditDisponible,
} from "./calculs.js";
import { state } from "./state.js";

const totalDu = document.getElementById("total-du");
const nbClients = document.getElementById("nb-clients");
const nbEnDette = document.getElementById("nb-en-dette");
const nbEnRetard = document.getElementById("nb-en-retard");
const listeClients = document.getElementById("liste-clients");
const modeleClient = document.getElementById("modele-client");
const etatVide = document.getElementById("etat-vide");
const etatAucunResultat = document.getElementById("etat-aucun-resultat");
const ficheNom = document.getElementById("fiche-nom");
const ficheTelephone = document.getElementById("fiche-telephone");
const ficheBadges = document.getElementById("fiche-badges");
const ficheSolde = document.getElementById("fiche-solde");
const fichePlafond = document.getElementById("fiche-plafond");
const ficheDisponible = document.getElementById("fiche-disponible");
const notification = document.getElementById("notification");

const historique = document.getElementById("historique");
const historiqueVide = document.getElementById("historique-vide");
const modeleOperation = document.getElementById("modele-operation");

export function renderTableauDeBord(clients, operations, aujourdhui) {
  const tableauDeBord = calculerTableauDeBord(clients, operations, aujourdhui);
  totalDu.textContent = formaterMontant(tableauDeBord.totalDu);
  nbClients.textContent = tableauDeBord.nombreClients;
  nbEnDette.textContent = tableauDeBord.clientsEnDette;
  nbEnRetard.textContent = tableauDeBord.clientsEnRetard;
}

export function renderListeClients() {
  listeClients.innerHTML = "";

  if (state.clients.length === 0) {
    listeClients.classList.add("hidden");
    etatVide.classList.remove("hidden");
    return;
  }
  etatVide.classList.add("hidden");
  listeClients.classList.remove("hidden");

  state.clients.forEach((client) => {
    const clone = modeleClient.content.cloneNode(true);

    const nom = clone.querySelector(".client-nom");
    const telephone = clone.querySelector(".client-telephone");
    const solde = clone.querySelector(".client-solde");
    const badgesElement = clone.querySelector(".client-badges");

    nom.textContent = client.nom;
    telephone.textContent = client.telephone || "Aucun téléphone";
    solde.textContent = `${formaterMontant(calculerSolde(client.id, state.operations))} MAD`;

    const ligne = clone.querySelector("li");
    ligne.dataset.clientId = client.id;

    clone.querySelectorAll(".nom-sr").forEach((element) => {
      element.textContent = ` ${client.nom}`;
    });

    badgesElement.appendChild(renderBadges(client));
    listeClients.appendChild(clone);
  });
}

// clientsFiltres is simply a variable containing the clients that remain after applying the search and filters.
export function renderNoResults(clientsFiltres) {
  listeClients.classList.add("hidden");
  etatVide.classList.add("hidden");
  etatAucunResultat.classList.add("hidden");

  if (state.clients.length === 0) {
    etatVide.classList.remove("hidden");
  } else if (clientsFiltres.length === 0) {
    etatAucunResultat.classList.remove("hidden");
  } else {
    listeClients.classList.remove("hidden");
  }
}

export function renderBadges(client) {
  const statut = calculerStatut(
    client,
    state.operations,
    new Date().toISOString().slice(0, 10),
  );

  const badge = document.createElement("span");
  badge.textContent = statut;
  badge.className = "rounded-full border px-2 py-1 text-xs font-medium";

  const badges =
    document.createDocumentFragment(); /*creates a temporary container in JavaScript where we can put HTML elements before adding them to the page.*/
  badges.appendChild(badge);

  if (estAuPlafond(client, state.operations)) {
    const badgePlafond = document.createElement("span");

    badgePlafond.textContent = "Plafond atteint";
    badgePlafond.className =
      "rounded-full border px-2 py-1 text-xs font-medium text-karni-rouge";

    badges.appendChild(badgePlafond);
  }

  return badges;
}

export function renderFicheClient(client) {
  ficheBadges.innerHTML = "";
  ficheBadges.appendChild(renderBadges(client));
  ficheNom.textContent = client.nom;
  ficheTelephone.textContent = client.telephone || "Aucun téléphone";
  ficheSolde.textContent = formaterMontant(
    calculerSolde(client.id, state.operations),
  );
  fichePlafond.textContent = formaterMontant(client.plafond);
  ficheDisponible.textContent = formaterMontant(
    calculerCreditDisponible(client, state.operations),
  );
}

export function renderNotification(message, type = "success") {
  notification.textContent = message;
  notification.classList.remove("text-karni-bleu", "text-karni-rouge");
  if (type === "error") {
    notification.classList.add("text-karni-rouge");
  } else {
    notification.classList.add("text-karni-bleu");
  }
}
export function renderHistorique(clientId) {
  historique.innerHTML = "";

  const operations = historiqueClient(clientId);

  if (operations.length === 0) {
    historiqueVide.classList.remove("hidden");
    return;
  }
  historiqueVide.classList.add("hidden");

  operations.forEach((operation) => {
    const clone = modeleOperation.content.cloneNode(true);

    const libelle = clone.querySelector(".operation-libelle");
    const date = clone.querySelector(".operation-date");
    const montant = clone.querySelector(".operation-montant");

    libelle.textContent = titreOperation(operation);
    date.textContent = new Date(operation.date).toLocaleDateString("fr-FR");
    montant.textContent = `${texteMontantOperation(operation)} MAD`;

    const ligne = clone.querySelector("li");
    ligne.dataset.operationId = operation.id;
    ligne.classList.add(`operation-${operation.type}`);

    clone.querySelector(".nom-sr").textContent =
      ` ${titreOperation(operation)}`;

    historique.appendChild(clone);
  });
}

export function render() {
  renderTableauDeBord(state.clients, state.operations, new Date());

  renderListeClients();
}
