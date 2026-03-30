// backend/routes/outilRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import {
  // Routes utilisateurs
  getOutils,
  getOutilById,
  downloadOutil,
  getOutilImage,
  getDocumentation,
  getCategories,
  // Routes admin
  createOutil,
  updateOutil,
  deleteOutil,
  toggleOutilActive,
  addDocumentation,
  updateDocumentation,
  deleteDocumentation,
  updateAccesOutil,
  getTelechargements,
  getOutilsStats,
  getUsersForSelection,
} from "../controller/outilController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/temp");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedExecutables = [".exe", ".msi", ".zip", ".rar", ".7z"];
  const allowedImages = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const allowedDocs = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".mp4",
    ".webm",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "executable") {
    if (allowedExecutables.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Type de fichier exécutable non autorisé. Extensions acceptées: ${allowedExecutables.join(", ")}`,
        ),
        false,
      );
    }
  } else if (file.fieldname === "image") {
    if (allowedImages.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Type d'image non autorisé. Extensions acceptées: ${allowedImages.join(", ")}`,
        ),
        false,
      );
    }
  } else if (file.fieldname === "document") {
    if (allowedDocs.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Type de document non autorisé. Extensions acceptées: ${allowedDocs.join(", ")}`,
        ),
        false,
      );
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max pour les exécutables
  },
});

// Upload pour création/modification d'outil (executable + image optionnelle)
const uploadOutil = upload.fields([
  { name: "executable", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// Upload pour documentation (un seul fichier)
const uploadDoc = upload.single("document");

// ==========================================
// ROUTES PUBLIQUES (utilisateurs connectés)
// ==========================================

// Liste des catégories
router.get("/categories", protect, getCategories);

// Liste des outils accessibles
router.get("/", protect, getOutils);

// Détail d'un outil
router.get("/:id", protect, getOutilById);

// Télécharger l'exécutable
router.get("/:id/download", protect, downloadOutil);

// Obtenir l'image d'un outil
router.get("/:id/image", protect, getOutilImage);

// Obtenir un document de documentation
router.get("/:id/documentation/:docId", protect, getDocumentation);

// ==========================================
// ROUTES ADMIN
// ==========================================

// Statistiques globales
router.get("/admin/stats", protect, admin, getOutilsStats);

// Liste des utilisateurs pour sélection
router.get("/admin/users-list", protect, admin, getUsersForSelection);

// Créer un outil
router.post("/", protect, admin, uploadOutil, createOutil);

// Modifier un outil
router.put("/:id", protect, admin, uploadOutil, updateOutil);

// Supprimer un outil
router.delete("/:id", protect, admin, deleteOutil);

// Activer/Désactiver un outil
router.patch("/:id/toggle-active", protect, admin, toggleOutilActive);

// Gérer les accès
router.put("/:id/acces", protect, admin, updateAccesOutil);

// Historique des téléchargements d'un outil
router.get("/:id/telechargements", protect, admin, getTelechargements);

// Documentation
router.post("/:id/documentation", protect, admin, uploadDoc, addDocumentation);
router.put(
  "/:id/documentation/:docId",
  protect,
  admin,
  uploadDoc,
  updateDocumentation,
);
router.delete("/:id/documentation/:docId", protect, admin, deleteDocumentation);

export default router;
