import mongoose from 'mongoose';

const cocktailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: { type: [String], required: true },
  measurements: { type: Number, required: true },
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

export default mongoose.model('userCocktail', cocktailSchema);
