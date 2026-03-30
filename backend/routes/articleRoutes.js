import express from "express";
import {
  getArticles,
  getArticleByNart,
  getArticleByGencod,
  searchArticles,
  getGroupes,
  getTgcRates,
  getAdjacentArticles,
} from "../controller/articleController.js";
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
  getArticles
);

router.get(
  "/:nomDossierDBF/search",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  searchArticles
);

router.get(
  "/:nomDossierDBF/groupes",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getGroupes
);

router.get(
  "/:nomDossierDBF/tgc-rates",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getTgcRates
);

router.get(
  "/:nomDossierDBF/adjacent/:nart",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getAdjacentArticles
);

router.get(
  "/:nomDossierDBF/code/:nart",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getArticleByNart
);

router.get(
  "/:nomDossierDBF/gencod/:gencod",
  protect,
  checkEntrepriseAccess,
  checkModuleAccess("stock", "read"),
  getArticleByGencod
);

export default router;