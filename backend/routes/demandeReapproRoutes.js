// backend/routes/demandeReapproRoutes.js
import express from "express";
import {
  createDemandeReappro, getDemandesReappro, getDemandeById, searchArticlesForDemande,
  prendreEnCharge, scanLigneDemande, relacherDemande, traiterLigne,
  countPending, countCompletedUnread, markAsRead, annulerDemande, deleteDemande,
} from "../controller/demandeReapproController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createDemandeReappro);
router.get("/", protect, getDemandesReappro);
router.get("/count-pending", protect, countPending);
router.get("/count-completed", protect, admin, countCompletedUnread);
router.get("/search-articles/:entrepriseId", protect, admin, searchArticlesForDemande);
router.get("/:id", protect, getDemandeById);
router.put("/:id/prendre-en-charge", protect, prendreEnCharge);
router.put("/:id/relacher", protect, relacherDemande);
router.put("/:id/lignes/:ligneId/scan", protect, scanLigneDemande);
router.put("/:id/lignes/:ligneId/traiter", protect, traiterLigne);
router.put("/:id/mark-read", protect, admin, markAsRead);
router.put("/:id/annuler", protect, admin, annulerDemande);
router.delete("/:id", protect, admin, deleteDemande);

export default router;