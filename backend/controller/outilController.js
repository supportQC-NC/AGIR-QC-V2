// backend/controllers/outilController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Outil from "../models/OutilsModel.js";
import Telechargement from "../models/TelechargementModel.js";
import Permission from "../models/PermissionModel.js";
import User from "../models/UserModel.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Chemin de base pour stocker les fichiers des outils
const OUTILS_BASE_PATH = process.env.OUTILS_PATH || "./uploads/outils";
const OUTILS_EXECUTABLES_PATH = path.join(OUTILS_BASE_PATH, "executables");
const OUTILS_IMAGES_PATH = path.join(OUTILS_BASE_PATH, "images");
const OUTILS_DOCS_PATH = path.join(OUTILS_BASE_PATH, "documentation");

// Créer les dossiers s'ils n'existent pas
const ensureDirectories = () => {
  [
    OUTILS_BASE_PATH,
    OUTILS_EXECUTABLES_PATH,
    OUTILS_IMAGES_PATH,
    OUTILS_DOCS_PATH,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Calculer le checksum MD5 d'un fichier
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

// Récupérer les entreprises de l'utilisateur
const getUserEntreprises = async (userId) => {
  const permission = await Permission.findOne({ user: userId });
  if (!permission) return [];
  if (permission.allEntreprises) return ["ALL"];
  return permission.entreprises || [];
};

// ==========================================
// ROUTES PUBLIQUES (utilisateurs connectés)
// ==========================================

/**
 * @desc    Obtenir tous les outils accessibles par l'utilisateur
 * @route   GET /api/outils
 * @access  Private
 */
const getOutils = asyncHandler(async (req, res) => {
  const { categorie, search, page = 1, limit = 20 } = req.query;
  const user = req.user;

  let query = { isActive: true };

  // Filtrer par catégorie
  if (categorie && categorie !== "tous") {
    query.categorie = categorie;
  }

  // Recherche textuelle
  if (search) {
    query.$text = { $search: search };
  }

  // Récupérer les entreprises de l'utilisateur
  const userEntreprises = await getUserEntreprises(user._id);

  // Si admin, récupérer tous les outils (même inactifs selon query param)
  if (user.role === "admin") {
    if (req.query.includeInactive === "true") {
      delete query.isActive;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const outils = await Outil.find(query)
    .populate("createdBy", "nom prenom email")
    .populate("utilisateursAutorises", "nom prenom email")
    .populate("entreprisesAutorisees", "nomComplet trigramme")
    .sort({ titre: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Outil.countDocuments(query);

  // Filtrer les outils accessibles si non-admin
  let outilsAccessibles = outils;
  if (user.role !== "admin") {
    outilsAccessibles = outils.filter((outil) =>
      outil.utilisateurPeutTelecharger(user, userEntreprises),
    );
  }

  // Ajouter un flag pour indiquer si l'utilisateur peut télécharger
  const outilsAvecAcces = outilsAccessibles.map((outil) => ({
    ...outil.toObject(),
    peutTelecharger: outil.utilisateurPeutTelecharger(user, userEntreprises),
  }));

  res.json({
    outils: outilsAvecAcces,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: user.role === "admin" ? total : outilsAccessibles.length,
      totalPages: Math.ceil(
        (user.role === "admin" ? total : outilsAccessibles.length) /
          parseInt(limit),
      ),
    },
  });
});

/**
 * @desc    Obtenir un outil par ID
 * @route   GET /api/outils/:id
 * @access  Private
 */
const getOutilById = asyncHandler(async (req, res) => {
  const user = req.user;

  const outil = await Outil.findById(req.params.id)
    .populate("createdBy", "nom prenom email")
    .populate("updatedBy", "nom prenom email")
    .populate("utilisateursAutorises", "nom prenom email")
    .populate("entreprisesAutorisees", "nomComplet trigramme nomDossierDBF");

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const userEntreprises = await getUserEntreprises(user._id);
  const peutTelecharger = outil.utilisateurPeutTelecharger(
    user,
    userEntreprises,
  );

  // Non-admin ne peut voir que les outils actifs et accessibles
  if (user.role !== "admin" && (!outil.isActive || !peutTelecharger)) {
    res.status(403);
    throw new Error("Vous n'avez pas accès à cet outil");
  }

  res.json({
    ...outil.toObject(),
    peutTelecharger,
  });
});

/**
 * @desc    Télécharger l'exécutable d'un outil
 * @route   GET /api/outils/:id/download
 * @access  Private (avec vérification d'accès)
 */
const downloadOutil = asyncHandler(async (req, res) => {
  const user = req.user;

  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  if (!outil.isActive && user.role !== "admin") {
    res.status(403);
    throw new Error("Cet outil n'est plus disponible");
  }

  // Vérifier l'accès
  const userEntreprises = await getUserEntreprises(user._id);
  if (!outil.utilisateurPeutTelecharger(user, userEntreprises)) {
    res.status(403);
    throw new Error("Vous n'êtes pas autorisé à télécharger cet outil");
  }

  // Vérifier que le fichier existe
  const filePath = outil.executablePath;
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("Fichier exécutable non trouvé sur le serveur");
  }

  // Créer l'enregistrement de téléchargement
  const telechargement = await Telechargement.create({
    outil: outil._id,
    user: user._id,
    versionTelechargee: outil.version,
    fichierNom: outil.executableNom,
    ipAddress: req.ip || req.connection?.remoteAddress || "",
    userAgent: req.headers["user-agent"] || "",
    status: "initie",
  });

  try {
    // Incrémenter le compteur de téléchargements
    await Outil.findByIdAndUpdate(outil._id, {
      $inc: { nombreTelechargements: 1 },
    });

    // Mettre à jour le statut du téléchargement
    telechargement.status = "complete";
    await telechargement.save();

    // Envoyer le fichier
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${outil.executableNom}"`,
    );
    res.setHeader("Content-Length", outil.executableTaille);

    if (outil.executableChecksum) {
      res.setHeader("X-Checksum-MD5", outil.executableChecksum);
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    telechargement.status = "echoue";
    telechargement.erreur = error.message;
    await telechargement.save();
    throw error;
  }
});

/**
 * @desc    Obtenir l'image d'un outil
 * @route   GET /api/outils/:id/image
 * @access  Private
 */
const getOutilImage = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  if (!outil.imagePath || !fs.existsSync(outil.imagePath)) {
    res.status(404);
    throw new Error("Image non trouvée");
  }

  const ext = path.extname(outil.imagePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const fileStream = fs.createReadStream(outil.imagePath);
  fileStream.pipe(res);
});

/**
 * @desc    Obtenir un document de la documentation
 * @route   GET /api/outils/:id/documentation/:docId
 * @access  Private
 */
const getDocumentation = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;
  const user = req.user;

  const outil = await Outil.findById(id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  // Vérifier l'accès
  const userEntreprises = await getUserEntreprises(user._id);
  if (
    user.role !== "admin" &&
    !outil.utilisateurPeutTelecharger(user, userEntreprises)
  ) {
    res.status(403);
    throw new Error("Vous n'avez pas accès à cette documentation");
  }

  const doc = outil.documentation.id(docId);

  if (!doc) {
    res.status(404);
    throw new Error("Document non trouvé");
  }

  // Si c'est du texte, retourner le contenu JSON
  if (doc.type === "texte") {
    return res.json({
      titre: doc.titre,
      type: doc.type,
      contenu: doc.contenu,
    });
  }

  // Si c'est un lien, retourner l'URL
  if (doc.type === "lien") {
    return res.json({
      titre: doc.titre,
      type: doc.type,
      url: doc.url,
    });
  }

  // Sinon, envoyer le fichier
  if (!doc.fichierPath || !fs.existsSync(doc.fichierPath)) {
    res.status(404);
    throw new Error("Fichier de documentation non trouvé");
  }

  const ext = path.extname(doc.fichierPath).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${doc.fichierNom || "document"}"`,
  );

  const fileStream = fs.createReadStream(doc.fichierPath);
  fileStream.pipe(res);
});

/**
 * @desc    Obtenir les catégories disponibles
 * @route   GET /api/outils/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = [
    { value: "gestion_stock", label: "Gestion de Stock" },
    { value: "comptabilite", label: "Comptabilité" },
    { value: "caisse", label: "Caisse" },
    { value: "utilitaire", label: "Utilitaire" },
    { value: "reporting", label: "Reporting" },
    { value: "import_export", label: "Import/Export" },
    { value: "maintenance", label: "Maintenance" },
    { value: "autre", label: "Autre" },
  ];

  // Compter les outils par catégorie
  const counts = await Outil.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$categorie", count: { $sum: 1 } } },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id] = c.count;
  });

  const categoriesAvecCount = categories.map((cat) => ({
    ...cat,
    count: countMap[cat.value] || 0,
  }));

  res.json(categoriesAvecCount);
});

// ==========================================
// ROUTES ADMIN
// ==========================================

/**
 * @desc    Créer un nouvel outil
 * @route   POST /api/outils
 * @access  Private/Admin
 */
const createOutil = asyncHandler(async (req, res) => {
  ensureDirectories();

  const {
    titre,
    description,
    descriptionCourte,
    version,
    categorie,
    tags,
    configurationRequise,
    changelog,
    accesPublic,
    utilisateursAutorises,
    entreprisesAutorisees,
  } = req.body;

  // Vérifier les fichiers uploadés
  if (!req.files?.executable) {
    res.status(400);
    throw new Error("Le fichier exécutable est requis");
  }

  const executableFile = req.files.executable[0];
  const imageFile = req.files?.image?.[0];

  // Générer un nom unique pour l'exécutable
  const executableExt = path.extname(executableFile.originalname);
  const executableUniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${executableExt}`;
  const executablePath = path.join(
    OUTILS_EXECUTABLES_PATH,
    executableUniqueName,
  );

  // Déplacer le fichier exécutable
  fs.renameSync(executableFile.path, executablePath);

  // Calculer le checksum
  const checksum = await calculateChecksum(executablePath);

  // Gérer l'image si présente
  let imagePath = "";
  let imageNom = "";
  if (imageFile) {
    const imageExt = path.extname(imageFile.originalname);
    const imageUniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${imageExt}`;
    imagePath = path.join(OUTILS_IMAGES_PATH, imageUniqueName);
    imageNom = imageFile.originalname;
    fs.renameSync(imageFile.path, imagePath);
  }

  // Parser les tags si c'est une chaîne
  let parsedTags = tags;
  if (typeof tags === "string") {
    parsedTags = tags.split(",").map((t) => t.trim().toLowerCase());
  }

  // Parser les utilisateurs autorisés
  let parsedUtilisateurs = utilisateursAutorises;
  if (typeof utilisateursAutorises === "string") {
    try {
      parsedUtilisateurs = JSON.parse(utilisateursAutorises);
    } catch {
      parsedUtilisateurs = [];
    }
  }

  // Parser les entreprises autorisées
  let parsedEntreprises = entreprisesAutorisees;
  if (typeof entreprisesAutorisees === "string") {
    try {
      parsedEntreprises = JSON.parse(entreprisesAutorisees);
    } catch {
      parsedEntreprises = [];
    }
  }

  const outil = await Outil.create({
    titre,
    description,
    descriptionCourte: descriptionCourte || "",
    version: version || "1.0.0",
    categorie: categorie || "autre",
    tags: parsedTags || [],
    configurationRequise: configurationRequise || "",
    changelog: changelog || "",
    accesPublic: accesPublic === "true" || accesPublic === true,
    utilisateursAutorises: parsedUtilisateurs || [],
    entreprisesAutorisees: parsedEntreprises || [],
    executablePath,
    executableNom: executableFile.originalname,
    executableTaille: executableFile.size,
    executableChecksum: checksum,
    imagePath,
    imageNom,
    createdBy: req.user._id,
  });

  const outilPopulated = await Outil.findById(outil._id)
    .populate("createdBy", "nom prenom email")
    .populate("utilisateursAutorises", "nom prenom email")
    .populate("entreprisesAutorisees", "nomComplet trigramme");

  res.status(201).json(outilPopulated);
});

