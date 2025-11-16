const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require("path");

const app = express();
dotenv.config();

// -------------------------
// 🔹 CORS GLOBAL EN PREMIER !
// -------------------------
app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// -------------------------
// 🔹 Middlewares classiques
// -------------------------
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// 🔹 Serve les images avec CORS et CORP corrects
// -------------------------
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");           // 🔥 Obligatoire pour html2canvas / fetch
      res.set("Cross-Origin-Resource-Policy", "cross-origin"); 
      res.set("Cross-Origin-Embedder-Policy", "credentialless");
    },
  })
);

// -------------------------
// 🔹 Routes
// -------------------------
app.use('/', require('./routes/userRoute'));

// -------------------------
// 🔹 MongoDB + serveur
// -------------------------
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("DB connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error));
