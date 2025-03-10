import express from "express";
import Cocktail from "../models/Cocktail.js";  // gebruik 'import' en zorg voor '.js' extensie
const router = express.Router();

// Zoek op naam of ingrediënten
router.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const cocktails = await Cocktail.find({
      $or: [{ name: new RegExp(query, "i") }, { ingredients: new RegExp(query, "i") }]
    });
    res.json(cocktails);
  } catch (err) {
    res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van cocktails." });
  }
});

export default router;


