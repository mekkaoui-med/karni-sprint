// Données de démonstration de Karni (US-08), au format commun décrit dans le brief.
// Les dates sont calculées par rapport à aujourd'hui pour que les statuts restent variés :
// à jour, en dette, en retard, plafond atteint.

// Date locale au format AAAA-MM-JJ, `jours` jours avant aujourd'hui.
const ilYa = (jours) => {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
};

export const creerDemo = () => ({
  app: "karni",
  version: 1,
  clients: [
    { id: "c-demo-1", nom: "Fatima Zahra Alaoui", telephone: "0612345678", plafond: 150000, creeLe: ilYa(60) },
    { id: "c-demo-2", nom: "Youssef Benali", telephone: "0661234567", plafond: 80000, creeLe: ilYa(50) },
    { id: "c-demo-3", nom: "Khadija Aït Lahcen", telephone: "", plafond: 50000, creeLe: ilYa(30) },
    { id: "c-demo-4", nom: "Omar El Idrissi", telephone: "0701020304", plafond: 30000, creeLe: ilYa(20) },
    { id: "c-demo-5", nom: "Salma Ouazzani", telephone: "0522334455", plafond: 100000, creeLe: ilYa(90) },
    { id: "c-demo-6", nom: "Rachid Bennani", telephone: "", plafond: 200000, creeLe: ilYa(15) },
  ],
  operations: [
    // Fatima : en dette, achats récents (solde 128,25 MAD).
    { id: "o-demo-1", clientId: "c-demo-1", type: "achat", montant: 4550, libelle: "Lait, pain, œufs", date: ilYa(3) },
    { id: "o-demo-2", clientId: "c-demo-1", type: "achat", montant: 5000, libelle: "Bonbonne de gaz", date: ilYa(2) },
    { id: "o-demo-3", clientId: "c-demo-1", type: "achat", montant: 3275, libelle: "Thé, sucre", date: ilYa(1) },

    // Youssef : en retard, aucun remboursement depuis le premier achat (solde 275,40 MAD).
    { id: "o-demo-4", clientId: "c-demo-2", type: "achat", montant: 21000, libelle: "Courses de la semaine", date: ilYa(45) },
    { id: "o-demo-5", clientId: "c-demo-2", type: "achat", montant: 6540, libelle: "Huile, farine", date: ilYa(38) },

    // Khadija : à jour (solde 0).
    { id: "o-demo-6", clientId: "c-demo-3", type: "achat", montant: 8000, libelle: "Légumes, lait", date: ilYa(20) },
    { id: "o-demo-7", clientId: "c-demo-3", type: "remboursement", montant: 8000, libelle: "", date: ilYa(5) },

    // Omar : plafond atteint (solde 300,00 MAD = plafond).
    { id: "o-demo-8", clientId: "c-demo-4", type: "achat", montant: 18000, libelle: "Courses", date: ilYa(12) },
    { id: "o-demo-9", clientId: "c-demo-4", type: "achat", montant: 12000, libelle: "Couches, lait infantile", date: ilYa(6) },

    // Salma : en retard, dernier remboursement il y a 40 jours (solde 349,90 MAD).
    { id: "o-demo-10", clientId: "c-demo-5", type: "achat", montant: 40000, libelle: "Courses du mois", date: ilYa(70) },
    { id: "o-demo-11", clientId: "c-demo-5", type: "remboursement", montant: 15000, libelle: "Acompte", date: ilYa(40) },
    { id: "o-demo-12", clientId: "c-demo-5", type: "achat", montant: 9990, libelle: "Produits ménagers", date: ilYa(35) },

    // Rachid : en dette (solde 19,99 MAD).
    { id: "o-demo-13", clientId: "c-demo-6", type: "achat", montant: 1999, libelle: "Lessive", date: ilYa(8) },
    { id: "o-demo-14", clientId: "c-demo-6", type: "achat", montant: 750, libelle: "Pain", date: ilYa(4) },
    { id: "o-demo-15", clientId: "c-demo-6", type: "remboursement", montant: 750, libelle: "", date: ilYa(2) },
  ],
});
