// import mongoose from "mongoose";

// /**
//  * Sous-schéma pour un argument configurable d'une tâche cron.
//  * Chaque argument a un flag, une description, et peut être activé/désactivé
//  * au moment du lancement manuel.
//  */
// const argumentSchema = new mongoose.Schema({
//   // Le flag/argument réel passé au script (ex: "--full", "--compress", "-v")
//   valeur: {
//     type: String,
//     required: [true, "La valeur de l'argument est requise"],
//     trim: true,
//   },
//   // Nom court affiché dans l'UI (ex: "Mode complet", "Compression")
//   nom: {
//     type: String,
//     required: [true, "Le nom de l'argument est requis"],
//     trim: true,
//   },
//   // Description pour expliquer à l'utilisateur ce que fait cet argument
//   description: {
//     type: String,
//     default: "",
//     trim: true,
//   },
//   // Si true, cet argument est activé par défaut quand on lance manuellement
//   actifParDefaut: {
//     type: Boolean,
//     default: false,
//   },
//   // Ordre d'affichage
//   ordre: {
//     type: Number,
//     default: 0,
//   },
// });

// /**
//  * Schéma principal pour une tâche cron (script exécutable depuis le serveur).
//  * Seuls les admins peuvent créer, modifier, supprimer et lancer ces tâches.
//  */
// const tacheCronSchema = new mongoose.Schema(
//   {
//     titre: {
//       type: String,
//       required: [true, "Titre de la tâche requis"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: [true, "Description de la tâche requise"],
//       trim: true,
//     },
//     descriptionCourte: {
//       type: String,
//       default: "",
//       trim: true,
//       maxlength: [200, "Description courte max 200 caractères"],
//     },

//     // Image d'illustration
//     imagePath: { type: String, default: "" },
//     imageNom: { type: String, default: "" },

//     // Commande de base à exécuter (sans arguments)
//     commande: {
//       type: String,
//       required: [true, "Commande à exécuter requise"],
//       trim: true,
//     },

//     // Liste des arguments configurables
//     arguments: [argumentSchema],

//     // Répertoire de travail (cwd)
//     repertoireTravail: { type: String, default: "", trim: true },

//     // Variables d'environnement (CLE=valeur, une par ligne)
//     variablesEnvironnement: { type: String, default: "" },

//     // Timeout en secondes (0 = pas de timeout)
//     timeoutSecondes: {
//       type: Number,
//       default: 300,
//       min: [0, "Le timeout ne peut pas être négatif"],
//     },

//     // Dossier où le script écrit ses fichiers de sortie
//     dossierSortie: { type: String, default: "", trim: true },

//     // Planification cron
//     expressionCron: { type: String, default: "", trim: true },
//     frequenceDescription: { type: String, default: "", trim: true },

//     categorie: {
//       type: String,
//       enum: [
//         "sauvegarde",
//         "synchronisation",
//         "nettoyage",
//         "import_export",
//         "reporting",
//         "maintenance",
//         "monitoring",
//         "autre",
//       ],
//       default: "autre",
//     },

//     tags: [{ type: String, trim: true, lowercase: true }],

//     statut: {
//       type: String,
//       enum: ["inactive", "active", "en_cours", "erreur"],
//       default: "active",
//     },

//     derniereExecution: {
//       date: { type: Date, default: null },
//       statut: {
//         type: String,
//         enum: ["succes", "erreur", "timeout", "annule", null],
//         default: null,
//       },
//       dureeMs: { type: Number, default: 0 },
//     },

//     prochaineExecution: { type: Date, default: null },

//     nombreExecutions: { type: Number, default: 0 },
//     nombreSucces: { type: Number, default: 0 },
//     nombreErreurs: { type: Number, default: 0 },

//     isActive: { type: Boolean, default: true },

//     notes: { type: String, default: "" },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true },
// );

