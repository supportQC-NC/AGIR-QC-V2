// backend/models/EntrepriseModel.js
import mongoose from "mongoose";

const entrepriseSchema = new mongoose.Schema(
  {
    nomDossierDBF: {
      type: String,
      required: [true, "Nom du dossier DBF requis"],
      unique: true,
      trim: true,
    },
    trigramme: {
      type: String,
      required: [true, "Trigramme requis"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Trigramme minimum 2 caractères"],
      maxlength: [5, "Trigramme maximum 5 caractères"],
    },
    nomComplet: {
      type: String,
      required: [true, "Nom complet requis"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Chemin vers le dossier DBF
    cheminBase: {
      type: String,
      default: "\\\\serveur\\Bases",
    },
    // Chemin vers le dossier des photos articles
    cheminPhotos: {
      type: String,
      default: "",
    },
    // Chemin d'export des fichiers inventaire (.dat)
    cheminExportInventaire: {
      type: String,
      default: "\\\\192.168.0.250\\Rcommun\\STOCK\\collect_sec",
    },
    // Mapping des noms d'entrepôts (S1, S2, S3, S4, S5)
    mappingEntrepots: {
      S1: {
        type: String,
        default: "Magasin",
      },
      S2: {
        type: String,
        default: "S2",
      },
      S3: {
        type: String,
        default: "S3",
      },
      S4: {
        type: String,
        default: "S4",
      },
      S5: {
        type: String,
        default: "S5",
      },
    },
    // Mapping des états de commande (personnalisable par entreprise)
    mappingEtatsCommande: {
      type: Map,
      of: String,
      default: () =>
        new Map([
          ["0", "Brouillon"],
          ["1", "A Préparer"],
          ["2", "Proforma"],
          ["3", "Reliquat"],
          ["4", "Envoyée"],
          ["5", "Confirmée"],
          ["6", "Transit"],
          ["7", "Bateau"],
          ["8", "Avion"],
          ["9", "Commande locale"],
        ]),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Virtuel: chemin complet vers le dossier DBF
entrepriseSchema.virtual("cheminComplet").get(function () {
  return `${this.cheminBase}\\${this.nomDossierDBF}`;
});

// Inclure les virtuels dans JSON
entrepriseSchema.set("toJSON", { virtuals: true });
entrepriseSchema.set("toObject", { virtuals: true });

const Entreprise = mongoose.model("Entreprise", entrepriseSchema);

export default Entreprise;