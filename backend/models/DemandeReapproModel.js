// backend/models/DemandeReapproModel.js
import mongoose from "mongoose";

const ligneDemandeSchema = new mongoose.Schema({
  nart: { type: String, required: true },
  gencod: { type: String, default: "" },
  designation: { type: String, default: "" },
  fourn: { type: String, default: "" },
  // Quantité demandée par l'admin
  quantiteDemandee: { type: Number, required: true, min: 1 },
  // Quantité réellement traitée par l'agent (rempli à l'exécution)
  quantiteTraitee: { type: Number, default: 0 },
  // Stocks au moment de la demande (snapshot pour historique)
  stocksSnapshot: {
    S1: { type: Number, default: 0 },
    S2: { type: Number, default: 0 },
    S3: { type: Number, default: 0 },
    S4: { type: Number, default: 0 },
    S5: { type: Number, default: 0 },
  },
  // Statut de la ligne
  status: {
    type: String,
    enum: ["en_attente", "traite", "ignore"],
    default: "en_attente",
  },
  // L'agent qui a traité cette ligne
  traiteePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  traiteeAt: { type: Date, default: null },
  // Note de l'agent (optionnel, ex: "article introuvable en rayon")
  noteAgent: { type: String, default: "" },
});

const demandeReapproSchema = new mongoose.Schema(
  {
    // Référence unique lisible (ex: DR-2026-00042)
    reference: { type: String, unique: true },

    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
    },
    nomDossierDBF: { type: String, required: true },

    // Admin qui crée la demande
    creePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Contexte de création
    source: {
      type: String,
      enum: ["fournisseur", "article", "manuel"],
      default: "manuel",
    },
    // Si créé depuis un fournisseur, stocker le code
    fournisseurCode: { type: String, default: "" },
    fournisseurNom: { type: String, default: "" },

    // Priorité
    priorite: {
      type: String,
      enum: ["normal", "urgent", "critique"],
      default: "normal",
    },

    // Note/commentaire de l'admin
    noteAdmin: { type: String, default: "" },

    // Statut global
    status: {
      type: String,
      enum: ["en_attente", "en_cours", "termine", "annule"],
      default: "en_attente",
    },

    // Agent qui prend en charge la demande
    assigneA: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    priseEnChargeAt: { type: Date, default: null },

    // Quand terminé
    termineAt: { type: Date, default: null },

    // Lignes d'articles à réapprovisionner
    lignes: [ligneDemandeSchema],

    // Totaux calculés
    totalArticles: { type: Number, default: 0 },
    totalQuantiteDemandee: { type: Number, default: 0 },
    totalQuantiteTraitee: { type: Number, default: 0 },

    // Lien vers le réappro créé par l'agent (optionnel)
    reapproId: { type: mongoose.Schema.Types.ObjectId, ref: "Reappro", default: null },

    // Notifications lues par l'admin
    notifLueParAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index pour recherches rapides
demandeReapproSchema.index({ entreprise: 1, status: 1 });
demandeReapproSchema.index({ assigneA: 1, status: 1 });
demandeReapproSchema.index({ creePar: 1, status: 1 });
demandeReapproSchema.index({ priorite: 1, status: 1 });

// Génération de la référence avant sauvegarde
demandeReapproSchema.pre("save", async function (next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });
    this.reference = `DR-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Méthode pour recalculer les totaux
demandeReapproSchema.methods.calculerTotaux = function () {
  this.totalArticles = this.lignes.length;
  this.totalQuantiteDemandee = this.lignes.reduce((s, l) => s + l.quantiteDemandee, 0);
  this.totalQuantiteTraitee = this.lignes.reduce((s, l) => s + l.quantiteTraitee, 0);
};

// Méthode pour vérifier si toutes les lignes sont traitées
demandeReapproSchema.methods.verifierCompletion = function () {
  const toutTraite = this.lignes.every((l) => l.status === "traite" || l.status === "ignore");
  if (toutTraite && this.status === "en_cours") {
    this.status = "termine";
    this.termineAt = new Date();
  }
};

const DemandeReappro = mongoose.model("DemandeReappro", demandeReapproSchema);

export default DemandeReappro;