/**
 * @desc    Mettre à jour un outil
 * @route   PUT /api/outils/:id
 * @access  Private/Admin
 */
const updateOutil = asyncHandler(async (req, res) => {
  ensureDirectories();

  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const {
    titre,
    description,
    descriptionCourte,
    version,
    categorie,
    tags,
    configurationRequise,
    changelog,
    accesPublic,
    utilisateursAutorises,
    entreprisesAutorisees,
    isActive,
  } = req.body;

  // Mise à jour des champs texte
  if (titre) outil.titre = titre;
  if (description) outil.description = description;
  if (descriptionCourte !== undefined)
    outil.descriptionCourte = descriptionCourte;
  if (version) outil.version = version;
  if (categorie) outil.categorie = categorie;
  if (configurationRequise !== undefined)
    outil.configurationRequise = configurationRequise;
  if (changelog !== undefined) outil.changelog = changelog;
  if (accesPublic !== undefined) {
    outil.accesPublic = accesPublic === "true" || accesPublic === true;
  }
  if (isActive !== undefined) {
    outil.isActive = isActive === "true" || isActive === true;
  }

  // Parser et mettre à jour les tags
  if (tags !== undefined) {
    let parsedTags = tags;
    if (typeof tags === "string") {
      parsedTags = tags.split(",").map((t) => t.trim().toLowerCase());
    }
    outil.tags = parsedTags;
  }

  // Parser et mettre à jour les utilisateurs autorisés
  if (utilisateursAutorises !== undefined) {
    let parsed = utilisateursAutorises;
    if (typeof utilisateursAutorises === "string") {
      try {
        parsed = JSON.parse(utilisateursAutorises);
      } catch {
        parsed = [];
      }
    }
    outil.utilisateursAutorises = parsed;
  }

  // Parser et mettre à jour les entreprises autorisées
  if (entreprisesAutorisees !== undefined) {
    let parsed = entreprisesAutorisees;
    if (typeof entreprisesAutorisees === "string") {
      try {
        parsed = JSON.parse(entreprisesAutorisees);
      } catch {
        parsed = [];
      }
    }
    outil.entreprisesAutorisees = parsed;
  }

  // Gérer le nouvel exécutable si uploadé
  if (req.files?.executable?.[0]) {
    const executableFile = req.files.executable[0];

    // Supprimer l'ancien fichier
    if (outil.executablePath && fs.existsSync(outil.executablePath)) {
      fs.unlinkSync(outil.executablePath);
    }

    // Sauvegarder le nouveau
    const executableExt = path.extname(executableFile.originalname);
    const executableUniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${executableExt}`;
    const executablePath = path.join(
      OUTILS_EXECUTABLES_PATH,
      executableUniqueName,
    );
    fs.renameSync(executableFile.path, executablePath);

    outil.executablePath = executablePath;
    outil.executableNom = executableFile.originalname;
    outil.executableTaille = executableFile.size;
    outil.executableChecksum = await calculateChecksum(executablePath);
  }

  // Gérer la nouvelle image si uploadée
  if (req.files?.image?.[0]) {
    const imageFile = req.files.image[0];

    // Supprimer l'ancienne image
    if (outil.imagePath && fs.existsSync(outil.imagePath)) {
      fs.unlinkSync(outil.imagePath);
    }

    // Sauvegarder la nouvelle
    const imageExt = path.extname(imageFile.originalname);
    const imageUniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${imageExt}`;
    const imagePath = path.join(OUTILS_IMAGES_PATH, imageUniqueName);
    fs.renameSync(imageFile.path, imagePath);

    outil.imagePath = imagePath;
    outil.imageNom = imageFile.originalname;
  }

  outil.updatedBy = req.user._id;

  await outil.save();

  const outilUpdated = await Outil.findById(outil._id)
    .populate("createdBy", "nom prenom email")
    .populate("updatedBy", "nom prenom email")
    .populate("utilisateursAutorises", "nom prenom email")
    .populate("entreprisesAutorisees", "nomComplet trigramme");

  res.json(outilUpdated);
});

