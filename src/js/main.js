import { state } from "./state.js";
import { dateDuJour, rechercherClients, filtrerClients, trierClients, calculerSolde } from "./calculs.js";
import { ajoutClient, modifieClient, supprimeClient, trouverClient } from "./clients.js";
import { ajouterOperation, supprimerOperation } from "./operation.js";
import { sauvegarder, restaurer } from "./storage.js";
import { validateData } from "./validation.js";
import { renderTableauDeBord, renderListeClients, renderFicheClient, renderHistorique, renderNotification } from "./render.js";
import { exportData } from "./export.js";
import { preparerImport, confirmerImport } from "./import.js";
import { chargeDemo, viderCarnet } from "./demo.js";

const bandeauErreurStockage = document.getElementById("erreur-stockage");
const messageErreurStockage = document.getElementById("erreur-stockage-message");

const btnNouveauClient = document.getElementById("nouveau-client");
const btnExporter = document.getElementById("exporter");
const btnImporter = document.getElementById("importer");
const inputFichierImport = document.getElementById("import-fichier");
const btnChargerDemo = document.getElementById("charger-demo");
const btnViderCarnet = document.getElementById("vider-carnet");

const champRecherche = document.getElementById("recherche");
const selectStatut = document.getElementById("filtre-statut");
const selectTri = document.getElementById("tri");
const btnReinitialiserFiltres = document.getElementById("reinitialiser-filtres");
const listeClientsEl = document.getElementById("liste-clients");

const dialogClient = document.getElementById("dialog-client");
const titreDialogClient = document.getElementById("dialog-client-titre");
const formClient = document.getElementById("form-client");
const inputClientId = document.getElementById("client-id");
const inputClientNom = document.getElementById("client-nom");
const errClientNom = document.getElementById("client-nom-erreur");
const inputClientTelephone = document.getElementById("client-telephone");
const errClientTelephone = document.getElementById("client-telephone-erreur");
const inputClientPlafond = document.getElementById("client-plafond");
const errClientPlafond = document.getElementById("client-plafond-erreur");
const btnAnnulerClient = document.getElementById("client-annuler");

const dialogFicheClient = document.getElementById("fiche-client");
const formOperation = document.getElementById("form-operation");
const inputOpMontant = document.getElementById("operation-montant");
const errOpMontant = document.getElementById("operation-montant-erreur");
const inputOpDate = document.getElementById("operation-date");
const errOpDate = document.getElementById("operation-date-erreur");
const inputOpLibelle = document.getElementById("operation-libelle");
const errOpLibelle = document.getElementById("operation-libelle-erreur");
const listeHistoriqueEl = document.getElementById("historique");
const btnFermerFiche = document.getElementById("fiche-fermer");

const dialogConfirmation = document.getElementById("dialog-confirmation");
const titreConfirmation = document.getElementById("confirmation-titre");
const msgConfirmation = document.getElementById("confirmation-message");
const detailsConfirmation = document.getElementById("confirmation-details");
const btnConfirmerValider = document.getElementById("confirmation-valider");
const btnConfirmerAnnuler = document.getElementById("confirmation-annuler");

let clientEnCoursId = null;
let actionConfirmationEnAttente = null;

function actualiserAffichageClients() {
  let clientsAffiches = state.clients;

  const texteRecherche = champRecherche ? champRecherche.value : "";
  const statutFiltre = selectStatut ? selectStatut.value : "tous";
  const critereTri = selectTri ? selectTri.value : "nom";

  clientsAffiches = rechercherClients(clientsAffiches, texteRecherche);
  clientsAffiches = filtrerClients(clientsAffiches, statutFiltre, state.operations);
  clientsAffiches = trierClients(clientsAffiches, critereTri, state.operations);

  renderListeClients(clientsAffiches);
}

