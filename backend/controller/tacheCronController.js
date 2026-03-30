// import asyncHandler from "../middleware/asyncHandler.js";
// import TacheCron from "../models/TacheCronModel.js";
// import ExecutionCron from "../models/ExecutionCronModel.js";
// import { Client } from "ssh2";
// import path from "path";
// import fs from "fs";
// import crypto from "crypto";
// import mime from "mime-types";

// // ==========================================
// // CONFIG
// // ==========================================

// const TACHES_BASE_PATH = process.env.TACHES_CRON_PATH || "./uploads/taches-cron";
// const TACHES_IMAGES_PATH = path.join(TACHES_BASE_PATH, "images");
// const TACHES_FICHIERS_PATH = path.join(TACHES_BASE_PATH, "fichiers");

// const getSSHConfig = () => ({
//   host: process.env.SSH_HOST,
//   port: parseInt(process.env.SSH_PORT) || 22,
//   username: process.env.SSH_USER,
//   password: process.env.SSH_PASSWORD,
//   readyTimeout: 10000,
//   keepaliveInterval: 5000,
// });

// const ensureDirectories = () => {
//   [TACHES_BASE_PATH, TACHES_IMAGES_PATH, TACHES_FICHIERS_PATH].forEach((dir) => {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//   });
// };

// // Map en mémoire pour le suivi temps réel des processus SSH
// // executionId -> { connection, stream, tacheId }
// const processusEnCours = new Map();

// const parseEnvVariables = (envString) => {
//   if (!envString || !envString.trim()) return {};
//   const env = {};
//   envString.split("\n").forEach((line) => {
//     const trimmed = line.trim();
//     if (!trimmed || !trimmed.includes("=")) return;
//     const eqIndex = trimmed.indexOf("=");
//     const key = trimmed.substring(0, eqIndex).trim();
//     const value = trimmed.substring(eqIndex + 1).trim();
//     if (key) env[key] = value;
//   });
//   return env;
// };

// /**
//  * Exécute une commande via SSH et retourne une Promise
//  */
// const executeSSH = (commandeComplete, tache, execution) => {
//   return new Promise((resolve) => {
//     const sshConfig = getSSHConfig();

//     if (!sshConfig.host || !sshConfig.username || !sshConfig.password) {
//       return resolve({
//         statut: "erreur",
//         codeSortie: null,
//         stdout: "",
//         stderr: "",
//         erreurInterne: "Configuration SSH manquante dans .env (SSH_HOST, SSH_USER, SSH_PASSWORD)",
//       });
//     }

//     const conn = new Client();
//     const dateDebut = Date.now();
//     let stdout = "";
//     let stderr = "";
//     let timeoutHandle = null;
//     let finished = false;

//     const finish = async (statut, codeSortie, erreurInterne) => {
//       if (finished) return;
//       finished = true;
//       if (timeoutHandle) clearTimeout(timeoutHandle);
//       processusEnCours.delete(execution._id.toString());
//       try { conn.end(); } catch {}
//       resolve({
//         statut,
//         codeSortie,
//         stdout,
//         stderr,
//         erreurInterne: erreurInterne || "",
//         dureeMs: Date.now() - dateDebut,
//       });
//     };

//     conn.on("ready", () => {
//       // Construire la commande avec cd + export des variables d'env
//       let fullCmd = "";

//       // Variables d'environnement
//       const envVars = parseEnvVariables(tache.variablesEnvironnement);
//       const envExports = Object.entries(envVars)
//         .map(([k, v]) => `export ${k}="${v}"`)
//         .join(" && ");
//       if (envExports) fullCmd += envExports + " && ";

//       // cd dans le répertoire de travail
//       if (tache.repertoireTravail) {
//         fullCmd += `cd ${tache.repertoireTravail} && `;
//       }

//       fullCmd += commandeComplete;

//       conn.exec(fullCmd, (err, stream) => {
//         if (err) {
//           return finish("erreur", null, `Erreur SSH exec: ${err.message}`);
//         }

//         // Stocker la connexion et le stream pour pouvoir annuler
//         processusEnCours.set(execution._id.toString(), {
//           connection: conn,
//           stream,
//           tacheId: tache._id.toString(),
//         });

//         stream.on("data", (data) => {
//           const chunk = data.toString();
//           if (stdout.length + chunk.length < 50000) stdout += chunk;
//         });

//         stream.stderr.on("data", (data) => {
//           const chunk = data.toString();
//           if (stderr.length + chunk.length < 50000) stderr += chunk;
//         });

//         stream.on("close", (code, signal) => {
//           let statut = "succes";
//           let errInterne = "";
//           if (signal) {
//             statut = "annule";
//             errInterne = `Processus terminé par signal: ${signal}`;
//           } else if (code !== 0) {
//             statut = "erreur";
//           }
//           finish(statut, code, errInterne);
//         });

//         // Timeout
//         if (tache.timeoutSecondes > 0) {
//           timeoutHandle = setTimeout(() => {
//             // Envoyer Ctrl+C via le stream SSH, puis fermer
//             try {
//               stream.signal("KILL");
//             } catch {}
//             try {
//               stream.close();
//             } catch {}
//             finish("timeout", null, `Timeout après ${tache.timeoutSecondes}s`);
//           }, tache.timeoutSecondes * 1000);
//         }
//       });
//     });

//     conn.on("error", (err) => {
//       finish("erreur", null, `Erreur connexion SSH: ${err.message}`);
//     });

//     conn.on("timeout", () => {
//       finish("erreur", null, "Timeout connexion SSH");
//     });

//     conn.connect(sshConfig);
//   });
// };

// /**
//  * Récupère les fichiers du dossier de sortie distant via SFTP
//  */
// const scanDossierSortieSSH = (dossierPath, seuilDate) => {
//   return new Promise((resolve) => {
//     if (!dossierPath) return resolve([]);

//     const sshConfig = getSSHConfig();
//     const conn = new Client();
//     const fichiers = [];

//     conn.on("ready", () => {
//       conn.sftp((err, sftp) => {
//         if (err) { conn.end(); return resolve([]); }

//         sftp.readdir(dossierPath, (err, list) => {
//           if (err) { conn.end(); return resolve([]); }

//           const pertinents = list.filter((item) => {
//             if (item.attrs.isDirectory()) return false;
//             const mtime = new Date(item.attrs.mtime * 1000);
//             return mtime >= seuilDate;
//           });

//           if (pertinents.length === 0) { conn.end(); return resolve([]); }

//           let downloaded = 0;
//           ensureDirectories();

//           pertinents.forEach((item) => {
//             const remotePath = `${dossierPath}/${item.filename}`;
//             const ext = path.extname(item.filename);
//             const localName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
//             const localPath = path.join(TACHES_FICHIERS_PATH, localName);

