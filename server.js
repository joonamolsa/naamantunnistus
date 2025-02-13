const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors({ origin: "*" })); // Sallii pyynnöt kaikista lähteistä
app.use(express.json());

// Tämä rivi lisää staattisten tiedostojen tarjoamisen public-kansiosta
app.use(express.static("public")); // <-- Lisää tämä rivi

const upload = multer({ dest: "uploads/" });

app.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Ei kuvaa ladattu!" });
  }

  const imagePath = req.file.path;
  const imageBuffer = fs.readFileSync(imagePath);

  try {
    const response = await axios.post(
      `${process.env.AZURE_ENDPOINT}/face/v1.0/detect`,
      imageBuffer,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        params: { returnFaceAttributes: "Glasses" },
      }
    );

    fs.unlinkSync(imagePath); // Poistetaan väliaikainen kuva
    console.log("Azure-vastaus:", response.data); // Tulostetaan Azure-vastaus palvelimeen

    return res.json({ faces: response.data }); // Lähetetään vastaus selaimeen
  } catch (error) {
    console.error("Azure API -virhe:", error.response?.data || error.message);
    return res.status(500).json({ error: "Virhe analyysissä" });
  }
});

app.listen(port, () => console.log(`Palvelin käynnissä portissa ${port}`));
