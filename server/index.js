
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require("path");

const app = express();
app.use(bodyParser.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers uploadés
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("DB connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port :${PORT} `);
    });
  })
  .catch((error) => console.log(error));

//-Routes
app.use('/', require('./routes/userRoute'));

  app.use(cors({
          origin: 'http://localhost:3000', // Replace with your React app's origin
          methods: ['GET', 'POST', 'PUT', 'DELETE']  // Or specific methods
        }));


//---arret
