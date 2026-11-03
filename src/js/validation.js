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
  date = new Date(date);
  if (date > today) {
    return { status: "invalid" };
  }
  return { status: "valid" };
}

export function validateClient(client, clients) {
  if (validateName(client.nom) == "invalid")
    return { status: "invalid" };
  if (validatePlafond(client.plafond) == "invalid")
    return { status: "invalid" };
  if (validatePhone(client.telephone) == "invalid")
    return { status: "invalid" };
  if (validateDate(client.creeLe) == "invalid")
    return { status: "invalid" };
}
