// backend/controller/articleController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Article from "../models/ArticleModel.js";
import Entreprise from "../models/EntrepriseModel.js";

/**
 * @desc    Obtenir tous les articles d'une entreprise avec filtres et pagination
 * @route   GET /api/articles/:nomDossierDBF
 * @access  Private
 */
const getArticles = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const startTime = Date.now();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Construction du filtre
  const filter = { entreprise: entreprise._id };

  // Recherche textuelle
  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { codeArticle: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
      { designation2: { $regex: search, $options: "i" } },
      { gencode: { $regex: search, $options: "i" } },
      { reference: { $regex: search, $options: "i" } },
      { designationFournisseur: { $regex: search, $options: "i" } },
    ];
  }

  if (req.query.nart) {
    filter.codeArticle = { $regex: req.query.nart, $options: "i" };
  }

  if (req.query.groupe) {
    filter.groupe = req.query.groupe;
  }

  if (req.query.fourn) {
    filter.codeFourn = parseInt(req.query.fourn);
  }

  if (req.query.gisement) {
    const gis = req.query.gisement;
    filter.$or = [
      { gism1: { $regex: gis, $options: "i" } },
      { gism2: { $regex: gis, $options: "i" } },
      { gism3: { $regex: gis, $options: "i" } },
      { gism4: { $regex: gis, $options: "i" } },
      { gism5: { $regex: gis, $options: "i" } },
      { place: { $regex: gis, $options: "i" } },
    ];
  }

  // Filtres booléens
  if (req.query.enStock === "true") {
    filter.$expr = {
      $gt: [{ $add: ["$s1", "$s2", "$s3", "$s4", "$s5"] }, 0],
    };
  }

  if (req.query.hasGencod === "true") {
    filter.gencode = { $ne: "" };
  }

  if (req.query.hasPromo === "true") {
    filter.prixPromo = { $gt: 0 };
  }

  if (req.query.hasDeprec === "true") {
    filter.depreciation = { $gt: 0 };
  }

  if (req.query.isWeb === "true") {
    filter.web = { $in: ["O", "o", "1"] };
  }

  if (req.query.hasPhoto === "true") {
    filter.photo = { $in: ["F", "f", "O", "o", "1"] };
  }

  if (req.query.reapproMag === "true") {
    filter.stock = { $gt: 0 };
    filter.s1 = 0;
  }

  if (req.query.tgc) {
    filter.taxes = parseFloat(req.query.tgc);
  }

  // Filtre par statut
  if (req.query.statut) {
    switch (req.query.statut) {
      case "ACTIF":
        filter.depreciation = 0;
        break;
      case "DEPRECIE":
        filter.depreciation = { $gt: 0, $lt: 99 };
        break;
      case "ARRETE":
        filter.depreciation = 99;
        break;
    }
  }

  const [articles, totalRecords, counts] = await Promise.all([
    Article.find(filter)
      .populate("fournisseur", "nom codeFourn")
      .sort({ codeArticle: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
    // Compteurs par statut
    Promise.all([
      Article.countDocuments({ entreprise: entreprise._id }),
      Article.countDocuments({ entreprise: entreprise._id, depreciation: 0 }),
      Article.countDocuments({ entreprise: entreprise._id, depreciation: { $gt: 0, $lt: 99 } }),
      Article.countDocuments({ entreprise: entreprise._id, depreciation: 99 }),
    ]),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);
  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    counts: {
      total: counts[0],
      actifs: counts[1],
      deprecies: counts[2],
      arretes: counts[3],
    },
    _queryTime: `${queryTime}ms`,
    articles,
  });
});

/**
 * @desc    Obtenir un article par son code NART
 * @route   GET /api/articles/:nomDossierDBF/code/:nart
 * @access  Private
 */
const getArticleByNart = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { nart } = req.params;
  const startTime = Date.now();

  const article = await Article.findOne({
    entreprise: entreprise._id,
    codeArticle: nart.trim(),
  })
    .populate("fournisseur", "nom codeFourn telephone email")
    .lean();

  if (!article) {
    res.status(404);
    throw new Error(`Article avec le code ${nart} non trouvé`);
  }

  // Gestion des renvois via gencodeDouble
  let isRenvoi = false;
  let articleOriginal = null;
  let articleFinal = article;

  if (article.gencodeDouble && article.gencodeDouble.trim()) {
    const renvoi = await Article.findOne({
      entreprise: entreprise._id,
      codeArticle: article.gencodeDouble.trim(),
    })
      .populate("fournisseur", "nom codeFourn telephone email")
      .lean();

    if (renvoi) {
      isRenvoi = true;
      articleOriginal = {
        codeArticle: article.codeArticle,
        gencode: article.gencode,
        designation: article.designation,
      };
      articleFinal = renvoi;
    }
  }

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    _queryTime: `${queryTime}ms`,
    article: articleFinal,
    isRenvoi,
    articleOriginal,
  });
});

