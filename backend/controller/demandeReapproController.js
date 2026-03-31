// backend/controllers/demandeReapproController.js
import asyncHandler from "../middleware/asyncHandler.js";
import DemandeReappro from "../models/DemandeReapproModel.js";
import Reappro from "../models/ReaproModel.js";
import Entreprise from "../models/EntrepriseModel.js";
import articleCacheService from "../services/articleService.js";

const createDemandeReappro = asyncHandler(async (req, res) => {
  const { entrepriseId, lignes, priorite, noteAdmin, source, fournisseurCode, fournisseurNom } = req.body;
  const entreprise = await Entreprise.findById(entrepriseId);
  if (!entreprise) { res.status(404); throw new Error("Entreprise non trouvée"); }
  if (!lignes || lignes.length === 0) { res.status(400); throw new Error("Au moins un article est requis"); }

  const demande = await DemandeReappro.create({
    entreprise: entrepriseId, nomDossierDBF: entreprise.nomDossierDBF,
    creePar: req.user._id, source: source || "manuel",
    fournisseurCode: fournisseurCode || "", fournisseurNom: fournisseurNom || "",
    priorite: priorite || "normal", noteAdmin: noteAdmin || "",
    lignes: lignes.map((l) => ({
      nart: l.nart, gencod: l.gencod || "", designation: l.designation || "",
      fourn: l.fourn || "", quantiteDemandee: parseInt(l.quantiteDemandee) || 1,
      stocksSnapshot: l.stocksSnapshot || {},
    })),
  });
  demande.calculerTotaux();
  await demande.save();
  const populated = await DemandeReappro.findById(demande._id)
    .populate("entreprise", "nomDossierDBF trigramme nomComplet")
    .populate("creePar", "nom prenom email");
  res.status(201).json(populated);
});

const getDemandesReappro = asyncHandler(async (req, res) => {
  const { entrepriseId, status, priorite, page = 1, limit = 20 } = req.query;
  const query = {};
  if (entrepriseId) query.entreprise = entrepriseId;
  if (status) query.status = status;
  if (priorite) query.priorite = priorite;
  const totalRecords = await DemandeReappro.countDocuments(query);
  const demandes = await DemandeReappro.find(query)
    .populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots")
    .populate("creePar", "nom prenom email")
    .populate("assigneA", "nom prenom email")
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
  const prioriteOrder = { critique: 0, urgent: 1, normal: 2 };
  demandes.sort((a, b) => (prioriteOrder[a.priorite] ?? 2) - (prioriteOrder[b.priorite] ?? 2) || b.createdAt - a.createdAt);
  res.json({ pagination: { page: parseInt(page), totalRecords }, demandes });
});

const getDemandeById = asyncHandler(async (req, res) => {
  const demande = await DemandeReappro.findById(req.params.id)
    .populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots")
    .populate("creePar", "nom prenom email")
    .populate("assigneA", "nom prenom email");
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  res.json(demande);
});

const searchArticlesForDemande = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ articles: [] });
  const entreprise = await Entreprise.findById(req.params.entrepriseId);
  if (!entreprise) { res.status(404); throw new Error("Entreprise non trouvée"); }
  const cache = await articleCacheService.getArticles(entreprise);
  const query = q.trim().toUpperCase();
  const results = [];
  for (const record of cache.records) {
    if (results.length >= 20) break;
    const nart = (record.NART || "").trim().toUpperCase();
    const gencod = (record.GENCOD || "").trim().toUpperCase();
    const design = (record.DESIGN || "").trim().toUpperCase();
    if (nart.includes(query) || gencod.includes(query) || design.includes(query)) {
      results.push({
        NART: (record.NART || "").trim(), GENCOD: (record.GENCOD || "").trim(),
        DESIGN: (record.DESIGN || "").trim(), FOURN: record.FOURN ? String(record.FOURN).trim() : "",
        S1: parseFloat(record.S1) || 0, S2: parseFloat(record.S2) || 0,
        S3: parseFloat(record.S3) || 0, S4: parseFloat(record.S4) || 0,
        S5: parseFloat(record.S5) || 0, PVTE: parseFloat(record.PVTE) || 0,
        stockTotal: (parseFloat(record.S1)||0)+(parseFloat(record.S2)||0)+(parseFloat(record.S3)||0)+(parseFloat(record.S4)||0)+(parseFloat(record.S5)||0),
      });
    }
  }
  res.json({ articles: results });
});