//             sftp.fastGet(remotePath, localPath, (err) => {
//               downloaded++;
//               if (!err) {
//                 fichiers.push({
//                   nom: item.filename,
//                   path: localPath,
//                   taille: item.attrs.size,
//                   mimeType: mime.lookup(item.filename) || "application/octet-stream",
//                   source: "auto",
//                   dateAjout: new Date(item.attrs.mtime * 1000),
//                 });
//               }
//               if (downloaded === pertinents.length) {
//                 conn.end();
//                 resolve(fichiers);
//               }
//             });
//           });
//         });
//       });
//     });

//     conn.on("error", () => resolve([]));
//     conn.connect(sshConfig);
//   });
// };

// // ==========================================
// // CRUD
// // ==========================================

// const getTachesCron = asyncHandler(async (req, res) => {
//   const { categorie, search, statut, page = 1, limit = 20 } = req.query;
//   let query = {};

//   if (categorie && categorie !== "tous") query.categorie = categorie;
//   if (statut && statut !== "tous") query.statut = statut;
//   if (search) query.$text = { $search: search };
//   if (req.query.includeInactive !== "true") query.isActive = true;

//   const skip = (parseInt(page) - 1) * parseInt(limit);
//   const taches = await TacheCron.find(query)
//     .populate("createdBy", "nom prenom email")
//     .populate("updatedBy", "nom prenom email")
//     .sort({ titre: 1 }).skip(skip).limit(parseInt(limit));

//   const total = await TacheCron.countDocuments(query);

//   const tachesAvecStatut = taches.map((tache) => {
//     const obj = tache.toObject();
//     obj.estEnCoursTempsReel = Array.from(processusEnCours.values()).some(
//       (p) => p.tacheId === tache._id.toString(),
//     );
//     return obj;
//   });

//   res.json({
//     taches: tachesAvecStatut,
//     pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
//   });
// });

// const getTacheCronById = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id)
//     .populate("createdBy", "nom prenom email")
//     .populate("updatedBy", "nom prenom email");
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

//   const obj = tache.toObject();
//   const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
//   obj.estEnCoursTempsReel = !!entry;
//   obj.executionEnCoursId = entry ? entry[0] : null;
//   res.json(obj);
// });

// const createTacheCron = asyncHandler(async (req, res) => {
//   ensureDirectories();
//   const {
//     titre, description, descriptionCourte, commande,
//     arguments: argsJson, repertoireTravail, variablesEnvironnement,
//     timeoutSecondes, dossierSortie, expressionCron, frequenceDescription,
//     categorie, tags, notes,
//   } = req.body;

//   if (!commande) { res.status(400); throw new Error("La commande à exécuter est requise"); }

//   let imagePath = "";
//   let imageNom = "";
//   if (req.files?.image?.[0]) {
//     const f = req.files.image[0];
//     const ext = path.extname(f.originalname);
//     const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
//     imagePath = path.join(TACHES_IMAGES_PATH, name);
//     imageNom = f.originalname;
//     fs.renameSync(f.path, imagePath);
//   }

//   let parsedTags = tags;
//   if (typeof tags === "string") parsedTags = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

//   let parsedArgs = [];
//   if (argsJson) { try { parsedArgs = typeof argsJson === "string" ? JSON.parse(argsJson) : argsJson; } catch {} }

//   const tache = await TacheCron.create({
//     titre, description, descriptionCourte: descriptionCourte || "", commande,
//     arguments: parsedArgs, repertoireTravail: repertoireTravail || "",
//     variablesEnvironnement: variablesEnvironnement || "",
//     timeoutSecondes: parseInt(timeoutSecondes) || 300,
//     dossierSortie: dossierSortie || "", expressionCron: expressionCron || "",
//     frequenceDescription: frequenceDescription || "",
//     categorie: categorie || "autre", tags: parsedTags || [],
//     notes: notes || "", imagePath, imageNom, createdBy: req.user._id,
//   });

//   const populated = await TacheCron.findById(tache._id).populate("createdBy", "nom prenom email");
//   res.status(201).json(populated);
// });

// const updateTacheCron = asyncHandler(async (req, res) => {
//   ensureDirectories();
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
//   if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
//     res.status(409); throw new Error("Impossible de modifier une tâche en cours d'exécution.");
//   }

//   const {
//     titre, description, descriptionCourte, commande,
//     arguments: argsJson, repertoireTravail, variablesEnvironnement,
//     timeoutSecondes, dossierSortie, expressionCron, frequenceDescription,
//     categorie, tags, notes, isActive,
//   } = req.body;

//   if (titre) tache.titre = titre;
//   if (description) tache.description = description;
//   if (descriptionCourte !== undefined) tache.descriptionCourte = descriptionCourte;
//   if (commande) tache.commande = commande;
//   if (repertoireTravail !== undefined) tache.repertoireTravail = repertoireTravail;
//   if (variablesEnvironnement !== undefined) tache.variablesEnvironnement = variablesEnvironnement;
//   if (timeoutSecondes !== undefined) tache.timeoutSecondes = parseInt(timeoutSecondes) || 300;
//   if (dossierSortie !== undefined) tache.dossierSortie = dossierSortie;
//   if (expressionCron !== undefined) tache.expressionCron = expressionCron;
//   if (frequenceDescription !== undefined) tache.frequenceDescription = frequenceDescription;
//   if (categorie) tache.categorie = categorie;
//   if (notes !== undefined) tache.notes = notes;
//   if (isActive !== undefined) tache.isActive = isActive === "true" || isActive === true;

//   if (tags !== undefined) {
//     tache.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : tags;
//   }
//   if (argsJson !== undefined) {
//     try { tache.arguments = typeof argsJson === "string" ? JSON.parse(argsJson) : argsJson; } catch { tache.arguments = []; }
//   }

//   if (req.files?.image?.[0]) {
//     if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
//     const f = req.files.image[0];
//     const ext = path.extname(f.originalname);
//     const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
//     const newPath = path.join(TACHES_IMAGES_PATH, name);
//     fs.renameSync(f.path, newPath);
//     tache.imagePath = newPath;
//     tache.imageNom = f.originalname;
//   }

//   tache.updatedBy = req.user._id;
//   await tache.save();
//   const updated = await TacheCron.findById(tache._id).populate("createdBy", "nom prenom email").populate("updatedBy", "nom prenom email");
//   res.json(updated);
// });

// const deleteTacheCron = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
//   if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
//     res.status(409); throw new Error("Impossible de supprimer une tâche en cours d'exécution.");
//   }

//   if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);