/**
 * @desc    Rechercher un article par code barre GENCOD
 * @route   GET /api/articles/:nomDossierDBF/gencod/:gencod
 * @access  Private
 */
const getArticleByGencod = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { gencod } = req.params;
  const startTime = Date.now();

  const article = await Article.findOne({
    entreprise: entreprise._id,
    gencode: gencod.trim(),
  })
    .populate("fournisseur", "nom codeFourn telephone email")
    .lean();

  if (!article) {
    res.status(404);
    throw new Error(`Article avec le code barre ${gencod} non trouvé`);
  }

  // Gestion renvois
  let isRenvoi = false;
  let articleOriginal = null;
  let articleFinal = article;

  if (article.gencodeDouble && article.gencodeDouble.trim()) {
    const renvoi = await Article.findOne({
      entreprise: entreprise._id,
      codeArticle: article.gencodeDouble.trim(),
    })
      .populate("fournisseur", "nom codeFourn telephone email")
      .lean();

    if (renvoi) {
      isRenvoi = true;
      articleOriginal = {
        codeArticle: article.codeArticle,
        gencode: article.gencode,
        designation: article.designation,
      };
      articleFinal = renvoi;
    }
  }

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    _queryTime: `${queryTime}ms`,
    article: articleFinal,
    isRenvoi,
    articleOriginal,
  });
});

/**
 * @desc    Recherche avancée d'articles
 * @route   GET /api/articles/:nomDossierDBF/search
 * @access  Private
 */
const searchArticles = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { q, limit = 50 } = req.query;
  const startTime = Date.now();

  if (!q) {
    res.status(400);
    throw new Error("Le paramètre de recherche 'q' est requis");
  }

  const filter = {
    entreprise: entreprise._id,
    $or: [
      { codeArticle: { $regex: q, $options: "i" } },
      { designation: { $regex: q, $options: "i" } },
      { designation2: { $regex: q, $options: "i" } },
      { gencode: { $regex: q, $options: "i" } },
      { reference: { $regex: q, $options: "i" } },
      { designationFournisseur: { $regex: q, $options: "i" } },
    ],
  };

  const articles = await Article.find(filter)
    .populate("fournisseur", "nom codeFourn")
    .sort({ codeArticle: 1 })
    .limit(parseInt(limit))
    .lean();

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    search: {
      query: q,
      totalFound: articles.length,
    },
    _queryTime: `${queryTime}ms`,
    articles,
  });
});

/**
 * @desc    Obtenir la liste des groupes/familles
 * @route   GET /api/articles/:nomDossierDBF/groupes
 * @access  Private
 */
const getGroupes = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const startTime = Date.now();

  const groupes = await Article.aggregate([
    { $match: { entreprise: entreprise._id } },
    { $group: { _id: "$groupe", count: { $sum: 1 } } },
    { $match: { _id: { $ne: "" } } },
    { $sort: { _id: 1 } },
    { $project: { code: "$_id", count: 1, _id: 0 } },
  ]);

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    totalGroupes: groupes.length,
    _queryTime: `${queryTime}ms`,
    groupes,
  });
});

/**
 * @desc    Obtenir les taux TGC distincts
 * @route   GET /api/articles/:nomDossierDBF/tgc-rates
 * @access  Private
 */
const getTgcRates = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const startTime = Date.now();

  const tgcRates = await Article.aggregate([
    { $match: { entreprise: entreprise._id } },
    { $group: { _id: "$taxes", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { taux: "$_id", count: 1, _id: 0 } },
  ]);

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    totalRates: tgcRates.length,
    _queryTime: `${queryTime}ms`,
    tgcRates,
  });
});

/**
 * @desc    Articles adjacents (prev/next) par code article
 * @route   GET /api/articles/:nomDossierDBF/adjacent/:nart
 * @access  Private
 */
const getAdjacentArticles = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { nart } = req.params;
  const startTime = Date.now();

  const normalizedNart = nart.trim();

  const [previous, next] = await Promise.all([
    Article.findOne({
      entreprise: entreprise._id,
      codeArticle: { $lt: normalizedNart },
    })
      .sort({ codeArticle: -1 })
      .select("codeArticle designation gencode")
      .lean(),
    Article.findOne({
      entreprise: entreprise._id,
      codeArticle: { $gt: normalizedNart },
    })
      .sort({ codeArticle: 1 })
      .select("codeArticle designation gencode")
      .lean(),
  ]);

  const queryTime = Date.now() - startTime;

  res.json({
    current: normalizedNart,
    previous: previous || null,
    next: next || null,
    _queryTime: `${queryTime}ms`,
  });
});

export {
  getArticles,
  getArticleByNart,
  getArticleByGencod,
  searchArticles,
  getGroupes,
  getTgcRates,
  getAdjacentArticles,
};