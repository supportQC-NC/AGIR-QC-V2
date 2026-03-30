import mongoose from "mongoose";

const fichierGenereSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  path: { type: String, required: true },
  taille: { type: Number, default: 0 },
  mimeType: { type: String, default: "application/octet-stream" },
  // "auto" = scanné du dossier de sortie, "manuel" = uploadé par admin
  source: { type: String, enum: ["auto", "manuel"], default: "auto" },
  dateAjout: { type: Date, default: Date.now },
});

const executionCronSchema = new mongoose.Schema(
  {
    tache: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TacheCron",
      required: true,
    },
    lancePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    declenchement: {
      type: String,
      enum: ["manuel", "planifie"],
      default: "manuel",
    },
    // Commande complète exécutée (avec les arguments sélectionnés)
    commandeExecutee: { type: String, required: true },
    // Liste des IDs d'arguments qui étaient activés pour cette exécution
    argumentsActives: [{ type: String }],
    statut: {
      type: String,
      enum: ["en_cours", "succes", "erreur", "timeout", "annule"],
      default: "en_cours",
    },
    codeSortie: { type: Number, default: null },
    sortieStandard: { type: String, default: "", maxlength: 50000 },
    sortieErreur: { type: String, default: "", maxlength: 50000 },
    erreurInterne: { type: String, default: "" },
    dateDebut: { type: Date, default: Date.now },
    dateFin: { type: Date, default: null },
    dureeMs: { type: Number, default: 0 },
    pid: { type: Number, default: null },
    ipAddress: { type: String, default: "" },
    fichiersGeneres: [fichierGenereSchema],
  },
  { timestamps: true },
);

executionCronSchema.index({ tache: 1, createdAt: -1 });
executionCronSchema.index({ statut: 1 });
executionCronSchema.index({ lancePar: 1, createdAt: -1 });

executionCronSchema.virtual("nombreFichiers").get(function () {
  return this.fichiersGeneres?.length || 0;
});

executionCronSchema.set("toJSON", { virtuals: true });
executionCronSchema.set("toObject", { virtuals: true });

const ExecutionCron = mongoose.model("ExecutionCron", executionCronSchema);

export default ExecutionCron;