//   const executions = await ExecutionCron.find({ tache: tache._id });
//   for (const exec of executions) {
//     for (const f of exec.fichiersGeneres || []) {
//       if (f.source === "manuel" && f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
//     }
//   }
//   await ExecutionCron.deleteMany({ tache: tache._id });
//   await TacheCron.deleteOne({ _id: tache._id });
//   res.json({ message: "Tâche cron supprimée avec succès" });
// });

// const toggleTacheCronActive = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
//   tache.isActive = !tache.isActive;
//   tache.statut = tache.isActive ? "active" : "inactive";
//   tache.updatedBy = req.user._id;
//   await tache.save();
//   res.json({ _id: tache._id, isActive: tache.isActive, statut: tache.statut, message: tache.isActive ? "Tâche activée" : "Tâche désactivée" });
// });

// // ==========================================
// // IMAGE
// // ==========================================

// const getTacheCronImage = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
//   if (!tache.imagePath || !fs.existsSync(tache.imagePath)) { res.status(404); throw new Error("Image non trouvée"); }

//   const ext = path.extname(tache.imagePath).toLowerCase();
//   const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
//   res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
//   res.setHeader("Cache-Control", "public, max-age=3600");
//   fs.createReadStream(tache.imagePath).pipe(res);
// });

// const updateTacheCronImage = asyncHandler(async (req, res) => {
//   ensureDirectories();
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
//   if (!req.files?.image?.[0]) { res.status(400); throw new Error("Aucune image fournie"); }

//   if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
//   const f = req.files.image[0];
//   const ext = path.extname(f.originalname);
//   const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
//   const newPath = path.join(TACHES_IMAGES_PATH, name);
//   fs.renameSync(f.path, newPath);

//   tache.imagePath = newPath;
//   tache.imageNom = f.originalname;
//   tache.updatedBy = req.user._id;
//   await tache.save();
//   res.json({ message: "Image mise à jour", imageNom: tache.imageNom });
// });

// const deleteTacheCronImage = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
//   if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
//   tache.imagePath = "";
//   tache.imageNom = "";
//   tache.updatedBy = req.user._id;
//   await tache.save();
//   res.json({ message: "Image supprimée" });
// });

// // ==========================================
// // EXÉCUTION VIA SSH
// // ==========================================

// const executerTacheCron = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
//   if (!tache.isActive) { res.status(400); throw new Error("Impossible de lancer une tâche inactive"); }

//   if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
//     res.status(409); throw new Error("Cette tâche est déjà en cours d'exécution");
//   }

//   // Construire la commande avec les arguments sélectionnés
//   const argumentsActives = req.body.argumentsActives || [];
//   const argsStr = tache.arguments
//     .filter((a) => argumentsActives.includes(a._id.toString()))
//     .sort((a, b) => a.ordre - b.ordre)
//     .map((a) => a.valeur)
//     .join(" ");

//   const commandeComplete = argsStr ? `${tache.commande} ${argsStr}` : tache.commande;

//   const execution = await ExecutionCron.create({
//     tache: tache._id,
//     lancePar: req.user._id,
//     declenchement: "manuel",
//     commandeExecutee: commandeComplete,
//     argumentsActives,
//     statut: "en_cours",
//     dateDebut: new Date(),
//     ipAddress: req.ip || req.connection?.remoteAddress || "",
//   });

//   tache.statut = "en_cours";
//   await tache.save();

//   // Répondre immédiatement, exécution en arrière-plan
//   res.status(202).json({
//     message: "Exécution lancée via SSH",
//     executionId: execution._id,
//     tacheId: tache._id,
//     commandeExecutee: commandeComplete,
//     argumentsActives,
//     sshHost: process.env.SSH_HOST,
//   });

//   // Exécuter en arrière-plan via SSH
//   try {
//     const result = await executeSSH(commandeComplete, tache, execution);

//     execution.statut = result.statut;
//     execution.codeSortie = result.codeSortie;
//     execution.sortieStandard = result.stdout;
//     execution.sortieErreur = result.stderr;
//     execution.erreurInterne = result.erreurInterne;
//     execution.dateFin = new Date();
//     execution.dureeMs = result.dureeMs;

//     // Scanner le dossier de sortie distant via SFTP
//     if (tache.dossierSortie && result.statut === "succes") {
//       const seuilDate = new Date(execution.dateDebut.getTime() - 5000);
//       const fichiers = await scanDossierSortieSSH(tache.dossierSortie, seuilDate);
//       if (fichiers.length > 0) execution.fichiersGeneres.push(...fichiers);
//     }

//     await execution.save();

//     await TacheCron.findByIdAndUpdate(tache._id, {
//       statut: result.statut === "succes" ? "active" : "erreur",
//       derniereExecution: { date: new Date(), statut: result.statut, dureeMs: result.dureeMs },
//       $inc: {
//         nombreExecutions: 1,
//         nombreSucces: result.statut === "succes" ? 1 : 0,
//         nombreErreurs: result.statut !== "succes" ? 1 : 0,
//       },
//     });
//   } catch (err) {
//     console.error(`Erreur exécution SSH tâche ${tache._id}:`, err);
//     execution.statut = "erreur";
//     execution.erreurInterne = err.message;
//     execution.dateFin = new Date();
//     execution.dureeMs = Date.now() - execution.dateDebut.getTime();
//     await execution.save();

//     await TacheCron.findByIdAndUpdate(tache._id, {
//       statut: "erreur",
//       derniereExecution: { date: new Date(), statut: "erreur", dureeMs: execution.dureeMs },
//       $inc: { nombreExecutions: 1, nombreErreurs: 1 },
//     });
//     processusEnCours.delete(execution._id.toString());
//   }
// });

// const annulerExecution = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

//   const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
//   if (!entry) { res.status(404); throw new Error("Aucune exécution en cours pour cette tâche"); }

//   const [executionId, { connection, stream }] = entry;

//   // Fermer le stream et la connexion SSH
//   try { if (stream) stream.close(); } catch {}
//   try { if (connection) connection.end(); } catch {}

//   await ExecutionCron.findByIdAndUpdate(executionId, {
//     statut: "annule", dateFin: new Date(),
//     erreurInterne: `Annulé manuellement par ${req.user.nom} ${req.user.prenom}`,
//   });

//   tache.statut = "active";
//   await tache.save();
//   processusEnCours.delete(executionId);
//   res.json({ message: "Exécution annulée" });
// });

// const getStatutExecution = asyncHandler(async (req, res) => {
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

//   const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
//   if (entry) {
//     const execution = await ExecutionCron.findById(entry[0]).populate("lancePar", "nom prenom email");
//     return res.json({ enCours: true, executionId: entry[0], dateDebut: execution?.dateDebut, lancePar: execution?.lancePar });
//   }

//   const derniere = await ExecutionCron.findOne({ tache: tache._id }).sort({ createdAt: -1 }).populate("lancePar", "nom prenom email");
//   res.json({ enCours: false, derniereExecution: derniere || null });
// });

