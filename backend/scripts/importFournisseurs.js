import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { DBFFile } from "dbffile";
dotenv.config();

import connectDB from "../config/db.js";
import Entreprise from "../models/EntrepriseModel.js";
import Fournisseur from "../models/FournisseurModel.js";

const IMPORTS_DIR = path.resolve("imports");

const importFournisseurs = async () => {
  await connectDB();

  const entreprises = await Entreprise.find({ isActive: true });
  console.log(`Found ${entreprises.length} entreprises`);

  if (!fs.existsSync(IMPORTS_DIR)) {
    console.log("Dossier imports/ introuvable");
    process.exit(1);
  }

  const dossiers = fs.readdirSync(IMPORTS_DIR);
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const dossier of dossiers) {
    const entreprise = entreprises.find((e) => e.nomDossierDBF === dossier);
    if (!entreprise) {
      console.log(`[SKIP] Dossier "${dossier}" pas dans le mapping`);
      totalSkipped++;
      continue;
    }

    const dbfPath = path.join(IMPORTS_DIR, dossier, "fourniss.dbf");
    if (!fs.existsSync(dbfPath)) {
      console.log(`[SKIP] ${dossier}/fourniss.dbf introuvable`);
      continue;
    }

    console.log(`\n[${entreprise.trigramme}] Import de ${dossier}/fourniss.dbf...`);

    const dbf = await DBFFile.open(dbfPath);
    const records = await dbf.readRecords();

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const codeFourn = record.FOURN;
      if (!codeFourn) continue;

      const notes = [];
      for (let i = 1; i <= 10; i++) {
        const note = record[`NOT${i}`];
        if (note && note.trim()) notes.push(note.trim());
      }

      const data = {
        entreprise: entreprise._id,
        codeFourn: codeFourn,
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

      const result = await Fournisseur.findOneAndUpdate(
        { entreprise: entreprise._id, codeFourn: codeFourn },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        inserted++;
      } else {
        updated++;
      }
    }

    console.log(`[${entreprise.trigramme}] ${inserted} nouveaux, ${updated} mis à jour`);
    totalInserted += inserted;
    totalUpdated += updated;
  }

  console.log(`\n=============================`);
  console.log(`Total: ${totalInserted} nouveaux, ${totalUpdated} mis à jour, ${totalSkipped} dossiers ignorés`);
  console.log(`=============================`);
  process.exit(0);
};

importFournisseurs().catch((err) => {
  console.error(err);
  process.exit(1);
});