function actualiserTout() {
  renderTableauDeBord(state.clients, state.operations);
  actualiserAffichageClients();

  const sauvegarde = sauvegarder(state);
  if (!sauvegarde.ok) {
    renderNotification(sauvegarde.erreur, "error");
  }
}

function effacerErreurs(formulaire) {
  formulaire.querySelectorAll("[aria-invalid]").forEach((champ) => {
    champ.removeAttribute("aria-invalid");
    champ.removeAttribute("aria-describedby");
  });
  formulaire.querySelectorAll("[id$='-erreur']").forEach((errEl) => {
    errEl.textContent = "";
    errEl.classList.add("hidden");
  });
}

function afficherErreur(inputEl, errEl, message) {
  inputEl.setAttribute("aria-invalid", "true");
  inputEl.setAttribute("aria-describedby", errEl.id);
  errEl.textContent = message;
  errEl.classList.remove("hidden");
}

function focusPremierChampErreur(formulaire) {
  const premier = formulaire.querySelector("[aria-invalid='true']");
  if (premier) premier.focus();
}

function convertirEnCentimes(texte) {
  const propre = String(texte).trim().replace(",", ".");
  const parties = propre.split(".");
  const dirhams = Number(parties[0]) || 0;
  let centimes = parties[1] || "";
  if (centimes.length === 0) centimes = "00";
  else if (centimes.length === 1) centimes += "0";
  else centimes = centimes.slice(0, 2);
  return dirhams * 100 + Number(centimes);
}

function demanderConfirmation({ titre, message, details = [], surConfirmer, masquerValider = false }) {
  titreConfirmation.textContent = titre;
  msgConfirmation.textContent = message;
  detailsConfirmation.innerHTML = "";

  details.forEach((texte) => {
    const li = document.createElement("li");
    li.textContent = texte;
    detailsConfirmation.appendChild(li);
  });

  if (masquerValider) {
    btnConfirmerValider.classList.add("hidden");
    btnConfirmerAnnuler.textContent = "Fermer";
  } else {
    btnConfirmerValider.classList.remove("hidden");
    btnConfirmerAnnuler.textContent = "Annuler";
  }

  actionConfirmationEnAttente = surConfirmer;
  dialogConfirmation.showModal();
}

function ouvrirModalNouveauClient() {
  effacerErreurs(formClient);
  formClient.reset();
  inputClientId.value = "";
  titreDialogClient.textContent = "Nouveau client";
  dialogClient.showModal();
  inputClientNom.focus();
}

function ouvrirModalModifierClient(id) {
  effacerErreurs(formClient);
  const client = trouverClient(id);
  if (!client) return;

  inputClientId.value = client.id;
  inputClientNom.value = client.nom;
  inputClientTelephone.value = client.telephone || "";
  inputClientPlafond.value = (client.plafond / 100).toFixed(2).replace(".", ",");

  titreDialogClient.textContent = "Modifier le client";
  dialogClient.showModal();
  inputClientNom.focus();
}

formClient.addEventListener("submit", (e) => {
  e.preventDefault();
  effacerErreurs(formClient);

  const id = inputClientId.value;
  const nom = inputClientNom.value.trim();
  const telephone = inputClientTelephone.value.trim();
  const plafondTexte = inputClientPlafond.value.trim();

  const plafondCentimes = convertirEnCentimes(plafondTexte);

  if (!id) {
    const nouveauClient = {
      id: "c-" + crypto.randomUUID().slice(0, 4),
      nom: nom,
      telephone: telephone,
      plafond: plafondCentimes,
      creeLe: dateDuJour(),
    };

    const resultat = ajoutClient(nouveauClient);
    if (!resultat.ok) {
      if (resultat.erreurs.nom) afficherErreur(inputClientNom, errClientNom, resultat.erreurs.nom);
      if (resultat.erreurs.telephone) afficherErreur(inputClientTelephone, errClientTelephone, resultat.erreurs.telephone);
      if (resultat.erreurs.plafond) afficherErreur(inputClientPlafond, errClientPlafond, resultat.erreurs.plafond);
      focusPremierChampErreur(formClient);
      return;
    }

    renderNotification(`Client « ${nom} » ajouté avec succès.`);
  } else {
    const resultat = modifieClient(id, {
      nom: nom,
      telephone: telephone,
      plafond: plafondCentimes,
    });

    if (!resultat.ok) {
      if (resultat.erreurs.nom) afficherErreur(inputClientNom, errClientNom, resultat.erreurs.nom);
      if (resultat.erreurs.telephone) afficherErreur(inputClientTelephone, errClientTelephone, resultat.erreurs.telephone);
      if (resultat.erreurs.plafond) afficherErreur(inputClientPlafond, errClientPlafond, resultat.erreurs.plafond);
      focusPremierChampErreur(formClient);
      return;
    }

    renderNotification(`Client « ${nom} » mis à jour.`);
  }

  dialogClient.close();
  actualiserTout();
});

