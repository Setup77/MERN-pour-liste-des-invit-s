const express = require("express");
const route = express.Router();

// ✅ Import du middleware Multer d’upload
const upload = require("../middleware/upload");

// ✅ Import des fonctions du contrôleur utilisateur
const {
  create,
  getAllUsers,
  getUserById,
  update,
  deleteUser,
} = require("../controller/userController");

// ✅ Route pour créer un utilisateur avec upload d’image
route.post("/user", upload.single("photo"), create);

// ✅ Récupérer tous les utilisateurs
route.get("/users", getAllUsers);

// ✅ Récupérer un utilisateur par ID
route.get("/user/:id", getUserById);

// ✅ Mettre à jour un utilisateur (avec upload facultatif)
route.put("/user/:id", upload.single("photo"), update);

// ✅ Supprimer un utilisateur
route.delete("/delete/user/:id", deleteUser);

module.exports = route;
