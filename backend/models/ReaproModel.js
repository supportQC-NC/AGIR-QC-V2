// backend/models/ReaproModel.js
import mongoose from "mongoose";

const ligneReapproSchema = new mongoose.Schema({
  nart: {
    type: String,
    required: true,
  },
  gencod: {
    type: String,
    default: "",
  },
  designation: {
    type: String,
    default: "",
  },
  refer: {
    type: String,
    default: "",
  },
  quantite: {
    type: Number,
    required: true,
    min: 1,
  },
  // Stocks au moment du scan (pour historique)
  stocksSnapshot: {
    S1: { type: Number, default: 0 },
    S2: { type: Number, default: 0 },
    S3: { type: Number, default: 0 },
    S4: { type: Number, default: 0 },
    S5: { type: Number, default: 0 },
  },
  isUnknown: {
    type: Boolean,
    default: false,
  },
  isRenvoi: {
    type: Boolean,
    default: false,
  },
  articleOriginal: {
    nart: { type: String, default: "" },
    gencod: { type: String, default: "" },
    designation: { type: String, default: "" },
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
});

const reapproSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      default: "",
    },
    titre: {
      type: String,
      default: "",
    },
    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
    },
    nomDossierDBF: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["en_cours", "partage", "termine", "exporte"],
      default: "en_cours",
    },
    // Qui a partagé ce réappro (quand status = "partage")
    partageePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lignes: [ligneReapproSchema],
    totalArticles: {
      type: Number,
      default: 0,
    },
    totalQuantite: {
      type: Number,
      default: 0,
    },
    fichierExport: {
      type: String,
      default: "",
    },
    cheminExport: {
      type: String,
      default: "",
    },
    modeExport: {
      type: String,
      enum: ["serveur", "telechargement", ""],
      default: "",
    },
    exportedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche rapide
reapproSchema.index({ entreprise: 1, user: 1, status: 1 });
reapproSchema.index({ entreprise: 1, status: 1 });
reapproSchema.index({ nomDossierDBF: 1 });

// Méthode pour calculer les totaux
reapproSchema.methods.calculerTotaux = function () {
  this.totalArticles = this.lignes.length;
  this.totalQuantite = this.lignes.reduce((sum, l) => sum + l.quantite, 0);
};

const Reappro = mongoose.model("Reappro", reapproSchema);

export default Reappro;