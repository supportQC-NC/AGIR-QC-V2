import express from "express";
import {
  getFournisseurs,
  getFournisseurByCode,
  getFournisseurById,
  getArticlesByFournisseur,
  searchFournisseurs,
} from "../controller/fournisseurController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  checkEntrepriseAccess,
  checkModuleAccess,
} from "../middleware/checkEntrepriseAccess.js";

const router = express.Router();

router.get(
  "/:nomDossierDBF",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getFournisseurs
);

router.get(
  "/:nomDossierDBF/search",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  searchFournisseurs
);

router.get(
  "/:nomDossierDBF/code/:codeFourn/articles",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getArticlesByFournisseur
);

router.get(
  "/:nomDossierDBF/code/:codeFourn",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getFournisseurByCode
);

router.get(
  "/:nomDossierDBF/:id",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getFournisseurById
);

export default router;