// // ==========================================
// // FICHIERS
// // ==========================================

// const uploadFichierExecution = asyncHandler(async (req, res) => {
//   ensureDirectories();
//   const execution = await ExecutionCron.findById(req.params.executionId);
//   if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
//   if (!req.file) { res.status(400); throw new Error("Aucun fichier fourni"); }

//   const file = req.file;
//   const ext = path.extname(file.originalname);
//   const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
//   const filePath = path.join(TACHES_FICHIERS_PATH, uniqueName);
//   fs.renameSync(file.path, filePath);

//   execution.fichiersGeneres.push({
//     nom: file.originalname, path: filePath, taille: file.size,
//     mimeType: file.mimetype || mime.lookup(file.originalname) || "application/octet-stream",
//     source: "manuel",
//   });
//   await execution.save();
//   res.status(201).json(execution.fichiersGeneres[execution.fichiersGeneres.length - 1]);
// });

// const downloadFichierExecution = asyncHandler(async (req, res) => {
//   const execution = await ExecutionCron.findById(req.params.executionId);
//   if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
//   const fichier = execution.fichiersGeneres.id(req.params.fichierId);
//   if (!fichier) { res.status(404); throw new Error("Fichier non trouvé"); }
//   if (!fs.existsSync(fichier.path)) { res.status(404); throw new Error("Fichier non trouvé sur le serveur"); }

//   res.setHeader("Content-Type", fichier.mimeType || "application/octet-stream");
//   res.setHeader("Content-Disposition", `attachment; filename="${fichier.nom}"`);
//   res.setHeader("Content-Length", fichier.taille);
//   fs.createReadStream(fichier.path).pipe(res);
// });

// const deleteFichierExecution = asyncHandler(async (req, res) => {
//   const execution = await ExecutionCron.findById(req.params.executionId);
//   if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
//   const fichier = execution.fichiersGeneres.id(req.params.fichierId);
//   if (!fichier) { res.status(404); throw new Error("Fichier non trouvé"); }
//   if (fichier.source === "manuel" && fichier.path && fs.existsSync(fichier.path)) fs.unlinkSync(fichier.path);
//   execution.fichiersGeneres.pull(req.params.fichierId);
//   await execution.save();
//   res.json({ message: "Fichier supprimé" });
// });

// // ==========================================
// // HISTORIQUE & STATS
// // ==========================================

// const getExecutions = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 20 } = req.query;
//   const tache = await TacheCron.findById(req.params.id);
//   if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

//   const skip = (parseInt(page) - 1) * parseInt(limit);
//   const executions = await ExecutionCron.find({ tache: tache._id })
//     .populate("lancePar", "nom prenom email")
//     .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
//   const total = await ExecutionCron.countDocuments({ tache: tache._id });

//   res.json({ executions, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
// });

// const getExecutionDetail = asyncHandler(async (req, res) => {
//   const execution = await ExecutionCron.findById(req.params.executionId)
//     .populate("lancePar", "nom prenom email")
//     .populate("tache", "titre commande dossierSortie arguments");
//   if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
//   res.json(execution);
// });

// const getCategoriesCron = asyncHandler(async (req, res) => {
//   const categories = [
//     { value: "sauvegarde", label: "Sauvegarde" }, { value: "synchronisation", label: "Synchronisation" },
//     { value: "nettoyage", label: "Nettoyage" }, { value: "import_export", label: "Import/Export" },
//     { value: "reporting", label: "Reporting" }, { value: "maintenance", label: "Maintenance" },
//     { value: "monitoring", label: "Monitoring" }, { value: "autre", label: "Autre" },
//   ];
//   const counts = await TacheCron.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$categorie", count: { $sum: 1 } } }]);
//   const countMap = {};
//   counts.forEach((c) => { countMap[c._id] = c.count; });
//   res.json(categories.map((cat) => ({ ...cat, count: countMap[cat.value] || 0 })));
// });

// const getTachesCronStats = asyncHandler(async (req, res) => {
//   const totalTaches = await TacheCron.countDocuments();
//   const tachesActives = await TacheCron.countDocuments({ isActive: true });
//   const tachesEnCours = processusEnCours.size;
//   const tachesEnErreur = await TacheCron.countDocuments({ statut: "erreur" });
//   const parCategorie = await TacheCron.aggregate([{ $group: { _id: "$categorie", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
//   const topExecutions = await TacheCron.find().select("titre nombreExecutions nombreSucces nombreErreurs categorie").sort({ nombreExecutions: -1 }).limit(10);
//   const executions7j = await ExecutionCron.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
//   const executions30j = await ExecutionCron.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
//   const totalExec = await ExecutionCron.countDocuments({ statut: { $ne: "en_cours" } });
//   const totalSucces = await ExecutionCron.countDocuments({ statut: "succes" });
//   const tauxSucces = totalExec > 0 ? ((totalSucces / totalExec) * 100).toFixed(1) : 0;
//   const dernieresErreurs = await ExecutionCron.find({ statut: "erreur" }).populate("tache", "titre").populate("lancePar", "nom prenom").sort({ createdAt: -1 }).limit(10);

//   res.json({
//     totalTaches, tachesActives, tachesInactives: totalTaches - tachesActives,
//     tachesEnCours, tachesEnErreur, parCategorie, topExecutions,
//     executions: { derniers7jours: executions7j, derniers30jours: executions30j, tauxSucces: parseFloat(tauxSucces) },
//     dernieresErreurs,
//   });
// });

// export {
//   getTachesCron, getTacheCronById, createTacheCron, updateTacheCron, deleteTacheCron, toggleTacheCronActive,
//   getTacheCronImage, updateTacheCronImage, deleteTacheCronImage,
//   executerTacheCron, annulerExecution, getStatutExecution,
//   uploadFichierExecution, downloadFichierExecution, deleteFichierExecution,
//   getExecutions, getExecutionDetail, getCategoriesCron, getTachesCronStats,
// };
import asyncHandler from "../middleware/asyncHandler.js";
import TacheCron from "../models/TacheCronModel.js";
import ExecutionCron from "../models/ExecutionCronModel.js";
import { Client } from "ssh2";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mime from "mime-types";

// ==========================================
// CONFIG
// ==========================================

const TACHES_BASE_PATH = process.env.TACHES_CRON_PATH || "./uploads/taches-cron";
const TACHES_IMAGES_PATH = path.join(TACHES_BASE_PATH, "images");
const TACHES_FICHIERS_PATH = path.join(TACHES_BASE_PATH, "fichiers");
const TACHES_DOCS_PATH = path.join(TACHES_BASE_PATH, "documentation");

