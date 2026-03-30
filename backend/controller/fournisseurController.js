import asyncHandler from "../middleware/asyncHandler.js";
import Fournisseur from "../models/FournisseurModel.js";

/**
 * @desc    Obtenir tous les fournisseurs d'une entreprise avec filtres et pagination
 * @route   GET /api/fournisseurs/:nomDossierDBF
 * @access  Private
 */
const getFournisseurs = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const startTime = Date.now();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = { entreprise: entreprise._id };

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { nom: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { observation: { $regex: search, $options: "i" } },
      { adresse1: { $regex: search, $options: "i" } },
    ];
    // Recherche par code fournisseur si c'est un nombre
    const num = parseInt(search);
    if (!isNaN(num)) {
      filter.$or.push({ codeFourn: num });
    }
  }

  if (req.query.local) {
    filter.local = req.query.local;
  }

  const [fournisseurs, totalRecords] = await Promise.all([
    Fournisseur.find(filter)
      .sort({ codeFourn: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Fournisseur.countDocuments(filter),
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
    _queryTime: `${queryTime}ms`,
    fournisseurs,
  });
});

/**
 * @desc    Obtenir un fournisseur par son code
 * @route   GET /api/fournisseurs/:nomDossierDBF/code/:codeFourn
 * @access  Private
 */
const getFournisseurByCode = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { codeFourn } = req.params;
  const startTime = Date.now();

  const fournisseur = await Fournisseur.findOne({
    entreprise: entreprise._id,
    codeFourn: parseInt(codeFourn),
  }).lean();

  if (!fournisseur) {
    res.status(404);
    throw new Error(`Fournisseur avec le code ${codeFourn} non trouvé`);
  }

  // Compter les articles liés à ce fournisseur
  const Article = (await import("../models/ArticleModel.js")).default;
  const nbArticles = await Article.countDocuments({
    entreprise: entreprise._id,
    codeFourn: parseInt(codeFourn),
  });

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    _queryTime: `${queryTime}ms`,
    fournisseur,
    nbArticles,
  });
});

/**
 * @desc    Obtenir un fournisseur par son ID MongoDB
 * @route   GET /api/fournisseurs/:nomDossierDBF/:id
 * @access  Private
 */
const getFournisseurById = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { id } = req.params;
  const startTime = Date.now();

  const fournisseur = await Fournisseur.findOne({
    _id: id,
    entreprise: entreprise._id,
  }).lean();

  if (!fournisseur) {
    res.status(404);
    throw new Error("Fournisseur non trouvé");
  }

  const Article = (await import("../models/ArticleModel.js")).default;
  const nbArticles = await Article.countDocuments({
    entreprise: entreprise._id,
    codeFourn: fournisseur.codeFourn,
  });

  const queryTime = Date.now() - startTime;

  res.json({
    entreprise: {
      _id: entreprise._id,
      nomDossierDBF: entreprise.nomDossierDBF,
      trigramme: entreprise.trigramme,
      nomComplet: entreprise.nomComplet,
    },
    _queryTime: `${queryTime}ms`,
    fournisseur,
    nbArticles,
  });
});

/**
 * @desc    Obtenir les articles d'un fournisseur
 * @route   GET /api/fournisseurs/:nomDossierDBF/code/:codeFourn/articles
 * @access  Private
 */
const getArticlesByFournisseur = asyncHandler(async (req, res) => {
  const entreprise = req.entreprise;
  const { codeFourn } = req.params;
  const startTime = Date.now();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const Article = (await import("../models/ArticleModel.js")).default;

  const filter = {
    entreprise: entreprise._id,
    codeFourn: parseInt(codeFourn),
  };

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { codeArticle: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
      { gencode: { $regex: search, $options: "i" } },
    ];
  }

  const [articles, totalRecords] = await Promise.all([
    Article.find(filter)
      .sort({ codeArticle: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
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
    _queryTime: `${queryTime}ms`,
    articles,
  });
});

/**
 * @desc    Recherche de fournisseurs
 * @route   GET /api/fournisseurs/:nomDossierDBF/search
 * @access  Private
 */
const searchFournisseurs = asyncHandler(async (req, res) => {
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
      { nom: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { observation: { $regex: q, $options: "i" } },
      { adresse1: { $regex: q, $options: "i" } },
    ],
  };

  const num = parseInt(q);
  if (!isNaN(num)) {
    filter.$or.push({ codeFourn: num });
  }

  const fournisseurs = await Fournisseur.find(filter)
    .sort({ codeFourn: 1 })
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
      totalFound: fournisseurs.length,
    },
    _queryTime: `${queryTime}ms`,
    fournisseurs,
  });
});

export {
  getFournisseurs,
  getFournisseurByCode,
  getFournisseurById,
  getArticlesByFournisseur,
  searchFournisseurs,
};