// Importer chaque config ici
import fournisseurs from "./fournisseurs.js";
// import articles from "./articles.js";
// import clients from "./clients.js";

// Chaque config est indexée par nom de fichier DBF
const configs = {
  [fournisseurs.fileName]: fournisseurs,
  // [articles.fileName]: articles,
  // [clients.fileName]: clients,
};

export default configs;