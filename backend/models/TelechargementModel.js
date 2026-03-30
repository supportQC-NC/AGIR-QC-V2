// backend/models/TelechargementModel.js
import mongoose from "mongoose";

/**
 * Schéma pour tracer les téléchargements d'outils
 * Utile pour les statistiques et l'audit
 */
const telechargementSchema = new mongoose.Schema(
  {
    outil: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outil",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Version téléchargée (snapshot au moment du téléchargement)
    versionTelechargee: {
      type: String,
      default: "",
    },
    // Nom du fichier téléchargé
    fichierNom: {
      type: String,
      default: "",
    },
    // Informations sur le client
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    // Statut du téléchargement
    status: {
      type: String,
      enum: ["initie", "complete", "echoue"],
      default: "initie",
    },
    // Message d'erreur si échec
    erreur: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche et statistiques
telechargementSchema.index({ outil: 1, createdAt: -1 });
telechargementSchema.index({ user: 1, createdAt: -1 });
telechargementSchema.index({ createdAt: -1 });

const Telechargement = mongoose.model("Telechargement", telechargementSchema);

export default Telechargement;
