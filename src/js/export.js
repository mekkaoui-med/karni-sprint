import { state } from "./state.js";
export function exportData() {
  const donnes = {
    app: "karni",
    version: 1,
    exporteLe: new Date().toISOString(),
    clients: state.clients,
    operations: state.operations,
  };
  const contenu = JSON.stringify(donnes, null, 2);
  const ficher = new Blob([contenu], {
    type: "application/json",
  });
  const url = URL.createObjectURL(ficher);

  const lien = document.createElement("a");
  lien.href = url;

  const date = new Date().toISOString().slice(0, 10);
  lien.download = `karni-${date}.json`;

  document.body.appendChild(lien)
  lien.click();
  lien.remove();

  URL.revokeObjectURL(url)
  return {ok : true}
}
