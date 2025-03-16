import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import expressSession from "express-session";

// Laad omgevingsvariabelen
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.json()); // Zorgt dat we JSON-data kunnen verwerken
app.use(express.static("public"));

// Sessies instellen
app.use(
    expressSession({
        secret: process.env.SESSION_SECRET, // Kies een geheime sleutel
        resave: false, // Niet elke keer opnieuw opslaan
        saveUninitialized: true, // Sla onbewerkte sessies op
        cookie: { secure: false }, // Dit moet `true` zijn als je HTTPS gebruikt
    })
);

// 📌 DATABASE CONNECTIE
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database verbonden"))
    .catch(err => console.log("❌ Database fout:", err));

// 📌 USER MODEL
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    birthdate: Date
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

// 🔹 REGISTRATIE (GET)
app.get('/register', async (req, res) => {
    res.render('register');
});

// 🔹 REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
    const { username, email, password, birthdate } = req.body;

    // Validatie 
    if (!username || !email || !password || !birthdate) {
        return res.status(400).json({ message: "Alle velden zijn verplicht!" });
    }
    try {
        // Controleer of de gebruiker al bestaat
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Try a different email address" });
        }
        // Converteer birthdate naar een Date object 
        const formattedBirthdate = new Date(birthdate);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword, birthdate: formattedBirthdate });
        await user.save();

        // Sessies instellen na registratie (direct inloggen)
        req.session.userId = user._id;  // Zet de gebruikers-ID in de sessie
        res.status(201).json({ message: "Account succesvol geregistreerd!", 
                               redirect: "/login" });

    } catch (err) {
        res.status(500).json({ message: "Er is een fout opgetreden, probeer het opnieuw" });
    }
});

// 🔹 LOGIN (POST)
app.post("/users/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Gebruiker niet gevonden" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Ongeldige inloggegevens" });

    // Sessies instellen bij succesvolle login
    req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
    res.json({ message: "Succesvol ingelogd!" });
});

// 🔹 LOGOUT (POST)
app.post("/users/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Fout bij uitloggen" });
        }
        res.json({ message: "Succesvol uitgelogd" });
    });
});

// 🔹 BEVEILIGDE ROUTE (bijvoorbeeld: Favorieten, uploaden van cocktails)
app.get("/cocktails/favorites", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om toegang te krijgen" });
    }

    res.json({ message: "Dit is de beveiligde favorieten route" });
});

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
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.set('views', 'views');


app.get('/home', async (req, res) => {
    try {
        const data = await fetchData(API + 'popular.php');
        const cocktails = data.drinks;

        if (!cocktails) {
            return res.status(404).send("Geen cocktails gevonden.");
        }

        res.render('home.ejs', { cocktails }); 
    } catch (error) {
        console.error("Fout bij ophalen van cocktails:", error);
        res.status(500).send("Er is een probleem met het laden van cocktails.");
    }
});

app.get("/instructions", async (req, res) => {
    res.render("instructies.ejs", {});
});
app.get("/upload", async (req, res) => {
    res.render("uploadrecept.ejs", {});
});
app.get("/profile", async (req, res) => {
    res.render("profile.ejs", {});
});




function onhome(req, res) {
  res.render('navbar.ejs');
}



// API data ophalen 
const API = 'https://www.thecocktaildb.com/api/json/v2/961249867/'

async function fetchData(url) {
    const response = await fetch(url);
    const data = await response.json();
    
    return(data);
}

//deze line gebruiken om de data op te vragen
//fetchData(API + 'rest van link');


// popular coctails laten zien op pagina
async function popularCocktails(req, res) {
  const data = await fetchData(API + 'popular.php');
  const cocktails = data.drinks;
  for(let i = 0; i < cocktails.length; i++) {
    let cocktail = cocktails[i]
    res.render('cocktail_list', {cocktails, cocktail});
  }
}



