import Article from "../../models/ArticleModel.js";
import Fournisseur from "../../models/FournisseurModel.js";

const parseDate = (d) => {
  if (!d || d === null) return null;
  if (d instanceof Date) return d;
  return null;
};

let fournisseurCache = {};

export default {
  fileName: "article.dbf",
  model: Article,
  cleUnique: "codeArticle",
  getCle: (record) => (record.NART ? record.NART.trim() : null),
  transform: async (record, entrepriseId) => {
    const codeFourn = record.FOURN || 0;
    let fournisseurId = null;

    if (codeFourn > 0) {
      const cacheKey = `${entrepriseId}_${codeFourn}`;
      if (fournisseurCache[cacheKey] !== undefined) {
        fournisseurId = fournisseurCache[cacheKey];
      } else {
        const fourn = await Fournisseur.findOne({
          entreprise: entrepriseId,
          codeFourn: codeFourn,
        });
        fournisseurId = fourn ? fourn._id : null;
        fournisseurCache[cacheKey] = fournisseurId;
      }
    }

    return {
      entreprise: entrepriseId,
      codeArticle: (record.NART || "").trim(),
      designation: (record.DESIGN || "").trim(),
      designation2: (record.DESIGN2 || "").trim(),
      gencode: (record.GENCOD || "").trim(),
      reference: (record.REFER || "").trim(),
      codeFourn: codeFourn,
      fournisseur: fournisseurId,
      prixRevient: record.PREV || 0,
      prixVenteHT: record.PVTE || 0,
      prixDetail: record.PDETAIL || 0,
      prixAchat: record.PACHAT || 0,
      prixPromo: record.PVPROMO || 0,
      prixVenteTTC: record.PVTETTC || 0,
      dernierPrixRevient: record.DERPREV || 0,
      qt2: record.QT2 || 0,
      pr2: record.PR2 || 0,
      qt3: record.QT3 || 0,
      pr3: record.PR3 || 0,
      stockMini: record.SMINI || 0,
      stock: record.STOCK || 0,
      stockLocal2: record.STLOC2 || 0,
      reserve: record.RESERV || 0,
      stockSecurite: record.STSECUR || 0,
      s1: record.S1 || 0,
      s2: record.S2 || 0,
      s3: record.S3 || 0,
      s4: record.S4 || 0,
      s5: record.S5 || 0,
      unite: (record.UNITE || "").trim(),
      conditionnement: record.CONDITNM || 0,
      enCoursCommande: record.ENCDE || 0,
      groupe: (record.GROUPE || "").trim(),
      taxes: record.TAXES || 0,
      tva: record.ATVA || 0,
      txADeduire: record.TXADEDUIRE || 0,
      observation: (record.OBSERV || "").trim(),
      pourcentage: record.POURC || 0,
      ventes: {
        v1: record.V1 || 0, v2: record.V2 || 0, v3: record.V3 || 0,
        v4: record.V4 || 0, v5: record.V5 || 0, v6: record.V6 || 0,
        v7: record.V7 || 0, v8: record.V8 || 0, v9: record.V9 || 0,
        v10: record.V10 || 0, v11: record.V11 || 0, v12: record.V12 || 0,
      },
      ruptures: {
        r1: record.RUP1 || 0, r2: record.RUP2 || 0, r3: record.RUP3 || 0,
        r4: record.RUP4 || 0, r5: record.RUP5 || 0, r6: record.RUP6 || 0,
        r7: record.RUP7 || 0, r8: record.RUP8 || 0, r9: record.RUP9 || 0,
        r10: record.RUP10 || 0, r11: record.RUP11 || 0, r12: record.RUP12 || 0,
      },
      douane: (record.DOUANE || "").trim(),
      devise: (record.DEVISE || "").trim(),
      dateInventaire: parseDate(record.DATINV),
      dateInventaire2: parseDate(record.DATINV2),
      dateCreation: parseDate(record.CREATION),
      datePromoDebut: parseDate(record.DPROMOD),
      datePromoFin: parseDate(record.DPROMOF),
      depreciation: record.DEPREC || 0,
      codeMaj: (record.CODMAJ || "").trim(),
      codeTarif: (record.CODTAR || "").trim(),
      codeTGC: (record.CODTGC || "").trim(),
      gism1: (record.GISM1 || "").trim(),
      gism2: (record.GISM2 || "").trim(),
      gism3: (record.GISM3 || "").trim(),
      gism4: (record.GISM4 || "").trim(),
      gism5: (record.GISM5 || "").trim(),
      place: (record.PLACE || "").trim(),
      tarifLibre: record.TARIFL === true || record.TARIFL === "T",
      texte: (record.TEXTE || "").trim(),
      gencodeDouble: (record.GENDOUBL || "").trim(),
      associe: (record.ASSOCIE || "").trim(),
      photo: (record.FOTO || "").trim(),
      web: (record.WEB || "").trim(),
      designationFournisseur: (record.DESIFRN || "").trim(),
      couleur: (record.COULR || "").trim(),
      commandeSpeciale: record.CDESPEC || 0,
      renvoi: (record.RENV || "").trim(),
      compose: (record.COMPOSE || "").trim(),
      volume: record.VOL || 0,
      kl: (record.KL || "").trim(),
      sav: (record.SAV || "").trim(),
      garantie: (record.GARANTIE || "").trim(),
    };
  },
};