btnAnnulerClient.addEventListener("click", () => dialogClient.close());

function ouvrirFicheClient(id) {
  const client = trouverClient(id);
  if (!client) return;

  clientEnCoursId = client.id;
  renderFicheClient(client);
  renderHistorique(client.id);

  effacerErreurs(formOperation);
  formOperation.reset();
  inputOpDate.value = dateDuJour();
  dialogFicheClient.showModal();
}

formOperation.addEventListener("submit", (e) => {
  e.preventDefault();
  effacerErreurs(formOperation);

  const typeRadio = formOperation.querySelector('input[name="operation-type"]:checked');
  const type = typeRadio ? typeRadio.value : "achat";
  const montantTexte = inputOpMontant.value.trim();
  const date = inputOpDate.value;
  const libelle = inputOpLibelle.value.trim();

  const donneesOp = {
    clientId: clientEnCoursId,
    type: type,
    montant: montantTexte,
    date: date,
    libelle: libelle,
  };

  const resultat = ajouterOperation(donneesOp);

  if (!resultat.ok) {
    if (resultat.erreurs.montant) afficherErreur(inputOpMontant, errOpMontant, resultat.erreurs.montant);
    if (resultat.erreurs.date) afficherErreur(inputOpDate, errOpDate, resultat.erreurs.date);
    if (resultat.erreurs.libelle) afficherErreur(inputOpLibelle, errOpLibelle, resultat.erreurs.libelle);
    focusPremierChampErreur(formOperation);
    return;
  }

  renderNotification("Opération enregistrée avec succès.");
  formOperation.reset();
  inputOpDate.value = dateDuJour();

  const client = trouverClient(clientEnCoursId);
  renderFicheClient(client);
  renderHistorique(client.id);
  actualiserTout();
});

btnFermerFiche.addEventListener("click", () => {
  dialogFicheClient.close();
  clientEnCoursId = null;
});

listeHistoriqueEl.addEventListener("click", (e) => {
  const boutonSupprimer = e.target.closest('[data-action="supprimer-operation"]');
  if (!boutonSupprimer) return;

  const ligne = boutonSupprimer.closest("[data-operation-id]");
  if (!ligne) return;

  const operationId = ligne.dataset.operationId;

  demanderConfirmation({
    titre: "Supprimer l'opération",
    message: "Êtes-vous sûr de vouloir supprimer cette opération de l'historique ?",
    surConfirmer: () => {
      supprimerOperation(operationId);
      renderNotification("Opération supprimée.");
      const client = trouverClient(clientEnCoursId);
      if (client) {
        renderFicheClient(client);
        renderHistorique(client.id);
      }
      actualiserTout();
    },
  });
});

