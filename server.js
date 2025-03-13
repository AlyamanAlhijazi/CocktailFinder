import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Laad omgevingsvariabelen
dotenv.config();

const app = express();
app.use(express.json()); // Zorgt dat we JSON-data kunnen verwerken

// 📌 DATABASE CONNECTIE
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database verbonden"))
    .catch(err => console.log("❌ Database fout:", err));

// 📌 USER MODEL
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model("User", userSchema);

// 📌 COCKTAIL MODEL
const cocktailSchema = new mongoose.Schema({
    name: String,
    ingredients: [String],
    category: String,
    alcohol: Boolean,
    rating: { type: Number, default: 0 },
    reviews: [{ user: String, rating: Number, comment: String }]
});
const Cocktail = mongoose.model("Cocktail", cocktailSchema);

// 🔹 REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered!" });
});

// 🔹 LOGIN (POST)
app.post("/users/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// 🔹 BESCHERMDE ROUTE (GET)
app.get("/users/protected", authenticateToken, (req, res) => {
    res.json({ message: "Je hebt toegang!", user: req.user });
});

// Middleware voor token-verificatie
function authenticateToken(req, res, next) {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Geen token, toegang geweigerd" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Ongeldige token" });
        req.user = user;
        next();
    });
}

// 🔹 ZOEK COCKTAILS (GET)
app.get("/cocktails/search", async (req, res) => {
    const { query } = req.query;
    try {
        const cocktails = await Cocktail.find({
            $or: [{ name: new RegExp(query, "i") }, { ingredients: new RegExp(query, "i") }]
        });
        res.json(cocktails);
    } catch (err) {
        res.status(500).json({ error: "Fout bij ophalen van cocktails." });
    }
});

// 🔹 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));


//views
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', onhome);

function onhome(req, res) {
  res.render('index.ejs');
}