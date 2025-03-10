const mongoose = require("mongoose");

const cocktailSchema = new mongoose.Schema({
  name: String,
  ingredients: [String],
  category: String,
  alcohol: Boolean,
  rating: { type: Number, default: 0 },
  reviews: [{ user: String, rating: Number, comment: String }]
});

module.exports = mongoose.model("Cocktail", cocktailSchema);