listeClientsEl.addEventListener("click", (e) => {
  const ligne = e.target.closest("[data-client-id]");
  if (!ligne) return;
  const clientId = ligne.dataset.clientId;

  if (e.target.closest('[data-action="ouvrir-fiche"]')) {
    ouvrirFicheClient(clientId);
    return;
  }

  if (e.target.closest('[data-action="modifier-client"]')) {
    ouvrirModalModifierClient(clientId);
    return;
  }

  if (e.target.closest('[data-action="supprimer-client"]')) {
    const client = trouverClient(clientId);
    if (!client) return;

    const solde = calculerSolde(client.id, state.operations);
    if (solde > 0) {
      renderNotification("Impossible de supprimer un client qui a un solde débiteur.", "error");
      return;
    }

    demanderConfirmation({
      titre: "Supprimer le client",
      message: `Voulez-vous supprimer définitivement ${client.nom} et toutes ses opérations associées ?`,
      surConfirmer: () => {
        supprimeClient(clientId);
        renderNotification(`Client « ${client.nom} » supprimé.`);
        actualiserTout();
      },
    });
  }
});

if (champRecherche) champRecherche.addEventListener("input", actualiserAffichageClients);
if (selectStatut) selectStatut.addEventListener("change", actualiserAffichageClients);
if (selectTri) selectTri.addEventListener("change", actualiserAffichageClients);

if (btnReinitialiserFiltres) {
  btnReinitialiserFiltres.addEventListener("click", () => {
    champRecherche.value = "";
    selectStatut.value = "tous";
    selectTri.value = "nom";
    actualiserAffichageClients();
  });
}

dialogConfirmation.addEventListener("close", () => {
  if (dialogConfirmation.returnValue === "valider" && typeof actionConfirmationEnAttente === "function") {
    actionConfirmationEnAttente();
  }
  actionConfirmationEnAttente = null;
});

btnNouveauClient.addEventListener("click", ouvrirModalNouveauClient);

btnExporter.addEventListener("click", () => {
  exportData();
  renderNotification("Le carnet a été exporté avec succès.");
});

btnImporter.addEventListener("click", () => inputFichierImport.click());

inputFichierImport.addEventListener("change", async (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;

  const resultat = await preparerImport(fichier);
  inputFichierImport.value = "";

  if (!resultat.ok) {
    demanderConfirmation({
      titre: "Importation impossible",
      message: "Le fichier sélectionné contient des erreurs et n'a pas pu être importé :",
      details: resultat.errors,
      masquerValider: true,
    });
    return;
  }

  demanderConfirmation({
    titre: "Confirmer l'importation",
    message: `Voulez-vous remplacer le carnet actuel par les données du fichier (${resultat.resume.texte}) ?`,
    surConfirmer: () => {
      confirmerImport(resultat.donnees);
      actualiserTout();
      renderNotification("Carnet importé avec succès.");
    },
  });
});

btnChargerDemo.addEventListener("click", () => {
  demanderConfirmation({
    titre: "Charger les données de démo",
    message: "Cette action remplacera toutes vos données actuelles par les données d'exemple. Continuer ?",
    surConfirmer: () => {
      chargeDemo();
      actualiserTout();
      renderNotification("Données de démo chargées avec succès.");
    },
  });
});

btnViderCarnet.addEventListener("click", () => {
  demanderConfirmation({
    titre: "Vider le carnet",
    message: "Attention : tous les clients et toutes les opérations seront définitivement effacés. Confirmer ?",
    surConfirmer: () => {
      viderCarnet();
      actualiserTout();
      renderNotification("Le carnet a été vidé.");
    },
  });
});

function initialiserApp() {
  const resultatRestauration = restaurer(validateData);

  if (resultatRestauration.ok) {
    state.clients = resultatRestauration.data.clients || [];
    state.operations = resultatRestauration.data.operations || [];
  } else {
    if (bandeauErreurStockage && messageErreurStockage) {
      messageErreurStockage.textContent = resultatRestauration.erreur;
      bandeauErreurStockage.classList.remove("hidden");
    }
  }

  actualiserTout();
}

initialiserApp();