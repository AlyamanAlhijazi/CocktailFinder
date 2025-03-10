import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import cocktailRoutes from "./routes/cocktailRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Database connectie
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch(err => console.error("❌ Database connectie mislukt:", err));

app.use(express.json()); // Nodig voor JSON-body parsing

// Routes
app.use("/cocktails", cocktailRoutes);
app.use("/users", userRoutes);

// Start de server
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));

