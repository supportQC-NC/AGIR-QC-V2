import mongoose from "mongoose";

const fournisseurSchema = new mongoose.Schema(
  {
    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
    },
    codeFourn: {
      type: Number,
      required: true,
    },
    nom: { type: String, default: "" },
    adresse1: { type: String, default: "" },
    adresse2: { type: String, default: "" },
    adresse3: { type: String, default: "" },
    adresse4: { type: String, default: "" },
    adresse5: { type: String, default: "" },
    telephone: { type: String, default: "" },
    email: { type: String, default: "" },
    fax: { type: String, default: "" },
    observation: { type: String, default: "" },
    delaiAppro: { type: Number, default: 0 },
    coefMini: { type: Number, default: 0 },
    texte: { type: String, default: "" },
    notes: [{ type: String }],
    franco: { type: Number, default: 0 },
    local: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

fournisseurSchema.index({ entreprise: 1, codeFourn: 1 }, { unique: true });

const Fournisseur = mongoose.model("Fournisseur", fournisseurSchema);

export default Fournisseur;