// import express from "express";
// import multer from "multer";
// import path from "path";
// import {
//   getTachesCron, getTacheCronById, createTacheCron, updateTacheCron, deleteTacheCron, toggleTacheCronActive,
//   getTacheCronImage, updateTacheCronImage, deleteTacheCronImage,
//   executerTacheCron, annulerExecution, getStatutExecution,
//   uploadFichierExecution, downloadFichierExecution, deleteFichierExecution,
//   getExecutions, getExecutionDetail, getCategoriesCron, getTachesCronStats,
// } from "../controllers/tacheCronController.js";
// import { protect, admin } from "../middleware/authMiddleware.js";

// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "./uploads/temp"),
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "image") {
//     const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
//     const ext = path.extname(file.originalname).toLowerCase();
//     cb(allowed.includes(ext) ? null : new Error("Type d'image non autorisé"), allowed.includes(ext));
//   } else {
//     cb(null, true);
//   }
// };

// const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024 } });
// const uploadImage = upload.fields([{ name: "image", maxCount: 1 }]);
// const uploadFichier = upload.single("fichier");

// // Routes statiques AVANT :id
// router.get("/categories", protect, admin, getCategoriesCron);
// router.get("/stats", protect, admin, getTachesCronStats);

// // Routes fichiers exécution
// router.get("/executions/:executionId", protect, admin, getExecutionDetail);
// router.post("/executions/:executionId/fichiers", protect, admin, uploadFichier, uploadFichierExecution);
// router.get("/executions/:executionId/fichiers/:fichierId", protect, admin, downloadFichierExecution);
// router.delete("/executions/:executionId/fichiers/:fichierId", protect, admin, deleteFichierExecution);

// // CRUD
// router.get("/", protect, admin, getTachesCron);
// router.post("/", protect, admin, uploadImage, createTacheCron);
// router.get("/:id", protect, admin, getTacheCronById);
// router.put("/:id", protect, admin, uploadImage, updateTacheCron);
// router.delete("/:id", protect, admin, deleteTacheCron);

// // Actions
// router.patch("/:id/toggle-active", protect, admin, toggleTacheCronActive);
// router.post("/:id/executer", protect, admin, executerTacheCron);
// router.post("/:id/annuler", protect, admin, annulerExecution);
// router.get("/:id/statut", protect, admin, getStatutExecution);
// router.get("/:id/executions", protect, admin, getExecutions);

// // Image
// router.get("/:id/image", protect, admin, getTacheCronImage);
// router.put("/:id/image", protect, admin, uploadImage, updateTacheCronImage);
// router.delete("/:id/image", protect, admin, deleteTacheCronImage);

// export default router;
import express from "express";
import multer from "multer";
import path from "path";
import {
  getTachesCron, getTacheCronById, createTacheCron, updateTacheCron, deleteTacheCron, toggleTacheCronActive,
  getTacheCronImage, updateTacheCronImage, deleteTacheCronImage,
  executerTacheCron, annulerExecution, getStatutExecution,
  uploadFichierExecution, downloadFichierExecution, deleteFichierExecution,
  getExecutions, getExecutionDetail, getCategoriesCron, getTachesCronStats,
  addDocumentationTacheCron, updateDocumentationTacheCron, deleteDocumentationTacheCron, getDocumentationFile,
} from "../controller/tacheCronController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/temp"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "image") {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(allowed.includes(ext) ? null : new Error("Type d'image non autorisé"), allowed.includes(ext));
  } else {
    cb(null, true);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024 } });
const uploadImage = upload.fields([{ name: "image", maxCount: 1 }]);
const uploadFichier = upload.single("fichier");
const uploadDocument = upload.single("document");

// Routes statiques AVANT :id
router.get("/categories", protect, admin, getCategoriesCron);
router.get("/stats", protect, admin, getTachesCronStats);

// Routes fichiers exécution
router.get("/executions/:executionId", protect, admin, getExecutionDetail);
router.post("/executions/:executionId/fichiers", protect, admin, uploadFichier, uploadFichierExecution);
router.get("/executions/:executionId/fichiers/:fichierId", protect, admin, downloadFichierExecution);
router.delete("/executions/:executionId/fichiers/:fichierId", protect, admin, deleteFichierExecution);

// CRUD
router.get("/", protect, admin, getTachesCron);
router.post("/", protect, admin, uploadImage, createTacheCron);
router.get("/:id", protect, admin, getTacheCronById);
router.put("/:id", protect, admin, uploadImage, updateTacheCron);
router.delete("/:id", protect, admin, deleteTacheCron);

// Actions
router.patch("/:id/toggle-active", protect, admin, toggleTacheCronActive);
router.post("/:id/executer", protect, admin, executerTacheCron);
router.post("/:id/annuler", protect, admin, annulerExecution);
router.get("/:id/statut", protect, admin, getStatutExecution);
router.get("/:id/executions", protect, admin, getExecutions);

// Image
router.get("/:id/image", protect, admin, getTacheCronImage);
router.put("/:id/image", protect, admin, uploadImage, updateTacheCronImage);
router.delete("/:id/image", protect, admin, deleteTacheCronImage);

// Documentation
router.post("/:id/documentation", protect, admin, uploadDocument, addDocumentationTacheCron);
router.put("/:id/documentation/:docId", protect, admin, uploadDocument, updateDocumentationTacheCron);
router.delete("/:id/documentation/:docId", protect, admin, deleteDocumentationTacheCron);
router.get("/:id/documentation/:docId", protect, admin, getDocumentationFile);

export default router;