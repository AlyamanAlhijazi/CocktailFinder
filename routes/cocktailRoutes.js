const express = require('express');
const router = express.Router();
const Cocktail = require('../models/Cocktail');

// Zoek op naam of ingrediënten
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const cocktails = await Cocktail.find({
    $or: [{ name: new RegExp(query, 'i') }, { ingredients: new RegExp(query, 'i') }]
  });
  res.json(cocktails);
});

module.exports = router;

