// backend/models/OutilModel.js
import mongoose from "mongoose";

/**
 * Schéma pour les documents/pièces jointes d'un outil
 * Peut être du texte, une image, un PDF, etc.
 */
const documentationSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, "Titre du document requis"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["texte", "image", "pdf", "video", "lien"],
    required: true,
  },
  // Contenu texte (pour type "texte")
  contenu: {
    type: String,
    default: "",
  },
  // Chemin du fichier (pour type "image", "pdf", "video")
  fichierPath: {
    type: String,
    default: "",
  },
  // Nom original du fichier
  fichierNom: {
    type: String,
    default: "",
  },
  // Taille du fichier en octets
  fichierTaille: {
    type: Number,
    default: 0,
  },
  // URL externe (pour type "lien")
  url: {
    type: String,
    default: "",
  },
  // Ordre d'affichage
  ordre: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Schéma principal pour un outil/application
 */
const outilSchema = new mongoose.Schema(
  {
    // Informations de base
    titre: {
      type: String,
      required: [true, "Titre de l'outil requis"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description de l'outil requise"],
      trim: true,
    },
    descriptionCourte: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Description courte max 200 caractères"],
    },
    // Version de l'outil
    version: {
      type: String,
      default: "1.0.0",
      trim: true,
    },
    // Catégorie de l'outil
    categorie: {
      type: String,
      enum: [
        "gestion_stock",
        "comptabilite",
        "caisse",
        "utilitaire",
        "reporting",
        "import_export",
        "maintenance",
        "autre",
      ],
      default: "autre",
    },
    // Image/icône de l'outil
    imagePath: {
      type: String,
      default: "",
    },
    imageNom: {
      type: String,
      default: "",
    },
    // Fichier exécutable (.exe)
    executablePath: {
      type: String,
      required: [true, "Fichier exécutable requis"],
    },
    executableNom: {
      type: String,
      required: [true, "Nom du fichier exécutable requis"],
    },
    executableTaille: {
      type: Number,
      default: 0,
    },
    // Checksum MD5 pour vérifier l'intégrité
    executableChecksum: {
      type: String,
      default: "",
    },
    // Documentation associée
    documentation: [documentationSchema],
    // Contrôle d'accès
    // Si vide, seuls les admins peuvent télécharger
    // Sinon, liste des utilisateurs autorisés
    utilisateursAutorises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Accès par entreprise (optionnel)
    entreprisesAutorisees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entreprise",
      },
    ],
    // Si true, tous les utilisateurs actifs peuvent télécharger
    accesPublic: {
      type: Boolean,
      default: false,
    },
    // Statut de l'outil
    isActive: {
      type: Boolean,
      default: true,
    },
    // Tags pour la recherche
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Statistiques
    nombreTelechargements: {
      type: Number,
      default: 0,
    },
    // Configuration requise / notes techniques
    configurationRequise: {
      type: String,
      default: "",
    },
    // Changelog / notes de version
    changelog: {
      type: String,
      default: "",
    },
    // Créateur
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Dernier modificateur
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche rapide
outilSchema.index({ titre: "text", description: "text", tags: "text" });
outilSchema.index({ categorie: 1, isActive: 1 });
outilSchema.index({ utilisateursAutorises: 1 });
outilSchema.index({ entreprisesAutorisees: 1 });

// Virtuel: Nombre de documents
outilSchema.virtual("nombreDocuments").get(function () {
  return this.documentation?.length || 0;
});

// Méthode pour vérifier si un utilisateur a accès
outilSchema.methods.utilisateurPeutTelecharger = function (
  user,
  userEntreprises = [],
) {
  // Admin a toujours accès
  if (user.role === "admin") {
    return true;
  }

  // Outil inactif = pas d'accès (sauf admin)
  if (!this.isActive) {
    return false;
  }

  // Accès public = tous les utilisateurs actifs
  if (this.accesPublic) {
    return true;
  }

  // Vérifier si l'utilisateur est dans la liste des autorisés
  const isUserAuthorized = this.utilisateursAutorises.some(
    (u) => u.toString() === user._id.toString(),
  );

  if (isUserAuthorized) {
    return true;
  }

  // Vérifier si une des entreprises de l'utilisateur est autorisée
  if (this.entreprisesAutorisees.length > 0 && userEntreprises.length > 0) {
    const hasEntrepriseAccess = this.entreprisesAutorisees.some((e) =>
      userEntreprises.some((ue) => ue.toString() === e.toString()),
    );
    if (hasEntrepriseAccess) {
      return true;
    }
  }

  return false;
};

// Inclure les virtuels dans JSON
outilSchema.set("toJSON", { virtuals: true });
outilSchema.set("toObject", { virtuals: true });

const Outil = mongoose.model("Outil", outilSchema);

export default Outil;