const getSSHConfig = () => ({
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT) || 22,
  username: process.env.SSH_USER,
  password: process.env.SSH_PASSWORD,
  readyTimeout: 10000,
  keepaliveInterval: 5000,
});

const ensureDirectories = () => {
  [TACHES_BASE_PATH, TACHES_IMAGES_PATH, TACHES_FICHIERS_PATH, TACHES_DOCS_PATH].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

// Map en mémoire pour le suivi temps réel des processus SSH
const processusEnCours = new Map();

const parseEnvVariables = (envString) => {
  if (!envString || !envString.trim()) return {};
  const env = {};
  envString.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("=")) return;
    const eqIndex = trimmed.indexOf("=");
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (key) env[key] = value;
  });
  return env;
};

/**
 * Exécute une commande via SSH et retourne une Promise
 */
const executeSSH = (commandeComplete, tache, execution) => {
  return new Promise((resolve) => {
    const sshConfig = getSSHConfig();

    if (!sshConfig.host || !sshConfig.username || !sshConfig.password) {
      return resolve({
        statut: "erreur",
        codeSortie: null,
        stdout: "",
        stderr: "",
        erreurInterne: "Configuration SSH manquante dans .env (SSH_HOST, SSH_USER, SSH_PASSWORD)",
      });
    }

    const conn = new Client();
    const dateDebut = Date.now();
    let stdout = "";
    let stderr = "";
    let timeoutHandle = null;
    let finished = false;

    const finish = async (statut, codeSortie, erreurInterne) => {
      if (finished) return;
      finished = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      processusEnCours.delete(execution._id.toString());
      try { conn.end(); } catch {}
      resolve({
        statut,
        codeSortie,
        stdout,
        stderr,
        erreurInterne: erreurInterne || "",
        dureeMs: Date.now() - dateDebut,
      });
    };

    conn.on("ready", () => {
      let fullCmd = "";
      const envVars = parseEnvVariables(tache.variablesEnvironnement);
      const envExports = Object.entries(envVars)
        .map(([k, v]) => `export ${k}="${v}"`)
        .join(" && ");
      if (envExports) fullCmd += envExports + " && ";
      if (tache.repertoireTravail) {
        fullCmd += `cd ${tache.repertoireTravail} && `;
      }
      fullCmd += commandeComplete;

      conn.exec(fullCmd, (err, stream) => {
        if (err) {
          return finish("erreur", null, `Erreur SSH exec: ${err.message}`);
        }

        processusEnCours.set(execution._id.toString(), {
          connection: conn,
          stream,
          tacheId: tache._id.toString(),
        });

        stream.on("data", (data) => {
          const chunk = data.toString();
          if (stdout.length + chunk.length < 50000) stdout += chunk;
        });

        stream.stderr.on("data", (data) => {
          const chunk = data.toString();
          if (stderr.length + chunk.length < 50000) stderr += chunk;
        });

        stream.on("close", (code, signal) => {
          let statut = "succes";
          let errInterne = "";
          if (signal) {
            statut = "annule";
            errInterne = `Processus terminé par signal: ${signal}`;
          } else if (code !== 0) {
            statut = "erreur";
          }
          finish(statut, code, errInterne);
        });

        if (tache.timeoutSecondes > 0) {
          timeoutHandle = setTimeout(() => {
            try { stream.signal("KILL"); } catch {}
            try { stream.close(); } catch {}
            finish("timeout", null, `Timeout après ${tache.timeoutSecondes}s`);
          }, tache.timeoutSecondes * 1000);
        }
      });
    });

    conn.on("error", (err) => {
      finish("erreur", null, `Erreur connexion SSH: ${err.message}`);
    });

    conn.on("timeout", () => {
      finish("erreur", null, "Timeout connexion SSH");
    });

    conn.connect(sshConfig);
  });
};

/**
 * Récupère les fichiers du dossier de sortie distant via SFTP
 */
const scanDossierSortieSSH = (dossierPath, seuilDate) => {
  return new Promise((resolve) => {
    if (!dossierPath) return resolve([]);

    const sshConfig = getSSHConfig();
    const conn = new Client();
    const fichiers = [];

    conn.on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) { conn.end(); return resolve([]); }

        sftp.readdir(dossierPath, (err, list) => {
          if (err) { conn.end(); return resolve([]); }

          const pertinents = list.filter((item) => {
            if (item.attrs.isDirectory()) return false;
            const mtime = new Date(item.attrs.mtime * 1000);
            return mtime >= seuilDate;
          });

          if (pertinents.length === 0) { conn.end(); return resolve([]); }

          let downloaded = 0;
          ensureDirectories();

          pertinents.forEach((item) => {
            const remotePath = `${dossierPath}/${item.filename}`;
            const ext = path.extname(item.filename);
            const localName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
            const localPath = path.join(TACHES_FICHIERS_PATH, localName);

            sftp.fastGet(remotePath, localPath, (err) => {
              downloaded++;
              if (!err) {
                fichiers.push({
                  nom: item.filename,
                  path: localPath,
                  taille: item.attrs.size,
                  mimeType: mime.lookup(item.filename) || "application/octet-stream",
                  source: "auto",
                  dateAjout: new Date(item.attrs.mtime * 1000),
                });
              }
              if (downloaded === pertinents.length) {
                conn.end();
                resolve(fichiers);
              }
            });
          });
        });
      });
    });

    conn.on("error", () => resolve([]));
    conn.connect(sshConfig);
  });
};

// ==========================================
// CRUD
// ==========================================

