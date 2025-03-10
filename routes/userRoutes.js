import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";  // Gebruik 'import' voor je models en voeg '.js' toe

const router = express.Router();

// Registratie route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  
  // Wachtwoord hash'en met bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new User({ username, email, password: hashedPassword });
  await user.save();
  
  res.json({ message: "User registered!" });
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Zoek gebruiker op basis van email
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  
  // Vergelijk het wachtwoord met het gehashte wachtwoord in de database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
  // Genereer JWT-token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  res.json({ token });
});

export default router;