/**
 * @desc    Supprimer un outil
 * @route   DELETE /api/outils/:id
 * @access  Private/Admin
 */
const deleteOutil = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  // Supprimer le fichier exécutable
  if (outil.executablePath && fs.existsSync(outil.executablePath)) {
    fs.unlinkSync(outil.executablePath);
  }

  // Supprimer l'image
  if (outil.imagePath && fs.existsSync(outil.imagePath)) {
    fs.unlinkSync(outil.imagePath);
  }

  // Supprimer les fichiers de documentation
  outil.documentation.forEach((doc) => {
    if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
      fs.unlinkSync(doc.fichierPath);
    }
  });

  // Supprimer l'historique des téléchargements
  await Telechargement.deleteMany({ outil: outil._id });

  // Supprimer l'outil
  await Outil.deleteOne({ _id: outil._id });

  res.json({ message: "Outil supprimé avec succès" });
});

/**
 * @desc    Activer/Désactiver un outil
 * @route   PATCH /api/outils/:id/toggle-active
 * @access  Private/Admin
 */
const toggleOutilActive = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  outil.isActive = !outil.isActive;
  outil.updatedBy = req.user._id;
  await outil.save();

  res.json({
    _id: outil._id,
    isActive: outil.isActive,
    message: outil.isActive ? "Outil activé" : "Outil désactivé",
  });
});