const getTachesCron = asyncHandler(async (req, res) => {
  const { categorie, search, statut, page = 1, limit = 20 } = req.query;
  let query = {};

  if (categorie && categorie !== "tous") query.categorie = categorie;
  if (statut && statut !== "tous") query.statut = statut;
  if (search) query.$text = { $search: search };
  if (req.query.includeInactive !== "true") query.isActive = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const taches = await TacheCron.find(query)
    .populate("createdBy", "nom prenom email")
    .populate("updatedBy", "nom prenom email")
    .sort({ titre: 1 }).skip(skip).limit(parseInt(limit));

  const total = await TacheCron.countDocuments(query);

  const tachesAvecStatut = taches.map((tache) => {
    const obj = tache.toObject();
    obj.estEnCoursTempsReel = Array.from(processusEnCours.values()).some(
      (p) => p.tacheId === tache._id.toString(),
    );
    return obj;
  });

  res.json({
    taches: tachesAvecStatut,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

const getTacheCronById = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id)
    .populate("createdBy", "nom prenom email")
    .populate("updatedBy", "nom prenom email");
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const obj = tache.toObject();
  const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
  obj.estEnCoursTempsReel = !!entry;
  obj.executionEnCoursId = entry ? entry[0] : null;
  res.json(obj);
});

const createTacheCron = asyncHandler(async (req, res) => {
  ensureDirectories();
  const {
    titre, description, descriptionCourte, commande,
    arguments: argsJson, repertoireTravail, variablesEnvironnement,
    timeoutSecondes, dossierSortie, expressionCron, frequenceDescription,
    categorie, tags, notes,
  } = req.body;

  if (!commande) { res.status(400); throw new Error("La commande à exécuter est requise"); }

  let imagePath = "";
  let imageNom = "";
  if (req.files?.image?.[0]) {
    const f = req.files.image[0];
    const ext = path.extname(f.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    imagePath = path.join(TACHES_IMAGES_PATH, name);
    imageNom = f.originalname;
    fs.renameSync(f.path, imagePath);
  }

  let parsedTags = tags;
  if (typeof tags === "string") parsedTags = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  let parsedArgs = [];
  if (argsJson) { try { parsedArgs = typeof argsJson === "string" ? JSON.parse(argsJson) : argsJson; } catch {} }

  const tache = await TacheCron.create({
    titre, description, descriptionCourte: descriptionCourte || "", commande,
    arguments: parsedArgs, repertoireTravail: repertoireTravail || "",
    variablesEnvironnement: variablesEnvironnement || "",
    timeoutSecondes: parseInt(timeoutSecondes) || 300,
    dossierSortie: dossierSortie || "", expressionCron: expressionCron || "",
    frequenceDescription: frequenceDescription || "",
    categorie: categorie || "autre", tags: parsedTags || [],
    notes: notes || "", imagePath, imageNom, createdBy: req.user._id,
  });

  const populated = await TacheCron.findById(tache._id).populate("createdBy", "nom prenom email");
  res.status(201).json(populated);
});

const updateTacheCron = asyncHandler(async (req, res) => {
  ensureDirectories();
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
  if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
    res.status(409); throw new Error("Impossible de modifier une tâche en cours d'exécution.");
  }

  const {
    titre, description, descriptionCourte, commande,
    arguments: argsJson, repertoireTravail, variablesEnvironnement,
    timeoutSecondes, dossierSortie, expressionCron, frequenceDescription,
    categorie, tags, notes, isActive,
  } = req.body;

  if (titre) tache.titre = titre;
  if (description) tache.description = description;
  if (descriptionCourte !== undefined) tache.descriptionCourte = descriptionCourte;
  if (commande) tache.commande = commande;
  if (repertoireTravail !== undefined) tache.repertoireTravail = repertoireTravail;
  if (variablesEnvironnement !== undefined) tache.variablesEnvironnement = variablesEnvironnement;
  if (timeoutSecondes !== undefined) tache.timeoutSecondes = parseInt(timeoutSecondes) || 300;
  if (dossierSortie !== undefined) tache.dossierSortie = dossierSortie;
  if (expressionCron !== undefined) tache.expressionCron = expressionCron;
  if (frequenceDescription !== undefined) tache.frequenceDescription = frequenceDescription;
  if (categorie) tache.categorie = categorie;
  if (notes !== undefined) tache.notes = notes;
  if (isActive !== undefined) tache.isActive = isActive === "true" || isActive === true;

  if (tags !== undefined) {
    tache.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : tags;
  }
  if (argsJson !== undefined) {
    try { tache.arguments = typeof argsJson === "string" ? JSON.parse(argsJson) : argsJson; } catch { tache.arguments = []; }
  }

  if (req.files?.image?.[0]) {
    if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
    const f = req.files.image[0];
    const ext = path.extname(f.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const newPath = path.join(TACHES_IMAGES_PATH, name);
    fs.renameSync(f.path, newPath);
    tache.imagePath = newPath;
    tache.imageNom = f.originalname;
  }

  tache.updatedBy = req.user._id;
  await tache.save();
  const updated = await TacheCron.findById(tache._id).populate("createdBy", "nom prenom email").populate("updatedBy", "nom prenom email");
  res.json(updated);
});

const deleteTacheCron = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
  if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
    res.status(409); throw new Error("Impossible de supprimer une tâche en cours d'exécution.");
  }

  if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);

  // Supprimer les fichiers de documentation
  for (const doc of tache.documentation || []) {
    if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
      fs.unlinkSync(doc.fichierPath);
    }
  }

  const executions = await ExecutionCron.find({ tache: tache._id });
  for (const exec of executions) {
    for (const f of exec.fichiersGeneres || []) {
      if (f.source === "manuel" && f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    }
  }
  await ExecutionCron.deleteMany({ tache: tache._id });
  await TacheCron.deleteOne({ _id: tache._id });
  res.json({ message: "Tâche cron supprimée avec succès" });
});

const toggleTacheCronActive = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
  tache.isActive = !tache.isActive;
  tache.statut = tache.isActive ? "active" : "inactive";
  tache.updatedBy = req.user._id;
  await tache.save();
  res.json({ _id: tache._id, isActive: tache.isActive, statut: tache.statut, message: tache.isActive ? "Tâche activée" : "Tâche désactivée" });
});

// ==========================================
// IMAGE
// ==========================================

const getTacheCronImage = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
  if (!tache.imagePath || !fs.existsSync(tache.imagePath)) { res.status(404); throw new Error("Image non trouvée"); }

  const ext = path.extname(tache.imagePath).toLowerCase();
  const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(tache.imagePath).pipe(res);
});

const updateTacheCronImage = asyncHandler(async (req, res) => {
  ensureDirectories();
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
  if (!req.files?.image?.[0]) { res.status(400); throw new Error("Aucune image fournie"); }

  if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
  const f = req.files.image[0];
  const ext = path.extname(f.originalname);
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const newPath = path.join(TACHES_IMAGES_PATH, name);
  fs.renameSync(f.path, newPath);

  tache.imagePath = newPath;
  tache.imageNom = f.originalname;
  tache.updatedBy = req.user._id;
  await tache.save();
  res.json({ message: "Image mise à jour", imageNom: tache.imageNom });
});

const deleteTacheCronImage = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche non trouvée"); }
  if (tache.imagePath && fs.existsSync(tache.imagePath)) fs.unlinkSync(tache.imagePath);
  tache.imagePath = "";
  tache.imageNom = "";
  tache.updatedBy = req.user._id;
  await tache.save();
  res.json({ message: "Image supprimée" });
});

// ==========================================
// DOCUMENTATION
// ==========================================

