// backend/server.js
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
dotenv.config();

import connectDB from "./config/db.js";

// Import des routes
import userRoutes from "./routes/userRoutes.js";
import entrepriseRoutes from "./routes/entrepriseRoutes.js";
import filialeRoutes from "./routes/fillialeRoutes.js";
import outilRoutes from "./routes//outilRoutes.js";
// ========== ROUTES TÂCHES CRON ==========
import tacheCronRoutes from "./routes/tacheCronRoutes.js";
// =======================================
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

const app = express();

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  }),
);

// Cookie parser middleware
app.use(cookieParser());

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Servir les fichiers statiques du dossier uploads
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Créer les dossiers uploads si nécessaire
const uploadDirs = [
  "./uploads",
  "./uploads/temp",
  "./uploads/outils",
  "./uploads/outils/executables",
  "./uploads/outils/images",
  "./uploads/outils/documentation",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier créé: ${dir}`);
  }
});

// ==========================================
// ROUTES API
// ==========================================
app.use("/api/users", userRoutes);
app.use("/api/entreprises", entrepriseRoutes);
app.use("/api/filiales", filialeRoutes);
// ========== ROUTES OUTILS ==========
app.use("/api/outils", outilRoutes);

// ========== ROUTES TÂCHES CRON ==========
app.use("/api/taches-cron", tacheCronRoutes);

// ==========================================
// FRONTEND EN PRODUCTION
// ==========================================
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "build")));

  app.get("/{*splat}", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API - A.G.I.R  is running...");
  });
}

// ==========================================
// ERROR MIDDLEWARES
// ==========================================
app.use(notFound);
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});