/**
 * @desc    Ajouter de la documentation à un outil
 * @route   POST /api/outils/:id/documentation
 * @access  Private/Admin
 */
const addDocumentation = asyncHandler(async (req, res) => {
  ensureDirectories();

  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const { titre, type, contenu, url, ordre } = req.body;

  if (!titre || !type) {
    res.status(400);
    throw new Error("Le titre et le type sont requis");
  }

  const newDoc = {
    titre,
    type,
    ordre: parseInt(ordre) || outil.documentation.length,
  };

  if (type === "texte") {
    newDoc.contenu = contenu || "";
  } else if (type === "lien") {
    newDoc.url = url || "";
  } else if (req.file) {
    // Fichier uploadé (image, pdf, video)
    const fileExt = path.extname(req.file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${fileExt}`;
    const filePath = path.join(OUTILS_DOCS_PATH, uniqueName);
    fs.renameSync(req.file.path, filePath);

    newDoc.fichierPath = filePath;
    newDoc.fichierNom = req.file.originalname;
    newDoc.fichierTaille = req.file.size;
  }

  outil.documentation.push(newDoc);
  outil.updatedBy = req.user._id;
  await outil.save();

  res.status(201).json(outil.documentation[outil.documentation.length - 1]);
});

/**
 * @desc    Modifier un document de documentation
 * @route   PUT /api/outils/:id/documentation/:docId
 * @access  Private/Admin
 */
const updateDocumentation = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const doc = outil.documentation.id(req.params.docId);

  if (!doc) {
    res.status(404);
    throw new Error("Document non trouvé");
  }

  const { titre, contenu, url, ordre } = req.body;

  if (titre) doc.titre = titre;
  if (contenu !== undefined && doc.type === "texte") doc.contenu = contenu;
  if (url !== undefined && doc.type === "lien") doc.url = url;
  if (ordre !== undefined) doc.ordre = parseInt(ordre);

  // Gérer le nouveau fichier si uploadé
  if (req.file && ["image", "pdf", "video"].includes(doc.type)) {
    // Supprimer l'ancien fichier
    if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
      fs.unlinkSync(doc.fichierPath);
    }

    const fileExt = path.extname(req.file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${fileExt}`;
    const filePath = path.join(OUTILS_DOCS_PATH, uniqueName);
    fs.renameSync(req.file.path, filePath);

    doc.fichierPath = filePath;
    doc.fichierNom = req.file.originalname;
    doc.fichierTaille = req.file.size;
  }

  outil.updatedBy = req.user._id;
  await outil.save();

  res.json(doc);
});

/**
 * @desc    Supprimer un document de documentation
 * @route   DELETE /api/outils/:id/documentation/:docId
 * @access  Private/Admin
 */
const deleteDocumentation = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const doc = outil.documentation.id(req.params.docId);

  if (!doc) {
    res.status(404);
    throw new Error("Document non trouvé");
  }

  // Supprimer le fichier si existant
  if (doc.fichierPath && fs.existsSync(doc.fichierPath)) {
    fs.unlinkSync(doc.fichierPath);
  }

  outil.documentation.pull(req.params.docId);
  outil.updatedBy = req.user._id;
  await outil.save();

  res.json({ message: "Document supprimé" });
});

