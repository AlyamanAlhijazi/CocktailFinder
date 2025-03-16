import mongoose from 'mongoose';

const cocktailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: { type: [String], required: true },
  measurements: { type: Number, required: true },
  measurements: {type: Number, required: true},
  category: { type: String },
  alcohol: { type: Boolean },
  rating: { type: Number, default: 0 },
  reviews: [
    {
      user: { type: String },
      rating: { type: Number },
      comment: { type: String },
    },
  ],
  image: { type: String } 
});

// Maak en exporteer het Cocktail model
const Cocktail = mongoose.model("Cocktail", cocktailSchema);
export default Cocktail;