// tacheCronSchema.index({ titre: "text", description: "text", tags: "text" });
// tacheCronSchema.index({ categorie: 1, isActive: 1 });
// tacheCronSchema.index({ statut: 1 });

// tacheCronSchema.virtual("estEnCours").get(function () {
//   return this.statut === "en_cours";
// });

// tacheCronSchema.set("toJSON", { virtuals: true });
// tacheCronSchema.set("toObject", { virtuals: true });

// const TacheCron = mongoose.model("TacheCron", tacheCronSchema);

// export default TacheCron;

import mongoose from "mongoose";

/**
 * Sous-schéma pour un argument configurable d'une tâche cron.
 */
const argumentSchema = new mongoose.Schema({
  valeur: {
    type: String,
    required: [true, "La valeur de l'argument est requise"],
    trim: true,
  },
  nom: {
    type: String,
    required: [true, "Le nom de l'argument est requis"],
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  actifParDefaut: {
    type: Boolean,
    default: false,
  },
  ordre: {
    type: Number,
    default: 0,
  },
});

/**
 * Sous-schéma pour la documentation associée à une tâche cron.
 * Identique au documentationSchema des outils.
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
  contenu: {
    type: String,
    default: "",
  },
  fichierPath: {
    type: String,
    default: "",
  },
  fichierNom: {
    type: String,
    default: "",
  },
  fichierTaille: {
    type: Number,
    default: 0,
  },
  url: {
    type: String,
    default: "",
  },
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
 * Schéma principal pour une tâche cron (script exécutable depuis le serveur).
 */
const tacheCronSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Titre de la tâche requis"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description de la tâche requise"],
      trim: true,
    },
    descriptionCourte: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Description courte max 200 caractères"],
    },

    imagePath: { type: String, default: "" },
    imageNom: { type: String, default: "" },

    commande: {
      type: String,
      required: [true, "Commande à exécuter requise"],
      trim: true,
    },

    arguments: [argumentSchema],

    repertoireTravail: { type: String, default: "", trim: true },
    variablesEnvironnement: { type: String, default: "" },

    timeoutSecondes: {
      type: Number,
      default: 300,
      min: [0, "Le timeout ne peut pas être négatif"],
    },

    dossierSortie: { type: String, default: "", trim: true },

    expressionCron: { type: String, default: "", trim: true },
    frequenceDescription: { type: String, default: "", trim: true },

    categorie: {
      type: String,
      enum: [
        "sauvegarde",
        "synchronisation",
        "nettoyage",
        "import_export",
        "reporting",
        "maintenance",
        "monitoring",
        "autre",
      ],
      default: "autre",
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    statut: {
      type: String,
      enum: ["inactive", "active", "en_cours", "erreur"],
      default: "active",
    },

    derniereExecution: {
      date: { type: Date, default: null },
      statut: {
        type: String,
        enum: ["succes", "erreur", "timeout", "annule", null],
        default: null,
      },
      dureeMs: { type: Number, default: 0 },
    },

    prochaineExecution: { type: Date, default: null },

    nombreExecutions: { type: Number, default: 0 },
    nombreSucces: { type: Number, default: 0 },
    nombreErreurs: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    notes: { type: String, default: "" },

    // Documentation associée à la tâche cron
    documentation: [documentationSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

tacheCronSchema.index({ titre: "text", description: "text", tags: "text" });
tacheCronSchema.index({ categorie: 1, isActive: 1 });
tacheCronSchema.index({ statut: 1 });

tacheCronSchema.virtual("estEnCours").get(function () {
  return this.statut === "en_cours";
});

tacheCronSchema.virtual("nombreDocuments").get(function () {
  return this.documentation?.length || 0;
});

tacheCronSchema.set("toJSON", { virtuals: true });
tacheCronSchema.set("toObject", { virtuals: true });

const TacheCron = mongoose.model("TacheCron", tacheCronSchema);

export default TacheCron;