const prendreEnCharge = asyncHandler(async (req, res) => {
  const demande = await DemandeReappro.findById(req.params.id).populate("entreprise");
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  if (demande.status !== "en_attente") { res.status(400); throw new Error("Demande déjà prise en charge"); }
  let reappro = await Reappro.findOne({ entreprise: demande.entreprise._id, user: req.user._id, status: "en_cours" });
  if (!reappro) {
    reappro = await Reappro.create({ entreprise: demande.entreprise._id, nomDossierDBF: demande.nomDossierDBF, user: req.user._id, lignes: [] });
    articleCacheService.preload(demande.entreprise).catch(() => {});
  }
  demande.status = "en_cours"; demande.assigneA = req.user._id;
  demande.priseEnChargeAt = new Date(); demande.reapproId = reappro._id;
  await demande.save();
  const populated = await DemandeReappro.findById(demande._id)
    .populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots")
    .populate("creePar", "nom prenom email").populate("assigneA", "nom prenom email");
  res.json({ message: "Demande prise en charge", demande: populated, reapproId: reappro._id });
});

const scanLigneDemande = asyncHandler(async (req, res) => {
  const { code, quantiteTraitee } = req.body;
  const demande = await DemandeReappro.findById(req.params.id).populate("entreprise");
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  if (demande.status !== "en_cours") { res.status(400); throw new Error("Demande pas en cours"); }
  const ligne = demande.lignes.id(req.params.ligneId);
  if (!ligne) { res.status(404); throw new Error("Ligne non trouvée"); }
  if (ligne.status !== "en_attente") { res.status(400); throw new Error("Ligne déjà traitée"); }
  const codeScan = (code || "").trim().toUpperCase();
  const ligneNart = (ligne.nart || "").trim().toUpperCase();
  const ligneGencod = (ligne.gencod || "").trim().toUpperCase();
  let match = codeScan === ligneNart || codeScan === ligneGencod;
  if (!match) {
    const articleScanne = await articleCacheService.findByCode(demande.entreprise, codeScan);
    if (articleScanne) {
      const sNart = (articleScanne.NART || "").trim().toUpperCase();
      const sGencod = (articleScanne.GENCOD || "").trim().toUpperCase();
      if (sNart === ligneNart || sGencod === ligneGencod) match = true;
      if (!match && articleScanne.GENDOUBL && articleScanne.GENDOUBL.trim().toUpperCase() === ligneNart) match = true;
    }
  }
  if (!match) { res.status(400); throw new Error(`Code "${code}" ne correspond pas à ${ligne.nart} (${ligne.designation})`); }
  const qte = parseInt(quantiteTraitee) || ligne.quantiteDemandee;
  const reappro = await Reappro.findById(demande.reapproId);
  if (!reappro) { res.status(400); throw new Error("Réappro introuvable"); }
  const existante = reappro.lignes.find((l) => l.nart === ligne.nart || (ligne.gencod && l.gencod === ligne.gencod));
  if (existante) { existante.quantite += qte; existante.scannedAt = new Date(); }
  else {
    reappro.lignes.push({ nart: ligne.nart, gencod: ligne.gencod || "", designation: ligne.designation || "", refer: "", quantite: qte, stocksSnapshot: ligne.stocksSnapshot || { S1:0,S2:0,S3:0,S4:0,S5:0 }, isUnknown: false, isRenvoi: false });
  }
  reappro.calculerTotaux(); await reappro.save();
  ligne.status = "traite"; ligne.quantiteTraitee = qte; ligne.traiteePar = req.user._id; ligne.traiteeAt = new Date();
  demande.calculerTotaux(); demande.verifierCompletion(); await demande.save();
  const populated = await DemandeReappro.findById(demande._id)
    .populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots")
    .populate("creePar", "nom prenom email").populate("assigneA", "nom prenom email");
  res.json({ demande: populated, ligneScanResult: { nart: ligne.nart, quantiteTraitee: qte, designation: ligne.designation }, reappro: { _id: reappro._id, totalArticles: reappro.totalArticles, totalQuantite: reappro.totalQuantite }, isComplete: populated.status === "termine" });
});

