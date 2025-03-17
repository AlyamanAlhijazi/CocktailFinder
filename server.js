import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import expressSession from "express-session";
import multer from "multer";
import path from "path"; 
import { fileURLToPath } from "url";

// Laad omgevingsvariabelen
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.json()); // Zorgt dat we JSON-data kunnen verwerken
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Sessies instellen
app.use(
    expressSession({
        secret: process.env.SESSION_SECRET, 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
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
    image: { type: String } // Path to uploaded image
});
const userCocktail = mongoose.model("userCocktail", cocktailSchema);

// 🔹 REGISTRATIE (GET)
app.get('/register', async (req, res) => {
    res.render('register');
});

// 🔹 REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
    const { username, email, password, birthdate } = req.body;
    if (!username || !email || !password || !birthdate) {
        return res.status(400).json({ message: "All fields are required!" });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Try a different email address" });
        }

        const formattedBirthdate = new Date(birthdate);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword, birthdate: formattedBirthdate });
        await user.save();

        // Sessies instellen na registratie (direct inloggen)
        req.session.userId = user._id;  // Zet de gebruikers-ID in de sessie
        res.status(201).json({ message: "Account has been succesfully registerd!", 
                               redirect: "/login" });

    } catch (err) {
        res.status(500).json({ message: "Something went wrong, try again" });
    }
});


// 🔹 LOGIN (GET)
app.get('/login', async (req, res) => {
    res.render('login');
});


// 🔹 LOGIN (POST)
app.post("/users/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Inlogpoging voor email:", email); // Controleer de ingevoerde email

    const user = await User.findOne({ email });
    console.log("Gevonden gebruiker:", user); // Controleer of een gebruiker wordt gevonden

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Wachtwoord correct:", isMatch); // Controleer of het wachtwoord klopt

    if (!isMatch) return res.status(400).json({ message: "try a diffrent email or password" });

    // Sessies instellen bij succesvolle login
    req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
    req.session.username = user.username; // Sla de gebruikersnaam op in de sessie

    res.status(201).json({ message: "You're logged in!",
                           redirect: "/home.ejs"
     });
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
        const cocktails = await userCocktail.find({
            $or: [{ name: new RegExp(query, "i") }, { ingredients: new RegExp(query, "i") }]
        });
        res.json(cocktails);
    } catch (err) {
        res.status(500).json({ error: "Fout bij ophalen van cocktails." });
    }
});

// 🔹 HOME PAGE & API FETCHING
const API = 'https://www.thecocktaildb.com/api/json/v2/961249867/';

async function fetchData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

app.get('/home', async (req, res) => {
    try {
        const data = await fetchData(API + 'popular.php');
        const cocktails = data.drinks;

        if (!cocktails) {
            return res.status(404).send("Geen cocktails gevonden.");
        }

        res.render('home.ejs', { cocktails,
            isHomeActive: true,
            isProfileActive: false

         }); 
        const cocktails = data.drinks || [];
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
    res.render("profile", {
        isHomeActive: false,
        isProfileActive: true


    });
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

// Multer storage
app.get("/instructions", (req, res) => res.render("instructies.ejs"));
app.get("/upload", (req, res) => res.render("upload.ejs"));
app.get("/profile", (req, res) => res.render("profile.ejs"));

// 🔹 MULTER FILE UPLOAD
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload-cocktail', upload.single('image'), async (req, res) => {
    try {
        const { name, ingredients, measurements, category, alcohol } = req.body;
        const image = req.file ? req.file.filename : null;

        const newCocktail = new userCocktail({
            name,
            ingredients: ingredients.split(','),
            measurements,
            category,
            alcohol: alcohol === 'true',
            image
        });

        await newCocktail.save();
        res.status(201).json({ message: 'Cocktail uploaded successfully!', cocktail: newCocktail });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading cocktail' });
    }
});

app.get('/usercocktails', async (req, res) => {
    try {
        const cocktails = await userCocktail.find();
        res.render('user_cocktails.ejs', { cocktails });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cocktails' });
    }
});

// 🔹 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));
