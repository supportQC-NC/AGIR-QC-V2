import fournisseurs from "./fournisseurs.js";
import articles from "./articles.js";

const configs = {
  [fournisseurs.fileName]: fournisseurs,
  [articles.fileName]: articles,
};

export default configs;