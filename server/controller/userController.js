const User = require("../model/userModel");
const fs = require("fs");
const path = require("path");

exports.create = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Vérifie si un utilisateur existe déjà
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Crée un nouvel utilisateur
    const newUser = new User({
      name,
      email,
      address,
      phone,
      photo,
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      message: "User created successfully.",
      user: savedUser,
    });
  } catch (error) {
    console.error("Erreur backend :", error);
    res.status(500).json({ errorMessage: error.message });
  }
};




  exports.getAllUsers = async (req, res) => {
    try {
      const userData = await User.find();
      if (!userData || userData.length === 0) {
       // return res.status(404).json({ message: "User data not found." }); 
        return res.status(200).json([]); // corrige l'erreur 404 dans la console
      }
      res.status(200).json(userData);
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  };


  exports.getUserById  = async (req, res) => {
    try {
      const id = req.params.id;
      const userExist = await User.findById(id);
      if (!userExist) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json(userExist);
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  };




// ✅ Mise à jour d'un utilisateur
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const userExist = await User.findById(id);

    if (!userExist) {
      return res.status(404).json({ message: "User not found." });
    }

    // 📸 Si une nouvelle photo a été envoyée
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (userExist.photo) {
        const oldPath = path.join(__dirname, "../uploads", userExist.photo);
        fs.access(oldPath, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.unlink(oldPath, (unlinkErr) => {
              if (unlinkErr) console.error("Erreur suppression ancienne photo :", unlinkErr);
              else console.log("✅ Ancienne photo supprimée :", userExist.photo);
            });
          }
        });
      }

      // Enregistrer la nouvelle photo
      req.body.photo = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur update :", error);
    res.status(500).json({ errorMessage: error.message });
  }
};


  
  exports.deleteUser  = async (req, res) => {
    try {
      const id = req.params.id;
      const userExist = await User.findById(id);
      if (!userExist) {
        return res.status(404).json({ message: "User not found." });
      }
      await User.findByIdAndDelete(id);
      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  };
  