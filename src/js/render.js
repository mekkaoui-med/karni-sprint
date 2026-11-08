import {
  historiqueClient,
  titreOperation,
  texteMontantOperation,
} from "./operation.js"; 
import {
  calculerTableauDeBord,
  formaterMontant,
  calculerStatut,
  estAuPlafond,
  calculerSolde,
  calculerCreditDisponible,
  STATUT_A_JOUR,
  STATUT_EN_DETTE,
  STATUT_EN_RETARD,
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

const LIBELLES_STATUT = {
  [STATUT_A_JOUR]: "À jour",
  [STATUT_EN_DETTE]: "En dette",
  [STATUT_EN_RETARD]: "En retard",
};

export function renderTableauDeBord(clients, operations, aujourdhui) {
  if (!totalDu) return;
  const tableauDeBord = calculerTableauDeBord(clients, operations, aujourdhui);
  totalDu.textContent = formaterMontant(tableauDeBord.totalDu);
  nbClients.textContent = tableauDeBord.nombreClients;
  nbEnDette.textContent = tableauDeBord.clientsEnDette;
  nbEnRetard.textContent = tableauDeBord.clientsEnRetard;
}

export function renderListeClients(clientsAffiches = state.clients) {
  if (!listeClients || !modeleClient) return;
  listeClients.innerHTML = "";

  if (state.clients.length === 0) {
    listeClients.classList.add("hidden");
    if (etatVide) etatVide.classList.remove("hidden");
    if (etatAucunResultat) etatAucunResultat.classList.add("hidden");
    return;
  }

  if (clientsAffiches.length === 0) {
    listeClients.classList.add("hidden");
    if (etatVide) etatVide.classList.add("hidden");
    if (etatAucunResultat) etatAucunResultat.classList.remove("hidden");
    return;
  }

  if (etatVide) etatVide.classList.add("hidden");
  if (etatAucunResultat) etatAucunResultat.classList.add("hidden");
  listeClients.classList.remove("hidden");

  clientsAffiches.forEach((client) => {
    const clone = modeleClient.content.cloneNode(true);

    const nom = clone.querySelector(".client-nom");
    const telephone = clone.querySelector(".client-telephone");
    const solde = clone.querySelector(".client-solde");
    const badgesElement = clone.querySelector(".client-badges");

    if (nom) nom.textContent = client.nom;
    if (telephone)
      telephone.textContent = client.telephone || "Aucun téléphone";
    if (solde)
      solde.textContent = formaterMontant(
        calculerSolde(client.id, state.operations),
      );

    const ligne = clone.querySelector("li");
    if (ligne) ligne.dataset.clientId = client.id;

    clone.querySelectorAll(".nom-sr").forEach((element) => {
      element.textContent = ` ${client.nom}`;
    });

    if (badgesElement) {
      badgesElement.appendChild(renderBadges(client));
    }

    listeClients.appendChild(clone);
  });
}

export function renderBadges(client) {
  const statut = calculerStatut(client, state.operations);
  const badges = document.createDocumentFragment();

  const badge = document.createElement("span");
  badge.textContent = LIBELLES_STATUT[statut] || statut;
  badge.className = "rounded-full border px-2 py-1 text-xs font-medium";
  badges.appendChild(badge);

  if (estAuPlafond(client, state.operations)) {
    const badgePlafond = document.createElement("span");
    badgePlafond.textContent = "Plafond atteint";
    badgePlafond.className =
      "rounded-full border px-2 py-1 text-xs font-medium text-karni-rouge border-karni-rouge";
    badges.appendChild(badgePlafond);
  }

  return badges;
}

export function renderFicheClient(client) {
  if (!ficheNom) return;
  if (ficheBadges) {
    ficheBadges.innerHTML = "";
    ficheBadges.appendChild(renderBadges(client));
  }
  ficheNom.textContent = client.nom;
  if (ficheTelephone)
    ficheTelephone.textContent = client.telephone || "Aucun téléphone";
  if (ficheSolde)
    ficheSolde.textContent = formaterMontant(
      calculerSolde(client.id, state.operations),
    );
  if (fichePlafond) fichePlafond.textContent = formaterMontant(client.plafond);
  if (ficheDisponible)
    ficheDisponible.textContent = formaterMontant(
      calculerCreditDisponible(client, state.operations),
    );
}

export function renderHistorique(clientId) {
  if (!historique || !modeleOperation) return;
  historique.innerHTML = "";

  const operations = historiqueClient(clientId);

  if (operations.length === 0) {
    if (historiqueVide) historiqueVide.classList.remove("hidden");
    return;
  }
  if (historiqueVide) historiqueVide.classList.add("hidden");

  operations.forEach((operation) => {
    const clone = modeleOperation.content.cloneNode(true);

    const libelle = clone.querySelector(".operation-libelle");
    const date = clone.querySelector(".operation-date");
    const montant = clone.querySelector(".operation-montant");

    if (libelle) libelle.textContent = titreOperation(operation);
    if (date)
      date.textContent = new Date(operation.date).toLocaleDateString("fr-FR");
    if (montant) montant.textContent = texteMontantOperation(operation);

    const ligne = clone.querySelector("li");
    if (ligne) {
      ligne.dataset.operationId = operation.id;
      ligne.classList.add(`operation-${operation.type}`);
    }

    clone.querySelectorAll(".nom-sr").forEach((el) => {
      el.textContent = ` ${titreOperation(operation)}`;
    });

    historique.appendChild(clone);
  });
}

export function renderNotification(message, type = "success") {
  if (!notification) return;
  notification.textContent = message;
  notification.classList.remove(
    "hidden",
    "text-karni-bleu",
    "text-karni-rouge",
  );
  if (type === "error") {
    notification.classList.add("text-karni-rouge");
  } else {
    notification.classList.add("text-karni-bleu");
  }

  setTimeout(() => {
    notification.classList.add("hidden");
  }, 4000);
}

export function render() {
  renderTableauDeBord(state.clients, state.operations);
  renderListeClients();
}
