import mongoose from 'mongoose';

const cocktailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: { type: [String], required: true },
  measurements: { type: [Number], required: true }, // Array fix
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
}, { collection: "usercocktails" }); // 👈 Dit zorgt ervoor dat de collectie correct wordt aangesproken

// Exporteer het model
const Cocktail = mongoose.model("Cocktail", cocktailSchema);
export default Cocktail;