const addDocumentationTacheCron = asyncHandler(async (req, res) => {
  ensureDirectories();
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const { titre, type, contenu, url } = req.body;
  if (!titre || !type) { res.status(400); throw new Error("Titre et type sont requis"); }

  const docData = {
    titre,
    type,
    ordre: tache.documentation.length,
  };

  if (type === "texte") {
    docData.contenu = contenu || "";
  } else if (type === "lien") {
    docData.url = url || "";
  } else if (["image", "pdf", "video"].includes(type)) {
    if (!req.file) { res.status(400); throw new Error("Fichier requis pour ce type de document"); }
    const file = req.file;
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(TACHES_DOCS_PATH, uniqueName);
    fs.renameSync(file.path, filePath);

    docData.fichierPath = filePath;
    docData.fichierNom = file.originalname;
    docData.fichierTaille = file.size;
  }

  tache.documentation.push(docData);
  tache.updatedBy = req.user._id;
  await tache.save();

  const newDoc = tache.documentation[tache.documentation.length - 1];
  res.status(201).json(newDoc);
});

const updateDocumentationTacheCron = asyncHandler(async (req, res) => {
  ensureDirectories();
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const doc = tache.documentation.id(req.params.docId);
  if (!doc) { res.status(404); throw new Error("Document non trouvé"); }

  const { titre, contenu, url } = req.body;
  if (titre) doc.titre = titre;

  if (doc.type === "texte" && contenu !== undefined) {
    doc.contenu = contenu;
  } else if (doc.type === "lien" && url !== undefined) {
    doc.url = url;
  } else if (["image", "pdf", "video"].includes(doc.type) && req.file) {
    // Supprimer l'ancien fichier
    if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
      fs.unlinkSync(doc.fichierPath);
    }
    const file = req.file;
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(TACHES_DOCS_PATH, uniqueName);
    fs.renameSync(file.path, filePath);

    doc.fichierPath = filePath;
    doc.fichierNom = file.originalname;
    doc.fichierTaille = file.size;
  }

  tache.updatedBy = req.user._id;
  await tache.save();
  res.json(doc);
});

const deleteDocumentationTacheCron = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const doc = tache.documentation.id(req.params.docId);
  if (!doc) { res.status(404); throw new Error("Document non trouvé"); }

  // Supprimer le fichier physique si présent
  if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
    fs.unlinkSync(doc.fichierPath);
  }

  tache.documentation.pull(req.params.docId);
  tache.updatedBy = req.user._id;
  await tache.save();
  res.json({ message: "Document supprimé" });
});

const getDocumentationFile = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const doc = tache.documentation.id(req.params.docId);
  if (!doc) { res.status(404); throw new Error("Document non trouvé"); }

  if (doc.type === "lien") {
    return res.redirect(doc.url);
  }

  if (!doc.fichierPath || !fs.existsSync(doc.fichierPath)) {
    res.status(404); throw new Error("Fichier non trouvé sur le serveur");
  }

  const mimeType = mime.lookup(doc.fichierNom) || "application/octet-stream";
  res.setHeader("Content-Type", mimeType);

  // Pour les images et PDF, afficher inline ; sinon, télécharger
  if (["image", "pdf"].includes(doc.type)) {
    res.setHeader("Content-Disposition", `inline; filename="${doc.fichierNom}"`);
  } else {
    res.setHeader("Content-Disposition", `attachment; filename="${doc.fichierNom}"`);
  }

  if (doc.fichierTaille) res.setHeader("Content-Length", doc.fichierTaille);
  res.setHeader("Cache-Control", "public, max-age=3600");

  fs.createReadStream(doc.fichierPath).pipe(res);
});

// ==========================================
// EXÉCUTION VIA SSH
// ==========================================

const executerTacheCron = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }
  if (!tache.isActive) { res.status(400); throw new Error("Impossible de lancer une tâche inactive"); }

  if (Array.from(processusEnCours.values()).some((p) => p.tacheId === tache._id.toString())) {
    res.status(409); throw new Error("Cette tâche est déjà en cours d'exécution");
  }

  const argumentsActives = req.body.argumentsActives || [];
  const argsStr = tache.arguments
    .filter((a) => argumentsActives.includes(a._id.toString()))
    .sort((a, b) => a.ordre - b.ordre)
    .map((a) => a.valeur)
    .join(" ");

  const commandeComplete = argsStr ? `${tache.commande} ${argsStr}` : tache.commande;

  const execution = await ExecutionCron.create({
    tache: tache._id,
    lancePar: req.user._id,
    declenchement: "manuel",
    commandeExecutee: commandeComplete,
    argumentsActives,
    statut: "en_cours",
    dateDebut: new Date(),
    ipAddress: req.ip || req.connection?.remoteAddress || "",
  });

  tache.statut = "en_cours";
  await tache.save();

  res.status(202).json({
    message: "Exécution lancée via SSH",
    executionId: execution._id,
    tacheId: tache._id,
    commandeExecutee: commandeComplete,
    argumentsActives,
    sshHost: process.env.SSH_HOST,
  });

  try {
    const result = await executeSSH(commandeComplete, tache, execution);

    execution.statut = result.statut;
    execution.codeSortie = result.codeSortie;
    execution.sortieStandard = result.stdout;
    execution.sortieErreur = result.stderr;
    execution.erreurInterne = result.erreurInterne;
    execution.dateFin = new Date();
    execution.dureeMs = result.dureeMs;

    if (tache.dossierSortie && result.statut === "succes") {
      const seuilDate = new Date(execution.dateDebut.getTime() - 5000);
      const fichiers = await scanDossierSortieSSH(tache.dossierSortie, seuilDate);
      if (fichiers.length > 0) execution.fichiersGeneres.push(...fichiers);
    }

    await execution.save();

    await TacheCron.findByIdAndUpdate(tache._id, {
      statut: result.statut === "succes" ? "active" : "erreur",
      derniereExecution: { date: new Date(), statut: result.statut, dureeMs: result.dureeMs },
      $inc: {
        nombreExecutions: 1,
        nombreSucces: result.statut === "succes" ? 1 : 0,
        nombreErreurs: result.statut !== "succes" ? 1 : 0,
      },
    });
  } catch (err) {
    console.error(`Erreur exécution SSH tâche ${tache._id}:`, err);
    execution.statut = "erreur";
    execution.erreurInterne = err.message;
    execution.dateFin = new Date();
    execution.dureeMs = Date.now() - execution.dateDebut.getTime();
    await execution.save();

    await TacheCron.findByIdAndUpdate(tache._id, {
      statut: "erreur",
      derniereExecution: { date: new Date(), statut: "erreur", dureeMs: execution.dureeMs },
      $inc: { nombreExecutions: 1, nombreErreurs: 1 },
    });
    processusEnCours.delete(execution._id.toString());
  }
});

