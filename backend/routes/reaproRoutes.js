// backend/routes/reapproRoutes.js
import express from "express";
import {
  createReappro,
  getReapproEnCours,
  scanArticleReappro,
  addLigneReappro,
  updateLigneReappro,
  deleteLigneReappro,
  exportReappro,
  downloadReappro,
  deleteReappro,
  getHistoriqueReappro,
  getReapproById,
  updateTitreReappro, partagerReappro, getReapproPartages, reprendreReappro
} from "../controller/reaproController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkModuleAccess } from "../middleware/checkEntrepriseAccess.js";

const router = express.Router();

// Créer un nouveau réappro
router
  .route("/")
  .post(protect, checkModuleAccess("reapro", "write"), createReappro);

// Historique des réappros
router
  .route("/historique")
  .get(protect, checkModuleAccess("reapro", "read"), getHistoriqueReappro);

  // Réappros partagés pour une entreprise
router.route("/partages/:entrepriseId").get(protect, checkModuleAccess("reapro", "read"), getReapproPartages);
 
// Après les routes existantes avec /:id :
 
// Mettre à jour le titre
router.route("/:id/titre").put(protect, checkModuleAccess("reapro", "write"), updateTitreReappro);
 
// Partager un réappro
 router.route("/:id/partager").put(protect, checkModuleAccess("reapro", "write"), partagerReappro);
 
// Reprendre un réappro partagé
 router.route("/:id/reprendre").put(protect, checkModuleAccess("reapro", "write"), reprendreReappro);
 

// Obtenir le réappro en cours pour une entreprise
router
  .route("/en-cours/:entrepriseId")
  .get(protect, checkModuleAccess("reapro", "read"), getReapproEnCours);

// Obtenir un réappro par ID
router
  .route("/:id")
  .get(protect, checkModuleAccess("reapro", "read"), getReapproById);

// Supprimer un réappro
router
  .route("/:id")
  .delete(protect, checkModuleAccess("reapro", "delete"), deleteReappro);

// Scanner un article (affiche les infos et stocks)
router
  .route("/:id/scan")
  .post(protect, checkModuleAccess("reapro", "write"), scanArticleReappro);

// Gérer les lignes du réappro
router
  .route("/:id/lignes")
  .post(protect, checkModuleAccess("reapro", "write"), addLigneReappro);
router
  .route("/:id/lignes/:ligneId")
  .put(protect, checkModuleAccess("reapro", "write"), updateLigneReappro)
  .delete(protect, checkModuleAccess("reapro", "delete"), deleteLigneReappro);

// Exporter sur serveur
router
  .route("/:id/export")
  .post(protect, checkModuleAccess("reapro", "write"), exportReappro);

// Télécharger le fichier
router
  .route("/:id/download")
  .post(protect, checkModuleAccess("reapro", "write"), downloadReappro);

export default router;
