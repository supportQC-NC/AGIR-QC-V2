import Fournisseur from "../../models/FournisseurModel.js";

export default {
  fileName: "fourniss.dbf",
  model: Fournisseur,
  cleUnique: "codeFourn",
  getCle: (record) => record.FOURN,
  transform: (record, entrepriseId) => {
    const notes = [];
    for (let i = 1; i <= 10; i++) {
      const note = record[`NOT${i}`];
      if (note && note.trim()) notes.push(note.trim());
    }

    return {
      entreprise: entrepriseId,
      codeFourn: record.FOURN,
      nom: (record.NOM || "").trim(),
      adresse1: (record.AD1 || "").trim(),
      adresse2: (record.AD2 || "").trim(),
      adresse3: (record.AD3 || "").trim(),
      adresse4: (record.AD4 || "").trim(),
      adresse5: (record.AD5 || "").trim(),
      telephone: (record.TEL || "").trim(),
      email: (record.TLX || "").trim(),
      fax: (record.FAX || "").trim(),
      observation: (record.OBSERV || "").trim(),
      delaiAppro: record.DELAPRO || 0,
      coefMini: record.COEFSMINI || 0,
      texte: (record.TEXTE || "").trim(),
      notes: notes,
      franco: record.FRANCO || 0,
      local: (record.LOCAL || "").trim(),
    };
  },
};