const relacherDemande = asyncHandler(async (req, res) => {
  const demande = await DemandeReappro.findById(req.params.id);
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  if (demande.status !== "en_cours" && demande.status !== "termine") { res.status(400); throw new Error("Impossible de relâcher"); }
  if (demande.assigneA && demande.assigneA.toString() !== req.user._id.toString() && req.user.role !== "admin") { res.status(403); throw new Error("Non autorisé"); }
  demande.status = "en_attente"; demande.assigneA = null; demande.priseEnChargeAt = null; demande.termineAt = null; demande.reapproId = null;
  for (const l of demande.lignes) { l.status = "en_attente"; l.quantiteTraitee = 0; l.traiteePar = null; l.traiteeAt = null; l.noteAgent = ""; }
  demande.calculerTotaux(); await demande.save();
  const populated = await DemandeReappro.findById(demande._id).populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots").populate("creePar", "nom prenom email");
  res.json({ message: "Demande relâchée", demande: populated });
});

const traiterLigne = asyncHandler(async (req, res) => {
  const { quantiteTraitee, noteAgent, action } = req.body;
  const demande = await DemandeReappro.findById(req.params.id);
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  const ligne = demande.lignes.id(req.params.ligneId);
  if (!ligne) { res.status(404); throw new Error("Ligne non trouvée"); }
  if (action === "ignore") { ligne.status = "ignore"; ligne.noteAgent = noteAgent || "Ignoré"; }
  else { ligne.status = "traite"; ligne.quantiteTraitee = parseInt(quantiteTraitee) || ligne.quantiteDemandee; }
  ligne.traiteePar = req.user._id; ligne.traiteeAt = new Date();
  demande.calculerTotaux(); demande.verifierCompletion(); await demande.save();
  const populated = await DemandeReappro.findById(demande._id).populate("entreprise", "nomDossierDBF trigramme nomComplet mappingEntrepots").populate("creePar", "nom prenom email").populate("assigneA", "nom prenom email");
  res.json(populated);
});

const countPending = asyncHandler(async (req, res) => {
  const { entrepriseId } = req.query;
  const query = { status: { $in: ["en_attente", "en_cours"] } };
  if (entrepriseId) query.entreprise = entrepriseId;
  const count = await DemandeReappro.countDocuments(query);
  const critique = await DemandeReappro.countDocuments({ ...query, priorite: "critique" });
  const urgent = await DemandeReappro.countDocuments({ ...query, priorite: "urgent" });
  res.json({ count, critique, urgent });
});

const countCompletedUnread = asyncHandler(async (req, res) => {
  const { entrepriseId } = req.query;
  const query = { status: "termine", notifLueParAdmin: false, creePar: req.user._id };
  if (entrepriseId) query.entreprise = entrepriseId;
  res.json({ count: await DemandeReappro.countDocuments(query) });
});

const markAsRead = asyncHandler(async (req, res) => {
  const d = await DemandeReappro.findById(req.params.id);
  if (!d) { res.status(404); throw new Error("Non trouvée"); }
  d.notifLueParAdmin = true; await d.save();
  res.json({ message: "Lu" });
});

const annulerDemande = asyncHandler(async (req, res) => {
  const d = await DemandeReappro.findById(req.params.id);
  if (!d) { res.status(404); throw new Error("Non trouvée"); }
  d.status = "annule"; await d.save();
  res.json({ message: "Annulée", demande: d });
});

/**
 * @desc    Supprimer définitivement une demande — ADMIN UNIQUEMENT
 * @route   DELETE /api/demandes-reappro/:id
 * @access  Private/Admin
 */
const deleteDemande = asyncHandler(async (req, res) => {
  const demande = await DemandeReappro.findById(req.params.id);
  if (!demande) { res.status(404); throw new Error("Demande non trouvée"); }
  await DemandeReappro.deleteOne({ _id: demande._id });
  res.json({ message: "Demande supprimée définitivement" });
});

export {
  createDemandeReappro, getDemandesReappro, getDemandeById, searchArticlesForDemande,
  prendreEnCharge, scanLigneDemande, relacherDemande, traiterLigne,
  countPending, countCompletedUnread, markAsRead, annulerDemande, deleteDemande,
};