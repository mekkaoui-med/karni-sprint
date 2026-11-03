// starter of the project 
export const sauvegarder = (state) => {
  try {
    localStorage.setItem("karni:v1", JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Erreur de sauvegarde :", error);
    return false;
  }
};