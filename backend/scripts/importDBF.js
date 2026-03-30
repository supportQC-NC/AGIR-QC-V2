import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { DBFFile } from "dbffile";
dotenv.config();

import connectDB from "../config/db.js";
import Entreprise from "../models/EntrepriseModel.js";
import configs from "./dbfConfigs/index.js";

const IMPORTS_DIR = path.resolve("imports");

const importDBF = async (dbfFileName, entreprises) => {
  const config = configs[dbfFileName];
  if (!config) return;

  const dossiers = fs.readdirSync(IMPORTS_DIR).filter((d) =>
    fs.statSync(path.join(IMPORTS_DIR, d)).isDirectory()
  );

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const dossier of dossiers) {
    const entreprise = entreprises.find((e) => e.nomDossierDBF === dossier);
    if (!entreprise) {
      console.log(`[SKIP] "${dossier}" pas dans le mapping`);
      continue;
    }

    const dbfPath = path.join(IMPORTS_DIR, dossier, dbfFileName);
    if (!fs.existsSync(dbfPath)) continue;

    console.log(`\n[${entreprise.trigramme}] ${dbfFileName}...`);

    const dbf = await DBFFile.open(dbfPath);
    const records = await dbf.readRecords();
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const cle = config.getCle(record);
      if (!cle) continue;

      const data = config.transform(record, entreprise._id);
      const filter = { entreprise: entreprise._id, [config.cleUnique]: cle };

      const existing = await config.model.findOne(filter);
      if (existing) {
        await config.model.updateOne(filter, data);
        updated++;
      } else {
        await config.model.create(data);
        inserted++;
      }
    }

    console.log(`[${entreprise.trigramme}] ${inserted} nouveaux, ${updated} mis a jour (${records.length} lignes)`);
    totalInserted += inserted;
    totalUpdated += updated;
  }

  console.log(`\n--- ${dbfFileName}: ${totalInserted} nouveaux, ${totalUpdated} mis a jour ---`);
};

const main = async () => {
  await connectDB();

  if (!fs.existsSync(IMPORTS_DIR)) {
    console.log("Dossier imports/ introuvable");
    process.exit(1);
  }

  const entreprises = await Entreprise.find({ isActive: true });
  const arg = process.argv[2];

  if (arg) {
    if (!configs[arg]) {
      console.log(`DBF inconnu: ${arg}`);
      console.log(`Disponibles: ${Object.keys(configs).join(", ")}`);
      process.exit(1);
    }
    await importDBF(arg, entreprises);
  } else {
    for (const dbfName of Object.keys(configs)) {
      await importDBF(dbfName, entreprises);
    }
  }

  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});