/**
 * @desc    Gérer les accès utilisateurs d'un outil
 * @route   PUT /api/outils/:id/acces
 * @access  Private/Admin
 */
const updateAccesOutil = asyncHandler(async (req, res) => {
  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const { utilisateursAutorises, entreprisesAutorisees, accesPublic } =
    req.body;

  if (utilisateursAutorises !== undefined) {
    outil.utilisateursAutorises = utilisateursAutorises;
  }

  if (entreprisesAutorisees !== undefined) {
    outil.entreprisesAutorisees = entreprisesAutorisees;
  }

  if (accesPublic !== undefined) {
    outil.accesPublic = accesPublic;
  }

  outil.updatedBy = req.user._id;
  await outil.save();

  const outilUpdated = await Outil.findById(outil._id)
    .populate("utilisateursAutorises", "nom prenom email")
    .populate("entreprisesAutorisees", "nomComplet trigramme");

  res.json(outilUpdated);
});

/**
 * @desc    Obtenir l'historique des téléchargements d'un outil
 * @route   GET /api/outils/:id/telechargements
 * @access  Private/Admin
 */
const getTelechargements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const outil = await Outil.findById(req.params.id);

  if (!outil) {
    res.status(404);
    throw new Error("Outil non trouvé");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const telechargements = await Telechargement.find({ outil: outil._id })
    .populate("user", "nom prenom email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Telechargement.countDocuments({ outil: outil._id });

  res.json({
    telechargements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Obtenir les statistiques globales des outils
 * @route   GET /api/outils/stats
 * @access  Private/Admin
 */
const getOutilsStats = asyncHandler(async (req, res) => {
  const totalOutils = await Outil.countDocuments();
  const outilsActifs = await Outil.countDocuments({ isActive: true });

  // Par catégorie
  const parCategorie = await Outil.aggregate([
    { $group: { _id: "$categorie", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Top téléchargements
  const topTelechargements = await Outil.find()
    .select("titre version nombreTelechargements categorie")
    .sort({ nombreTelechargements: -1 })
    .limit(10);

  // Téléchargements récents
  const telechargements7j = await Telechargement.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  const telechargements30j = await Telechargement.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  // Utilisateurs les plus actifs
  const topUtilisateurs = await Telechargement.aggregate([
    { $group: { _id: "$user", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        count: 1,
        "user.nom": 1,
        "user.prenom": 1,
        "user.email": 1,
      },
    },
  ]);

  res.json({
    totalOutils,
    outilsActifs,
    outilsInactifs: totalOutils - outilsActifs,
    parCategorie,
    topTelechargements,
    telechargements: {
      derniers7jours: telechargements7j,
      derniers30jours: telechargements30j,
    },
    topUtilisateurs,
  });
});

/**
 * @desc    Obtenir tous les utilisateurs (pour sélection dans le formulaire)
 * @route   GET /api/outils/users-list
 * @access  Private/Admin
 */
const getUsersForSelection = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select("_id nom prenom email role")
    .sort({ nom: 1, prenom: 1 });

  res.json(users);
});

export {
  // Routes utilisateurs
  getOutils,
  getOutilById,
  downloadOutil,
  getOutilImage,
  getDocumentation,
  getCategories,
  // Routes admin
  createOutil,
  updateOutil,
  deleteOutil,
  toggleOutilActive,
  addDocumentation,
  updateDocumentation,
  deleteDocumentation,
  updateAccesOutil,
  getTelechargements,
  getOutilsStats,
  getUsersForSelection,
};
