const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String },
  phone: { type: String },
  photo: { type: String }, // stockera juste le nom du fichier ou l’URL
}, { timestamps: true });

module.exports = mongoose.model('Users', userSchema);
