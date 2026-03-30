// backend/seeder.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";

// Models
import User from "./models/UserModel.js";
import Permission from "./models/PermissionModel.js";
import Entreprise from "./models/EntrepriseModel.js";

// Data
import users from "./data/users.js";
import permissions from "./data/permissions.js";
import entreprises from "./data/entreprises.js";

// Config
import connectDB from "./config/db.js";

dotenv.config();

const importData = async () => {
  try {
    console.log("🟢 Seeder démarré...");

    // 1️⃣ Connecte à MongoDB
    await connectDB();
    console.log("✅ MongoDB connecté, démarrage de l'import...");

    // 2️⃣ Nettoyer la base de données
    await User.deleteMany();
    await Permission.deleteMany();
    await Entreprise.deleteMany();
    console.log("🗑️  Base de données nettoyée".yellow);

    // 3️⃣ Créer les entreprises
    const createdEntreprises = await Entreprise.insertMany(entreprises);
    console.log(`✅ ${createdEntreprises.length} entreprise(s) créée(s)`.green);

    // 4️⃣ Créer les utilisateurs UN PAR UN (pour déclencher le pre-save)
    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = new User(userData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
      } catch (err) {
        console.error(`❌ Erreur création user ${userData.email}: ${err.message}`.red);
      }
    }
    console.log(`✅ ${createdUsers.length} utilisateur(s) créé(s)`.green);

    // 5️⃣ Créer les permissions
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const permData = permissions[i];

      if (!permData) {
        console.warn(`⚠️  Pas de permissions définies pour l'utilisateur index ${i}`.yellow);
        continue;
      }

      const userEntreprises = createdEntreprises.map((e) => e._id);

      await Permission.create({
        user: user._id,
        entreprises: userEntreprises,
        allEntreprises: permData.allEntreprises,
        allModules: permData.allModules,
        modules: permData.modules,
      });
    }
    console.log("✅ Permissions créées".green);

    console.log("\n🚀 Données importées avec succès !".green.bold);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`.red.bold);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Permission.deleteMany();
    await Entreprise.deleteMany();
    console.log("🗑️  Toutes les données ont été supprimées !".red.bold);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`.red.bold);
    await mongoose.connection.close();
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}