const annulerExecution = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
  if (!entry) { res.status(404); throw new Error("Aucune exécution en cours pour cette tâche"); }

  const [executionId, { connection, stream }] = entry;

  try { if (stream) stream.close(); } catch {}
  try { if (connection) connection.end(); } catch {}

  await ExecutionCron.findByIdAndUpdate(executionId, {
    statut: "annule", dateFin: new Date(),
    erreurInterne: `Annulé manuellement par ${req.user.nom} ${req.user.prenom}`,
  });

  tache.statut = "active";
  await tache.save();
  processusEnCours.delete(executionId);
  res.json({ message: "Exécution annulée" });
});

const getStatutExecution = asyncHandler(async (req, res) => {
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const entry = Array.from(processusEnCours.entries()).find(([, p]) => p.tacheId === tache._id.toString());
  if (entry) {
    const execution = await ExecutionCron.findById(entry[0]).populate("lancePar", "nom prenom email");
    return res.json({ enCours: true, executionId: entry[0], dateDebut: execution?.dateDebut, lancePar: execution?.lancePar });
  }

  const derniere = await ExecutionCron.findOne({ tache: tache._id }).sort({ createdAt: -1 }).populate("lancePar", "nom prenom email");
  res.json({ enCours: false, derniereExecution: derniere || null });
});

// ==========================================
// FICHIERS
// ==========================================

const uploadFichierExecution = asyncHandler(async (req, res) => {
  ensureDirectories();
  const execution = await ExecutionCron.findById(req.params.executionId);
  if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
  if (!req.file) { res.status(400); throw new Error("Aucun fichier fourni"); }

  const file = req.file;
  const ext = path.extname(file.originalname);
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const filePath = path.join(TACHES_FICHIERS_PATH, uniqueName);
  fs.renameSync(file.path, filePath);

  execution.fichiersGeneres.push({
    nom: file.originalname, path: filePath, taille: file.size,
    mimeType: file.mimetype || mime.lookup(file.originalname) || "application/octet-stream",
    source: "manuel",
  });
  await execution.save();
  res.status(201).json(execution.fichiersGeneres[execution.fichiersGeneres.length - 1]);
});

const downloadFichierExecution = asyncHandler(async (req, res) => {
  const execution = await ExecutionCron.findById(req.params.executionId);
  if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
  const fichier = execution.fichiersGeneres.id(req.params.fichierId);
  if (!fichier) { res.status(404); throw new Error("Fichier non trouvé"); }
  if (!fs.existsSync(fichier.path)) { res.status(404); throw new Error("Fichier non trouvé sur le serveur"); }

  res.setHeader("Content-Type", fichier.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${fichier.nom}"`);
  res.setHeader("Content-Length", fichier.taille);
  fs.createReadStream(fichier.path).pipe(res);
});

const deleteFichierExecution = asyncHandler(async (req, res) => {
  const execution = await ExecutionCron.findById(req.params.executionId);
  if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
  const fichier = execution.fichiersGeneres.id(req.params.fichierId);
  if (!fichier) { res.status(404); throw new Error("Fichier non trouvé"); }
  if (fichier.source === "manuel" && fichier.path && fs.existsSync(fichier.path)) fs.unlinkSync(fichier.path);
  execution.fichiersGeneres.pull(req.params.fichierId);
  await execution.save();
  res.json({ message: "Fichier supprimé" });
});

// ==========================================
// HISTORIQUE & STATS
// ==========================================

const getExecutions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const tache = await TacheCron.findById(req.params.id);
  if (!tache) { res.status(404); throw new Error("Tâche cron non trouvée"); }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const executions = await ExecutionCron.find({ tache: tache._id })
    .populate("lancePar", "nom prenom email")
    .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  const total = await ExecutionCron.countDocuments({ tache: tache._id });

  res.json({ executions, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
});

const getExecutionDetail = asyncHandler(async (req, res) => {
  const execution = await ExecutionCron.findById(req.params.executionId)
    .populate("lancePar", "nom prenom email")
    .populate("tache", "titre commande dossierSortie arguments");
  if (!execution) { res.status(404); throw new Error("Exécution non trouvée"); }
  res.json(execution);
});

const getCategoriesCron = asyncHandler(async (req, res) => {
  const categories = [
    { value: "sauvegarde", label: "Sauvegarde" }, { value: "synchronisation", label: "Synchronisation" },
    { value: "nettoyage", label: "Nettoyage" }, { value: "import_export", label: "Import/Export" },
    { value: "reporting", label: "Reporting" }, { value: "maintenance", label: "Maintenance" },
    { value: "monitoring", label: "Monitoring" }, { value: "autre", label: "Autre" },
  ];
  const counts = await TacheCron.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$categorie", count: { $sum: 1 } } }]);
  const countMap = {};
  counts.forEach((c) => { countMap[c._id] = c.count; });
  res.json(categories.map((cat) => ({ ...cat, count: countMap[cat.value] || 0 })));
});

const getTachesCronStats = asyncHandler(async (req, res) => {
  const totalTaches = await TacheCron.countDocuments();
  const tachesActives = await TacheCron.countDocuments({ isActive: true });
  const tachesEnCours = processusEnCours.size;
  const tachesEnErreur = await TacheCron.countDocuments({ statut: "erreur" });
  const parCategorie = await TacheCron.aggregate([{ $group: { _id: "$categorie", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const topExecutions = await TacheCron.find().select("titre nombreExecutions nombreSucces nombreErreurs categorie").sort({ nombreExecutions: -1 }).limit(10);
  const executions7j = await ExecutionCron.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
  const executions30j = await ExecutionCron.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
  const totalExec = await ExecutionCron.countDocuments({ statut: { $ne: "en_cours" } });
  const totalSucces = await ExecutionCron.countDocuments({ statut: "succes" });
  const tauxSucces = totalExec > 0 ? ((totalSucces / totalExec) * 100).toFixed(1) : 0;
  const dernieresErreurs = await ExecutionCron.find({ statut: "erreur" }).populate("tache", "titre").populate("lancePar", "nom prenom").sort({ createdAt: -1 }).limit(10);

  res.json({
    totalTaches, tachesActives, tachesInactives: totalTaches - tachesActives,
    tachesEnCours, tachesEnErreur, parCategorie, topExecutions,
    executions: { derniers7jours: executions7j, derniers30jours: executions30j, tauxSucces: parseFloat(tauxSucces) },
    dernieresErreurs,
  });
});

export {
  getTachesCron, getTacheCronById, createTacheCron, updateTacheCron, deleteTacheCron, toggleTacheCronActive,
  getTacheCronImage, updateTacheCronImage, deleteTacheCronImage,
  executerTacheCron, annulerExecution, getStatutExecution,
  uploadFichierExecution, downloadFichierExecution, deleteFichierExecution,
  getExecutions, getExecutionDetail, getCategoriesCron, getTachesCronStats,
  addDocumentationTacheCron, updateDocumentationTacheCron, deleteDocumentationTacheCron, getDocumentationFile,
};